import re
from typing import Dict, Any, Tuple, List

def field_is_present(normalized_text: str, field_def: Dict[str, Any]) -> Tuple[bool, List[str]]:
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