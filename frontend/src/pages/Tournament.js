import React, { useEffect, useState, useContext } from 'react';
import api from '../utils/api';
import { AuthContext } from '../auth/AuthProvider';
import Bracket from '../components/Bracket';

export default function TournamentPage({ match }){
  const tournamentId = match?.params?.id || window.location.pathname.split('/').pop();
  const [bracket, setBracket] = useState({});
  const [participants, setParticipants] = useState([]);
  const { user } = useContext(AuthContext);

  useEffect(()=>{
    api.get(`/api/tournaments/${tournamentId}/bracket`).then(r=>setBracket(r.data)).catch(()=>{});
    api.get('/api/tournaments').then(r=>{ const t = r.data.find(x=>String(x.id)===String(tournamentId)); if(t) setParticipants([t]); }).catch(()=>{});
    // socket
    const socket = window.__VV_SOCKET__;
    if(socket){
      socket.connect();
      socket.on('match_updated', (m)=>{
        // refetch bracket
        api.get(`/api/tournaments/${tournamentId}/bracket`).then(r=>setBracket(r.data)).catch(()=>{});
      });
    }
    return ()=>{ if(socket) socket.disconnect(); }
  }, [tournamentId]);

  async function generate(){
    if(!user || user.role !== 'admin') return alert('Admin only');
    if(!confirm('Generate bracket? This will overwrite existing matches if you force.')) return;
    await api.post(`/api/tournaments/${tournamentId}/generate-bracket`, { force: true });
    const r = await api.get(`/api/tournaments/${tournamentId}/bracket`);
    setBracket(r.data);
  }

  return (
    <div style={{padding:20}}>
      <h2>Tournament #{tournamentId}</h2>
      {user && user.role === 'admin' && <button onClick={generate}>Generate Bracket (force)</button>}

      <div style={{display:'flex',gap:20,marginTop:20}}>
        <div style={{flex:1}}>
          <Bracket rounds={bracket} tournamentId={tournamentId} />
        </div>
      </div>
    </div>
  );
}
