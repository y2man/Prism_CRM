from slowapi import Limiter
from slowapi.util import get_remote_address
import jwt
from app.core.config import settings

def client_key(request):
    header = request.headers.get("authorization", "")
    if header.lower().startswith("bearer "):
        try:
            payload = jwt.decode(header[7:], settings.jwt_secret, algorithms=[settings.jwt_algorithm])
            return f"user:{payload['sub']}"
        except (jwt.PyJWTError, KeyError):
            pass
    return get_remote_address(request)

limiter = Limiter(key_func=client_key)
