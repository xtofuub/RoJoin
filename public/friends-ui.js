const friendsPanel = document.querySelector('.tool-panel[data-panel="friends"]');

if (friendsPanel) {
  friendsPanel.innerHTML = `
    <div class="friends-product">
      <div class="friends-hero">
        <div class="friends-copy">
          <span class="friends-kicker">FIREFOX COMPANION</span>
          <h3>Your own friend visibility, kept local.</h3>
          <p>The website stays anonymous. The optional companion uses the Roblox session already active in Firefox to show the online friends Roblox returns to you, then opens Roblox-native join attempts.</p>
          <div class="trust-row">
            <span><i></i>No cookies permission</span>
            <span><i></i>No analytics</span>
            <span><i></i>No session upload</span>
            <span><i></i>Open source</span>
          </div>
        </div>

        <article class="companion-download-card">
          <div class="companion-download-top">
            <div class="companion-logo" aria-hidden="true"><svg viewBox="0 0 32 32"><path d="M6 7h10.5c5.6 0 9 2.8 9 7.4 0 3.5-2 6-5.6 7l6.1 4.6h-6.8l-5.4-4.2H12V26H6V7Zm6 5v5h4.2c2.1 0 3.2-.9 3.2-2.5 0-1.7-1.1-2.5-3.2-2.5H12Z"/><circle cx="25" cy="7" r="3"/></svg></div>
            <div class="companion-title"><strong>RoJoiner Companion</strong><span>Firefox test build</span></div>
            <span class="version-pill">v0.2.0</span>
          </div>

          <div class="companion-capabilities">
            <div><b>01</b><span>Reads the online-friends view available to your signed-in Roblox session.</span></div>
            <div><b>02</b><span>Shows which visible friends are in-game and opens Roblox join links.</span></div>
            <div><b>03</b><span>Keeps authenticated requests between Firefox and Roblox.</span></div>
          </div>

          <div class="companion-download-actions">
            <a class="download-firefox" href="/downloads/rojoiner-companion-firefox-0.2.0.zip" download><span>Download Firefox build</span><span>↓</span></a>
            <a class="view-source" href="https://github.com/xtofuub/RoJoiner/tree/main/companion" target="_blank" rel="noreferrer">Source ↗</a>
          </div>
          <p class="download-note">Unsigned test build. Permanent installation in standard Firefox requires Mozilla signing.</p>
        </article>
      </div>

      <div class="friends-lower">
        <article class="install-card">
          <div class="friends-card-head"><strong>Install</strong><span>Temporary Firefox add-on</span></div>
          <ol class="install-steps">
            <li><strong>Download</strong><span class="install-copy">Save the companion ZIP.</span></li>
            <li><strong>Open debugging</strong><span class="install-copy">Choose <b>Load Temporary Add-on</b>.<code>about:debugging#/runtime/this-firefox</code></span></li>
            <li><strong>Load it</strong><span class="install-copy">Select the ZIP, stay signed in at Roblox, then pin the extension.</span></li>
          </ol>
        </article>

        <article class="boundary-card">
          <div class="friends-card-head"><strong>Limits</strong><span>What it can see</span></div>
          <ul class="boundary-list">
            <li><span>Online friends and presence already returned to your Roblox account.</span></li>
            <li><span>Roblox-native <code>userId</code> join attempts; Roblox still decides whether the join is allowed.</span></li>
            <li><span>Malformed or unresolved accounts are omitted.</span></li>
            <li class="limit"><span>No hidden users, private servers, cookie extraction, or privacy bypasses.</span></li>
          </ul>
        </article>
      </div>
    </div>`;
}
