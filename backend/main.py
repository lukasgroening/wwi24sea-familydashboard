import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import SQLModel, Session, select
from auth import get_password_hash
from routers import auth_router, users, notes, todos, weather, schedules, calendars
from models.user import Role, User
from database import engine

from models import note, schedule, calendar  # noqa: F401
from models.note import Note
from models.calendar import CalendarEvent, CalendarSource


def create_seed_data():
    with Session(engine) as session:
        # 1. User Seed
        existing_user = session.exec(select(User)).first()
        if not existing_user:
            print("Erstelle Dummy-Admin User...")
            dummy_admin = User(
                username="Mama_Admin",
                hashed_password=get_password_hash("geheim123123"),
                role=Role.FAMILY_ADMIN,
            )
            session.add(dummy_admin)
            session.commit()
            print("Dummy-Admin erfolgreich angelegt!")

        # 2. Notes Seed
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

        # 3. Calendar Seed
        existing_event = session.exec(select(CalendarEvent)).first()
        if not existing_event:
            from datetime import datetime, timedelta
            print("Erstelle Dummy-Kalenderdaten...")
            ev1 = CalendarEvent(
                title="Wocheneinkauf",
                start_time=datetime.now().replace(hour=10, minute=0),
                end_time=datetime.now().replace(hour=11, minute=0),
                location="Supermarkt",
                color="#7c9a7e"
            )
            ev2 = CalendarEvent(
                title="Abendessen Familie",
                start_time=(datetime.now() + timedelta(days=1)).replace(hour=18, minute=30),
                end_time=(datetime.now() + timedelta(days=1)).replace(hour=20, minute=0),
                color="#a8c4a8"
            )
            session.add(ev1)
            session.add(ev2)
            
            # Add a public ICS source
            # This is a dummy source that the user can see/edit
            source1 = CalendarSource(
                name="Beispiel Externer Kalender",
                url="https://p21-caldav.icloud.com/published/2/...", # Placeholder
                active=False
            )
            session.add(source1)
            
            session.commit()
            print("Dummy-Kalenderdaten erfolgreich angelegt!")


@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Server fährt hoch... Erstelle Tabellen!")
    SQLModel.metadata.create_all(engine)

    create_seed_data()

    yield


app = FastAPI(title="Family Dashboard API", lifespan=lifespan)

cors_origins = os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(notes.router)
app.include_router(auth_router.router)
app.include_router(users.router)
app.include_router(todos.router)
app.include_router(weather.router)
app.include_router(schedules.router)
app.include_router(calendars.router)


@app.get("/api/health")
def read_health_check():
    return {
        "status": "online",
        "message": "Das FastAPI Backend ist bereit!",
        "version": "0.1.0",
    }
