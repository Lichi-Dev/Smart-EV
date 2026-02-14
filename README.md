## Smart EV Trip Planner

Production-ready EV trip planner built with **Next.js**, **Node.js/Express**, and **MongoDB**. It plans routes, suggests optimal charging stations near the route, and stores trip history. An admin panel lets you manage stations and view traffic analytics by city.

### Features

- **Route planning**: Multiple route options between origin and destination (via GraphHopper routing API).
- **Smart charging suggestions**: Charging stations stored in MongoDB, filtered by distance (default 5 km, configurable).
- **Trip history**: Persisted trips with route metrics and charging stops.
- **Admin panel**: Manage stations, see trip history, and see traffic by city (with geolocation).

### Tech Stack

- **Frontend**: Next.js 14 (App Router), React 18, TailwindCSS.
- **Backend**: Node.js, Express, MongoDB (Mongoose), Joi validation.
- **Maps / Routing**: GraphHopper routing API.

### Project structure

```text
.
├── backend
│   ├── src
│   │   ├── app.js
│   │   ├── server.js
│   │   ├── config/env.js
│   │   ├── models
│   │   ├── routes
│   │   ├── services
│   │   └── middleware
│   └── package.json
├── frontend
│   ├── app
│   ├── components
│   ├── styles
│   ├── next.config.mjs
│   └── package.json
└── package.json (root; run install/dev from backend/ and frontend/)
```

Dependencies and build output stay inside each app: run `npm install` and `npm run dev` (or `npm run build`) from `backend/` and `frontend/` so that `node_modules` and `.next` live in those folders. From the repo root you can use `npm run install:all`, `npm run dev:backend`, and `npm run dev:frontend`.

### Prerequisites

- Node.js 18+
- MongoDB instance (local or Atlas)
- GraphHopper API key (free at [graphhopper.com](https://www.graphhopper.com/))

### How to run (quick start)

1. **Install dependencies** (from repo root):
   ```bash
   npm run install:all
   ```
2. **Backend:** Copy `backend/.env.example` to `backend/.env`, set your `MONGO_URI` and `GRAPHHOPPER_API_KEY`, then run:
   ```bash
   npm run dev:backend
   ```
   Backend runs at **http://localhost:4000**.
3. **Frontend:** Copy `frontend/.env.example` to `frontend/.env.local`, then run:
   ```bash
   npm run dev:frontend
   ```
   App runs at **http://localhost:3000**.

(You can also run from each folder: `cd backend && npm install && npm run dev` and `cd frontend && npm install && npm run dev`.)

### Backend setup

```bash
cd backend
npm install
```

Copy `backend/.env.example` to `backend/.env` and set values. Example:

```bash
cp .env.example .env
# Edit .env: set MONGO_URI, GRAPHHOPPER_API_KEY, etc.
```

Run the backend:

```bash
cd backend
npm run dev
```

The API will be available at `http://localhost:4000`.

Key endpoints:

- `POST /api/routes` – get multiple route options.
- `POST /api/stations/near-route` – stations within X km of a route’s bounding box.
- `POST /api/trips` – save a trip.
- `GET /api/trips/history` – get recent trips.
- `GET /api/admin/stations` / `POST /api/admin/stations` – manage stations.
- `GET /api/admin/trips` – all trips for admin.
- `GET /api/admin/traffic` – aggregated traffic by city.

### Frontend setup

```bash
cd frontend
npm install
```

Copy `frontend/.env.example` to `frontend/.env.local`:

```bash
cd frontend
cp .env.example .env.local
# .env.local should have NEXT_PUBLIC_BACKEND_URL=http://localhost:4000
```

Run the frontend:

```bash
cd frontend
npm run dev
```

The app runs at `http://localhost:3000`.

Key pages:

- `/` – Trip planner (origin/destination, route options, nearby stations, save trip).
- `/history` – User trip history list.
- `/admin` – Admin dashboard for stations, trips, and traffic by city.

### Production deployment

- **Backend**:
  - Containerize with Docker or deploy to a Node-friendly host (Render, Railway, Fly.io, etc.).
  - Use MongoDB Atlas for production-grade Mongo.
  - Expose the backend over HTTPS, e.g. `https://api.your-domain.com`.
- **Frontend**:
  - Deploy the Next.js app to Vercel or any Node host.
  - Set `NEXT_PUBLIC_BACKEND_URL` to your live backend URL.

Example environment for production:

```bash
# Backend
MONGO_URI=your_atlas_uri
PORT=4000
CLIENT_ORIGIN=https://ev.your-domain.com
GRAPHHOPPER_API_KEY=...

# Frontend
NEXT_PUBLIC_BACKEND_URL=https://api.your-domain.com
# Optional: Add map SDK key if you want map rendering
# NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=...
```

### GitHub & CI/CD (suggested)

- Initialize a repository in the project root:

```bash
git init
git add .
git commit -m "Smart EV Trip Planner initial version"
git remote add origin git@github.com:YOUR_USER/smart-ev-trip-planner.git
git push -u origin main
```

- Connect the GitHub repo to:
  - **Vercel** for the `frontend` directory.
  - **Render/Railway** for the `backend` directory.

Once deployed, you’ll have:

- **Frontend live link** – e.g. `https://smart-ev.your-domain.com`
- **Backend live link** – e.g. `https://api.smart-ev.your-domain.com`

Use those URLs in your README and submission.
