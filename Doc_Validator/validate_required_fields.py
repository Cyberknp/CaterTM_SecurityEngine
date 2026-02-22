import re
from typing import Any, Dict, List, Tuple

from document_standards import DOC_STANDARDS
from text_normalize import normalize_text


def field_is_present(
    normalized_text: str, field_def: Dict[str, Any]
) -> Tuple[bool, List[str]]:
    reasons = []
    # 1) keyword check
    for kw in field_def.get("label_keywords", []):
        kw_norm = kw.lower().strip()
        if kw_norm and kw_norm in normalized_text:
            reasons.append(f"keyword:{kw}")
            return True, reasons

    # 2) regex check
    for pattern in field_def.get("value_regex") or []:
        if re.search(pattern, normalized_text, flags=re.IGNORECASE):
            reasons.append(f"regex:{pattern}")
            return True, reasons

    return False, reasons


def validate_fields(doc_type: str, raw_text: str) -> Dict[str, Any]:
    """
    Validate OCR-extracted text against the document standards for a given doc type.

    Args:
        doc_type:  One of the keys in DOC_STANDARDS (e.g. "AADHAAR", "ESHRAM", "VOTER_ID").
        raw_text:  Raw OCR text extracted from the document image.

    Returns:
        A dict with the following keys:
            valid            – bool: True if every required field was found.
            doc_type         – str: the doc_type that was checked.
            found_required   – list[str]: required field names that were found.
            missing_required – list[str]: required field names that were NOT found.
            found_optional   – list[str]: optional field names that were found.
            missing_optional – list[str]: optional field names that were NOT found.
            details          – dict[str, list[str]]: per-field match reasons (empty list = not found).
    """
    doc_type_upper = doc_type.upper().strip()

    if doc_type_upper not in DOC_STANDARDS:
        return {
            "valid": False,
            "doc_type": doc_type_upper,
            "error": f"Unknown document type '{doc_type_upper}'. "
            f"Supported types: {list(DOC_STANDARDS.keys())}",
            "found_required": [],
            "missing_required": [],
            "found_optional": [],
            "missing_optional": [],
            "details": {},
        }

    normalized = normalize_text(raw_text)
    standards = DOC_STANDARDS[doc_type_upper]

    found_required: List[str] = []
    missing_required: List[str] = []
    found_optional: List[str] = []
    missing_optional: List[str] = []
    details: Dict[str, List[str]] = {}

    # --- required fields ---
    for field_name, field_def in standards.get("required_fields", {}).items():
        found, reasons = field_is_present(normalized, field_def)
        details[field_name] = reasons
        if found:
            found_required.append(field_name)
        else:
            missing_required.append(field_name)

    # --- optional fields ---
    for field_name, field_def in standards.get("optional_fields", {}).items():
        found, reasons = field_is_present(normalized, field_def)
        details[field_name] = reasons
        if found:
            found_optional.append(field_name)
        else:
            missing_optional.append(field_name)

    return {
        "valid": len(missing_required) == 0,
        "doc_type": doc_type_upper,
        "found_required": found_required,
        "missing_required": missing_required,
        "found_optional": found_optional,
        "missing_optional": missing_optional,
        "details": details,
    }
