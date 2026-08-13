const express = require('express');
const db = require('../db');

module.exports = function(io){
  const router = express.Router();

  // submit score and advance winner
  router.post('/:id/score', async (req,res) => {
    const mid = req.params.id;
    const { score1, score2 } = req.body;
    try {
      // update match
      const r = await db.query('UPDATE matches SET score1=$1, score2=$2, status=$3, winner_id = CASE WHEN $1>$2 THEN player1_id WHEN $2>$1 THEN player2_id ELSE NULL END WHERE id=$4 RETURNING *',
        [score1, score2, 'finished', mid]);
      if(r.rowCount === 0) return res.status(404).json({ error: 'Match not found' });
      const match = r.rows[0];

      // if winner determined, place into parent match slot
      if(match.winner_id){
        // find parent match
        const pr = await db.query('SELECT id, round, position, player1_id, player2_id FROM matches WHERE id=$1', [match.parent_match_id]);
        if(pr.rowCount > 0){
          const parent = pr.rows[0];
          // need child's position to know left/right
          const childPos = match.position;
          const slotIsFirst = (childPos % 2 === 0);
          if(slotIsFirst && !parent.player1_id){
            await db.query('UPDATE matches SET player1_id=$1 WHERE id=$2', [match.winner_id, parent.id]);
          } else if(!slotIsFirst && !parent.player2_id){
            await db.query('UPDATE matches SET player2_id=$1 WHERE id=$2', [match.winner_id, parent.id]);
          }
        }
      }

      // emit to tournament room
      const matchFull = await db.query('SELECT * FROM matches WHERE id=$1', [mid]);
      io.to(`tournament_${match.tournament_id}`).emit('match_updated', matchFull.rows[0]);

      res.json(matchFull.rows[0]);
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: 'DB error' });
    }
  });

  return router;
};
