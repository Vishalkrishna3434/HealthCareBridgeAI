def verify_token(token: str) -> dict:
    """Mock verification of Firebase Auth ID token."""
    if token == "valid_token":
        return {"uid": "demo-user-123", "email": "demo@example.com"}
    return None
