# Doc_Validator

A Python-based document validation system that uses OCR (Optical Character Recognition) to extract and validate Indian government identity documents. This module supports Aadhaar, e-Shram, and Voter ID cards with bilingual support for English and Hindi.

## 🎯 Overview

The Doc_Validator module provides automated validation of government-issued identity documents by:
1. Extracting text from document images using OCR
2. Normalizing the extracted text
3. Validating required and optional fields against predefined standards
4. Returning detailed validation results

## 📋 Supported Documents

- **AADHAAR** - Unique Identification Authority of India card
- **ESHRAM** - e-Shram (Unorganized Workers) card
- **VOTER_ID** - Election Commission of India Voter ID

## 🛠️ Architecture

The system consists of several modular components:

```
Doc_Validator/
├── ocr_image.py              # OCR engine (Python wrapper)
├── ocr_worker.mjs            # Tesseract.js Node.js worker
├── document_standards.py     # Document field definitions
├── validate_required_fields.py   # Field validation logic
├── text_normalize.py         # Text preprocessing
└── quick_test.py            # Example usage
```

## 🚀 Features

### OCR Processing (`ocr_image.py` & `ocr_worker.mjs`)

- **No local Tesseract installation required** - Uses Tesseract.js (WASM-based)
- **Automatic language data download** - Downloads traineddata files on first use
- **Image preprocessing pipeline**:
  - Greyscale conversion
  - Image upscaling
  - Noise reduction
  - Binary threshold application
- **Multi-language support** - Default: English + Hindi (`eng+hin`)
- **Cross-platform** - Windows, macOS, and Linux support

**Technology Stack:**
- **Python** with OpenCV (`cv2`) for image preprocessing
- **Node.js** with Tesseract.js for OCR processing
- **Subprocess communication** between Python and Node.js

### Document Standards (`document_standards.py`)

Defines validation criteria for each document type:

#### AADHAAR Card
**Required Fields:**
- Name (English/Hindi: "name", "नाम")
- DOB/Year of Birth (multiple formats supported)
- Gender (English/Hindi keywords)
- 12-digit Aadhaar number (format: `XXXX XXXX XXXX`)

**Optional Fields:**
- Address

#### e-Shram Card
**Required Fields:**
- Name
- Father's name
- Date of Birth
- Gender
- UAN (Universal Account Number)

**Optional Fields:**
- Occupation
- Contact number (10-digit)
- Address

#### Voter ID
**Required Fields:**
- EPIC Number
- Identity Card markers
- Election Commission of India identifiers

### Field Validation (`validate_required_fields.py`)

**Validation Methods:**
1. **Keyword matching** - Searches for label keywords in both English and Hindi
2. **Regex pattern matching** - Validates field formats (dates, numbers, IDs)

**Validation Output:**
```python
{
    "valid": bool,                      # True if all required fields found
    "doc_type": str,                    # Document type validated
    "found_required": List[str],        # Found required fields
    "missing_required": List[str],      # Missing required fields
    "found_optional": List[str],        # Found optional fields
    "missing_optional": List[str],      # Missing optional fields
    "details": Dict[str, List[str]]     # Match reasons per field
}
```

### Text Normalization (`text_normalize.py`)

Preprocesses OCR text for consistent validation:
- Converts to lowercase
- Normalizes whitespace
- Strips leading/trailing spaces

## 📦 Requirements

### Python Dependencies
```bash
pip install opencv-python
```

### Node.js Dependencies
```bash
npm install tesseract.js
```

### System Requirements
- **Node.js** (LTS version recommended) - Download from https://nodejs.org/
- **Python 3.7+**

## 🔧 Installation

1. **Install Node.js**
   - Download from https://nodejs.org/
   - Ensure `node` is available in your PATH

2. **Install Python dependencies**
   ```bash
   pip install opencv-python
   ```

3. **Install Node.js dependencies**
   ```bash
   npm install tesseract.js
   ```

4. **Verify installation**
   - The module will automatically verify Node.js and `ocr_worker.mjs` on import

## 💻 Usage

### Basic Example

```python
from validate_required_fields import validate_fields
from ocr_image import ocr_from_image_path

# Extract text from document image
image_path = "path/to/aadhaar_card.jpg"
ocr_text = ocr_from_image_path(image_path, lang="eng+hin")

# Validate extracted text
result = validate_fields("AADHAAR", ocr_text)

# Check validation result
if result["valid"]:
    print("✅ Document is valid!")
    print(f"Found fields: {result['found_required']}")
else:
    print("❌ Document validation failed")
    print(f"Missing fields: {result['missing_required']}")
```

### Quick Test

Run the included test script:
```python
python quick_test.py
```

This demonstrates validation with sample OCR text.

## 🔍 How It Works

### OCR Pipeline

1. **Image Preprocessing** (Python/OpenCV):
   ```
   Input Image → Greyscale → Upscale → Denoise → Binarize → Temp PNG
   ```

2. **Text Extraction** (Node.js/Tesseract.js):
   ```
   Temp PNG → Tesseract.js Worker → OCR Text → stdout
   ```

3. **Result Capture** (Python):
   ```
   stdout → Python string → Temp file cleanup → Return text
   ```

### Validation Pipeline

1. **Normalization**: Raw OCR text → lowercase, whitespace normalized
2. **Standard Lookup**: Load document standards for specified doc type
3. **Field Checking**: 
   - Keyword search (English & Hindi)
   - Regex pattern matching
4. **Result Compilation**: Categorize fields as found/missing, required/optional

## 🎨 Customization

### Adding New Document Types

Edit `document_standards.py`:

```python
DOC_STANDARDS = {
    "YOUR_DOC_TYPE": {
        "required_fields": {
            "field_name": {
                "label_keywords": ["keyword1", "keyword2"],
                "value_regex": [r"\bregex_pattern\b"],
            },
        },
        "optional_fields": {
            # ... optional field definitions
        },
    },
}
```

### Modifying OCR Languages

Change the language parameter in OCR calls:
```python
ocr_from_image_path(image_path, lang="eng")        # English only
ocr_from_image_path(image_path, lang="hin")        # Hindi only
ocr_from_image_path(image_path, lang="eng+hin+tam") # Multiple languages
```

## 📁 Data Storage

- **Tesseract traineddata cache**: `./tessdata_cache/`
  - Automatically created on first run
  - Stores language data files to avoid re-downloading

## ⚙️ Configuration

### OCR Worker Settings

Edit `ocr_worker.mjs` to modify Tesseract.js settings:

```javascript
const worker = await createWorker(langs, 1 /* OEM.LSTM_ONLY */, {
    cachePath: CACHE_DIR,
    logger: silentLogger,
    errorHandler: (err) => { /* ... */ },
});
```

**Available OEM modes:**
- `0` - Legacy engine only
- `1` - Neural nets LSTM engine only (default)
- `2` - Legacy + LSTM engines
- `3` - Default based on what's available

**Available PSM modes:**
- `6` - Assume a single uniform block of text (default)
- `3` - Fully automatic page segmentation
- See Tesseract documentation for more options

## 🐛 Troubleshooting

### Node.js Not Found Error

```
RuntimeError: Node.js not found on this machine.
```

**Solution:**
1. Install Node.js from https://nodejs.org/
2. Ensure `node` is in your system PATH
3. Restart your terminal/IDE

### OCR Worker Script Not Found

```
RuntimeError: OCR worker script not found: 'ocr_worker.mjs'
```

**Solution:**
- Ensure `ocr_worker.mjs` is in the same directory as `ocr_image.py`

### Poor OCR Accuracy

**Solutions:**
- Improve image quality (higher resolution, better lighting)
- Adjust OpenCV preprocessing parameters
- Add more language data files
- Fine-tune Tesseract PSM/OEM settings

## 🔐 Security Considerations

- **PII Handling**: This module processes sensitive personal information. Ensure:
  - Secure storage of document images
  - Encrypted transmission if used in client-server architecture
  - Compliance with data protection regulations (GDPR, etc.)
  - Proper access controls and audit logging

- **Temporary Files**: The OCR pipeline creates temporary files that are automatically cleaned up. Ensure proper permissions on temp directories.

## 🤝 Contributing

To extend this module:
1. Add new document types to `document_standards.py`
2. Enhance preprocessing in `ocr_image.py`
3. Improve validation logic in `validate_required_fields.py`
4. Add unit tests for new features



## 👥 K Nagendra Pai


*github.com/Cyberknp*
