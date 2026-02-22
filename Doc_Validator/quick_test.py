from validate_required_fields import validate_fields

fake_ocr = """
GOVT. OF INDIA
Name: RAMESH KUMAR
DOB: 12/08/1990
Gender: Male
1234 5678 9012
"""

print(validate_fields("AADHAAR", fake_ocr))
