# SecuroSense

SecuroSense is a call quality-assurance platform. It transcribes calls, scores them against QA templates, and reports compliance and coaching insights for each organization.

This repository holds both applications:

- `secure-be` — Express API, Prisma, and PostgreSQL
- `secure-fe` — Angular app

## Prerequisites

- Node.js 18 or newer
- PostgreSQL 13 or newer

## Backend

```bash
cd secure-be
npm install
```

Create `secure-be/development.env` (this file is not committed) with the database URL, JWT secrets, and AI API key the server expects. `npm run dev` loads `development.env`.

```bash
npx prisma migrate deploy
npm run seed
npm run dev
```

The API listens on `http://localhost:3000`. Swagger is at `http://localhost:3000/api-docs`.

## Frontend

```bash
cd secure-fe
npm install
npm start
```

The app serves on `http://localhost:4200` and proxies `/api` to the backend.

See `secure-fe/README.md` for roles, QA templates, and the seeded local login.
