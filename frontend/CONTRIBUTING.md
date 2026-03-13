# FamilyBoard — Mitmachen

## Widget hinzufügen (für Widget-Kollegen)

### 1. Ordner anlegen
```
src/widgets/MeinWidget/
└── index.tsx
```

### 2. Komponente bauen
```tsx
// src/widgets/MeinWidget/index.tsx
import type { WidgetProps } from '../../types'

// Mock-Daten — später durch echten API-Call ersetzen:
// const { data } = useQuery({ queryFn: () => api.get('/mein-endpoint') })
const mockData = { beispiel: 'Daten' }

export default function MeinWidget(_props: WidgetProps) {
  return (
    <div>
      {/* Dein Widget hier */}
    </div>
  )
}
```

### 3. In Registry eintragen
In `src/widgets/index.ts` ergänzen:
```ts
import MeinWidget from './MeinWidget'

// In das WIDGETS-Array:
{
  id: 'mein-widget',
  name: 'Mein Widget',
  description: 'Kurze Beschreibung',
  component: MeinWidget,
  defaultSize: 'medium',   // 'small' | 'medium' | 'large'
  requiredRole: 'user',    // 'user' | 'admin' — wer darf es sehen?
},
```

Das war's. Das Widget erscheint automatisch im Dashboard.

---

## Für den API-Aufruf (sobald Backend fertig)

Import in deinem Widget:
```ts
import api from '../../lib/api'
import { useQuery } from '@tanstack/react-query'

const { data, isLoading } = useQuery({
  queryKey: ['mein-widget'],
  queryFn: () => api.get('/mein-endpoint').then(r => r.data),
})
```

---

## Projekt lokal starten

```bash
cd frontend
npm install
npm run dev
# → http://localhost:5173
```

**Demo-Login:** `mama@family.de` / `test` (Admin) · `lena@family.de` / `test` (Nutzer)

---

## Backend-Anbindung

Die Backend-URL steht in `frontend/.env.local`:
```
VITE_API_URL=http://localhost:3000/api
```

Für Vercel: Variable im Vercel-Dashboard unter Settings → Environment Variables setzen.

---

## Datenstrukturen (mit Backend absprechen)

### User
```ts
{ id: string, name: string, email: string, role: 'admin' | 'user' | 'sysadmin', familyId: string }
```

### Auth
- `POST /auth/login` → `{ user: User, token: string }`
- `POST /auth/register` → `{ user: User, token: string }`

### Todos
```ts
{ id: string, text: string, done: boolean, tag?: string, familyId: string }
```
- `GET /todos` → `Todo[]`
- `POST /todos` → `Todo`
- `PATCH /todos/:id` → `Todo`

### Events (Kalender)
```ts
{ id: string, title: string, date: string, time: string, color?: string, familyId: string }
```
- `GET /events` → `Event[]`
- `POST /events` → `Event`

### Schedule (Stundenplan)
```ts
{ id: string, day: 'Mo'|'Di'|'Mi'|'Do'|'Fr', time: string, subject: string, room: string, personId: string }
```
- `GET /schedule?personId=...` → `ScheduleItem[]`

### Weather
- `GET /weather?city=...` → `{ temp: number, description: string, high: number, low: number, rain: number }`
