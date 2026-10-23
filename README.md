# TaskFlow (Routinary)

<!-- TODO(me): put demos here!! gifs/screenshots of the network editor + a practice session. maybe a short video too -->

TaskFlow is a practice scheduling tool I've been building for musicians. The idea is that you break what you're working on into a network of skills/tasks (scales feed into etudes, etudes feed into pieces, etc.) and it figures out what you should actually practice today based on priorities, dependencies between tasks, how much time you have, and how your past sessions went. Under the hood it uses an evolutionary algorithm to tune the routine over time.

The frontend is branded as **Routinary** — same project, I just haven't renamed the repo.

## What's in here

- **Practice networks** – build a graph of tasks, edit nodes, group them into folders, merge/split networks
- **Practice sessions** – run through a generated routine and rate how each item went
- **Marketplace** – publish your networks and clone other people's
- **Social stuff** – friends, profiles, streaks, badges/achievements
- Accounts with email activation, password reset, and OAuth login

## Stack

- `frontend/` – Next.js 15, React 19, Tailwind, Radix UI, vis-network for the graph stuff
- `backend/` – Spring Boot 3.2 (Java 17), Spring Security + JWT, JPA, MySQL (Postgres works too)

## Running it locally

You'll need Node, Java 17, Maven and a MySQL database running.

### Backend

```bash
cd backend
cp src/main/resources/application-local.properties.example src/main/resources/application-local.properties
# fill in DB creds, mail creds and the JWT secret
mvn spring-boot:run
```

Runs on http://localhost:8080. It expects a database called `Frame` by default, override with `DATABASE_URL` if you want something else.

There's also a Dockerfile in `backend/` if you'd rather do it that way:

```bash
docker build -t taskflow-backend ./backend
docker run -p 8080:8080 --env-file .env taskflow-backend
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Runs on http://localhost:4200. If the backend isn't on 8080, set `NEXT_PUBLIC_BACKEND_API_URL`.

## Env vars

Backend:

| var | what it's for |
| --- | --- |
| `DATABASE_URL` | JDBC url (defaults to local mysql) |
| `DB_USERNAME` / `DB_PASSWORD` | db login |
| `MAIL_USERNAME` / `MAIL_PASSWORD` | gmail smtp for activation + reset emails |
| `FRONTEND_URL` | used for links in emails / oauth redirect (default `http://localhost:4200`) |
| `PORT` | defaults to 8080 |

Frontend:

| var | what it's for |
| --- | --- |
| `NEXT_PUBLIC_BACKEND_API_URL` | where the api lives (default `http://localhost:8080`) |

## Notes

Still very much a work in progress, things will break.
