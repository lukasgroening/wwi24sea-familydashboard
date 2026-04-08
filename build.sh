#!/usr/bin/env bash
# ============================================================
#  Family Dashboard — Build Script
#  Führt alle Schritte aus, um die Anwendung zu bauen und
#  lokal bereitzustellen.
#
#  Verwendete Tools:
#    - npm / tsc   → Frontend-Abhängigkeiten & TypeScript-Check
#    - vite        → Frontend-Bundle (Produktion)
#    - eslint      → Statische Code-Analyse (Frontend)
#    - pip         → Backend-Abhängigkeiten
#    - docker      → Container-Build & Start
# ============================================================

set -e  # Bricht ab, sobald ein Schritt fehlschlägt

# ---------- Farben für die Ausgabe ----------
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color (Reset)

step() { echo -e "\n${BLUE}==>${NC} $1"; }
ok()   { echo -e "${GREEN}✔ $1${NC}"; }
fail() { echo -e "${RED}✘ $1${NC}"; exit 1; }

# ============================================================
# 1. FRONTEND — Abhängigkeiten installieren
# ============================================================
step "[1/5] Frontend-Abhängigkeiten installieren (npm install)"
cd frontend
npm install
ok "node_modules bereit"

# ============================================================
# 2. FRONTEND — Statische Code-Analyse (Linting)
# ============================================================
step "[2/5] Frontend Linting (eslint)"
if npm run lint; then
  ok "Keine Lint-Fehler"
else
  echo -e "${RED}⚠ ESLint-Warnungen gefunden — Build wird trotzdem fortgesetzt${NC}"
fi

# ============================================================
# 3. FRONTEND — TypeScript prüfen + Produktions-Bundle bauen
#    tsc -b   → TypeScript-Compiler prüft alle Typen
#    vite build → bündelt React-App in optimierte statische Dateien (dist/)
# ============================================================
step "[3/5] Frontend bauen (tsc + vite build)"
npm run build
ok "Frontend-Bundle liegt in frontend/dist/"

cd ..

# ============================================================
# 4. BACKEND — Abhängigkeiten installieren
# ============================================================
step "[4/5] Backend-Abhängigkeiten installieren (pip)"
pip install --quiet -r backend/requirements.txt
ok "Python-Pakete installiert"

# ============================================================
# 5. DOCKER — Beide Container bauen und starten
#    --build  → Images neu bauen (kein Cache)
#    -d       → Im Hintergrund starten
# ============================================================
step "[5/5] Docker-Container bauen und starten (docker-compose)"
docker-compose up --build -d
ok "Anwendung läuft!"

# ---------- Fertig ----------
echo ""
echo -e "${GREEN}============================================================${NC}"
echo -e "${GREEN}  Build erfolgreich abgeschlossen!${NC}"
echo -e "${GREEN}============================================================${NC}"
echo ""
echo "  Frontend: http://localhost:8401"
echo "  Backend:  http://localhost:8400"
echo "  API-Docs: http://localhost:8400/docs"
echo ""
echo "  Zum Stoppen: docker-compose down"
