# RoJoiner Companion

The companion is an optional browser extension for the one feature a normal website cannot provide: the online friends visible to your signed-in Roblox browser session.

It displays those friends locally and opens Roblox-native `userId` join links. It does not send your Roblox session, friends list, or searches to the RoJoiner website.

## Permissions

| Permission | Purpose |
|---|---|
| `storage` | Save small extension preferences locally. |
| `users.roblox.com` | Identify the Roblox account already signed in within the browser. |
| `friends.roblox.com` | Request the online-friends list Roblox exposes to that account. |
| `presence.roblox.com` | Display the public location Roblox returns for those friends. |
| `thumbnails.roblox.com` | Display Roblox avatar headshots. |

The extension does **not** request the browser `cookies` permission and does not directly read `.ROBLOSECURITY`. Requests are sent to Roblox with browser-managed credentials.

## Install from source

### Firefox

1. Download or clone this repository.
2. Open `about:debugging#/runtime/this-firefox`.
3. Select **Load Temporary Add-on**.
4. Choose `companion/manifest.json`.
5. Sign in at Roblox and open the RoJoiner Companion toolbar button.

Temporary Firefox add-ons are removed when Firefox restarts.

### Chromium browsers

1. Download or clone this repository.
2. Open `chrome://extensions`.
3. Enable **Developer mode**.
4. Select **Load unpacked**.
5. Choose the `companion` folder.
6. Sign in at Roblox and open the toolbar button.

## Trust model

- All authenticated requests go directly from the extension to Roblox domains.
- No session value is displayed, copied, stored, or forwarded.
- No analytics or remote JavaScript is included.
- The extension can be reviewed and loaded directly from this folder.

Roblox still makes the final decision about whether a friend can be joined based on their status, privacy settings, and server type.
