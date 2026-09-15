# Selena — Collaborative Project Management Platform with Geospatial Intelligence

A full-stack, real-time project management platform (Trello/Asana-inspired) with a genuine
geospatial dimension: projects and tasks can be located on a map, queried spatially
("tasks near me"), and analyzed territorially — powered by PostGIS, not a decorative Leaflet map.

## Features

**Accounts & profiles**
- Register / login / logout with JWT (access + refresh, auto-refreshed on 401), password
  change and reset-by-email flow.
- Editable profile: name, username, email, avatar, bio, job title.

**Projects & teams**
- Create projects with description, status (planning/active/on hold/completed/archived),
  priority (low/medium/high/critical), start/end dates, and an optional map location.
- Invite members with a role — owner / admin / manager / member / viewer — each permission
  (edit project, manage board, assign tasks, manage members, ...) enforced server-side from
  the caller's actual `ProjectMember` row, never from anything the client sends.
- Per-project Overview, Board, List, Calendar, Map, Activity, Members, and Settings tabs.

**Boards & tasks**
- Kanban board with drag-and-drop columns (Backlog → To Do → In Progress → Review → Done by
  default, fully customizable) using `@dnd-kit`, with float-based positions so reordering
  never needs to renumber a whole column.
- Task cards: title, description, priority, status, start/due dates, completion date,
  estimated/actual hours, progress, parent task (subtasks), tags, file attachments.
- Multi-assignee support via a proper many-to-many (`TaskAssignee`), with assign/reassign/
  unassign always re-validated against project membership and caller permissions.
- Task detail modal: full edit surface, comment thread, activity timeline, and an optional
  mini-map when the task has a location.
- List view (sortable/filterable table) and month Calendar view (by start/due date) as
  alternatives to the board; CSV export of the current task list.
- Bulk actions (multi-select status/assignee/priority updates) and a tag picker scoped to
  the project.

**Collaboration**
- Threaded comments per task — add / edit own / delete (author or admin+) — with
  `@username` mention detection that fires a notification.
- Full activity timeline per project/task ("Sarah created this task", "Maria moved the task
  to In Progress", ...), used as the audit trail.
- Notifications (assignment, reassignment, new comment, mention, project invite, status
  change, deadline reminders) with an unread badge, panel, and mark-as-read/mark-all-read.

**Real-time**
- Django Channels/WebSockets over project-scoped groups: task create/update/move,
  assignment, comment, membership, and notification events are pushed live to every
  connected member without a page refresh, and connections are re-authorized against the
  database on connect (never trusted from the URL alone).

**Geospatial**
- Projects and tasks can optionally carry a PostGIS geometry (point / line / polygon /
  multipolygon) via a shared `SpatialMixin`, with a `location_visibility` setting
  (public / project members / private-to-admins) enforced everywhere the geometry is
  serialized, REST and WebSocket alike.
- Interactive Leaflet map (global Explore view and per-project Map tab) with clustering,
  popups, and click-to-open-task integration.
- "Tasks near me": opt-in browser geolocation → PostGIS `ST_DWithin`/`ST_Distance` search
  within a capped radius, returning real distances — never computed client-side.

**Dashboard & search**
- Global dashboard: my projects, assigned tasks, due-today/overdue/upcoming, recent
  activity, and project/task statistics.
- Per-project dashboard: progress, status/priority distribution, team, deadlines.
- Global search across projects, tasks, and users, plus server-side task filtering
  (status, priority, assignee, due date, project, overdue).

## Technologies

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4, React Router, TanStack Query,
  React-Leaflet + Leaflet, `@dnd-kit` (drag-and-drop), Recharts, Axios.
- **Backend**: Python, Django, Django REST Framework, Simple JWT, Django Channels
  (Daphne/ASGI), django-filter, GeoDjango.
- **Database**: PostgreSQL + PostGIS (geography-typed geometry columns for accurate
  real-world distance queries, GiST-indexed).
- **Real-time transport**: WebSockets via Django Channels, in-memory channel layer for
  local dev and Redis (`channels_redis`) for multi-process/production setups.

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
