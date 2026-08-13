import React, { useEffect, useState } from 'react';
import api from '../utils/api';

export default function AdminPayments(){
  const [payments, setPayments] = useState([]);

  useEffect(()=>{ fetchPayments(); }, []);
  function fetchPayments(){ api.get('/api/payments?status=pending').then(r=>setPayments(r.data)).catch(console.error); }

  async function act(id, action){
    try{
      await api.post(`/api/payments/${id}/verify`, { action });
      fetchPayments();
    }catch(e){ alert(e.response?.data?.error || 'Action failed'); }
  }

  return (
    <div style={{padding:20}}>
      <h2>Pending Payments</h2>
      {payments.length===0 && <div>No pending payments</div>}
      {payments.map(p => (
        <div key={p.id} style={{border:'1px solid #eee',padding:12,marginBottom:8}}>
          <div>User: {p.user_name} (ID: {p.user_id})</div>
          <div>Tournament: {p.tournament_title} (ID: {p.tournament_id})</div>
          <div>Amount: ₹{p.amount}</div>
          <div>Proof: {p.proof_path ? <a href={p.proof_path} target="_blank" rel="noreferrer">View</a> : 'No file'}</div>
          <div style={{marginTop:8}}>
            <button onClick={()=>act(p.id,'verify')}>Verify</button>
            <button onClick={()=>act(p.id,'reject')} style={{marginLeft:8}}>Reject</button>
          </div>
        </div>
      ))}
    </div>
  );
}
