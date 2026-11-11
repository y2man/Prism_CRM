from app.core.config import settings

SYSTEM = (
    "You are Prism, a friendly CRM copilot for a sales team. For CRM questions, use only the supplied records; never invent facts. "
    "Separate facts from suggestions, say when data is missing, and keep answers under 120 words."
)

def active_provider() -> str:
    return "groq" if settings.groq_api_key else "local"

def ai_enabled() -> bool:
    return active_provider() == "groq"

def _groq(prompt: str, history: list[dict]) -> str:
    from groq import Groq
    client = Groq(api_key=settings.groq_api_key)
    messages = [{"role": "system", "content": SYSTEM}] + history + [{"role": "user", "content": prompt}]
    models = [settings.groq_model] + [m.strip() for m in settings.groq_fallback_models.split(",") if m.strip() and m.strip() != settings.groq_model]
    error = None
    for model in models:
        try:
            result = client.chat.completions.create(model=model, messages=messages, max_tokens=800, temperature=0.3)
            return result.choices[0].message.content or ""
        except Exception as exc:
            error = exc
    raise RuntimeError("All configured Groq models failed") from error

def generate_text(prompt: str, history: list[dict] | None = None) -> str | None:
    """Return None only when AI is not configured; provider errors propagate."""
    if not ai_enabled():
        return None
    return _groq(prompt, history or [])

def open_stream(prompt: str, history: list[dict] | None = None):
    """Open Groq's stream now so setup failures can become an HTTP 503."""
    from groq import Groq
    client = Groq(api_key=settings.groq_api_key)
    messages = [{"role": "system", "content": SYSTEM}] + (history or []) + [{"role": "user", "content": prompt}]
    models = [settings.groq_model] + [m.strip() for m in settings.groq_fallback_models.split(",") if m.strip() and m.strip() != settings.groq_model]
    error = None
    for model in models:
        try:
            return client.chat.completions.create(model=model, messages=messages, max_tokens=800, temperature=0.3, stream=True)
        except Exception as exc:
            error = exc
    raise RuntimeError("All configured Groq models failed") from error
