# KI-Nutzungs- und Beitragslogbuch

Dieses Dokument listet auf, wer an welchen Teilen des Projekts mitgewirkt hat und wo KI-Tools zur Unterstützung eingesetzt wurden.

| Datum | Teammitglied | Bereich/Datei | Eingesetztes KI-Tool | Zweck der Nutzung (Wo & Wie) |
| :--- | :--- | :--- | :--- | :--- |
| 14.03.2026 | Lukas Gröning | `/backend/main.py`, `requirements.txt` | Gemini | Generierung von Boilerplate-Code für das FastAPI-Grundsetup inkl. CORS-Middleware und Healthcheck-Route. |
| 14.03.2026 | Lukas Gröning | `database.py`, `models/note.py`, `routers/notes.py` | Gemini | Setup von SQLModel mit lokaler SQLite-DB, Modellierung der Notiz-Tabelle (inkl. Auto-Timestamps) und Implementierung der REST-Routen (GET/POST) sowie einer Seed-Funktion. |
| 15.03.2026 | Lukas Gröning | `models/user.py`, `auth.py`, `routers/auth_router.py`, `dependencies.py` | Gemini | Implementierung des Rollensystems (Enum) und der JWT-Authentifizierung. Passwort-Hashing (bcrypt), Login-Endpunkt und Absicherung der Routen über FastAPI-Türsteher (Dependencies). |
| 15.03.2026 | Lukas Gröning | `routers/users.py`, `models/user.py`, `models/note.py`, `routers/notes.py` | Gemini | Abschluss der User-Verwaltung (Update/Delete) inkl. "Last-Admin"-Sicherheitscheck und Rollen-Endpunkt für das Frontend. Refactoring der API-Schnittstellen (User & Notizen) durch Einführung von DTOs (Data Transfer Objects) zur sauberen Trennung von Input- und Output-Daten. |
| 15.03.2026 | Lukas Gröning | `models/todo.py`, `routers/todos.py`, `main.py` | Gemini | Implementierung des To-Do-Widgets inkl. CRUD-Operationen. Einführung von Datenbank-Beziehungen (Foreign Keys) mit optionaler Benutzerzuweisung (`user_id`). Anpassung von Pydantic-DTOs für saubere Inputs/Outputs. |