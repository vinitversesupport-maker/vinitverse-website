import React, { useState, useContext } from 'react';
import api from '../utils/api';
import { AuthContext } from '../auth/AuthProvider';

export default function Register(){
  const [name,setName] = useState('');
  const [email,setEmail] = useState('');
  const [password,setPassword] = useState('');
  const { login } = useContext(AuthContext);
  const [error,setError] = useState(null);

  async function submit(e){
    e.preventDefault();
    setError(null);
    try{
      const res = await api.post('/api/auth/register', { name, email, password });
      if(res.data && res.data.token){
        login(res.data.token);
      }
    }catch(err){
      setError(err.response?.data?.error || 'Registration failed');
    }
  }

  return (
    <div style={{maxWidth:420,padding:12}}>
      <h3>Register</h3>
      {error && <div style={{color:'red'}}>{error}</div>}
      <form onSubmit={submit}>
        <div style={{marginBottom:8}}>
          <input value={name} onChange={e=>setName(e.target.value)} placeholder="Name" style={{width:'100%',padding:8}} />
        </div>
        <div style={{marginBottom:8}}>
          <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email" style={{width:'100%',padding:8}} />
        </div>
        <div style={{marginBottom:8}}>
          <input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Password" style={{width:'100%',padding:8}} />
        </div>
        <button type="submit" style={{padding:'8px 12px'}}>Register</button>
      </form>
    </div>
  );
}
