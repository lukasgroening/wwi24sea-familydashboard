from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import SQLModel, Session, select
from database import engine

from models import note  # noqa: F401
from models.note import Note

from routers import notes


def create_seed_data():
    with Session(engine) as session:
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


@app.get("/api/health")
def read_health_check():
    return {
        "status": "online",
        "message": "Das FastAPI Backend ist bereit!",
        "version": "0.1.0",
    }
