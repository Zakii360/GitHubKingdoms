import { createSupabaseClient, signInWithGitHub, signOut, restoreSession, loadOrCreatePlayerBundle } from "./supabaseClient.js";
import { state } from "./state.js";
import { CONFIG } from "./config.js";
import { WorldScene } from "./worldScene.js";
import { initChat } from "./chat.js";

function setAuthedUI(authed) {
  document.getElementById("login-screen").classList.toggle("hidden", authed);
  document.getElementById("logout-btn").classList.toggle("hidden", !authed);
  document.getElementById("login-btn").classList.toggle("hidden", authed);
  document.getElementById("hud").classList.toggle("hidden", !authed);
  document.getElementById("chat-panel").classList.toggle("hidden", !authed);
  document.getElementById("map-card").classList.toggle("hidden", !authed);
}

async function bootGame() {
  if (state.game) return;
  state.game = new Phaser.Game({
    type: Phaser.AUTO,
    parent: "game-container",
    width: CONFIG.GAME_WIDTH,
    height: CONFIG.GAME_HEIGHT,
    pixelArt: true,
    backgroundColor: "#0a1020",
    physics: { default: "arcade", arcade: { debug: false } },
    scene: [WorldScene],
    scale: { mode: Phaser.Scale.RESIZE, autoCenter: Phaser.Scale.CENTER_BOTH },
  });
}

async function initAuthed() {
  const bundle = await loadOrCreatePlayerBundle();
  state.me = bundle.me;
  document.getElementById("hud-name").textContent = "@" + bundle.profile.login;
  document.getElementById("hud-meta").textContent = `${bundle.kingdom.rank} • ${bundle.kingdom.biome} • ${bundle.kingdom.stars_total}★`;
  setAuthedUI(true);
  await bootGame();
  await initChat();
}

async function init() {
  createSupabaseClient();
  document.getElementById("login-btn").onclick = signInWithGitHub;
  document.getElementById("logout-btn").onclick = signOut;

  await restoreSession();
  if (state.user) {
    await initAuthed();
  } else {
    setAuthedUI(false);
  }

  state.supabase.auth.onAuthStateChange(async (_evt, session) => {
    state.session = session;
    state.user = session?.user || null;
    if (state.user) {
      await initAuthed();
    } else {
      window.location.reload();
    }
  });
}

init().catch(err => {
  console.error(err);
  alert("GitHub Kingdoms failed to start: " + err.message);
});
