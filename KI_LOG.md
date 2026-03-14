# KI-Nutzungs- und Beitragslogbuch

Dieses Dokument listet auf, wer an welchen Teilen des Projekts mitgewirkt hat und wo KI-Tools zur Unterstützung eingesetzt wurden.

| Datum | Teammitglied | Bereich/Datei | Eingesetztes KI-Tool | Zweck der Nutzung (Wo & Wie) |
| :--- | :--- | :--- | :--- | :--- |
| 14.03.2026 | Lukas Gröning | `/backend/main.py`, `requirements.txt` | Gemini | Generierung von Boilerplate-Code für das FastAPI-Grundsetup inkl. CORS-Middleware und Healthcheck-Route. |
| 14.03.2026 | Lukas Gröning | `database.py`, `models/note.py`, `routers/notes.py` | Gemini | Setup von SQLModel mit lokaler SQLite-DB, Modellierung der Notiz-Tabelle (inkl. Auto-Timestamps) und Implementierung der REST-Routen (GET/POST) sowie einer Seed-Funktion. |