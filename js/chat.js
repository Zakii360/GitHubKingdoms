import { state } from "./state.js";
import { fetchRecentChat, sendChatMessage } from "./supabaseClient.js";

const messagesEl = () => document.getElementById("chat-messages");
const inputEl = () => document.getElementById("chat-input");

function renderMessage(m) {
  const div = document.createElement("div");
  div.className = "chat-msg";
  div.innerHTML = `<span class="chat-user">@${m.github_username}</span> ${escapeHtml(m.message)}`;
  messagesEl().appendChild(div);
  messagesEl().scrollTop = messagesEl().scrollHeight;
}
function escapeHtml(s=""){return s.replace(/[&<>"]/g, c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;"}[c]||c));}

export async function initChat() {
  const msgs = await fetchRecentChat();
  messagesEl().innerHTML = "";
  msgs.forEach(renderMessage);

  document.getElementById("chat-send").onclick = async () => {
    const value = inputEl().value.trim();
    if (!value) return;
    inputEl().value = "";
    await sendChatMessage(value);
  };
  inputEl().addEventListener("keydown", async (e) => {
    if (e.key === "Enter") {
      const value = inputEl().value.trim();
      if (!value) return;
      inputEl().value = "";
      await sendChatMessage(value);
    }
  });

  state.chatChannel = state.supabase
    .channel("chat-room")
    .on("postgres_changes", { event: "INSERT", schema: "public", table: "chat_messages" }, (payload) => {
      renderMessage(payload.new);
    })
    .subscribe();
}
