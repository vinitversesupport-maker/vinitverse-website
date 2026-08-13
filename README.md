# Vinitverse Website — Scaffold

This branch contains a starter scaffold for Vinitverse esports project.

Included:
- docker-compose.yml (Postgres + backend + frontend)
- backend/ (Express API, routes, DB migrations)
- frontend/ (React starter with Chat widget & Bracket stub)
- plugins/vinitvers-local-chat/ (WordPress local chatbot plugin)
- wp-theme/ (minimal starter theme)
- .env.example

Seed data: tournaments inserted for BR and CS with prices in ₹.

Quick start (local with Docker):
1) Copy .env.example to .env and edit if needed.
2) Run: docker-compose up --build
3) After DB is ready, run migrations inside backend container:
   docker-compose exec backend bash
   node -e "require('./src/db')" # then use psql or run psql client
   # simpler: use psql client to run backend/migrations/init.sql against the Postgres container

Notes:
- Payment integration is a placeholder. Add Razorpay later.
- WordPress theme and plugin are provided as code — upload to wp-content/themes and wp-content/plugins respectively if you use WordPress hosting.

