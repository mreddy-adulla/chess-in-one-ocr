import secrets
import hmac
import hashlib

def generate_pairing_code() -> str:
    return "".join(str(secrets.randbelow(10)) for _ in range(6))

def generate_api_token() -> str:
    return secrets.token_urlsafe(32)

def verify_token(token: str, expected_token: str) -> bool:
    return hmac.compare_digest(token, expected_token)
