export async function fetchGitHubProfile(username) {
  const res = await fetch(`https://api.github.com/users/${encodeURIComponent(username)}`);
  if (!res.ok) throw new Error("Failed to fetch GitHub profile");
  return res.json();
}
export async function fetchGitHubRepos(username) {
  let page = 1;
  const out = [];
  while (page <= 3) {
    const res = await fetch(`https://api.github.com/users/${encodeURIComponent(username)}/repos?per_page=100&page=${page}&sort=updated`);
    if (!res.ok) break;
    const data = await res.json();
    out.push(...data.filter(r => !r.fork));
    if (data.length < 100) break;
    page++;
  }
  return out;
}
