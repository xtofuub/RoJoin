const stylesheetId = 'rojoiner-friends-polish';
if (!document.querySelector(`link[data-style-id="${stylesheetId}"]`)) {
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = '/friends-polish.css';
  link.dataset.styleId = stylesheetId;
  document.head.append(link);
}

const friendsPanel = document.querySelector('.tool-panel[data-panel="friends"]');

if (friendsPanel) {
  friendsPanel.innerHTML = `
    <div class="friends-product">
      <div class="friends-hero">
        <div class="friends-copy">
          <span class="friends-kicker">Firefox / local companion</span>
          <h3>Join the friends your browser can actually see.</h3>
          <p>RoJoiner stays anonymous on the website. The optional companion runs inside Firefox, uses the Roblox session you already have, and shows the online friends Roblox returns to that session.</p>
          <div class="trust-row">
            <span><i></i>No cookies permission</span>
            <span><i></i>No analytics</span>
            <span><i></i>No RoJoiner upload</span>
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
            <div><b>01</b><span>Reads the online-friends view already available to your signed-in Roblox session.</span></div>
            <div><b>02</b><span>Separates friends currently shown in-game and opens Roblox-native join attempts.</span></div>
            <div><b>03</b><span>Keeps authenticated Roblox requests inside Firefox instead of sending them through RoJoiner.</span></div>
          </div>

          <div class="companion-download-actions">
            <a class="download-firefox" href="/downloads/rojoiner-companion-firefox-0.2.0.zip" download><span>Download Firefox build</span><span>↓</span></a>
            <a class="view-source" href="https://github.com/xtofuub/RoJoiner/tree/main/companion" target="_blank" rel="noreferrer">Source ↗</a>
          </div>
          <p class="download-note">Unsigned test build · permanent standard-Firefox installation requires Mozilla signing.</p>
        </article>
      </div>

      <div class="friends-lower">
        <article class="install-card">
          <div class="friends-card-head"><strong>Install in three steps</strong><span>Temporary Firefox add-on</span></div>
          <ol class="install-steps">
            <li><strong>Download</strong><span>Save the companion ZIP using the download button above.</span></li>
            <li><strong>Open Firefox debugging</strong><span>Paste this page into Firefox and choose <strong>Load Temporary Add-on</strong>.</span><code>about:debugging#/runtime/this-firefox</code></li>
            <li><strong>Use RoJoiner</strong><span>Select the ZIP, stay signed in at Roblox, then pin and open the companion.</span></li>
          </ol>
        </article>

        <article class="boundary-card">
          <div class="friends-card-head"><strong>Trust boundary</strong><span>What the extension can see</span></div>
          <ul class="boundary-list">
            <li>Online friends and presence already returned to your Roblox account.</li>
            <li>Roblox-native <code>userId</code> join attempts; Roblox still makes the permission decision.</li>
            <li>Malformed, deleted, and unresolved account records are omitted.</li>
            <li class="limit">No hidden users, private servers, cookie extraction, or privacy bypasses.</li>
          </ul>
          <p class="boundary-foot">Authenticated requests go directly from your browser to Roblox domains.</p>
        </article>
      </div>
    </div>`;
}
