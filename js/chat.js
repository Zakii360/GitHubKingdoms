
const messages=document.getElementById('messages');
document.getElementById('sendBtn').onclick=async()=>{
 const msg=document.getElementById('chatInput').value;
 if(!window.playerName||!msg) return;
 await sb.from('chat_messages').insert({username:window.playerName,message:msg});
 document.getElementById('chatInput').value='';
};

function addMessage(m){
 messages.innerHTML += `<div><b>${m.username}</b>: ${m.message}</div>`;
 messages.scrollTop=messages.scrollHeight;
}
