(function(){
  function appendMessage(text, who){
    var container = document.getElementById('vvc-messages');
    if(!container) return;
    var div = document.createElement('div');
    div.style.margin = '6px 0';
    if(who === 'user'){
      div.style.textAlign = 'right';
      div.innerHTML = '<div style="display:inline-block;background:#0073aa;color:#fff;padding:8px;border-radius:8px;max-width:80%;">'+escapeHtml(text)+'</div>';
    } else {
      div.style.textAlign = 'left';
      div.innerHTML = '<div style="display:inline-block;background:#f1f1f1;color:#111;padding:8px;border-radius:8px;max-width:80%;">'+escapeHtml(text)+'</div>';
    }
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
  }

  function escapeHtml(s){
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  async function sendMessage(msg){
    appendMessage(msg, 'user');
    try {
      const res = await fetch(VVC_CHAT.rest_url, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ message: msg })
      });
      if(!res.ok){
        const err = await res.json().catch(()=>({message:'Server error'}));
        appendMessage('Server error: ' + (err.message || 'Error'), 'bot');
        return;
      }
      const data = await res.json();
      appendMessage((data.reply || 'Kuch samasya hui.'), 'bot');
    } catch(e){
      appendMessage('Connection error.', 'bot');
    }
  }

  document.addEventListener('click', function(e){
    if(e.target && e.target.id === 'vvc-send'){
      var input = document.getElementById('vvc-input');
      var v = input.value.trim();
      if(!v) return;
      input.value = '';
      sendMessage(v);
    }
  });

  document.addEventListener('keydown', function(e){
    var input = document.getElementById('vvc-input');
    if(!input) return;
    if(e.key === 'Enter' && document.activeElement === input){
      e.preventDefault();
      var v = input.value.trim();
      if(!v) return;
      input.value = '';
      sendMessage(v);
    }
  });

})();
