/**
 * ocr_worker.mjs
 *
 * Standalone Node.js OCR worker that uses Tesseract.js (WASM, no binary needed).
 * Called by ocr_image.py via subprocess.
 *
 * Usage:
 *   node ocr_worker.mjs <image_path> [lang]
 *
 * Arguments:
 *   image_path  Path to the preprocessed image file (PNG recommended).
 *   lang        Tesseract language string, languages joined with '+'.
 *               Default: "eng+hin"
 *
 * Output:
 *   Recognized text is written to stdout.
 *   Errors / progress logs are written to stderr only.
 *   Exit code 0 on success, 1 on any failure.
 *
 * Traineddata cache:
 *   Language data is downloaded once and stored in ./tessdata_cache/
 *   (a sibling directory to this script) so subsequent runs are instant.
 */

import { createWorker } from "tesseract.js";
import { fileURLToPath } from "url";
import { dirname, join, resolve } from "path";
import { existsSync, mkdirSync } from "fs";

// ---------------------------------------------------------------------------
// Resolve __dirname in ESM context
// ---------------------------------------------------------------------------
const __dirname = dirname(fileURLToPath(import.meta.url));

// ---------------------------------------------------------------------------
// Persistent cache directory for traineddata (avoids re-downloading each run)
// ---------------------------------------------------------------------------
const CACHE_DIR = join(__dirname, "tessdata_cache");
if (!existsSync(CACHE_DIR)) {
  mkdirSync(CACHE_DIR, { recursive: true });
}

// ---------------------------------------------------------------------------
// Parse CLI arguments
// ---------------------------------------------------------------------------
const [, , rawImagePath, langArg = "eng+hin"] = process.argv;

if (!rawImagePath) {
  process.stderr.write(
    "Usage: node ocr_worker.mjs <image_path> [lang]\n" +
      "  image_path  Path to the image file\n" +
      '  lang        Tesseract language string (default: "eng+hin")\n'
  );
  process.exit(1);
}

const imagePath = resolve(rawImagePath);

if (!existsSync(imagePath)) {
  process.stderr.write(`[ocr_worker] Image file not found: ${imagePath}\n`);
  process.exit(1);
}

// Tesseract.js v4+ accepts an array of language codes, e.g. ["eng", "hin"]
const langs = langArg
  .split("+")
  .map((l) => l.trim())
  .filter(Boolean);

if (langs.length === 0) {
  process.stderr.write(
    `[ocr_worker] Invalid lang argument: "${langArg}". ` +
      'Expected format: "eng" or "eng+hin"\n'
  );
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Run OCR
// ---------------------------------------------------------------------------

/**
 * Suppress all internal Tesseract.js progress/logger output so that only the
 * final recognised text reaches stdout.  Errors still go to stderr.
 */
const silentLogger = () => {};

try {
  process.stderr.write(
    `[ocr_worker] Starting OCR  image="${imagePath}"  langs=[${langs.join(", ")}]\n`
  );

  //
  // OEM 1 = LSTM_ONLY  (same as "--oem 1" in pytesseract)
  // PSM 6 = SINGLE_BLOCK (same as "--psm 6" in pytesseract)
  //
  const worker = await createWorker(langs, 1 /* OEM.LSTM_ONLY */, {
    cachePath: CACHE_DIR,
    logger: silentLogger,
    errorHandler: (err) => {
      process.stderr.write(`[ocr_worker] Tesseract internal error: ${err}\n`);
    },
  });

  // PSM 6 — treat the image as a single uniform block of text
  await worker.setParameters({
    tessedit_pageseg_mode: "6",
  });

  const {
    data: { text },
  } = await worker.recognize(imagePath);

  await worker.terminate();

  process.stderr.write("[ocr_worker] OCR complete.\n");

  // Write the recognised text to stdout — this is what Python captures
  process.stdout.write(text);
  process.exit(0);
} catch (err) {
  process.stderr.write(`[ocr_worker] OCR failed: ${err.message}\n`);
  if (err.stack) {
    process.stderr.write(`${err.stack}\n`);
  }
  process.exit(1);
}
