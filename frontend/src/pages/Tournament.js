import React, { useEffect, useState, useContext } from 'react';
import api from '../utils/api';
import { AuthContext } from '../auth/AuthProvider';

export default function TournamentPage({ match }){
  const tournamentId = match?.params?.id || window.location.pathname.split('/').pop();
  const [bracket, setBracket] = useState({});
  const [tournament, setTournament] = useState(null);
  const [myPayment, setMyPayment] = useState(null);
  const [file, setFile] = useState(null);
  const { user } = useContext(AuthContext);

  useEffect(()=>{
    api.get(`/api/tournaments/${tournamentId}/bracket`).then(r=>setBracket(r.data)).catch(()=>{});
    api.get('/api/tournaments').then(r=>{ const t = r.data.find(x=>String(x.id)===String(tournamentId)); if(t) setTournament(t); }).catch(()=>{});
    // fetch my payment status
    if(user){
      api.get(`/api/payments?tournament_id=${tournamentId}&status=verified`).then(r=>{
        const payments = r.data.filter(p=>p.user_id===user.id);
        setMyPayment(payments[0]||null);
      }).catch(()=>{});
    }
    // socket
    const socket = window.__VV_SOCKET__;
    if(socket){
      socket.connect();
      socket.on('match_updated', (m)=>{
        api.get(`/api/tournaments/${tournamentId}/bracket`).then(r=>setBracket(r.data)).catch(()=>{});
      });
    }
    return ()=>{ if(socket) socket.disconnect(); }
  }, [tournamentId, user]);

  async function uploadProof(e){
    e.preventDefault();
    if(!user) return alert('Login first');
    if(!file) return alert('Select a file');
    const form = new FormData();
    form.append('tournament_id', tournamentId);
    form.append('amount', tournament?.entry_fee || 0);
    form.append('method', 'manual_upi');
    form.append('proof', file);
    try{
      const res = await api.post('/api/payments', form, { headers: {'Content-Type': 'multipart/form-data'} });
      alert('Proof uploaded - pending verification');
    }catch(err){ alert(err.response?.data?.error || 'Upload failed'); }
  }

  async function join(){
    if(!user) return alert('Login first');
    try{
      const res = await api.post(`/api/tournaments/${tournamentId}/join`);
      alert('Joined');
    }catch(err){ alert(err.response?.data?.error || 'Join failed'); }
  }

  return (
    <div style={{padding:20}}>
      <h2>Tournament #{tournamentId}</h2>
      {tournament && <div>Entry Fee: ₹{tournament.entry_fee || 0} | Max Players: {tournament.max_players || 'Unlimited'}</div>}

      {tournament && tournament.entry_fee > 0 && (
        <div style={{marginTop:12}}>
          <h4>Payment</h4>
          {myPayment ? (
            <div>Payment verified ✅</div>
          ) : (
            <form onSubmit={uploadProof}>
              <div style={{marginBottom:8}}>
                <input type="file" accept="image/*,.pdf" onChange={e=>setFile(e.target.files[0])} />
              </div>
              <button type="submit">Upload UPI Proof (JPG/PNG/PDF)</button>
            </form>
          )}
        </div>
      )}

      <div style={{marginTop:12}}>
        <button onClick={join} disabled={tournament && tournament.entry_fee>0 && !myPayment}>Join Tournament</button>
      </div>

      <div style={{display:'flex',gap:20,marginTop:20}}>
        <div style={{flex:1}}>
          <Bracket rounds={bracket} tournamentId={tournamentId} />
        </div>
      </div>
    </div>
  );
}
