<div align="center">
  <img src="./assets/rojoiner-readme.svg" width="100%" alt="RoJoiner — Roblox joining toolkit" />

  <br />

  <a href="./LICENSE"><img alt="MIT License" src="https://img.shields.io/badge/license-MIT-FF6038?style=flat-square&labelColor=111111" /></a>
  <a href="https://rojoiner-web.vercel.app"><img alt="Live website" src="https://img.shields.io/badge/live-rojoiner-ffffff?style=flat-square&labelColor=111111" /></a>
  <a href="./companion"><img alt="Optional companion" src="https://img.shields.io/badge/companion-open_source-68C991?style=flat-square&labelColor=111111" /></a>

  <p>
    An open-source Roblox joining toolkit for player lookup, public server browsing,<br />
    relationship checks, local favourites, share links, and optional online-friend access.
  </p>
</div>

---

## Why RoJoiner?

RoJoiner keeps its normal website useful without asking users to connect a Roblox account. The optional friends companion is separate, small, open source, and documents every permission it requests.

The website has no Roblox login flow, analytics SDK, remote search-history database, or `.ROBLOSECURITY` cookie handling.

## Features

### Player lookup

- Resolve usernames, avatars, account dates, and public social counts.
- Display the public presence fields Roblox returned.
- Open an exact instance when Roblox exposes a `gameInstanceId`.
- Fall back to a Roblox-controlled `userId` join request.
- Explain whether the public place and exact instance were returned or hidden.
- Save players locally and copy share links.

### Public server browser

- Accept a Roblox game URL or numeric Place ID.
- Display game icon, title, creator, visits, active users, and server capacity.
- Load up to 100 public instances per page.
- Sort smallest-first or largest-first and hide full servers.
- Join the smallest open server, largest open server, or a random server.
- Rejoin a recently opened server.
- Save games and share exact instances.

Roblox public server responses expose instance IDs and capacity information, but currently do not provide usable player identity arrays. RoJoiner therefore does not claim to reveal hidden server membership.

### Relationship comparison

- Compare two Roblox usernames.
- Check whether the returned public friend lists connect them.
- Display public friend, follower, and following counts.
- Calculate and render mutual public friends.

### Local library

Favourite players, favourite games, and recent servers are stored only in browser `localStorage`. Every item can be removed individually, and the entire local library can be cleared from the interface.

### Optional friends companion

The [`companion/`](./companion) browser extension shows online friends visible to the Roblox account already signed in within that browser.

- No browser `cookies` permission.
- No direct `.ROBLOSECURITY` access.
- Authenticated requests go directly to Roblox-owned domains.
- Friend and session data are not sent to the RoJoiner website.
- Source-install instructions are included for Firefox and Chromium browsers.

Read the [companion permission and installation guide](./companion/README.md).

## Share links

RoJoiner uses query-based links so sharing works reliably on the production Vercel alias:

```text
/?player=<username>
/?game=<placeId>
/?server=<placeId>:<gameInstanceId>
```

Each link resolves current data when opened. It does not publish a history of where a player was located.

## Architecture

```text
Browser
  ├── Players ──────► /api/search  ──► users / presence / friends / thumbnails
  ├── Servers ──────► /api/game    ──► games / universes / public servers
  ├── Compare ──────► /api/compare ──► users / public friend lists
  └── Library ──────► localStorage only

Optional companion
  └── Browser-managed Roblox session ──► authenticated online-friends endpoint
```

## Run locally

Requirements:

- Node.js 20 or newer
- No environment variables
- No package installation required

```bash
git clone https://github.com/xtofuub/RoJoiner.git
cd RoJoiner
npm run check
npm run dev
```

Open `http://localhost:3000`.

## Deploy to Vercel

Import `xtofuub/RoJoiner` using the **Other** framework preset. No build command or environment variables are required.

Vercel serves the interface from `public/` and runs the three Node.js functions in `api/`. The included GitHub Actions workflow validates the website, APIs, companion JavaScript, and extension manifest on pushes and pull requests.

## Project structure

```text
.
├── .github/workflows/ci.yml
├── api/
│   ├── search.js
│   ├── game.js
│   └── compare.js
├── companion/
│   ├── manifest.json
│   ├── popup.html
│   ├── popup.css
│   ├── popup.js
│   ├── icon.svg
│   └── README.md
├── lib/roblox.js
├── public/
│   ├── index.html
│   ├── app.js       # Bootstrap module
│   ├── share.js     # Alias-safe sharing
│   ├── core.js      # Toolkit interface logic
│   ├── styles.css
│   └── favicon.svg
├── server.mjs
├── vercel.json
└── package.json
```

## Privacy boundary

| RoJoiner does | RoJoiner does not |
|---|---|
| Use Roblox-owned public endpoints | Ask for a Roblox password |
| Browse public server instances | Reveal hidden server membership |
| Use Roblox-native launch links | Bypass account join settings |
| Store favourites in the current browser | Upload a searchable player history |
| Explain unavailable data honestly | Enter private servers without permission |

Roblox always makes the final decision about whether a player or server can be joined.

## Security

- Restrictive Content Security Policy and browser security headers.
- Request timeouts, normalized public errors, and lookup rate limiting.
- No remote client scripts, analytics SDKs, or external database.
- Companion permissions are deliberately limited and documented.
- Automated syntax and manifest validation through GitHub Actions.

Please report security issues privately through the maintainer's GitHub profile rather than publishing sensitive exploit details.

## Disclaimer

RoJoiner is an independent open-source project and is not affiliated with, endorsed by, or sponsored by Roblox Corporation. Roblox can change, remove, or rate-limit its endpoints at any time.

## License

Released under the [MIT License](./LICENSE).
