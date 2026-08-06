# RoJoin

A transparent, dependency-free website for finding and joining a player's publicly visible Roblox server. RoJoin was built as a safer alternative to questionable browser extensions that request broad permissions.

## Why RoJoin?

Finding a public Roblox server should not require installing a potentially malicious extension. RoJoin keeps the full implementation inspectable and runs without Roblox passwords, `.ROBLOSECURITY` cookies, analytics, or hidden third-party services.

**Find players. Not malware.**

## Features

- Midnight editorial UI inspired by the supplied reference.
- Server-side Roblox requests; no browser CORS workaround required.
- No Roblox login, `.ROBLOSECURITY` cookie, API key, database, analytics, or third-party backend.
- Exact app and web launch links when the server is publicly visible.
- Safe fallback states for offline, online, hidden-server, rate-limit, and upstream-error responses.
- Basic per-instance IP rate limiting.
- Responsive layout and reduced-motion support.

## Run locally

Requires Node.js 20 or newer.

```bash
npm run dev
```

Then open `http://localhost:3000`.

## Deploy to Vercel

1. Upload this folder to a Git repository or import it directly into Vercel.
2. Keep the framework preset as **Other**.
3. No environment variables are required.
4. Deploy.

Vercel serves the files in `public/` and runs `api/search.js` as a serverless function.

## Public API behavior

The backend calls Roblox-owned endpoints for:

- Username resolution
- Public profile information
- Public presence
- Avatar thumbnail
- Optional game metadata

It does not attempt to bypass privacy settings or enumerate public-server avatar tokens. If Roblox reports that the player is in a game but omits `gameId`, the exact-server button stays disabled.

## Project layout

```text
api/search.js       Vercel serverless endpoint
lib/roblox.js       Roblox API client and response mapping
public/index.html   Main interface
public/styles.css   Complete visual system
public/app.js       Search UI and result rendering
server.mjs          Dependency-free local development server
vercel.json         Security headers and deployment configuration
```

## Disclaimer

RoJoin is not affiliated with Roblox Corporation. Roblox may change or rate-limit its public endpoints. The app handles HTTP 429 responses but public behavior can still change over time.
