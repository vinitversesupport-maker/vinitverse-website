### Payments (Manual UPI)

This branch implements manual UPI payment proof upload, admin verification, and pay-first join flow.

DB migrations:
- Run the SQL in backend/migrations/20260813_payments.sql to add entry_fee, max_players, payments table and participant status.

Backend endpoints:
- POST /api/payments (auth, multipart/form-data): upload proof file (field name 'proof'), tournament_id, amount, method, txn_id.
- GET /api/payments?status=pending&tournament_id=... (auth): admin can list pending payments; non-admin users will see only their payments.
- POST /api/payments/:id/verify (auth admin): { action: 'verify' | 'reject' } — verify payment and auto-register participant if verified.

Frontend:
- Tournament page shows Entry Fee, upload proof form (JPG/PNG/PDF, max 5MB) and disables Join button until payment verified.
- Admin page: /admin/payments to review pending proofs and approve/reject.

Storage:
- Proof files are stored on the server under /uploads and the path is saved in payments.proof_path. uploads/ is gitignored.

Email:
- Email notifications to admin and user are sent if SMTP_* env vars are configured. Otherwise emails are logged to console.

