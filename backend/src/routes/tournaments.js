const express = require('express');
const db = require('../db');
const { v4: uuidv4 } = require('uuid');

module.exports = function(io){
  const router = express.Router();

  // create tournament (admin)
  router.post('/', async (req,res) => {
    const { title, type, description, start_date } = req.body;
    try {
      const r = await db.query(
        'INSERT INTO tournaments (title,type,description,start_date,status,created_at) VALUES ($1,$2,$3,$4,$5,NOW()) RETURNING *',
        [title,type||'single_elim',description||null,start_date||null,'draft']
      );
      res.json(r.rows[0]);
    } catch(e){
      console.error(e);
      res.status(500).json({ error: 'DB error' });
    }
  });

  // list tournaments
  router.get('/', async (req,res) => {
    const r = await db.query('SELECT * FROM tournaments ORDER BY created_at DESC LIMIT 100');
    res.json(r.rows);
  });

  // join tournament
  router.post('/:id/join', async (req,res) => {
    const tid = req.params.id;
    const { user_id } = req.body; // for demo; in prod get from JWT
    try {
      await db.query('INSERT INTO tournament_participants (tournament_id,user_id,joined_at,status) VALUES ($1,$2,NOW(),$3) ON CONFLICT DO NOTHING', [tid, user_id, 'registered']);
      // emit update
      const participants = await db.query('SELECT u.id,u.name FROM tournament_participants tp JOIN users u ON u.id=tp.user_id WHERE tp.tournament_id=$1', [tid]);
      io.to(`tournament_${tid}`).emit('participants_updated', { tournamentId: tid, participants: participants.rows });
      res.json({ ok: true });
    } catch(e){
      console.error(e);
      res.status(500).json({ error: 'DB error' });
    }
  });

  // get bracket data (simple: list matches)
  router.get('/:id/bracket', async (req,res) => {
    const tid = req.params.id;
    const r = await db.query('SELECT * FROM matches WHERE tournament_id=$1 ORDER BY round, id', [tid]);
    res.json(r.rows);
  });

  return router;
};
