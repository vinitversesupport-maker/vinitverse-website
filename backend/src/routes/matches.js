const express = require('express');
const db = require('../db');

module.exports = function(io){
  const router = express.Router();

  router.post('/:id/score', async (req,res) => {
    const mid = req.params.id;
    const { score1, score2 } = req.body;
    try {
      // update match
      const r = await db.query('UPDATE matches SET score1=$1, score2=$2, status=$3, winner_id = CASE WHEN $1>$2 THEN player1_id WHEN $2>$1 THEN player2_id ELSE NULL END WHERE id=$4 RETURNING *',
        [score1, score2, 'finished', mid]);
      const match = r.rows[0];
      // emit to tournament room
      io.to(`tournament_${match.tournament_id}`).emit('match_updated', match);
      res.json(match);
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: 'DB error' });
    }
  });

  return router;
};
