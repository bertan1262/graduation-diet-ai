"""
HTTP middleware & global exception handlers.

RequestContextMiddleware
    * Gives every request an `X-Request-ID` (re-uses the client's header if sent).
    * Measures processing time and returns it as `X-Process-Time-Ms`.
    * Logs one line per request:  METHOD /path -> status (ms) [request-id]

Exception handlers
    * Database connection problems (PostgreSQL down, etc.) -> HTTP 503 JSON
      instead of an ugly 500 stack trace.
"""

import logging
import re
import time
import uuid

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from sqlalchemy.exc import OperationalError, SQLAlchemyError
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.responses import Response

logger = logging.getLogger("dietai.http")

REQUEST_ID_HEADER = "X-Request-ID"
_SAFE_REQUEST_ID = re.compile(r"^[A-Za-z0-9._-]{1,64}$")


def get_request_id(request: Request) -> str:
    return getattr(request.state, "request_id", "") or ""


class RequestContextMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        incoming_id = request.headers.get(REQUEST_ID_HEADER, "")
        request_id = incoming_id if _SAFE_REQUEST_ID.match(incoming_id) else uuid.uuid4().hex
        request.state.request_id = request_id

        started = time.perf_counter()
        response = await call_next(request)
        elapsed_ms = (time.perf_counter() - started) * 1000

        response.headers[REQUEST_ID_HEADER] = request_id
        response.headers["X-Process-Time-Ms"] = f"{elapsed_ms:.1f}"
        logger.info(
            "%s %s -> %s (%.1f ms) [%s]",
            request.method,
            request.url.path,
            response.status_code,
            elapsed_ms,
            request_id,
        )
        return response


def register_exception_handlers(app: FastAPI) -> None:
    @app.exception_handler(OperationalError)
    async def database_unavailable_handler(request: Request, exc: OperationalError) -> JSONResponse:
        logger.error("Database unavailable [%s]: %s", get_request_id(request), exc)
        return JSONResponse(
            status_code=503,
            content={
                "detail": "Database is currently unavailable. Please try again later.",
                "request_id": get_request_id(request),
            },
        )

    @app.exception_handler(SQLAlchemyError)
    async def database_error_handler(request: Request, exc: SQLAlchemyError) -> JSONResponse:
        logger.exception("Database error [%s]", get_request_id(request))
        return JSONResponse(
            status_code=500,
            content={
                "detail": "An internal database error occurred.",
                "request_id": get_request_id(request),
            },
        )
