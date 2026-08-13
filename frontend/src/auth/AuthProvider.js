import React, { createContext, useState, useEffect } from 'react';

export const AuthContext = createContext(null);

export function AuthProvider({ children }){
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('vv_token'));

  useEffect(()=>{
    if(token){
      localStorage.setItem('vv_token', token);
      // fetch /api/auth/me
      fetch('/api/auth/me', { headers: { 'Authorization': 'Bearer ' + token }})
      .then(r=>r.json())
      .then(data=>{ if(data.user) setUser(data.user); else { setUser(null); setToken(null); localStorage.removeItem('vv_token'); } })
      .catch(()=>{ setUser(null); setToken(null); localStorage.removeItem('vv_token'); });
    } else {
      setUser(null);
      localStorage.removeItem('vv_token');
    }
  }, [token]);

  function login(token){
    setToken(token);
  }
  function logout(){
    setToken(null);
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
