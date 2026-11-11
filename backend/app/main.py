from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from app.core.config import settings
from app.core.limiter import limiter
from app.models import customer  # noqa: F401
from app.api.routes.customers import router as customers_router
from app.api.routes.ai import router as ai_router
from app.api.routes.auth import router as auth_router

if settings.environment == "production" and (len(settings.jwt_secret) < 32 or settings.jwt_secret.startswith("local-dev")):
    raise RuntimeError("Set a unique JWT_SECRET of at least 32 characters before running in production")

app = FastAPI(title=settings.app_name, version="4.0.0")
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
origins = [origin.strip() for origin in settings.frontend_origin.split(",") if origin.strip()]
app.add_middleware(CORSMiddleware, allow_origins=origins,
                   allow_credentials=True, allow_methods=["*"], allow_headers=["*"],
                   expose_headers=["X-AI-Provider"])
app.include_router(auth_router)
app.include_router(customers_router)
app.include_router(ai_router)

@app.get("/health")
def health():
    return {"status": "ok", "service": "prism-crm-api"}
