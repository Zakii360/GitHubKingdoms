
function setupRealtime(){
 sb.channel('chat-live')
 .on('postgres_changes',{event:'INSERT',schema:'public',table:'chat_messages'},
 payload=>addMessage(payload.new))
 .subscribe();
}
