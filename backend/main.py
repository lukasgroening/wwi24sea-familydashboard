import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import SQLModel, Session, select
from auth import get_password_hash
from routers import (
    auth_router,
    users,
    notes,
    todos,
    weather,
    schedules,
    dashboard,
    calendars,
    families,
)
from models.user import Role, User
from models.family import Family
from models.todo import ToDo
from models.schedule import ScheduleEntry, DayOfWeek
from database import engine

from models import note, schedule, calendar  # noqa: F401
from models.note import Note
from models.calendar import CalendarEvent, CalendarSource


def create_seed_data():
    with Session(engine) as session:
        # 1. Familien Seed
        existing_family = session.exec(select(Family)).first()
        if not existing_family:
            print("Erstelle Demo-Familie...")
            demo_family = Family(name="Familie Demo")
            session.add(demo_family)
            session.commit()
            session.refresh(demo_family)
            print(f"Demo-Familie angelegt (id={demo_family.id})")
        else:
            demo_family = existing_family

        # 2. User Seed
        existing_user = session.exec(select(User)).first()
        if not existing_user:
            print("Erstelle System-Admin und Demo-Admin User...")

            # System-Administrator (keine family_id — verwaltet alles)
            system_admin = User(
                username="system_admin",
                hashed_password=get_password_hash("system123"),
                role=Role.SYSTEM_ADMIN,
            )
            session.add(system_admin)

            # Familien-Administrator für Demo-Familie
            dummy_admin = User(
                username="Mama_Admin",
                hashed_password=get_password_hash("geheim123123"),
                role=Role.FAMILY_ADMIN,
                family_id=demo_family.id,
            )
            session.add(dummy_admin)

            # Normaler User für Demo-Familie
            dummy_user = User(
                username="Kind_Lukas",
                hashed_password=get_password_hash("lukas123"),
                role=Role.USER,
                family_id=demo_family.id,
            )
            session.add(dummy_user)

            session.commit()
            session.refresh(dummy_admin)
            session.refresh(dummy_user)
            print("System-Admin (system_admin / system123) und Familien-User angelegt!")
        else:
            dummy_admin = session.exec(
                select(User).where(User.username == "Mama_Admin")
            ).first()
            dummy_user = session.exec(
                select(User).where(User.username == "Kind_Lukas")
            ).first()

        # 3. Notes Seed
        existing_note = session.exec(select(Note)).first()
        if not existing_note:
            print("Datenbank ist leer. Erstelle Dummy-Notizen...")
            session.add(
                Note(
                    title="Willkommen!",
                    content="Das ist das erste Widget für unser Dashboard.",
                    family_id=demo_family.id,
                )
            )
            session.add(
                Note(
                    title="Einkaufsliste",
                    content="Milch, Eier, Brot und Kaffee nicht vergessen.",
                    family_id=demo_family.id,
                )
            )
            session.commit()
            print("Dummy-Notizen erfolgreich angelegt!")

        # 4. Calendar Seed
        existing_event = session.exec(select(CalendarEvent)).first()
        if not existing_event:
            from datetime import datetime, timedelta

            print("Erstelle Dummy-Kalenderdaten...")
            session.add(
                CalendarEvent(
                    title="Wocheneinkauf",
                    start_time=datetime.now().replace(hour=10, minute=0),
                    end_time=datetime.now().replace(hour=11, minute=0),
                    location="Supermarkt",
                    color="#7c9a7e",
                    family_id=demo_family.id,
                )
            )
            session.add(
                CalendarEvent(
                    title="Abendessen Familie",
                    start_time=(datetime.now() + timedelta(days=1)).replace(
                        hour=18, minute=30
                    ),
                    end_time=(datetime.now() + timedelta(days=1)).replace(
                        hour=20, minute=0
                    ),
                    color="#a8c4a8",
                    family_id=demo_family.id,
                )
            )

            session.add(
                CalendarSource(
                    name="Beispiel Externer Kalender",
                    url="https://p21-caldav.icloud.com/published/2/...",  # Placeholder
                    active=False,
                    family_id=demo_family.id,
                )
            )
            session.commit()
            print("Dummy-Kalenderdaten erfolgreich angelegt!")

        # 5. ToDo Seed
        existing_todo = session.exec(select(ToDo)).first()
        if not existing_todo:
            print("Erstelle Dummy-ToDos...")
            session.add(
                ToDo(
                    title="Spülmaschine ausräumen",
                    tag="Haushalt",
                    family_id=demo_family.id,
                    user_id=dummy_user.id if dummy_user else None,
                )
            )
            session.add(
                ToDo(title="Staubsaugen", tag="Haushalt", family_id=demo_family.id)
            )
            session.commit()
            print("Dummy-ToDos erfolgreich angelegt!")

        # 6. Schedule Seed
        existing_schedule = session.exec(select(ScheduleEntry)).first()
        if not existing_schedule:
            from datetime import time

            print("Erstelle Dummy-Stundenplan...")
            session.add(
                ScheduleEntry(
                    subject="Mathematik",
                    day_of_week=DayOfWeek.MONTAG,
                    start_time=time(8, 0),
                    end_time=time(9, 30),
                    room="R101",
                    family_id=demo_family.id,
                    user_id=dummy_user.id if dummy_user else None,
                )
            )
            session.commit()
            print("Dummy-Stundenplan erfolgreich angelegt!")


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
app.include_router(dashboard.router)
app.include_router(families.router)


@app.get("/api/health")
def read_health_check():
    return {
        "status": "online",
        "message": "Das FastAPI Backend ist bereit!",
        "version": "0.1.0",
    }
