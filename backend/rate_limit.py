"""
Rate limiting middleware for FastAPI
"""
from fastapi import Request, HTTPException, status
from starlette.middleware.base import BaseHTTPMiddleware
from collections import defaultdict
from datetime import datetime, timedelta
import time

class RateLimitMiddleware(BaseHTTPMiddleware):
    """
    Simple in-memory rate limiter.
    For production, use Redis-based rate limiting.
    """
    def __init__(self, app, requests_per_minute: int = 60):
        super().__init__(app)
        self.requests_per_minute = requests_per_minute
        self.requests = defaultdict(list)
        self.cleanup_interval = timedelta(minutes=5)
        self.last_cleanup = datetime.now()

    async def dispatch(self, request: Request, call_next):
        # Skip rate limiting for OPTIONS requests
        if request.method == "OPTIONS":
            return await call_next(request)
        
        # Get client IP
        client_ip = request.client.host if request.client else "unknown"
        
        # Cleanup old entries periodically
        if datetime.now() - self.last_cleanup > self.cleanup_interval:
            self._cleanup_old_entries()
            self.last_cleanup = datetime.now()
        
        # Check rate limit
        now = time.time()
        minute_ago = now - 60
        
        # Clean old requests for this IP
        self.requests[client_ip] = [
            req_time for req_time in self.requests[client_ip] 
            if req_time > minute_ago
        ]
        
        # Check if limit exceeded
        if len(self.requests[client_ip]) >= self.requests_per_minute:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Rate limit exceeded. Please try again later.",
                headers={"Retry-After": "60"}
            )
        
        # Add current request
        self.requests[client_ip].append(now)
        
        # Continue with request
        response = await call_next(request)
        return response
    
    def _cleanup_old_entries(self):
        """Remove old entries to prevent memory leak"""
        now = time.time()
        minute_ago = now - 60
        for ip in list(self.requests.keys()):
            self.requests[ip] = [
                req_time for req_time in self.requests[ip] 
                if req_time > minute_ago
            ]
            if not self.requests[ip]:
                del self.requests[ip]

