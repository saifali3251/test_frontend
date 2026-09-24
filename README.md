# Fieldwork — frontend

React + Vite frontend for Fieldwork, a project tracker, served by Nginx in
production. Split out from a single-repo layout into its own repo so
Holodeck can target it independently of the backend — a ticket scoped to
this repo produces a frontend-only PR, not one touching both halves.

The backend lives in a separate repo (`test_backend`). This repo talks to it
over `/api`, proxied by Nginx to whatever `BACKEND_URL` is set to.

## Run standalone

Start `test_backend` first (its own `docker compose up`), then:

```bash
docker compose up -d --build
```

Open http://localhost:13000.

## Configuration

```bash
cp env.example .env
```

- `FRONTEND_PORT`: host port, default `13000`
- `BACKEND_URL`: where Nginx proxies `/api/*` to. Defaults to
  `http://host.docker.internal:18000` (test_backend's default host port,
  reached from this container). Override if the backend runs elsewhere.

`BACKEND_URL` is substituted into Nginx's config **at container start**
(via the official nginx image's template mechanism), not baked in at build
time — so pointing this at a different backend is a restart, not a rebuild.

## Local dev (hot reload, no Docker)

```bash
npm install
npm run dev
```

Vite's dev server proxies `/api` per `vite.config.ts` (`VITE_API_PROXY_TARGET`,
defaults to `http://localhost:18000` — override via env var if needed).

## Common commands

```bash
make up       # build and start
make logs     # follow logs
make ps       # show health
make down     # stop
```

## Extend

API access is centralized in `src/api.ts`; shared contracts in
`src/types.ts`. Add resource views/components under `src/`, then rebuild.

## Move the repository

Copy this directory to another machine with Docker, set `BACKEND_URL` to
wherever `test_backend` is reachable, and run `docker compose up -d --build`.
