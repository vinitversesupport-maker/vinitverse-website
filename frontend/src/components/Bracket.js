import React from 'react';

export default function Bracket({ matches = [] }){
  return (
    <div>
      <h4>Bracket (stub)</h4>
      {matches.map(m=>(
        <div key={m.id} style={{border:'1px solid #eee',padding:8,marginBottom:6}}>
          Round: {m.round} — {m.player1_id} vs {m.player2_id} — {m.score1 || '-'} : {m.score2 || '-'}
        </div>
      ))}
    </div>
  );
}
