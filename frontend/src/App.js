import React, { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import { socket } from './socket';
import ChatWidget from './components/ChatWidget';
import Bracket from './components/Bracket';
import { AuthProvider, AuthContext } from './auth/AuthProvider';
import Login from './pages/Login';
import Register from './pages/Register';

function InnerApp(){
  const [tournaments,setTournaments] = useState([]);
  const [view, setView] = useState('list');
  const { user, logout } = useContext(AuthContext);

  useEffect(()=>{
    axios.get('/api/tournaments').then(r=>setTournaments(r.data)).catch(console.error);
    socket.connect();
    return ()=> socket.disconnect();
  },[]);

  return (
    <div style={{padding:20}}>
      <header style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <h1>Vinitvers Tournament</h1>
        <div>
          {user ? (
            <>
              <span style={{marginRight:8}}>Hi, {user.name}</span>
              <button onClick={logout}>Logout</button>
            </>
          ) : (
            <>
              <button onClick={()=>setView('login')}>Login</button>
              <button onClick={()=>setView('register')} style={{marginLeft:8}}>Register</button>
            </>
          )}
        </div>
      </header>

      {view === 'login' && <Login />}
      {view === 'register' && <Register />}

      <div style={{display:'flex',gap:20,marginTop:20}}>
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

export default function App(){
  return (
    <AuthProvider>
      <InnerApp />
    </AuthProvider>
  );
}
