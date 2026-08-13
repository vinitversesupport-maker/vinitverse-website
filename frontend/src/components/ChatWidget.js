import React, { useState } from 'react';
import axios from 'axios';

export default function ChatWidget(){
  const [msgs, setMsgs] = useState([]);
  const [text, setText] = useState('');

  async function send(){
    if(!text) return;
    setMsgs(prev => [...prev, {sender:'user', text}]);
    try {
      const res = await axios.post('/api/chat/send', { message: text });
      setMsgs(prev => [...prev, {sender:'bot', text: res.data.reply}]);
    } catch(e){
      setMsgs(prev => [...prev, {sender:'bot', text: 'Server error'}]);
    }
    setText('');
  }

  return (
    <div style={{border:'1px solid #ddd',padding:10,borderRadius:6}}>
      <h3>Chat</h3>
      <div style={{height:240,overflow:'auto',background:'#fafafa',padding:8}}>
        {msgs.map((m,i)=>(<div key={i} style={{textAlign: m.sender==='user'?'right':'left',margin:'6px 0'}}>
          <span style={{display:'inline-block',padding:8,background: m.sender==='user'?'#0073aa':'#eee',color:m.sender==='user'?'#fff':'#000',borderRadius:6}}>
            {m.text}
          </span>
        </div>))}
      </div>
      <div style={{marginTop:8,display:'flex',gap:8}}>
        <input value={text} onChange={e=>setText(e.target.value)} style={{flex:1,padding:8}} placeholder="Apna sawal likhen..." />
        <button onClick={send} style={{padding:'8px 12px'}}>Send</button>
      </div>
    </div>
  );
}
