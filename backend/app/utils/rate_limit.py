"""
Basic in-memory rate limiting to protect auth and AI-backed endpoints from
abuse. Uses slowapi (a Flask-limiter-style wrapper around FastAPI). This is
process-local (fine for a single-instance deployment); for multi-instance
production deployments, back it with Redis instead.
"""
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)
