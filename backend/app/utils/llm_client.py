"""
Thin wrapper so the app can talk to Google Gemini (free tier) using the
native google-genai SDK. Gemini's newer "AQ."-prefixed API keys only work
through this native SDK, not through OpenAI-compatible endpoints.
"""
from fastapi import HTTPException

from app.config import settings


def generate(system: str, user_content: str, max_tokens: int = 2000) -> str:
    """Sends a system+user prompt to Gemini and returns the raw text response."""
    if not settings.LLM_API_KEY:
        raise HTTPException(
            status_code=503,
            detail="AI features are not configured. Set LLM_API_KEY in the backend .env file.",
        )

    try:
        from google import genai
        from google.genai import types

        client = genai.Client(api_key=settings.LLM_API_KEY)

        response = client.models.generate_content(
            model=settings.LLM_MODEL,
            contents=user_content,
            config=types.GenerateContentConfig(
                system_instruction=system,
                max_output_tokens=max_tokens,
            ),
        )
        return response.text or ""
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"AI provider request failed: {e}")