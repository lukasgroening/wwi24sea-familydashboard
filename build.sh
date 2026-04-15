#!/usr/bin/env bash
# ==============================================================================
#  Family Dashboard — Optimized Build & Deploy Script
# ==============================================================================
#  Description:
#    Orchestrates the multi-stage Docker build process.
#    Ensures code quality via linting and testing before deployment.
# ==============================================================================

set -e

# ---------- Terminal Colors ----------
GREEN='\033[0;32m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# ---------- Helper Functions ----------
header() {
    echo -e "\n${CYAN}==============================================================================${NC}"
    echo -e "${CYAN}  $1${NC}"
    echo -e "${CYAN}==============================================================================${NC}"
}

step() { echo -e "\n${BLUE}==>${NC} $1..."; }
ok()   { echo -e "${GREEN}  ✔ $1${NC}"; }
info() { echo -e "${YELLOW}  i $1${NC}"; }
fail() { echo -e "${RED}  ✘ $1${NC}"; exit 1; }

# ==============================================================================
# 0. BUILD MANIFEST (Transparent Step & Tool Overview)
# ==============================================================================
header "BUILD MANIFEST"
info "The following steps will be executed inside Docker containers:"
echo ""
echo -e "  ${YELLOW}BACKEND:${NC}"
echo -e "    1. Linting        [Tool: Ruff]"
echo -e "    2. Unit Tests     [Tool: Pytest]"
echo -e "    3. Production     [Tool: Uvicorn / FastAPI]"
echo ""
echo -e "  ${YELLOW}FRONTEND:${NC}"
echo -e "    1. Linting        [Tool: ESLint]"
echo -e "    2. Unit Tests     [Tool: Vitest]"
echo -e "    3. Build          [Tool: Vite / TypeScript]"
echo -e "    4. Production     [Tool: Nginx (Alpine)]"
echo ""
info "Final images will be stripped of all testing tools and source maps."

# ==============================================================================
# 1. ORCHESTRATION
# ==============================================================================
header "EXECUTION PHASE"

step "[1/2] Building and testing all services"
docker compose build || fail "Build or Quality Checks failed. See logs above."
ok "All quality gates passed (Linting & Tests successful)"
ok "Production images generated"

step "[2/2] Starting application containers"
docker compose up -d
ok "Services are starting up"

# ==============================================================================
# 2. COMPLETION SUMMARY
# ==============================================================================
header "BUILD SUCCESSFUL"
echo -e "${GREEN}The Family Dashboard is now online!${NC}"
echo ""
echo -e "  Local Access Points:"
echo -e "  --------------------------------------------------"
echo -e "  Frontend UI:  ${CYAN}http://localhost:8401${NC}"
echo -e "  Backend API:  ${CYAN}http://localhost:8400${NC}"
echo -e "  API Docs:     ${CYAN}http://localhost:8400/docs${NC}"
echo -e "  --------------------------------------------------"
echo ""
info "To view logs:   docker compose logs -f"
info "To stop:        docker compose down"
echo ""
