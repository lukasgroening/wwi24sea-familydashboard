# Architektur-Diagramme

Diese Ordner enthält PlantUML-Diagramme zur Architektur-Dokumentation des Family Dashboard Systems.

## Diagramme anzeigen

### Voraussetzungen installieren

**1. Graphviz installieren** (erforderlich für C4-Diagramme)

```bash
# macOS
brew install graphviz

# Ubuntu/Debian
sudo apt-get install graphviz

# Windows (via Chocolatey)
choco install graphviz

# Überprüfen
which dot  # Sollte Pfad zu dot ausgeben
```

**2. VS Code PlantUML Extension installieren**

- Öffnen Sie VS Code
- Drücken Sie `⇧⌘X` (Mac) oder `Ctrl+Shift+X` (Windows/Linux)
- Suchen Sie nach "PlantUML" (von jebbs)
- Klicken Sie auf "Install"

### Diagramme in VS Code anzeigen

1. **Öffnen Sie eine `.puml` Datei**
2. **Vorschau öffnen:**
   - Drücken Sie **Alt+D** (Mac: **⌥+D**)
   - Oder: Rechtsklick → "Preview Current Diagram"
   - Oder: `⇧⌘P` → "PlantUML: Preview Current Diagram"

3. **Als Bild exportieren:**
   - In der Vorschau: Rechtsklick → "Export Current Diagram"
   - Wählen Sie Format: PNG, SVG oder PDF
   - Bilder werden im gleichen Ordner gespeichert

### Alternative: Online PlantUML Editor

Wenn Sie nichts installieren möchten:

1. Öffnen Sie: http://www.plantuml.com/plantuml/uml/
2. Kopieren Sie den Inhalt einer `.puml` Datei
3. Fügen Sie ihn ein → Diagramm wird sofort angezeigt
4. Download als PNG/SVG möglich

⚠️ **Hinweis:** Für C4-Diagramme funktioniert die Online-Version möglicherweise nicht optimal, da externe `!include` Dateien geladen werden müssen.

### Alternative: Kommandozeile

```bash
# PlantUML JAR herunterladen (einmalig)
curl -L https://sourceforge.net/projects/plantuml/files/plantuml.jar/download -o plantuml.jar

# Einzelnes Diagramm als PNG generieren
java -jar plantuml.jar docs/diagrams/C4/c4-level1.puml

# Alle Diagramme in einem Ordner generieren
java -jar plantuml.jar docs/diagrams/C4/*.puml

# Als SVG exportieren
java -jar plantuml.jar -tsvg docs/diagrams/C4/c4-level1.puml
```

Die generierten Bilder werden im gleichen Ordner wie die `.puml` Dateien erstellt.

## 📖 Diagramm-Übersicht

### C4-Modell (Software Architecture for Developers)

**Level 1: System Context**

- Zeigt das System im Kontext von Benutzern und externen Systemen
- Akteure: System-Admin, Familien-Admin, Nutzer
- Externe APIs: Open-Meteo, Nominatim

**Level 2: Container**

- Zeigt die Haupt-Container des Systems
- Frontend SPA (React), Backend API (FastAPI), Datenbank (SQLite)
- Kommunikation zwischen Containern

**Level 3: Component (Backend)**

- Backend-Komponenten im Detail
- Router (auth, users, todos, weather, ...)
- Services, Models, Dependencies

**Level 3: Component (Frontend)**

- Frontend-Komponenten im Detail
- Pages, Widgets, Stores, API-Clients
- React-Komponentenstruktur

### Sequenzdiagramme

**Login Sequence**

- Authentifizierungs-Flow mit JWT
- Frontend → Backend → Datenbank
- Erfolgs- und Fehlerfall

**Todo Widget Sequence**

- CRUD-Operationen für Todos
- Optimistisches Update-Pattern
- Rollback bei Fehlern

## Troubleshooting

**Problem: "Cannot run program 'dot'"**

- **Lösung:** Graphviz ist nicht installiert → siehe "Voraussetzungen installieren"

**Problem: Diagramm wird nicht angezeigt**

- Überprüfen Sie, ob Graphviz installiert ist: `which dot`
- Überprüfen Sie die PlantUML Extension Settings in VS Code
- Starten Sie VS Code neu nach Graphviz-Installation

**Problem: C4-Diagramme zeigen Fehler**

- Stellen Sie sicher, dass eine Internetverbindung besteht (für `!include` von GitHub)
- Überprüfen Sie, ob die C4-PlantUML Bibliothek erreichbar ist

## Weitere Ressourcen

- **PlantUML Dokumentation**: https://plantuml.com/
- **C4-Model**: https://c4model.com/
- **C4-PlantUML**: https://github.com/plantuml-stdlib/C4-PlantUML
- **VS Code PlantUML Extension**: https://marketplace.visualstudio.com/items?itemName=jebbs.plantuml
