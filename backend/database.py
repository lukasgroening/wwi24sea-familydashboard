from sqlmodel import create_engine, Session

import os
sqlite_file_name = os.getenv("DB_PATH", "database.db")
sqlite_url = f"sqlite:///{sqlite_file_name}"

engine = create_engine(sqlite_url, echo=True, connect_args={"check_same_thread": False})


def get_session():
    with Session(engine) as session:
        yield session
