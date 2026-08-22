# Tapline Admin — Phase 5 React frontend

Admin panel for the NFC review-management backend. React + Vite + Tailwind +
React Router + Axios.

## Pages

- `/login` — admin sign in
- `/dashboard` — entity/subscription/scan stat tiles
- `/entities` — table of all entities (search, filter by type, copy NFC URL,
  edit, delete, click a row for a detail drawer)
- `/entities/new` — create an entity + its initial subscription in one form;
  shows the NFC URL with a copy button on success
- `/entities/:id/edit` — edit name/type/URL/active flag + subscription
  dates/status
- `/subscriptions` — table of all subscriptions across entities, with a
  modal to create/edit, and a status filter (including "currently valid"
  which reflects the backend's live date-range check, not just the stored
  status)

## Setup

```bash
npm install
cp .env.example .env      # then edit VITE_API_URL if your backend isn't on localhost:8000
npm run dev
```

Runs on http://localhost:5173 by default (matches the backend's
`CORS_ORIGINS` default).

## Auth

JWT is stored in `localStorage` under `tapline_admin_token` and attached to
every request via an Axios interceptor. A 401 response anywhere clears the
token and redirects to `/login`.

## Build

```bash
npm run build   # outputs to dist/
npm run preview # serve the production build locally
```

## Notes

- The backend never trusts the frontend for subscription validity — this
  admin panel just displays what `GET /api/subscriptions` and
  `GET /api/dashboard/stats` return. The "Currently valid" filter and badges
  read `is_currently_valid` straight from the API.
- Creating an entity makes two calls (`POST /api/entities` then
  `POST /api/subscriptions`), since the backend's entity-create endpoint
  doesn't take subscription fields.
- The dashboard needs a small backend addition — see `backend_updates/` in
  this delivery if you haven't applied it yet.
