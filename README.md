# GitHub Kingdoms

A multiplayer pixel-art GitHub RPG built for GitHub Pages + Supabase.

## Features
- GitHub OAuth sign-in required to play
- Phaser 3 top-down pixel world
- Realtime multiplayer presence
- Global chat
- GitHub-powered kingdom generation
- Pixel-art JRPG aesthetic
- GitHub Pages friendly

## Setup
1. Create a Supabase project.
2. Run `supabase/schema.sql`.
3. Enable GitHub auth in Supabase Auth and add your GitHub OAuth app callback.
4. In `js/config.js`, set:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
5. Deploy the folder to GitHub Pages.

## GitHub OAuth callback
Set your GitHub OAuth callback to:
`https://YOURNAME.github.io/GitHub-Kingdoms/`

If testing locally, add:
`http://localhost:5500/`

## Notes
- The world is generated client-side from kingdom data stored in Supabase.
- The game uses placeholder pixel tiles drawn in code so it works immediately without external art.
- You can swap in real sprite sheets later without changing the gameplay architecture.
