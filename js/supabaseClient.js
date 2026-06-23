import { CONFIG } from "./config.js";
import { state } from "./state.js";
import { fetchGitHubProfile, fetchGitHubRepos } from "./github.js";
import { buildKingdomFromGitHub } from "./kingdom.js";

export function createSupabaseClient() {
  state.supabase = window.supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
  });
  return state.supabase;
}

export async function signInWithGitHub() {
  const redirectTo = window.location.origin + window.location.pathname;
  const { error } = await state.supabase.auth.signInWithOAuth({
    provider: "github",
    options: { redirectTo, scopes: "read:user user:email" }
  });
  if (error) throw error;
}

export async function signOut() {
  await state.supabase.auth.signOut();
  window.location.reload();
}

export async function restoreSession() {
  const { data } = await state.supabase.auth.getSession();
  state.session = data.session || null;
  state.user = state.session?.user || null;
  return state.session;
}

export async function loadOrCreatePlayerBundle() {
  if (!state.user) throw new Error("No session");
  const username = state.user.user_metadata?.user_name || state.user.user_metadata?.preferred_username || state.user.user_metadata?.name || state.user.email?.split("@")[0];
  const profile = await fetchGitHubProfile(username);
  const repos = await fetchGitHubRepos(username);
  state.githubProfile = profile;
  const kingdom = buildKingdomFromGitHub(profile, repos);
  state.kingdom = kingdom;

  await state.supabase.from("kingdoms").upsert({
    github_username: kingdom.github_username,
    display_name: kingdom.display_name,
    avatar_url: kingdom.avatar_url,
    bio: kingdom.bio,
    followers: kingdom.followers,
    following: kingdom.following,
    public_repos: kingdom.public_repos,
    stars_total: kingdom.stars_total,
    top_languages: kingdom.top_languages,
    biome: kingdom.biome,
    rank: kingdom.rank,
    district_count: kingdom.district_count,
    npc_count: kingdom.npc_count,
    castle_level: kingdom.castle_level,
    repo_count: kingdom.repo_count,
    updated_at: new Date().toISOString(),
  }, { onConflict: "github_username" });

  const startX = 18 + (profile.id % 20);
  const startY = 18 + (profile.id % 12);

  await state.supabase.from("players").upsert({
    user_id: state.user.id,
    github_username: profile.login,
    display_name: profile.name || profile.login,
    avatar_url: profile.avatar_url,
    x: startX,
    y: startY,
    dir: "down",
    map_id: "overworld",
    biome: kingdom.biome,
    rank: kingdom.rank,
    last_seen: new Date().toISOString(),
  }, { onConflict: "user_id" });

  const { data: me } = await state.supabase.from("players").select("*").eq("user_id", state.user.id).single();
  return { me, kingdom, profile };
}

export async function pushPlayerPosition(payload) {
  return state.supabase.from("players").update({
    x: payload.x,
    y: payload.y,
    dir: payload.dir,
    last_seen: new Date().toISOString(),
  }).eq("user_id", state.user.id);
}

export async function fetchPlayers() {
  const cutoff = new Date(Date.now() - 1000 * 60 * 10).toISOString();
  const { data, error } = await state.supabase
    .from("players")
    .select("*")
    .gte("last_seen", cutoff)
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function fetchRecentChat() {
  const { data, error } = await state.supabase
    .from("chat_messages")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(60);
  if (error) throw error;
  return (data || []).reverse();
}

export async function sendChatMessage(message) {
  return state.supabase.from("chat_messages").insert({
    user_id: state.user.id,
    github_username: state.githubProfile.login,
    display_name: state.githubProfile.name || state.githubProfile.login,
    avatar_url: state.githubProfile.avatar_url,
    message: message.slice(0,220),
  });
}
