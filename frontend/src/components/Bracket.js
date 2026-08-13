import React from 'react';

export default function Bracket({ rounds = {}, tournamentId }){
  // rounds expected as { 1: [matches], 2: [matches], ... }
  const roundKeys = Object.keys(rounds).sort((a,b)=>a-b);
  return (
    <div style={{display:'flex',gap:24,alignItems:'flex-start'}}>
      {roundKeys.length === 0 && <div>No bracket generated yet.</div>}
      {roundKeys.map(rk=> (
        <div key={rk} style={{minWidth:220}}>
          <h4>Round {rk}</h4>
          {rounds[rk].map(m => (
            <div key={m.id} style={{border:'1px solid #eee',padding:8,marginBottom:8,borderRadius:6}}>
              <div style={{fontSize:14}}>{m.player1 ? m.player1.name : 'TBD'}</div>
              <div style={{textAlign:'center',color:'#888'}}>-</div>
              <div style={{fontSize:14}}>{m.player2 ? m.player2.name : 'TBD'}</div>
              <div style={{marginTop:6,fontSize:12,color:'#333'}}>Score: {m.score1 ?? '-'} : {m.score2 ?? '-'}</div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
