#!/usr/bin/env bash
# ============================================================
#  Family Dashboard — Build Script
#
#  Verwendete Tools:
#    - vitest  → Frontend Unit-Tests
#    - pytest  → Backend Unit- & Integrationstests
#    - docker  → Container-Build & Start
# ============================================================

set -e

# ---------- Farben für die Ausgabe ----------
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

step() { echo -e "\n${BLUE}==>${NC} $1"; }
ok()   { echo -e "${GREEN}✔ $1${NC}"; }
fail() { echo -e "${RED}✘ $1${NC}"; exit 1; }

# ============================================================
# 1. FRONTEND — Unit-Tests (vitest)
# ============================================================
step "[1/3] Frontend-Tests ausführen (vitest)"
cd frontend
npm install --silent
npm test || fail "Frontend-Tests fehlgeschlagen — Build abgebrochen"
cd ..
ok "Alle Frontend-Tests bestanden"

# ============================================================
# 2. BACKEND — Unit- & Integrationstests (pytest)
# ============================================================
step "[2/3] Backend-Tests ausführen (pytest)"
pip install --quiet -r backend/requirements.txt
cd backend
pytest tests/ -v || fail "Backend-Tests fehlgeschlagen — Build abgebrochen"
cd ..
ok "Alle Backend-Tests bestanden"

# ============================================================
# 3. DOCKER — Container bauen und starten
#    --build → Images neu bauen
#    -d      → Im Hintergrund starten
# ============================================================
step "[3/3] Docker-Container bauen und starten (docker-compose)"
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
