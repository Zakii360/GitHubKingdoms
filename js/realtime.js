
function subscribeChat(cb){
 sb.channel('chat')
 .on('postgres_changes',{event:'INSERT',schema:'public',table:'chat_messages'},p=>cb(p.new))
 .subscribe();
}
