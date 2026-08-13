const express = require('express');
const db = require('../db');
const auth = require('../middleware/auth');
const { generateBracket, getBracket } = require('../utils/bracket');

module.exports = function(io){
  const router = express.Router();

  // generate bracket (admin-only)
  router.post('/:id/generate-bracket', auth, async (req,res) => {
    const tid = req.params.id;
    // check admin
    if(!req.user || req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
    const force = req.body.force === true;

    try{
      // check existing matches
      const existing = await db.query('SELECT COUNT(*) FROM matches WHERE tournament_id=$1', [tid]);
      if(existing.rows[0].count > 0 && !force) return res.status(400).json({ error: 'Bracket already exists. Use force to regenerate.' });
      if(existing.rows[0].count > 0 && force){
        await db.query('DELETE FROM matches WHERE tournament_id=$1', [tid]);
      }

      const result = await generateBracket(tid);
      res.json({ ok:true, info: result });
    } catch(e){
      console.error(e);
      res.status(500).json({ error: 'DB error' });
    }
  });

  // get structured bracket
  router.get('/:id/bracket', async (req,res) => {
    const tid = req.params.id;
    try{
      const b = await getBracket(tid);
      res.json(b);
    } catch(e){
      console.error(e);
      res.status(500).json({ error: 'DB error' });
    }
  });

  return router;
};
