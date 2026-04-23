from sqlmodel import create_engine, Session
import os

# Falls DATABASE_URL gesetzt ist (z.B. in Docker), nutze diese (Postgres)
# Ansonsten nutze SQLite als lokaler Fallback
database_url = os.getenv("DATABASE_URL")

if not database_url:
    sqlite_file_name = os.getenv("DB_PATH", "database.db")
    database_url = f"sqlite:///{sqlite_file_name}"

# SQLite braucht check_same_thread=False, Postgres nicht.
connect_args = {}
if database_url.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

engine = create_engine(database_url, echo=True, connect_args=connect_args)


def get_session():
    with Session(engine) as session:
        yield session
