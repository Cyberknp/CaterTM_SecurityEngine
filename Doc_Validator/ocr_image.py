import os
import sys

import cv2
import pytesseract

# --- Tesseract binary auto-detection (Windows) ---
_TESSERACT_CANDIDATES = [
    r"C:\Program Files\Tesseract-OCR\tesseract.exe",
    r"C:\Program Files (x86)\Tesseract-OCR\tesseract.exe",
    r"C:\Users\{}\AppData\Local\Programs\Tesseract-OCR\tesseract.exe".format(
        os.environ.get("USERNAME", "")
    ),
]


def _configure_tesseract() -> None:
    """
    Locate the Tesseract executable and point pytesseract at it.
    On non-Windows systems the binary is expected to be on PATH already.
    Raises RuntimeError with install instructions if the binary cannot be found.
    """
    if sys.platform != "win32":
        # On Linux/macOS tesseract is normally on PATH; let pytesseract handle it.
        return

    # 1) Already on PATH?
    import shutil

    if shutil.which("tesseract"):
        return

    # 2) Check common Windows install locations.
    for candidate in _TESSERACT_CANDIDATES:
        if os.path.isfile(candidate):
            pytesseract.pytesseract.tesseract_cmd = candidate
            return

    # 3) Nothing found — give the developer a clear, actionable message.
    raise RuntimeError(
        "\n"
        "Tesseract OCR engine not found on this machine.\n"
        "\n"
        "To fix this:\n"
        "  1. Download the Windows installer from:\n"
        "     https://github.com/UB-Mannheim/tesseract/wiki\n"
        "  2. Run the installer. During setup, expand 'Additional language data'\n"
        "     and tick 'Hindi' (required for lang='eng+hin').\n"
        "  3. The default install path is:\n"
        "       C:\\Program Files\\Tesseract-OCR\\tesseract.exe\n"
        "  4. Re-run your script — this module will detect it automatically.\n"
        "\n"
        "Alternatively, set the path manually before calling ocr_from_image_path():\n"
        "  import pytesseract\n"
        "  pytesseract.pytesseract.tesseract_cmd = r'C:\\...\\tesseract.exe'\n"
    )


# Run detection once at import time so every caller benefits automatically.
_configure_tesseract()


def ocr_from_image_path(image_path: str, lang: str = "eng+hin") -> str:
    """
    Extract text from a document image using Tesseract OCR.

    Args:
        image_path: Absolute or relative path to the image file.
        lang:       Tesseract language string (default: English + Hindi).

    Returns:
        Raw OCR text as a string.

    Raises:
        ValueError:   If the image cannot be read by OpenCV.
        RuntimeError: If the Tesseract binary is not installed.
    """
    img = cv2.imread(image_path)
    if img is None:
        raise ValueError(
            f"Could not read image: '{image_path}'\n"
            "Check that the path is correct and the file is a supported image format."
        )

    # --- lightweight preprocessing for better OCR accuracy ---
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    # Upscale: Tesseract works best with text >= 20px tall
    gray = cv2.resize(gray, None, fx=2, fy=2, interpolation=cv2.INTER_CUBIC)

    # Mild blur to reduce noise before thresholding
    gray = cv2.GaussianBlur(gray, (3, 3), 0)

    # Otsu binarisation: separates dark text from light background reliably
    _, gray = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)

    # OEM 3 = LSTM engine; PSM 6 = assume a uniform block of text
    config = "--oem 3 --psm 6"
    text = pytesseract.image_to_string(gray, lang=lang, config=config)

    return text
