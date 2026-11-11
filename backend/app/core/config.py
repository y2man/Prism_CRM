from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    app_name: str = "Prism CRM API"
    database_url: str = "sqlite:///./prism.db"
    frontend_origin: str = "http://localhost:5173"
    jwt_secret: str = "local-dev-only-change-this-secret-before-deploy"
    environment: str = "development"
    jwt_algorithm: str = "HS256"
    access_token_minutes: int = 60 * 24
    groq_api_key: str | None = None
    groq_model: str = "llama-3.3-70b-versatile"
    groq_fallback_models: str = "llama-3.1-8b-instant,llama-3.3-70b-versatile"
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

settings = Settings()
