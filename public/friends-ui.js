const firefoxPolish = document.createElement('style');
firefoxPolish.textContent = `
  #toolkit .tool-tabs {
    position: relative !important;
    top: auto !important;
  }

  .tool-panel[data-panel="friends"] {
    min-height: auto !important;
    overflow: hidden;
  }

  .friends-product {
    display: grid;
    gap: 18px;
  }

  .friends-hero {
    display: grid;
    grid-template-columns: minmax(0, 1.05fr) minmax(360px, .95fr);
    gap: 48px;
    align-items: center;
  }

  .friends-copy {
    max-width: 680px;
    padding: 12px 0;
  }

  .friends-kicker {
    display: inline-flex;
    align-items: center;
    gap: 9px;
    color: var(--accent);
    font-family: var(--mono);
    font-size: 9px;
    font-weight: 650;
    letter-spacing: .15em;
    text-transform: uppercase;
  }

  .friends-kicker::before {
    content: "";
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: var(--accent);
    box-shadow: 0 0 18px rgba(255,107,80,.45);
  }

  .friends-copy h3 {
    max-width: 620px;
    margin: 20px 0 18px !important;
    font-size: clamp(38px, 4.2vw, 58px) !important;
    line-height: .98 !important;
    letter-spacing: -.055em !important;
  }

  .friends-copy > p {
    max-width: 620px;
    margin: 0;
    color: #878787 !important;
    font-size: 13px !important;
    line-height: 1.7 !important;
  }

  .trust-row {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 26px;
  }

  .trust-row span {
    min-height: 32px;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 0 11px;
    border: 1px solid rgba(255,255,255,.09);
    border-radius: 999px;
    color: #7d7d7d;
    background: rgba(255,255,255,.018);
    font-family: var(--mono);
    font-size: 8px;
    white-space: nowrap;
  }

  .trust-row i {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--green);
  }

  .companion-download-card {
    position: relative;
    min-height: 370px;
    display: flex;
    flex-direction: column;
    padding: 26px !important;
    overflow: hidden;
    border: 1px solid rgba(255,255,255,.11) !important;
    border-radius: 26px !important;
    background:
      radial-gradient(circle at 100% 0%, rgba(255,107,80,.11), transparent 42%),
      #0b0b0b !important;
  }

  .companion-download-card::after {
    content: "";
    position: absolute;
    right: -72px;
    top: -72px;
    width: 180px;
    height: 180px;
    border: 1px solid rgba(255,107,80,.16);
    border-radius: 50%;
    pointer-events: none;
  }

  .companion-download-top {
    position: relative;
    z-index: 1;
    display: grid;
    grid-template-columns: 52px minmax(0, 1fr) auto;
    gap: 14px;
    align-items: center;
    padding-bottom: 20px;
    border-bottom: 1px solid rgba(255,255,255,.08);
  }

  .companion-logo {
    width: 52px;
    height: 52px;
    display: grid;
    place-items: center;
    border: 1px solid rgba(255,255,255,.11);
    border-radius: 14px !important;
    background: #111;
  }

  .companion-logo svg { width: 31px; height: 31px; fill: #f1eee8; }
  .companion-logo circle { fill: var(--accent); }

  .companion-title strong,
  .companion-title span { display: block; }

  .companion-title strong {
    color: #f2f2f2;
    font-size: 14px;
    letter-spacing: -.025em;
  }

  .companion-title span {
    margin-top: 4px;
    color: #666;
    font-family: var(--mono);
    font-size: 8px;
    letter-spacing: .08em;
  }

  .version-pill {
    min-height: 28px;
    display: grid;
    place-items: center;
    padding: 0 9px;
    border: 1px solid rgba(255,107,80,.3);
    border-radius: 999px;
    color: var(--accent);
    background: rgba(255,107,80,.06);
    font-family: var(--mono);
    font-size: 8px;
  }

  .companion-capabilities {
    position: relative;
    z-index: 1;
    display: grid;
    margin: 16px 0 22px;
  }

  .companion-capabilities div {
    display: grid;
    grid-template-columns: 26px minmax(0, 1fr);
    gap: 6px;
    align-items: center;
    min-height: 48px;
    border-bottom: 1px solid rgba(255,255,255,.07);
  }

  .companion-capabilities b {
    color: var(--accent);
    font-family: var(--mono);
    font-size: 8px;
    font-weight: 500;
  }

  .companion-capabilities span {
    color: #858585;
    font-size: 10px;
    line-height: 1.45;
  }

  .companion-download-actions {
    position: relative;
    z-index: 1;
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 8px;
    margin-top: auto;
  }

  .download-firefox,
  .view-source {
    min-height: 48px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-radius: 13px !important;
  }

  .download-firefox {
    padding: 0 15px;
    color: #050505 !important;
    background: var(--accent) !important;
    font-size: 10px;
    font-weight: 750;
  }

  .download-firefox:hover { filter: brightness(1.06); }

  .view-source {
    min-width: 84px;
    justify-content: center;
    border: 1px solid rgba(255,255,255,.12);
    color: #888;
    font-size: 9px;
  }

  .view-source:hover { border-color: #666; color: #fff; }

  .download-note {
    position: relative;
    z-index: 1;
    margin: 12px 0 0;
    color: #555;
    font-size: 8px;
    line-height: 1.5;
  }

  .friends-lower {
    display: grid;
    grid-template-columns: minmax(0, 1.35fr) minmax(320px, .65fr);
    gap: 18px;
  }

  .install-card,
  .boundary-card {
    padding: 22px !important;
    border: 1px solid rgba(255,255,255,.08) !important;
    border-radius: 22px !important;
    background: #090909 !important;
  }

  .friends-card-head {
    min-height: 36px;
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 20px;
    padding-bottom: 14px;
    border-bottom: 1px solid rgba(255,255,255,.08);
  }

  .friends-card-head strong {
    color: #e8e8e8;
    font-size: 12px;
    font-weight: 600;
  }

  .friends-card-head span {
    color: #4f4f4f;
    font-family: var(--mono);
    font-size: 7px;
    letter-spacing: .08em;
  }

  .install-steps {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 10px;
    margin: 18px 0 0;
    padding: 0;
    list-style: none;
    counter-reset: step;
  }

  .install-steps li {
    counter-increment: step;
    min-width: 0;
    min-height: 142px;
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 15px;
    border: 1px solid rgba(255,255,255,.075);
    border-radius: 14px;
    color: #858585;
    background: #0d0d0d;
    font-size: 10px;
    line-height: 1.55;
  }

  .install-steps li::before {
    content: counter(step, decimal-leading-zero);
    color: var(--accent);
    font-family: var(--mono);
    font-size: 8px;
  }

  .install-steps strong { color: #d9d9d9; font-weight: 550; }

  .install-steps code {
    display: block;
    width: 100%;
    margin-top: auto;
    padding: 8px 9px;
    overflow-x: auto;
    border: 1px solid rgba(255,255,255,.07);
    border-radius: 8px;
    color: #bdbdbd;
    background: #070707;
    font-family: var(--mono);
    font-size: 8px;
    line-height: 1.35;
    white-space: nowrap;
    word-break: normal;
    overflow-wrap: normal;
    scrollbar-width: thin;
  }

  .boundary-card {
    display: flex;
    flex-direction: column;
  }

  .boundary-list {
    display: grid;
    margin: 4px 0 0;
    padding: 0;
    list-style: none;
  }

  .boundary-list li {
    display: grid;
    grid-template-columns: 8px minmax(0, 1fr);
    gap: 11px;
    align-items: start;
    padding: 13px 0;
    border-bottom: 1px solid rgba(255,255,255,.07);
    color: #858585;
    font-size: 10px;
    line-height: 1.5;
  }

  .boundary-list li::before {
    content: "";
    width: 5px;
    height: 5px;
    margin-top: 5px;
    border-radius: 50%;
    background: var(--green);
  }

  .boundary-list li.limit::before { background: var(--accent); }
  .boundary-list code { color: #c8c8c8; font-family: var(--mono); font-size: 9px; }

  .boundary-foot {
    margin-top: auto;
    padding-top: 16px;
    color: #555;
    font-family: var(--mono);
    font-size: 8px;
    line-height: 1.6;
  }

  @media (max-width: 980px) {
    .friends-hero,
    .friends-lower { grid-template-columns: 1fr; }
    .friends-copy { max-width: 760px; }
    .companion-download-card { min-height: 340px; }
  }

  @media (max-width: 720px) {
    .friends-hero { gap: 28px; }
    .friends-copy h3 { font-size: 40px !important; }
    .install-steps { grid-template-columns: 1fr; }
    .install-steps li { min-height: 0; }
  }

  @media (max-width: 520px) {
    .companion-download-top { grid-template-columns: 46px minmax(0, 1fr); }
    .version-pill { grid-column: 2; width: max-content; }
    .companion-download-actions { grid-template-columns: 1fr; }
    .view-source { min-height: 42px; }
  }
`;
document.head.append(firefoxPolish);

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
