import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { socket } from './socket';
import ChatWidget from './components/ChatWidget';
import Bracket from './components/Bracket';

function App(){
  const [tournaments,setTournaments] = useState([]);

  useEffect(()=>{
    axios.get('/api/tournaments').then(r=>setTournaments(r.data)).catch(console.error);
    socket.connect();
    return ()=> socket.disconnect();
  },[]);

  return (
    <div style={{padding:20}}>
      <h1>Vinitvers Tournament</h1>
      <div style={{display:'flex',gap:20}}>
        <div style={{flex:1}}>
          <h2>Tournaments</h2>
          {tournaments.map(t=>(
            <div key={t.id} style={{border:'1px solid #ddd',padding:10,marginBottom:8}}>
              <h3>{t.title}</h3>
              <p>{t.description}</p>
              <a href={`/tournament/${t.id}`}>View</a>
            </div>
          ))}
        </div>
        <div style={{width:360}}>
          <ChatWidget />
        </div>
      </div>
    </div>
  );
}

export default App;
