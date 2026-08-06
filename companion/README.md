# RoJoiner Companion

RoJoiner Companion is the optional Firefox extension for the one feature a normal website cannot provide: the online friends visible to your signed-in Roblox browser session.

It displays those friends locally, separates friends currently shown as in-game, and opens Roblox-native `userId` join links. It does not send your Roblox session, friends list, or searches to the RoJoiner website.

## What it shows

- The Roblox account signed in within Firefox
- Friends Roblox currently reports as online
- Which visible friends are currently shown as in-game
- The public location Roblox returns
- Roblox-native **Join** and profile actions

## Permissions

| Permission | Purpose |
|---|---|
| `users.roblox.com` | Identify the Roblox account already signed in within the browser. |
| `friends.roblox.com` | Request the online-friends list Roblox exposes to that account. |
| `presence.roblox.com` | Display the public presence Roblox returns for those friends. |
| `thumbnails.roblox.com` | Display Roblox avatar headshots. |

The extension does **not** request the browser `cookies` permission and does not directly read `.ROBLOSECURITY`. Requests go directly to Roblox using browser-managed credentials.

The Firefox manifest declares `data_collection_permissions.required: ["none"]` because the extension does not collect or transmit user data outside the extension.

## Download and test in Firefox

1. Download `rojoiner-companion-firefox.zip` from the RoJoiner website.
2. Open `about:debugging#/runtime/this-firefox` in Firefox.
3. Select **Load Temporary Add-on**.
4. Choose the downloaded ZIP file.
5. Sign in at Roblox, then open the RoJoiner Companion toolbar button.

Firefox removes temporary add-ons when the browser restarts. Standard Firefox and Firefox Beta require Mozilla signing for permanent installation, so the downloadable build is currently intended for transparent testing from source.

## Install from the repository

1. Download or clone this repository.
2. Open `about:debugging#/runtime/this-firefox`.
3. Select **Load Temporary Add-on**.
4. Choose `companion/manifest.json`.
5. Sign in at Roblox and open the toolbar button.

## Trust model

- Authenticated requests go directly from the extension to Roblox domains.
- No session value is displayed, copied, stored, or forwarded.
- No analytics, remote JavaScript, or external backend is included.
- Invalid or deleted friend records are omitted instead of being shown as fake users.
- Roblox makes the final decision about whether a friend can be joined based on their status, privacy settings, and server type.
