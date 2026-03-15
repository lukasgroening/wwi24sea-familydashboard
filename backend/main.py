from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import SQLModel, Session, select
from auth import get_password_hash
from routers import auth_router, users, notes, todos, weather
from models.user import Role, User
from database import engine

from models import note  # noqa: F401
from models.note import Note


def create_seed_data():
    with Session(engine) as session:
        # 1. User Seed
        existing_user = session.exec(select(User)).first()
        if not existing_user:
            print("Erstelle Dummy-Admin User...")
            # Wir nutzen das Enum und hashen das Passwort "geheim123"
            dummy_admin = User(
                username="Mama_Admin",
                hashed_password=get_password_hash("geheim123123"),
                role=Role.FAMILY_ADMIN,
            )
            session.add(dummy_admin)
            session.commit()
            print("Dummy-Admin erfolgreich angelegt!")

        existing_note = session.exec(select(Note)).first()

        if not existing_note:
            print("Datenbank ist leer. Erstelle Dummy-Notizen...")
            dummy1 = Note(
                title="Willkommen!",
                content="Das ist das erste Widget für unser Dashboard.",
            )
            dummy2 = Note(
                title="Einkaufsliste",
                content="Milch, Eier, Brot und Kaffee nicht vergessen.",
            )

            session.add(dummy1)
            session.add(dummy2)
            session.commit()
            print("Dummy-Notizen erfolgreich angelegt!")


@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Server fährt hoch... Erstelle Tabellen!")
    # 1. Erstellt die Datenbank und alle Tabellen (falls sie noch nicht existieren)
    SQLModel.metadata.create_all(engine)

    # 2. Führt unser Seed-Skript aus
    create_seed_data()

    yield  # Hier läuft der Server und wartet auf Frontend-Anfragen


app = FastAPI(title="Family Dashboard API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # TODO: limit to only exact frontend-URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(notes.router)
app.include_router(auth_router.router)
app.include_router(users.router)
app.include_router(todos.router)
app.include_router(weather.router)


@app.get("/api/health")
def read_health_check():
    return {
        "status": "online",
        "message": "Das FastAPI Backend ist bereit!",
        "version": "0.1.0",
    }
