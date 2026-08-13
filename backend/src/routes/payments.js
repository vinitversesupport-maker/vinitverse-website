const express = require('express');
const router = express.Router();
const db = require('../db');
const auth = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const sendEmail = require('../utils/email');

// ensure uploads dir exists
const uploadsDir = path.join(__dirname, '..', '..', 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const name = `${Date.now()}-${Math.random().toString(36).slice(2,8)}${ext}`;
    cb(null, name);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: function (req, file, cb) {
    const allowed = ['.png', '.jpg', '.jpeg', '.pdf'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) cb(null, true); else cb(new Error('Invalid file type'));
  }
});

// POST /api/payments - upload proof (authenticated)
router.post('/', auth, upload.single('proof'), async (req, res) => {
  try {
    const user_id = req.user.userId;
    const { tournament_id, amount, method, txn_id } = req.body;
    if (!tournament_id) return res.status(400).json({ error: 'tournament_id required' });
    // check tournament exists
    const t = await db.query('SELECT id, entry_fee, max_players FROM tournaments WHERE id=$1', [tournament_id]);
    if (t.rowCount === 0) return res.status(404).json({ error: 'Tournament not found' });
    const entry_fee = t.rows[0].entry_fee || 0;
    // amount must match entry_fee (user chose rupee unit)
    const amt = parseInt(amount || 0, 10);
    if (entry_fee > 0 && amt !== entry_fee) {
      // allow upload but mark pending and admin will verify amount
      // proceed but note mismatch
    }

    const proof_path = req.file ? `/uploads/${req.file.filename}` : null;
    const ins = await db.query('INSERT INTO payments (user_id,tournament_id,amount,currency,method,txn_id,proof_path,status,created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,NOW()) RETURNING *',
      [user_id, tournament_id, amt, 'INR', method||'manual_upi', txn_id||null, proof_path, 'pending']);

    // send email to admin if configured
    try{
      await sendEmail({
        to: process.env.ADMIN_EMAIL,
        subject: `New payment proof for tournament ${tournament_id}`,
        text: `User ${user_id} uploaded payment proof for tournament ${tournament_id}. Review and verify.`
      });
    } catch(e){ console.error('Email error', e.message); }

    res.json({ ok: true, payment: ins.rows[0] });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message || 'Server error' });
  }
});

// GET /api/payments - list payments (admin sees all, users see their own)
router.get('/', auth, async (req, res) => {
  try{
    const q = [];
    const params = [];
    let sql = 'SELECT p.*, u.name as user_name, t.title as tournament_title FROM payments p LEFT JOIN users u ON u.id=p.user_id LEFT JOIN tournaments t ON t.id=p.tournament_id';
    const where = [];
    if (req.query.status) { params.push(req.query.status); where.push(`p.status=$${params.length}`); }
    if (req.query.tournament_id) { params.push(req.query.tournament_id); where.push(`p.tournament_id=$${params.length}`); }
    // if not admin, only their payments
    if (req.user.role !== 'admin') { params.push(req.user.userId); where.push(`p.user_id=$${params.length}`); }

    if (where.length) sql += ' WHERE ' + where.join(' AND ');
    sql += ' ORDER BY p.created_at DESC';
    const r = await db.query(sql, params);
    res.json(r.rows);
  } catch(e){ console.error(e); res.status(500).json({ error: 'DB error' }); }
});

// POST /api/payments/:id/verify - admin verifies a payment
router.post('/:id/verify', auth, async (req,res) => {
  if (!req.user || req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
  const pid = req.params.id;
  const { action } = req.body; // action: 'verify' or 'reject'
  if (!['verify','reject'].includes(action)) return res.status(400).json({ error: 'action must be verify or reject' });

  try{
    const r = await db.query('SELECT * FROM payments WHERE id=$1', [pid]);
    if (r.rowCount === 0) return res.status(404).json({ error: 'Payment not found' });
    const p = r.rows[0];
    if (action === 'reject'){
      await db.query('UPDATE payments SET status=$1, verified_by=$2, verified_at=NOW() WHERE id=$3', ['rejected', req.user.userId, pid]);
      // notify user
      await sendEmail({ to: (await db.query('SELECT email FROM users WHERE id=$1',[p.user_id])).rows[0].email, subject: 'Payment rejected', text: `Your payment for tournament ${p.tournament_id} was rejected by admin.` });
      return res.json({ ok:true });
    }

    // action == verify
    // check capacity
    const t = await db.query('SELECT max_players, entry_fee FROM tournaments WHERE id=$1', [p.tournament_id]);
    const max_players = t.rows[0].max_players;
    if (max_players){
      const count = await db.query('SELECT COUNT(*) FROM tournament_participants WHERE tournament_id=$1 AND status=$2', [p.tournament_id, 'paid']);
      if (parseInt(count.rows[0].count,10) >= parseInt(max_players,10)){
        return res.status(400).json({ error: 'Tournament is full' });
      }
    }

    // mark payment verified
    await db.query('UPDATE payments SET status=$1, verified_by=$2, verified_at=NOW() WHERE id=$3', ['verified', req.user.userId, pid]);
    // add participant (pay-first flow) if not exists
    const exists = await db.query('SELECT id FROM tournament_participants WHERE tournament_id=$1 AND user_id=$2', [p.tournament_id, p.user_id]);
    if (exists.rowCount === 0){
      await db.query('INSERT INTO tournament_participants (tournament_id,user_id,joined_at,status,payment_id) VALUES ($1,$2,NOW(),$3,$4)', [p.tournament_id, p.user_id, 'paid', pid]);
    } else {
      await db.query('UPDATE tournament_participants SET status=$1, payment_id=$2 WHERE tournament_id=$3 AND user_id=$4', ['paid', pid, p.tournament_id, p.user_id]);
    }

    // notify user
    const userEmail = (await db.query('SELECT email FROM users WHERE id=$1',[p.user_id])).rows[0].email;
    await sendEmail({ to: userEmail, subject: 'Payment verified', text: `Your payment for tournament ${p.tournament_id} has been verified. You are now registered.` });

    // emit participants update via socket - will be handled by tournaments join logic which emits; here emit directly
    // fetch io instance - in this router we don't have io; caller will emit if necessary (or tournaments route consumer)

    res.json({ ok:true });
  } catch(e){ console.error(e); res.status(500).json({ error: 'DB error' }); }
});

module.exports = router;
