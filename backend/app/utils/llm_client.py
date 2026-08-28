"""
Thin wrapper so the app can talk to either Anthropic (Claude) or any
OpenAI-compatible endpoint (Google Gemini's free tier, Groq, OpenRouter,
etc.) using the SAME app code. Controlled purely by environment variables:

- If LLM_BASE_URL is set  -> uses the `openai` client pointed at that URL
  (this is how free providers like Gemini/Groq are used, since they expose
  an OpenAI-compatible /chat/completions endpoint).
- If LLM_BASE_URL is empty -> uses the native `anthropic` client (Claude).
"""
from fastapi import HTTPException

from app.config import settings


def generate(system: str, user_content: str, max_tokens: int = 2000) -> str:
    """Sends a system+user prompt to the configured LLM and returns the
    raw text response. Raises HTTPException on any failure."""
    if not settings.LLM_API_KEY:
        raise HTTPException(
            status_code=503,
            detail="AI features are not configured. Set LLM_API_KEY in the backend .env file.",
        )

    if settings.LLM_BASE_URL:
        return _generate_openai_compatible(system, user_content, max_tokens)
    return _generate_anthropic(system, user_content, max_tokens)


def _generate_openai_compatible(system: str, user_content: str, max_tokens: int) -> str:
    try:
        from openai import OpenAI
        client = OpenAI(api_key=settings.LLM_API_KEY, base_url=settings.LLM_BASE_URL)
        response = client.chat.completions.create(
            model=settings.LLM_MODEL,
            max_tokens=max_tokens,
            messages=[
                {"role": "system", "content": system},
                {"role": "user", "content": user_content},
            ],
        )
        return response.choices[0].message.content or ""
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"AI provider request failed: {e}")


def _generate_anthropic(system: str, user_content: str, max_tokens: int) -> str:
    try:
        import anthropic
        client = anthropic.Anthropic(api_key=settings.LLM_API_KEY)
        response = client.messages.create(
            model=settings.LLM_MODEL,
            max_tokens=max_tokens,
            system=system,
            messages=[{"role": "user", "content": user_content}],
        )
        return "".join(b.text for b in response.content if getattr(b, "type", None) == "text")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"AI provider request failed: {e}")