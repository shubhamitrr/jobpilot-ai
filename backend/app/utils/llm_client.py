"""
Thin wrapper for calling Groq's free, OpenAI-compatible API.
"""
from fastapi import HTTPException

from app.config import settings


def generate(system: str, user_content: str, max_tokens: int = 2000) -> str:
    if not settings.LLM_API_KEY:
        raise HTTPException(
            status_code=503,
            detail="AI features are not configured. Set LLM_API_KEY in the backend .env file.",
        )
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