const express = require('express');
const router = express.Router();
const db = require('../db');
const auth = require('../middleware/auth');

// POST /api/chats - create message
router.post('/', auth, async (req,res) => {
  try{
    const { tournament_id, content } = req.body;
    if(!content) return res.status(400).json({ error: 'content required' });
    const r = await db.query('INSERT INTO messages (user_id,tournament_id,content,created_at) VALUES ($1,$2,$3,NOW()) RETURNING *', [req.user.userId, tournament_id||null, content]);
    res.json(r.rows[0]);
  }catch(e){ console.error(e); res.status(500).json({ error: 'DB error' }); }
});

// GET /api/chats?tournament_id=1 - list messages (for tournament) or user's messages
router.get('/', auth, async (req,res) => {
  try{
    const { tournament_id } = req.query;
    let r;
    if(tournament_id){
      r = await db.query('SELECT m.*, u.name as user_name FROM messages m LEFT JOIN users u ON u.id=m.user_id WHERE m.tournament_id=$1 ORDER BY m.created_at ASC', [tournament_id]);
    } else {
      // user's own messages
      r = await db.query('SELECT m.*, u.name as user_name FROM messages m LEFT JOIN users u ON u.id=m.user_id WHERE m.user_id=$1 ORDER BY m.created_at DESC LIMIT 200', [req.user.userId]);
    }
    res.json(r.rows);
  }catch(e){ console.error(e); res.status(500).json({ error: 'DB error' }); }
});

// PUT /api/chats/:id - edit message (within edit window)
router.put('/:id', auth, async (req,res)=>{
  try{
    const mid = req.params.id;
    const { content } = req.body;
    if(!content) return res.status(400).json({ error: 'content required' });
    const r = await db.query('SELECT * FROM messages WHERE id=$1', [mid]);
    if(r.rowCount===0) return res.status(404).json({ error: 'Message not found' });
    const msg = r.rows[0];
    if(msg.user_id !== req.user.userId) return res.status(403).json({ error: 'Not allowed' });
    const created = new Date(msg.created_at);
    const now = new Date();
    const diffMin = (now - created) / 60000;
    const EDIT_WINDOW_MIN = 2; // 2 minutes as requested
    if(diffMin > EDIT_WINDOW_MIN) return res.status(403).json({ error: 'Edit window expired' });

    // create version
    const v = await db.query('INSERT INTO message_versions (message_id, content, created_at, edited_by) VALUES ($1,$2,NOW(),$3) RETURNING id', [mid, msg.content, req.user.userId]);
    // update message
    await db.query('UPDATE messages SET content=$1, edited_at=NOW(), current_version_id=$2 WHERE id=$3', [content, v.rows[0].id, mid]);
    res.json({ ok:true });
  }catch(e){ console.error(e); res.status(500).json({ error: 'DB error' }); }
});

// GET /api/chats/:id/versions - list versions
router.get('/:id/versions', auth, async (req,res)=>{
  try{
    const mid = req.params.id;
    const r = await db.query('SELECT mv.*, u.name as edited_by_name FROM message_versions mv LEFT JOIN users u ON u.id=mv.edited_by WHERE mv.message_id=$1 ORDER BY mv.created_at DESC', [mid]);
    res.json(r.rows);
  }catch(e){ console.error(e); res.status(500).json({ error: 'DB error' }); }
});

module.exports = router;
