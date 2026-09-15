# Engineering Workspace

A unified engineering workspace: team messaging, GitHub repository browsing, an in-browser code editor, issues, pull
requests, CI status, contributors, and (in progress) live collaborative coding and video calls — built with Next.js,
Prisma, and the GitHub API.

## Status

This repository is being built in phases. **Phase 1 (current)** covers: authentication, the application shell,
GitHub OAuth + repository import, the code workspace (file explorer, Monaco editor, commits via the GitHub API),
issues, pull requests with a diff viewer, contributors, a CI/test-run dashboard, notifications, settings, and basic
(non-realtime) channel messaging. Live collaborative multi-cursor editing, WebRTC video calls, and fully realtime
messaging land in later phases — see `components`/`lib` for the data models and routes already scaffolded for them.

## Getting started

```bash
git clone <repository>
cd <repository>
npm install
cp .env.example .env
```

Fill in `.env`:

| Variable | Required | Notes |
|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string. |
| `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` | Yes | `openssl rand -base64 48` each. Must differ. |
| `TOKEN_ENCRYPTION_KEY` | Yes | `openssl rand -base64 32`. Encrypts stored GitHub tokens at rest. |
| `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` | No | See GitHub OAuth setup below. Without these, the app runs fully except the GitHub-connected screens, which show a clear "not configured" state. |
| `NEXT_PUBLIC_APP_URL` | No | Defaults to `http://localhost:3000`. |

Then:

```bash
npx prisma migrate dev
npm run db:seed   # optional: realistic demo data — login with alex@acme.dev / Password123!
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## GitHub OAuth setup

1. Go to **GitHub → Settings → Developer settings → OAuth Apps → New OAuth App**.
2. Homepage URL: `http://localhost:3000`.
3. Authorization callback URL: `http://localhost:3000/api/github/callback`.
4. Copy the generated **Client ID** and a new **Client Secret** into `.env` as `GITHUB_CLIENT_ID` /
   `GITHUB_CLIENT_SECRET`.
5. Restart the dev server. Go to **Settings → GitHub** in the app and click **Connect GitHub**.

Tokens are encrypted at rest (`GitHubConnection.accessTokenEncrypted`, AES-256-GCM) and are never sent to the
browser — all GitHub API calls happen server-side through `lib/github/*`.

## Database

Any PostgreSQL 14+ instance works (local, Docker, or a managed provider). The schema lives in
`prisma/schema.prisma`; the Prisma Client is generated into `src/generated/prisma`.

```bash
npx prisma migrate dev     # apply/create migrations
npm run db:seed            # seed realistic demo data
npm run db:studio          # browse data visually
```

## Testing

```bash
npm run test          # Vitest unit tests (JWT, password hashing/strength, permissions, encryption)
npm run test:watch    # watch mode
npx playwright test   # Playwright E2E (spins up `next dev` automatically)
```

## Realtime / WebSockets

`socket.io` is installed and the room-naming convention (`workspace:{id}`, `channel:{id}`, `repository:{id}`,
`coding:{sessionId}`, `video:{roomId}`) is documented in `lib/realtime`, but the server and client wiring for live
messaging, presence, and collaborative editing are being built out in the next phase. Channel messaging today
persists to Postgres and works without realtime delivery (refresh to see new messages).

## Docker

```bash
cp .env.example .env   # fill in secrets; DATABASE_URL is overridden by docker-compose for the db service
docker compose up --build
```

This starts a Postgres container and the app in standalone mode. Run migrations against the containerized DB with:

```bash
DATABASE_URL="postgresql://workspace:workspace@localhost:5432/software_engineer_workspace" npx prisma migrate deploy
```

## Project structure

```
src/
  app/            Next.js App Router routes ((auth), (workspace), api/*)
  components/     UI components, grouped by feature
  lib/            auth, db, github, permissions, validation, realtime
  types/          shared TypeScript types
  generated/      Prisma Client output (generated, not hand-edited)
prisma/           schema.prisma, migrations, seed.ts
tests/
  unit/           Vitest unit tests
  e2e/            Playwright E2E tests
```

## Definition of done (tracked against the product spec)

Auth, GitHub OAuth + import, repository browsing, code editing + commits via GitHub, branches/commits, issues,
pull requests + diff review, contributors, CI/test dashboard, notifications, and responsive desktop/tablet/mobile
layout are implemented and wired to real data. Realtime messaging/presence, live collaborative editing, and WebRTC
video calls are architected (data models, routes, UI shells) but not yet functional — see **Status** above.
# Workspace-Teams
