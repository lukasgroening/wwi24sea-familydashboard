import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session, SQLModel, create_engine
from sqlmodel.pool import StaticPool

from main import app
from database import get_session
from models.user import Role, User
from models.family import Family
from auth import get_password_hash

# Create a separate engine for testing
# We use an in-memory SQLite database and StaticPool to allow sharing the
# same in-memory database across multiple connections within a single thread.
SQLITE_URL = "sqlite:///:memory:"


@pytest.fixture(name="session")
def session_fixture():
    engine = create_engine(
        SQLITE_URL,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    SQLModel.metadata.create_all(engine)
    with Session(engine) as session:
        yield session


@pytest.fixture(name="client")
def client_fixture(session: Session):
    def get_session_override():
        return session

    app.dependency_overrides[get_session] = get_session_override
    client = TestClient(app)
    yield client
    app.dependency_overrides.clear()


@pytest.fixture(name="test_family")
def test_family_fixture(session: Session):
    family = Family(name="Test Family", join_code="TESTCODE")
    session.add(family)
    session.commit()
    session.refresh(family)
    return family


@pytest.fixture(name="test_user")
def test_user_fixture(session: Session, test_family: Family):
    user = User(
        username="testuser",
        hashed_password=get_password_hash("testpassword"),
        role=Role.USER,
        family_id=test_family.id,
    )
    session.add(user)
    session.commit()
    session.refresh(user)
    return user


@pytest.fixture(name="admin_user")
def admin_user_fixture(session: Session, test_family: Family):
    user = User(
        username="adminuser",
        hashed_password=get_password_hash("adminpassword"),
        role=Role.FAMILY_ADMIN,
        family_id=test_family.id,
    )
    session.add(user)
    session.commit()
    session.refresh(user)
    return user
