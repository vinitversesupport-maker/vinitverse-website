const express = require('express');
const db = require('../db');

module.exports = function(io){
  const router = express.Router();

  // simple send message -> local QA search
  router.post('/send', async (req,res) => {
    const { message, user_id, tournament_id } = req.body;
    if(!message) return res.status(400).json({ error: 'Missing message' });

    // store log
    const chatRes = await db.query('INSERT INTO chat_logs (user_id, message, sender, created_at, tournament_id) VALUES ($1,$2,$3,NOW(),$4) RETURNING id', [user_id||null, message, 'user', tournament_id||null]);

    // search qa table for best match
    const qres = await db.query('SELECT id,question_text,answer_text FROM qa_kv');
    let best = {score:0,answer:null};
    const normalize = s => (s||'').toLowerCase();
    const msgNorm = normalize(message);
    for(const row of qres.rows){
      const qn = normalize(row.question_text);
      if(qn && msgNorm.includes(qn)) { best = {score:100, answer: row.answer_text}; break; }
      if(qn && msgNorm.indexOf(qn) !== -1) { best = { score:80, answer: row.answer_text }; }
    }

    let reply = best.answer || 'Maaf, main is sawal ka jawab nahi de pa raha. Aap admin se contact kar sakte hain.';
    // save bot reply
    await db.query('INSERT INTO chat_logs (user_id, message, sender, created_at, tournament_id) VALUES ($1,$2,$3,NOW(),$4)', [user_id||null, reply, 'bot', tournament_id||null]);

    // emit chat to tournament room if present
    if(tournament_id) io.to(`tournament_${tournament_id}`).emit('chat_message', { user_id, message: reply, sender: 'bot', tournament_id });

    res.json({ reply });
  });

  return router;
};
