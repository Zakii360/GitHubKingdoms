import {
  createSupabaseClient,
  signInWithGitHub,
  signOut,
  restoreSession,
  loadOrCreatePlayerBundle
} from "./supabaseClient.js";
import { state } from "./state.js";
import { CONFIG } from "./config.js";
import { WorldScene } from "./worldScene.js";
import { initChat } from "./chat.js";

let authedBooted = false;
let bootingAuth = false;

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
    physics: {
      default: "arcade",
      arcade: { debug: false }
    },
    scene: [WorldScene],
    scale: {
      mode: Phaser.Scale.RESIZE,
      autoCenter: Phaser.Scale.CENTER_BOTH
    }
  });
}

async function initAuthed() {
  if (authedBooted || bootingAuth) return;
  bootingAuth = true;

  try {
    const bundle = await loadOrCreatePlayerBundle();
    state.me = bundle.me;

    document.getElementById("hud-name").textContent = "@" + bundle.profile.login;
    document.getElementById("hud-meta").textContent =
      `${bundle.kingdom.rank} • ${bundle.kingdom.biome} • ${bundle.kingdom.stars_total}★`;

    setAuthedUI(true);

    await bootGame();

    // only init chat once
    if (!state.chatInitialized) {
      await initChat();
      state.chatInitialized = true;
    }

    authedBooted = true;
  } finally {
    bootingAuth = false;
  }
}

function clearAuthedState() {
  authedBooted = false;
  bootingAuth = false;
  state.me = null;
  state.githubProfile = null;
  state.kingdom = null;
  setAuthedUI(false);
}

async function init() {
  createSupabaseClient();

  document.getElementById("login-btn").onclick = async () => {
    try {
      await signInWithGitHub();
    } catch (err) {
      console.error(err);
      alert("GitHub sign-in failed: " + err.message);
    }
  };

  document.getElementById("logout-btn").onclick = async () => {
    try {
      await signOut();
      clearAuthedState();
    } catch (err) {
      console.error(err);
      alert("Logout failed: " + err.message);
    }
  };

  // Restore session once on page load
  await restoreSession();

  if (state.user) {
    await initAuthed();
  } else {
    setAuthedUI(false);
  }

  // Listen for auth changes, but DO NOT reload the page bro
  state.supabase.auth.onAuthStateChange(async (event, session) => {
    state.session = session;
    state.user = session?.user || null;

    console.log("[auth]", event, !!state.user);

    if (session?.user) {
      if (!authedBooted && !bootingAuth) {
        await initAuthed();
      }
    } else {
      clearAuthedState();
    }
  });
}

init().catch((err) => {
  console.error(err);
  alert("GitHub Kingdoms failed to start: " + err.message);
});
