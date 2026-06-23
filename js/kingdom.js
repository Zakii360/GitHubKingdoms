const langBiome = {
  JavaScript: "Neon Market",
  TypeScript: "Crystal Archive",
  Python: "Scholar Garden",
  Rust: "Iron Bastion",
  "C++": "Forge District",
  C: "Forge District",
  Go: "Harbor Ward",
  Java: "Clockwork Court",
  HTML: "Sunlit Plaza",
  CSS: "Sunlit Plaza",
};

export function buildKingdomFromGitHub(profile, repos) {
  const languages = {};
  let stars = 0;
  for (const r of repos) {
    stars += r.stargazers_count || 0;
    if (r.language) languages[r.language] = (languages[r.language] || 0) + 1;
  }
  const topLanguages = Object.entries(languages).sort((a,b)=>b[1]-a[1]).slice(0,5).map(([name,count])=>({name,count}));
  const dominant = topLanguages[0]?.name || "JavaScript";
  const biome = langBiome[dominant] || "Open Source Village";
  const rank = stars > 10000 ? "Legendary" : stars > 2000 ? "Grand" : stars > 300 ? "Rising" : "Small";
  const districtCount = Math.max(3, Math.min(10, Math.ceil((repos.length || 1) / 6)));
  const npcCount = Math.max(4, Math.min(28, Math.ceil((profile.followers || 0) / 4) + 4));
  return {
    github_username: profile.login,
    display_name: profile.name || profile.login,
    avatar_url: profile.avatar_url,
    bio: profile.bio || "",
    followers: profile.followers || 0,
    following: profile.following || 0,
    public_repos: profile.public_repos || repos.length,
    stars_total: stars,
    top_languages: topLanguages,
    biome,
    rank,
    district_count: districtCount,
    npc_count: npcCount,
    castle_level: Math.max(1, Math.min(6, Math.ceil((stars + profile.followers * 10 + repos.length * 6) / 400))),
    repo_count: repos.length,
  };
}

export function kingdomFlavor(kingdom) {
  const langs = (kingdom.top_languages || []).map(l=>l.name).join(", ") || "misc magic";
  return `${kingdom.display_name}'s ${kingdom.rank} kingdom is known for ${kingdom.biome.toLowerCase()}, ${kingdom.repo_count} repositories, ${kingdom.followers} followers, and a ${langs} tech stack.`;
}
