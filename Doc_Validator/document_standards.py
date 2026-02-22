import re

DOC_STANDARDS = {
    "AADHAAR": {
        "required_fields": {
            "name": {
                "label_keywords": ["name", "नाम"],
                "value_regex": None,
            },
            "dob_or_yob": {
                "label_keywords": [
                    "dob",
                    "date of birth",
                    " जन्म",
                    "जन्म तिथि",
                    "year of birth",
                    "yob",
                ],
                "value_regex": [
                    r"\b\d{2}[/-]\d{2}[/-]\d{4}\b",  # dd/mm/yyyy
                    r"\b(19|20)\d{2}\b",  # year
                ],
            },
            "gender": {
                "label_keywords": ["gender", "लिंग", "male", "female", "m", "f"],
                "value_regex": None,
            },
            "aadhaar_number": {
                "label_keywords": ["uidai", "aadhaar", "आधार"],
                "value_regex": [
                    r"\b\d{4}\s?\d{4}\s?\d{4}\b",  # 12 digits with optional spaces
                ],
            },
        },
        "optional_fields": {
            "address": {
                "label_keywords": ["address", "पता"],
                "value_regex": None,
            }
        },
    },
    "ESHRAM": {
        "required_fields": {
            "name": {
                "label_keywords": ["name", "नाम"],
                "value_regex": None,
            },
            "fathers_name": {
                "label_keywords": ["father", "father's name", "पिता", "पिता का नाम"],
                "value_regex": None,
            },
            "dob": {
                "label_keywords": ["dob", "date of birth", "जन्म", "जन्म तिथि"],
                "value_regex": [
                    r"\b\d{2}[/-]\d{2}[/-]\d{4}\b",
                ],
            },
            "gender": {
                "label_keywords": ["gender", "लिंग", "male", "female", "m", "f"],
                "value_regex": None,
            },
            "uan": {
                "label_keywords": ["uan", "universal account number"],
                "value_regex": [
                    r"\buan\b\D{0,10}(\d{4,20})\b",  # flexible: captures digits near 'uan'
                ],
            },
        },
        "optional_fields": {
            "occupation": {
                "label_keywords": ["occupation", "व्यवसाय"],
                "value_regex": None,
            },
            "contact_number": {
                "label_keywords": ["contact", "mobile", "फोन", "मोबाइल"],
                "value_regex": [r"\b\d{10}\b"],
            },
            "address": {
                "label_keywords": ["address", "पता"],
                "value_regex": None,
            },
        },
    },
    "VOTER_ID": {
        "required_fields": {
            "epic_number": {
                "label_keywords": [
                    "epic",
                    "identity card",
                    "election commission of india",
                ],
                "value_regex": [
                    r"\b[A-Z]{2,4}\d{5,10}\b",  # flexible EPIC-like
                ],
            },
            "name": {
                "label_keywords": ["name", "नाम"],
                "value_regex": None,
            },
            "fathers_or_husbands_name": {
                "label_keywords": ["father", "husband", "father's name", "पिता", "पति"],
                "value_regex": None,
            },
            "sex": {
                "label_keywords": ["sex", "लिंग", "m", "f", "male", "female"],
                "value_regex": None,
            },
            "dob_or_age": {
                "label_keywords": ["date of birth", "dob", "age", "जन्म", "उम्र"],
                "value_regex": [
                    r"\b\d{2}[/-]\d{2}[/-]\d{4}\b",
                    r"\bage\b\D{0,10}(\d{1,3})\b",
                ],
            },
        },
        "optional_fields": {
            "address": {
                "label_keywords": ["address", "पता"],
                "value_regex": None,
            }
        },
    },
}
