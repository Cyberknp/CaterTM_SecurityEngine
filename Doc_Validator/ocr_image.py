"""
ocr_image.py

Extracts text from document images using Tesseract.js (via a Node.js subprocess).
No local Tesseract binary installation is required — Tesseract.js ships its own
WASM build and downloads language traineddata automatically on first use.

Pipeline:
  1. OpenCV reads and preprocesses the image (greyscale → upscale → denoise → binarise).
  2. The preprocessed image is written to a temporary PNG file.
  3. ocr_worker.mjs is invoked via Node.js; it runs Tesseract.js and prints the
     recognised text to stdout.
  4. Python captures stdout, deletes the temp file, and returns the text string.

Public API (unchanged from the pytesseract version):
  ocr_from_image_path(image_path, lang="eng+hin") -> str
"""

import os
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

import cv2

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------

# The Node.js worker script lives in the same directory as this Python module.
_WORKER_SCRIPT: Path = Path(__file__).parent / "ocr_worker.mjs"


# ---------------------------------------------------------------------------
# Node.js discovery
# ---------------------------------------------------------------------------

_NODE_CANDIDATES_WIN = [
    r"C:\Program Files\nodejs\node.exe",
    r"C:\Program Files (x86)\nodejs\node.exe",
    # nvm-windows default location
    os.path.join(
        os.environ.get("APPDATA", ""),
        "nvm",
        "current",
        "node.exe",
    ),
]


def _find_node() -> str:
    """
    Return the path to the Node.js executable.

    Search order:
      1. ``node`` already on PATH (any platform).
      2. Common Windows install locations.

    Raises:
        RuntimeError: If Node.js cannot be found, with installation instructions.
    """
    # 1) PATH
    node = shutil.which("node")
    if node:
        return node

    # 2) Windows common locations
    if sys.platform == "win32":
        for candidate in _NODE_CANDIDATES_WIN:
            if candidate and os.path.isfile(candidate):
                return candidate

    raise RuntimeError(
        "\n"
        "Node.js not found on this machine.\n"
        "\n"
        "This module requires Node.js to run Tesseract.js (no Tesseract binary needed).\n"
        "\n"
        "To fix this:\n"
        "  1. Download and install Node.js (LTS recommended) from:\n"
        "       https://nodejs.org/\n"
        "  2. Make sure 'node' is available on your PATH.\n"
        "  3. From the project root, install dependencies:\n"
        "       npm install\n"
        "  4. Re-run your script — this module will detect Node.js automatically.\n"
    )


def _check_worker_script() -> None:
    """Verify that ocr_worker.mjs exists next to this file."""
    if not _WORKER_SCRIPT.is_file():
        raise RuntimeError(
            f"\n"
            f"OCR worker script not found: '{_WORKER_SCRIPT}'\n"
            f"\n"
            f"Expected 'ocr_worker.mjs' to be in the same directory as 'ocr_image.py'.\n"
            f"Make sure both files are present in:\n"
            f"  {_WORKER_SCRIPT.parent}\n"
        )


# Run sanity checks once at import time.
_check_worker_script()


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------


def ocr_from_image_path(image_path: str, lang: str = "eng+hin") -> str:
    """
    Extract text from a document image using Tesseract.js.

    The image is preprocessed with OpenCV (greyscale, 2× upscale, Gaussian
    denoise, Otsu binarisation) before being handed to Tesseract.js to maximise
    recognition accuracy.

    Language traineddata is downloaded automatically by Tesseract.js on the
    first run and cached in ``Doc_Validator/tessdata_cache/`` for subsequent
    calls.

    Args:
        image_path: Absolute or relative path to the image file.
        lang:       Tesseract language string.  Separate multiple languages
                    with ``+``, e.g. ``"eng+hin"`` (default).

    Returns:
        Raw OCR text as a string.

    Raises:
        ValueError:   If the image cannot be read by OpenCV.
        RuntimeError: If Node.js is not installed, the worker script is
                      missing, or Tesseract.js reports an error.
        subprocess.TimeoutExpired: If OCR takes longer than 120 s (the first
                      run downloads traineddata and may be slower on a slow
                      connection; increase ``timeout`` if needed).
    """
    # ------------------------------------------------------------------
    # 1. Read the source image
    # ------------------------------------------------------------------
    img = cv2.imread(image_path)
    if img is None:
        raise ValueError(
            f"Could not read image: '{image_path}'\n"
            "Check that the path is correct and the file is a supported image format."
        )

    # ------------------------------------------------------------------
    # 2. Preprocess for better OCR accuracy
    # ------------------------------------------------------------------
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    # Upscale: Tesseract works best when text height >= 20 px
    gray = cv2.resize(gray, None, fx=2, fy=2, interpolation=cv2.INTER_CUBIC)

    # Mild Gaussian blur to reduce sensor/compression noise before binarisation
    gray = cv2.GaussianBlur(gray, (3, 3), 0)

    # Otsu binarisation: robustly separates dark text from light background
    _, gray = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)

    # ------------------------------------------------------------------
    # 3. Save preprocessed image to a temporary file
    # ------------------------------------------------------------------
    tmp_fd, tmp_path = tempfile.mkstemp(suffix=".png")
    os.close(tmp_fd)

    try:
        success = cv2.imwrite(tmp_path, gray)
        if not success:
            raise RuntimeError(
                f"OpenCV failed to write the preprocessed image to '{tmp_path}'."
            )

        # ------------------------------------------------------------------
        # 4. Run Tesseract.js via Node.js
        # ------------------------------------------------------------------
        node_bin = _find_node()

        try:
            result = subprocess.run(
                [node_bin, str(_WORKER_SCRIPT), tmp_path, lang],
                capture_output=True,
                text=True,
                # First run downloads traineddata (~10–30 MB per language).
                # 120 s should be generous even on a slow connection.
                timeout=120,
            )
        except subprocess.TimeoutExpired as exc:
            raise subprocess.TimeoutExpired(
                exc.cmd,
                exc.timeout,
            ) from exc

        # ------------------------------------------------------------------
        # 5. Handle errors from the worker
        # ------------------------------------------------------------------
        if result.returncode != 0:
            stderr_msg = (
                result.stderr.strip() if result.stderr else "(no stderr output)"
            )
            raise RuntimeError(
                f"Tesseract.js OCR worker exited with code {result.returncode}.\n"
                f"\n"
                f"Worker stderr:\n{stderr_msg}\n"
                f"\n"
                f"Troubleshooting tips:\n"
                f"  • Ensure Node.js >= 18 is installed.\n"
                f"  • Run 'npm install' in the project root to install tesseract.js.\n"
                f"  • Check that the lang code is valid (e.g. 'eng', 'eng+hin').\n"
                f"  • Verify internet access for the first-run traineddata download.\n"
            )

        return result.stdout

    finally:
        # Always remove the temporary image, even if an exception was raised.
        try:
            os.unlink(tmp_path)
        except OSError:
            pass
