# Prism CRM

Prism CRM is a React and TypeScript sales workspace backed by FastAPI, SQLAlchemy and PostgreSQL. It includes a dashboard, client and lead records, a drag and drop pipeline, tasks, communications, analytics, account login and a CRM-aware AI assistant. Each account sees only records it owns. Groq is optional; without a Groq key, the assistant uses small local summaries.

## Project map

```text
frontend/src/
  app/                 App shell, navigation and dashboard
  components/           Sidebar, cards, AI assistant and UI effects
  features/             Clients, leads, pipeline, tasks, analytics, settings
  state/                Auth and CRM data contexts
  lib/                  API client and formatting helpers
  styles/               Theme and glass effects
backend/app/
  api/routes/           Auth, customer/task/activity, AI routes
  core/                 Settings, JWT/password security and rate limits
  database/             SQLAlchemy engine and DB sessions
  models/               User, customer, task and activity tables
  schemas/              Validated API input and output
  services/ai/          Groq provider and model fallback
backend/migrations/     Alembic schema history
backend/tests/          Auth, ownership, stage and mocked AI tests
```

## Run locally

Requirements: Node.js 20+, Python 3.11+.

1. In the project root, copy `.env.example` to `backend/.env`. Keep the local `JWT_SECRET` only for local development. Add `GROQ_API_KEY` if you want live AI.
2. Start the backend:

   ```powershell
   cd backend
   python -m venv .venv
   .venv\Scripts\Activate.ps1
   pip install -r requirements.txt
   alembic upgrade head
   uvicorn main:app --reload
   ```

3. In another terminal:

   ```powershell
   cd frontend
   npm install
   npm run dev
   ```

Open the Vite URL, create your account, and add your CRM records. The first account created on a database adopts legacy unowned records from the prior single-user version. Later accounts start with an empty workspace.

To run backend tests from `backend/`, use `pytest -q tests`.

## Upgrade an existing database

Back up the database first. Run `alembic upgrade head` from `backend/`. The first migration recognizes the old schema, then the next adds user accounts, nullable owner links, and `last_contact_date`. Existing rows remain inaccessible until the first account registers; that account adopts them. The new app no longer calls `create_all()` at startup.

For a deployed database that already contains the old tables, take a database snapshot before deploying. The baseline migration detects those tables and applies only the new ownership migration. Review the migration output and verify sign-in and record counts before switching production traffic.

## Render + Neon + Vercel deployment

1. **Rotate the exposed Groq key first.** Revoke the key that was included in the shared ZIP in the Groq console, create a fresh key, and store it only as a Render secret. Do not commit `.env` files or put provider keys in Vercel.
2. **Create PostgreSQL on Neon.** Copy its pooled or direct connection string and use the psycopg SQLAlchemy form for Render: `postgresql+psycopg://USER:PASSWORD@HOST/DBNAME?sslmode=require`. URL-encode special characters in the password.
3. **Deploy the backend on Render.** Create a Blueprint from `render.yaml` (or a Python web service with Root Directory `backend`). Set `DATABASE_URL`, `FRONTEND_ORIGIN` to the Vercel production domain, and `GROQ_API_KEY`. Render generates `JWT_SECRET` in the Blueprint. Build: `pip install -r requirements.txt`; Start: `alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port $PORT`. Health check: `/health`.
4. **Deploy the frontend on Vercel.** Import this repo and set Root Directory to `frontend`. Vercel uses `npm run build` and `dist`. Set `VITE_API_URL` to the full Render API origin (for example `https://prism-crm-api.onrender.com`). Redeploy after setting it.
5. Set Render `FRONTEND_ORIGIN` to the exact Vercel domain including `https://`, without a trailing slash. Redeploy the backend, then verify `/health`, registration, login, create/edit/delete, AI status and chat. Set the Vercel preview domain separately only if you intend to use preview deployments.

Keep Neon backups enabled. `JWT_SECRET` and `GROQ_API_KEY` are server secrets. Changing `JWT_SECRET` signs out all current users. The API uses bearer tokens, password hashing, owner-scoped queries, login throttling, and a 10 requests/minute limit for AI chat.

## Docker

Docker Compose includes PostgreSQL, the API and a frontend container whose Nginx config forwards `/api` to FastAPI:

```powershell
$env:JWT_SECRET = [Convert]::ToBase64String([Security.Cryptography.RandomNumberGenerator]::GetBytes(48))
$env:GROQ_API_KEY = "your-new-key"
docker compose up --build
```

Open `http://localhost:8080`. The API container runs Alembic before starting. `docker-compose.yml` database passwords and secrets are for local use; use Render and Neon secrets for production.

## Data safety notes

- Customers, tasks, activity and stats require a valid login and are filtered by owner.
- `/api/ai/chat` and `/api/ai/chat/stream` require login and are rate limited.
- Customer email is validated, deal stage is validated, and `last_contact_date` is a database date.
- The contact date is stored alongside the old human-readable `last_contact` field to keep existing records readable.
- If a configured Groq provider fails, AI routes return “AI is unavailable right now” instead of pretending the model replied.
