const db = require('../db');

function shuffle(array){
  for(let i = array.length -1; i>0; i--){
    const j = Math.floor(Math.random()*(i+1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

function nextPowerOfTwo(n){
  let p = 1;
  while(p < n) p <<= 1;
  return p;
}

async function generateBracket(tournamentId){
  // fetch participants
  const pres = await db.query('SELECT u.id,u.name FROM tournament_participants tp JOIN users u ON u.id=tp.user_id WHERE tp.tournament_id=$1', [tournamentId]);
  const participants = pres.rows.map(r=>({ id: r.id, name: r.name }));
  shuffle(participants);
  const count = participants.length;
  const size = nextPowerOfTwo(count || 1);
  const rounds = Math.log2(size);

  // prepare matches structure in memory
  const matchesByRound = [];
  for(let r=1; r<=rounds; r++){
    const matchesCount = size / Math.pow(2, r);
    matchesByRound[r] = new Array(matchesCount).fill(null).map(()=>({}));
  }

  // insert empty matches for each round to get IDs
  for(let r=1;r<=rounds;r++){
    const arr = matchesByRound[r];
    for(let i=0;i<arr.length;i++){
      const ins = await db.query('INSERT INTO matches (tournament_id, round, status, created_at, position) VALUES ($1,$2,$3,NOW(),$4) RETURNING id', [tournamentId, r, 'pending', i]);
      arr[i].id = ins.rows[0].id;
      arr[i].round = r;
      arr[i].position = i;
    }
  }

  // set parent_match_id for child matches (child -> parent)
  for(let r=1;r<rounds;r++){
    const arr = matchesByRound[r];
    const parents = matchesByRound[r+1];
    for(let i=0;i<arr.length;i++){
      const parentIndex = Math.floor(i/2);
      const parentId = parents[parentIndex].id;
      await db.query('UPDATE matches SET parent_match_id=$1 WHERE id=$2', [parentId, arr[i].id]);
    }
  }

  // assign participants into round 1 matches
  const round1 = matchesByRound[1];
  for(let i=0;i<round1.length;i++){
    const p1 = participants[i*2] ? participants[i*2].id : null;
    const p2 = participants[i*2+1] ? participants[i*2+1].id : null;
    await db.query('UPDATE matches SET player1_id=$1, player2_id=$2 WHERE id=$3', [p1,p2, round1[i].id]);
  }

  return { rounds, size };
}

async function getBracket(tournamentId){
  // fetch matches and player info
  const r = await db.query(`SELECT m.id,m.round,m.position,m.player1_id,m.player2_id,m.score1,m.score2,m.winner_id,m.status,
    p1.name as player1_name, p2.name as player2_name
    FROM matches m
    LEFT JOIN users p1 ON p1.id = m.player1_id
    LEFT JOIN users p2 ON p2.id = m.player2_id
    WHERE m.tournament_id=$1
    ORDER BY m.round, m.position`, [tournamentId]);

  const rows = r.rows;
  const byRound = {};
  for(const row of rows){
    if(!byRound[row.round]) byRound[row.round] = [];
    byRound[row.round].push({
      id: row.id,
      position: row.position,
      player1: row.player1_id ? { id: row.player1_id, name: row.player1_name } : null,
      player2: row.player2_id ? { id: row.player2_id, name: row.player2_name } : null,
      score1: row.score1,
      score2: row.score2,
      winner_id: row.winner_id,
      status: row.status
    });
  }
  return byRound;
}

module.exports = { generateBracket, getBracket };
