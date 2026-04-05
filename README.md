# Buildscript
## Frontend
### Schritt 1: Dependencies installieren
```
cd frontend
npm install
```
Tool: npm (Node Package Manager)

Ergebnis: node_modules/ Ordner mit ~500MB Dependencies
 
### Schritt 2: Type Checking
```
npm run build  # Führt TypeScript Compiler aus
```
Tool: tsc (TypeScript Compiler 5.9.3)

Prüft: Type Errors, Interface Violations
 
### Schritt 3: Production Build
Tool: Vite 8.0.0
 
Prozess:
- Transpiliert TypeScript → JavaScript
- Bundelt alle Module
- Minifiziert Code
- Tree-Shaking (entfernt ungenutzten Code)
- CSS Processing (TailwindCSS → optimiertes CSS)

Ergebnis: frontend/dist/ 

## Backend
### Schritt 1: Dependencies installieren
```
cd backend
pip install -r requirements.txt
```
Tool: pip (Python Package Manager)

Ergebnis: Python packages im venv oder global
 
Keine Compilation nötig:

- Python ist interpretierte Sprache → Code wird zur Laufzeit ausgeführt
- Optional: Linting
- Tool: ruff, black, mypy

## Docker
 
**Docker Images bauen:**
 
`docker-compose build` oder `docker-compose up --build`

**Docker Frontend:**

```
FROM node:20-alpine          # Base Image laden (150 MB)
WORKDIR /app                 # Working Directory setzen
COPY package*.json ./        # Package-Dateien kopieren
RUN npm install              # Dependencies installieren (500 MB)
COPY . .                     # Source Code kopieren (5 MB)
EXPOSE 5173                  # Port deklarieren
CMD ["npm", "run", "dev"]    # Start-Kommando
```
**Docker Backend:**

```
FROM python:3.11-slim        # Base Image laden (300 MB)
WORKDIR /app                 # Working Directory setzen
COPY requirements.txt .      # Requirements kopieren
RUN pip install --no-cache-dir -r requirements.txt  # Dependencies (200 MB)
COPY . .                     # Source Code kopieren (10 MB)
EXPOSE 8000                  # Port deklarieren
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

## Build Tools

| Tool | Zweck | Wo wird es verwendet |
| --- | --- | --- |
| npm  | Package Manager | Frontend Dependencies |
| tsc | TypeScript Compiler | Frontend Type Check |
| Vite | Build Tool | Frontend Bundle & Minify |
| pip | Package Manager | Backend Dependencies |
| Docker | Container Build | Images bauen |
| Docker Compose | Orchestrierung | Multi-Container Start |
