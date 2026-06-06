# CFTMP — Deploy Guide

Self-contained stack: PostgreSQL + the Next.js app, both in Docker.
Tested on Linux VPS (Ubuntu/Debian). Should run on any host with Docker + docker compose.

---

## What's in the box

```
.
├── Dockerfile             # production image for the Next.js app
├── docker-compose.yml     # 2 services: db (Postgres 16) + app (Next.js)
├── .env.example           # copy to .env and fill in
├── sql_migration.sql      # full DB schema
├── scripts/
│   ├── migrate.js         # creates the schema
│   └── seed.js            # inserts the initial admin user
├── app/api/               # Next.js API routes (all DB access)
├── lib/db.js              # pg pool (server-only)
├── lib/authServer.js      # bcrypt + JWT cookie helpers (server-only)
└── lib/api.js             # browser-side fetch wrappers
```

---

## 0. Prerequisites on the server

```bash
# Docker + compose (Ubuntu/Debian)
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
newgrp docker  # or log out + back in
```

---

## 1. Clone and configure

```bash
git clone <your-repo-url> cftmp && cd cftmp

# create a real .env from the template
cp .env.example .env
nano .env                     # fill in real values
```

Edit these in `.env`:

| Variable             | What to put                                                       |
|----------------------|-------------------------------------------------------------------|
| `POSTGRES_PASSWORD`  | A strong random password (e.g. `openssl rand -hex 24`)            |
| `AUTH_SECRET`        | `openssl rand -hex 48` — used to sign session cookies             |
| `ADMIN_EMAIL`        | The first admin account's email                                   |
| `ADMIN_PASSWORD`     | The first admin's login password (you can change it in the app)   |
| `ADMIN_NAME`         | Display name for the seeded admin                                 |

`POSTGRES_DB` and `POSTGRES_USER` can stay as `cftmp` / `cftmp`.

> The compose file binds Postgres to `127.0.0.1:5435` on the host — meaning only this server can reach it, never the public internet. If you're not running another Postgres on the box you can change it to `127.0.0.1:5432` in `docker-compose.yml`.

---

## 2. Start the database

```bash
docker compose up -d db
docker compose ps                # wait until db is "healthy"
```

---

## 3. Create the schema and seed admin

These run from your host against the dockerized DB.

```bash
# Use the same DATABASE_URL the app uses but pointed at the localhost-mapped port:
export DATABASE_URL="postgres://cftmp:${POSTGRES_PASSWORD}@127.0.0.1:5435/cftmp"
export ADMIN_EMAIL ADMIN_PASSWORD ADMIN_NAME    # already in your shell from .env

# install node deps once on the host so the scripts can run
npm install --omit=dev

npm run db:migrate     # creates 8 tables + indexes
npm run db:seed        # inserts the admin user with a bcrypt-hashed password
```

If you don't want Node on the host, you can run both scripts inside the running app container after step 4 instead:

```bash
docker compose exec app npm run db:migrate
docker compose exec app npm run db:seed
```

(The app container has `DATABASE_URL` baked into its env, so it just works.)

---

## 4. Build and start the app

```bash
docker compose up -d --build app
docker compose logs -f app          # Ctrl-C when you see "Ready in"
```

The site is now on port `3000`. Log in at `http://your-server:3000` with `ADMIN_EMAIL` / `ADMIN_PASSWORD`.

---

## 5. Front it with a real domain (nginx + HTTPS)

`/etc/nginx/sites-available/cftmp`:

```nginx
server {
    listen 80;
    server_name cftmp.example.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Then:

```bash
sudo ln -s /etc/nginx/sites-available/cftmp /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d cftmp.example.com
```

After HTTPS is on, session cookies become `Secure` automatically (controlled by `NODE_ENV=production`).

---

## 6. Day-2 operations

| Task                                | Command                                                              |
|-------------------------------------|----------------------------------------------------------------------|
| View app logs                       | `docker compose logs -f app`                                         |
| View DB logs                        | `docker compose logs -f db`                                          |
| Restart app                         | `docker compose restart app`                                         |
| Update code and redeploy            | `git pull && docker compose up -d --build app`                       |
| Backup the DB                       | `docker exec cftmp-db pg_dump -U cftmp cftmp > backup-$(date +%F).sql` |
| Restore a backup                    | `cat backup.sql \| docker exec -i cftmp-db psql -U cftmp -d cftmp`   |
| Open a Postgres shell               | `docker exec -it cftmp-db psql -U cftmp -d cftmp`                    |
| Wipe DB and re-create schema        | `npm run db:migrate && npm run db:seed`                              |
| Stop everything                     | `docker compose down`                                                |
| Stop and delete the volume too      | `docker compose down -v`  ⚠️ deletes all data                        |

---

## 7. Security model

- **Passwords**: stored as bcrypt hashes (cost 10) in `profiles.password_hash`. Plaintext never touches the database.
- **Sessions**: signed JWT in an HttpOnly + SameSite=Lax cookie. `Secure` flag is set when `NODE_ENV=production`.
- **Authorization**: every API route under `/api` uses `withAuth(..., { roles: [...] })` from `lib/authServer.js`. Role checks happen server-side — clients can't bypass them by editing localStorage.
- **Database access**: never from the browser. The only thing the client can do is call `/api/...`, which goes through Next.js → `lib/db.js` → Postgres.
- **DB port**: by default only bound to `127.0.0.1` on the host (not exposed publicly).
- **AUTH_SECRET**: must be at least 32 chars; the app refuses to start otherwise.

### What's still demo-grade
- The "payment" form does not actually charge — it just records the enrollment. Hook it up to SlickPay (or Stripe) by:
  1. Creating an invoice on the server in `POST /api/enrollments` (don't create the enrollment yet).
  2. Returning the gateway redirect URL to the client.
  3. Receiving the gateway webhook on a new `POST /api/payments/webhook` route and only THEN inserting the row.
- Per-user rate limiting on login is not implemented. Add it via nginx (`limit_req`) or a middleware before going live.

---

## 8. Troubleshooting

| Symptom                                          | Likely cause / fix                                                                 |
|--------------------------------------------------|------------------------------------------------------------------------------------|
| `AUTH_SECRET must be set and at least 32 chars`  | You forgot to set it in `.env`. Run `openssl rand -hex 48` and paste the output.   |
| `DATABASE_URL is not set`                        | App container can't see it. Make sure `.env` exists and `docker compose up -d --build app`. |
| Login returns `notfound` for admin               | Forgot `npm run db:seed`, or `ADMIN_PASSWORD` mismatch.                            |
| `port already in use` on `docker compose up`     | Another Postgres or another Next.js is bound to the same host port. Change the host-side port in `docker-compose.yml`. |
| 500 on every API call after a schema change      | Re-run `npm run db:migrate`. The script drops + recreates everything — back up first. |
