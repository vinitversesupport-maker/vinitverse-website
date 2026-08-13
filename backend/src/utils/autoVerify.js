const db = require('../db');
const path = require('path');
const ocr = require('./ocr');
const sendEmail = require('./email');

async function parseAmountFromText(text){
  if(!text) return null;
  // look for patterns like ₹123, 123 INR, 123.00, 1,234
  const amtRegexes = [ /₹\s*([0-9.,]+)/g, /([0-9]{2,6}(?:,[0-9]{3})*(?:\.[0-9]+)?)(?:\s*INR)?/g ];
  for(const re of amtRegexes){
    let m;
    while((m = re.exec(text)) !== null){
      // normalize number
      const raw = m[1].replace(/,/g,'');
      const num = parseFloat(raw);
      if(!isNaN(num)) return Math.round(num); // treat as rupee units
    }
  }
  return null;
}

async function attemptAutoVerify(payment){
  // payment: object from payments table
  if(!payment || !payment.proof_path) return { ok:false, reason: 'no_proof' };
  try{
    const uploadsRoot = path.join(__dirname, '..','..');
    const filePath = path.join(uploadsRoot, payment.proof_path.replace(/^\//,''));
    const res = await ocr(filePath);
    const text = res.text || '';
    const confidence = res.confidence || 0;
    const extractedAmount = await parseAmountFromText(text);

    // fetch tournament entry_fee
    const t = await db.query('SELECT entry_fee, max_players FROM tournaments WHERE id=$1', [payment.tournament_id]);
    if(t.rowCount===0) return { ok:false, reason:'no_tournament' };
    const entryFee = t.rows[0].entry_fee || 0;

    // Compare amounts (both are rupee units). Use strict equality for now.
    const amountMatches = (extractedAmount !== null) && (parseInt(extractedAmount,10) === parseInt(payment.amount || 0,10) || parseInt(extractedAmount,10) === parseInt(entryFee,10));

    const CONF_THRESH = 0.7; // require >=70% confidence
    if(amountMatches && confidence >= CONF_THRESH){
      // check capacity
      const maxPlayers = t.rows[0].max_players;
      if(maxPlayers){
        const cnt = await db.query('SELECT COUNT(*) FROM tournament_participants WHERE tournament_id=$1 AND status=$2', [payment.tournament_id, 'paid']);
        if(parseInt(cnt.rows[0].count,10) >= parseInt(maxPlayers,10)){
          // cannot auto-verify because full
          await db.query('UPDATE payments SET status=$1 WHERE id=$2', ['pending', payment.id]);
          return { ok:false, reason:'full_capacity' };
        }
      }

      // mark payment verified
      await db.query('UPDATE payments SET status=$1, verified_by=$2, verified_at=NOW() WHERE id=$3', ['verified', null, payment.id]);
      // add or update participant
      const exists = await db.query('SELECT id FROM tournament_participants WHERE tournament_id=$1 AND user_id=$2', [payment.tournament_id, payment.user_id]);
      if(exists.rowCount === 0){
        await db.query('INSERT INTO tournament_participants (tournament_id,user_id,joined_at,status,payment_id) VALUES ($1,$2,NOW(),$3,$4)', [payment.tournament_id, payment.user_id, 'paid', payment.id]);
      } else {
        await db.query('UPDATE tournament_participants SET status=$1, payment_id=$2 WHERE tournament_id=$3 AND user_id=$4', ['paid', payment.id, payment.tournament_id, payment.user_id]);
      }

      // send user email (if configured)
      try{
        const userR = await db.query('SELECT email FROM users WHERE id=$1',[payment.user_id]);
        const userEmail = userR.rowCount ? userR.rows[0].email : null;
        if(userEmail){
          await sendEmail({ to: userEmail, subject: 'Payment auto-verified', text: `Your payment for tournament ${payment.tournament_id} was auto-verified.` });
        }
      }catch(e){ console.error('email send failed', e.message); }

      // create system chat message (optional)
      try{
        await db.query('INSERT INTO messages (user_id,tournament_id,content,created_at) VALUES ($1,$2,$3,NOW())', [null, payment.tournament_id, `System: User ${payment.user_id} auto-joined after payment verification.`]);
      }catch(e){ /* ignore if messages table not present yet */ }

      return { ok:true, auto:true, confidence, extractedAmount };
    }

    // else leave as pending
    await db.query('UPDATE payments SET status=$1 WHERE id=$2', ['pending', payment.id]);
    return { ok:false, reason:'low_confidence_or_mismatch', confidence, extractedAmount, textSnippet: text.substring(0,200) };
  }catch(e){ console.error('autoVerify error', e); return { ok:false, reason:'error', error: e.message }; }
}

module.exports = attemptAutoVerify;
