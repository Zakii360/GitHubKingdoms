
async function sendChat(username,message){
 await sb.from('chat_messages').insert({username,message});
}
