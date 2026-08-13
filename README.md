### Auth & JWT

This project now includes JWT-based authentication (Register / Login) with protected endpoints.

Backend endpoints:
- POST /api/auth/register  { name, email, password } -> returns { user, token }
- POST /api/auth/login     { email, password } -> returns { user, token }
- GET  /api/auth/me        (Authorization: Bearer <token>) -> returns { user }

Protected endpoints example:
- POST /api/tournaments/:id/join (Authorization: Bearer <token>)

Frontend:
- Added AuthProvider (frontend/src/auth/AuthProvider.js) which stores token in localStorage under key `vv_token`.
- Login and Register pages at frontend/src/pages/Login.js and Register.js
- Axios instance at frontend/src/utils/api.js attaches Authorization header when token present.

How to test locally:
1) Start docker-compose (see README)
2) Register a user via POST /api/auth/register
3) Use returned token in Authorization header for protected calls (or use frontend login/register UI)

