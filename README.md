# Selena — Collaborative Project Management Platform with Geospatial Intelligence

A full-stack, real-time project management platform (Trello/Asana-inspired) with a genuine
geospatial dimension: projects and tasks can be located on a map, queried spatially
("tasks near me"), and analyzed territorially — powered by PostGIS, not a decorative Leaflet map.

## Architecture

```
React + TypeScript (Vite, Tailwind)
        │  REST (JWT) + WebSocket
        ▼
Django + Django REST Framework + Django Channels
        │
        ▼
Business / Permission / Spatial services (per-app)
        │
        ▼
PostgreSQL + PostGIS
```

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4, React Router, TanStack Query,
  React-Leaflet, @dnd-kit (Kanban drag-and-drop), Recharts.
- **Backend**: Django, Django REST Framework, Simple JWT, Django Channels (Daphne/ASGI),
  django-filter, GeoDjango.
- **Database**: PostgreSQL + PostGIS (geography-typed geometry columns for accurate
  real-world distance queries).

## Project structure

```
project-management-platform/
├── frontend/           React + TypeScript SPA
│   └── src/
│       ├── components/ (layout, board, tasks, map, dashboard, activity, notifications, ui)
│       ├── pages/       (top-level routes + per-project sub-pages)
│       ├── services/    (one file per API domain: authService, projectService, ...)
│       ├── contexts/    (AuthContext)
│       ├── hooks/       (useProjectSocket - the WebSocket layer)
│       └── types/       (shared TS interfaces mirroring the API)
│
├── backend/            Django project
│   ├── config/          settings, urls, asgi (Channels routing)
│   ├── accounts/        custom User, Profile, auth endpoints
│   ├── projects/        Project, ProjectMember, Board, BoardColumn, role permissions
│   ├── tasks/            Task, TaskAssignee, Tag, Attachment
│   ├── comments/        Comment (with @mention detection)
│   ├── notifications/   Notification model + read/unread endpoints
│   ├── activity/        Activity log (audit trail per project/task)
│   ├── geospatial/      SpatialMixin, GeoJSON serialization, nearby/spatial queries
│   ├── realtime/        Channels consumer, JWT WebSocket auth, broadcast helpers
│   └── dashboard/       Aggregated global + per-project analytics endpoints
│
└── README.md
```

## Data model highlights

- **Roles**: `owner > admin > manager > member > viewer` — every privileged action is
  re-checked server-side against the caller's `ProjectMember` row (never trusted from the client).
- **Spatial fields**: `Project` and `Task` share a `SpatialMixin` (geospatial/models.py) with
  an optional `location` (PostGIS geography column, SRID 4326), `spatial_type`
  (point/line/polygon/multipolygon), and `location_visibility` (public/members/private).
- **Board columns** use a float `position` on tasks so drag-and-drop reordering never needs
  to renumber the whole column (new position = midpoint of its neighbors).

## Prerequisites

- Python 3.11+
- Node.js 18+
- PostgreSQL 14+ with the **PostGIS** extension available
- On Windows, GeoDjango needs the GDAL/GEOS/PROJ DLLs — the PostGIS installer for Windows
  ships them under `PostgreSQL\<version>\bin`; point `GDAL_LIBRARY_PATH` /
  `GEOS_LIBRARY_PATH` at them in `.env` (see `.env.example`). On Linux/macOS this is
  usually auto-detected and can be left blank.

## Backend setup

```bash
cd backend
python -m venv venv
source venv/Scripts/activate   # Windows Git Bash; use venv/bin/activate on macOS/Linux
pip install -r requirements.txt

cp .env.example .env           # then edit DB_*, CORS_ALLOWED_ORIGINS, etc.
```

Create the database and enable PostGIS (adjust names/passwords to match your `.env`):

```sql
CREATE ROLE pmp_user WITH LOGIN PASSWORD 'pmp_dev_password';
CREATE DATABASE pmp_db OWNER pmp_user;
\c pmp_db
CREATE EXTENSION postgis;
```

> The Postgres role used by Django needs `CREATEDB` (and, to auto-enable PostGIS in the
> throwaway test database, effectively superuser locally) so `manage.py test` can spin up
> and tear down its own `test_pmp_db`.

```bash
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver 0.0.0.0:8010
```

`runserver` here is backed by **Daphne** (installed as an app so Django auto-swaps the dev
server for an ASGI one), so both the REST API and WebSocket endpoints are served from the
same process — no separate Channels server needed in development.

By default, real-time events use Channels' **in-memory layer** (single process, fine for
local dev). To run multiple backend processes / a production-like setup, set `REDIS_URL`
in `.env` to switch to `channels_redis`.

## Frontend setup

```bash
cd frontend
npm install
npm run dev
```

The Vite dev server proxies `/api` and `/ws` to `http://localhost:8010` (kept off port 8000
deliberately, since that port is commonly used by other local services such as FastAPI/uvicorn
apps), so the browser
only ever talks to one origin — no CORS involved in local dev. Edit `vite.config.ts` if you
need a different port; keep `CORS_ALLOWED_ORIGINS` in the backend `.env` in sync if you ever
bypass the proxy.

## Running tests

```bash
cd backend
python manage.py test
```

Covers: auth (registration/login/JWT), project creation & role-based permission
enforcement, task creation/assignment/move (including IDOR and cross-project checks),
comments (ownership, @mention notifications), notifications (unread counts, mark-read),
activity logging, spatial queries (nearby search distance/radius correctness, location
visibility rules), and WebSocket authorization (anonymous/non-member connections rejected).

## Key workflows to try

1. Register/login → global dashboard.
2. Create a project → a board with 5 default columns (Backlog → To Do → In Progress →
   Review → Done) and an owner membership are created automatically.
3. Board tab → drag tasks between columns; open a task to edit status/priority/assignees/
   tags/attachments/location, comment, and view its activity log.
4. Project → Settings tab → click the map to give the project a site location.
5. Sidebar → Map / Explore → "Tasks near me" (requests browser geolocation only when
   clicked, never automatically) → returns tasks within the chosen radius using
   PostGIS `ST_DWithin`/`ST_Distance`, with real distances.
6. Open the same project board in two browser windows and move a task in one — it updates
   in the other via WebSocket without a refresh.

## Security notes

- All authorization (project role, task project membership, comment ownership, WebSocket
  group membership) is re-verified server-side on every request/connection.
- JWT access/refresh tokens (Simple JWT), with automatic refresh on 401 in the frontend
  API client.
- A user's live location is never requested or stored automatically — only on explicit
  "Tasks near me" clicks, and project/task locations have a visibility setting
  (public / members-only / private) enforced when serializing map features.
- Password hashing uses a tuned PBKDF2 iteration count (`config/hashers.py`, 400k instead
  of Django's stock 1.5M) — the stock default measured ~4.5s per check on typical dev
  hardware, which is a genuine usability problem for login/registration, not just a test
  nicety. 400k still comfortably clears OWASP's current PBKDF2-SHA256 guidance. Existing
  hashes keep verifying against the stock hasher (still listed, as a fallback) and are
  transparently upgraded to the faster one on next successful login.
