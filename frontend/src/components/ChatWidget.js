import React, { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../auth/AuthProvider';
import api from '../utils/api';

export default function ChatWidget(){
  const { user } = useContext(AuthContext);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [tournamentId, setTournamentId] = useState(null);

  useEffect(()=>{
    // if you have a current tournament context, set it
    const tid = window.__CURRENT_TOURNAMENT_ID__;
    if(tid) setTournamentId(tid);
    fetchMessages(tid);
  }, []);

  function fetchMessages(tid){
    const q = tid ? `?tournament_id=${tid}` : '';
    api.get(`/api/chats${q}`).then(r=>setMessages(r.data)).catch(console.error);
  }

  async function send(){
    if(!user) return alert('Login first');
    if(!text.trim()) return;
    await api.post('/api/chats', { tournament_id: tournamentId, content: text });
    setText('');
    fetchMessages(tournamentId);
  }

  async function edit(m){
    const newText = prompt('Edit message (2 minute window):', m.content);
    if(newText === null) return;
    try{
      await api.put(`/api/chats/${m.id}`, { content: newText });
      fetchMessages(tournamentId);
    }catch(e){ alert(e.response?.data?.error || 'Edit failed'); }
  }

  return (
    <div style={{border:'1px solid #ddd',padding:8,borderRadius:6}}>
      <h4>Chat</h4>
      <div style={{maxHeight:300,overflow:'auto',marginBottom:8}}>
        {messages.map(m=> (
          <div key={m.id} style={{padding:6,borderBottom:'1px solid #f0f0f0'}}>
            <div style={{fontSize:12,color:'#666'}}>{m.user_name || 'System'} • {new Date(m.created_at).toLocaleString()}</div>
            <div style={{marginTop:4}}>{m.content}</div>
            {m.user_id === (user?.id) && <div style={{marginTop:6}}><button onClick={()=>edit(m)}>Edit</button></div>}
          </div>
        ))}
      </div>
      <div>
        <textarea value={text} onChange={e=>setText(e.target.value)} style={{width:'100%',height:60}} />
        <button onClick={send} style={{marginTop:8}}>Send</button>
      </div>
    </div>
  );
}
