from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.openapi.utils import get_openapi
import os

from app.database import create_db_and_tables
from app.api.auth import router as auth_router
from app.api.accounts import router as accounts_router
from app.api.contact import router as contacts_router
from app.api.transactions import router as transactions_router
from app.api.cards import router as cards_router
from app.api.users import router as users_router
from app.api.recipients import router as recipients_router
from app.api.support import router as support_router
from app.api.savings_goals import router as savings_goals_router

app = FastAPI(title="DiceBank API", version="1.0")

# CORS setup
default_origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:4173",
    "http://127.0.0.1:4173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

env_origins = os.getenv("ALLOW_ORIGINS")
if env_origins:
    allow_origins = [origin.strip() for origin in env_origins.split(",") if origin.strip()]
else:
    allow_origins = default_origins

app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static directory
STATIC_DIR = os.path.join(os.path.dirname(__file__), "static")
os.makedirs(STATIC_DIR, exist_ok=True)
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

@app.on_event("startup")
def on_startup():
    create_db_and_tables()

# Routers
app.include_router(auth_router)
app.include_router(accounts_router)
app.include_router(contacts_router)
app.include_router(transactions_router)
app.include_router(cards_router)
app.include_router(users_router)
app.include_router(recipients_router)
app.include_router(support_router)
app.include_router(savings_goals_router)

@app.get("/")
def root():
    return {"status": "running", "message": "Welcome to DiceBank API!"}

# Custom OpenAPI for Swagger "Authorize" button
def custom_openapi():
    if app.openapi_schema:
        return app.openapi_schema

    openapi_schema = get_openapi(
        title=app.title,
        version=app.version,
        routes=app.routes,
    )

    openapi_schema["components"]["securitySchemes"] = {
        "BearerAuth": {
            "type": "http",
            "scheme": "bearer",
            "bearerFormat": "JWT",
        }
    }

    openapi_schema["security"] = [{"BearerAuth": []}]

    app.openapi_schema = openapi_schema
    return app.openapi_schema

app.openapi = custom_openapi
