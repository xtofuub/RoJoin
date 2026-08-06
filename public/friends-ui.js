const companionStyle = document.createElement('style');
companionStyle.textContent = `
  .tool-panel[data-panel="friends"] { overflow: hidden; }
  .friends-product { display: grid; gap: 28px; }
  .friends-hero { display: grid; grid-template-columns: minmax(0, 1.08fr) minmax(320px, .92fr); gap: 42px; align-items: stretch; }
  .friends-kicker { display: inline-flex; align-items: center; gap: 8px; color: var(--accent); font-family: var(--mono); font-size: 9px; letter-spacing: .08em; }
  .friends-kicker::before { content: ""; width: 7px; height: 7px; border-radius: 50%; background: var(--accent); }
  .friends-copy h3 { max-width: 650px; margin: 18px 0 18px; font-size: clamp(34px, 5vw, 58px); line-height: .98; letter-spacing: -.055em; }
  .friends-copy > p { max-width: 660px; margin: 0; color: var(--muted); font-size: 13px; line-height: 1.75; }
  .trust-row { display: flex; flex-wrap: wrap; gap: 7px; margin-top: 24px; }
  .trust-row span { min-height: 31px; display: inline-flex; align-items: center; gap: 7px; padding: 0 10px; border: 1px solid var(--soft-line); color: var(--muted); background: #0d0d0d; font-family: var(--mono); font-size: 8px; }
  .trust-row i { width: 6px; height: 6px; border-radius: 50%; background: var(--green); }
  .companion-download-card { position: relative; min-height: 100%; display: flex; flex-direction: column; padding: 22px; border: 1px solid var(--line); background: #0d0d0d; }
  .companion-download-top { display: grid; grid-template-columns: 54px minmax(0, 1fr) auto; gap: 13px; align-items: center; padding-bottom: 20px; border-bottom: 1px solid var(--soft-line); }
  .companion-logo { width: 54px; height: 54px; display: grid; place-items: center; border: 1px solid var(--line); background: #090909; }
  .companion-logo svg { width: 34px; height: 34px; fill: var(--text); }
  .companion-logo circle { fill: var(--accent); }
  .companion-title { min-width: 0; }
  .companion-title strong, .companion-title span { display: block; }
  .companion-title strong { font-size: 15px; letter-spacing: -.025em; }
  .companion-title span { margin-top: 5px; color: var(--muted); font-family: var(--mono); font-size: 8px; }
  .version-pill { min-height: 27px; display: grid; place-items: center; padding: 0 8px; border: 1px solid var(--line); color: var(--accent); font-family: var(--mono); font-size: 8px; }
  .companion-capabilities { display: grid; gap: 0; margin: 18px 0 22px; border-top: 1px solid var(--soft-line); }
  .companion-capabilities div { display: grid; grid-template-columns: 20px minmax(0, 1fr); gap: 10px; padding: 12px 0; border-bottom: 1px solid var(--soft-line); }
  .companion-capabilities b { color: var(--accent); font-family: var(--mono); font-size: 9px; font-weight: 500; }
  .companion-capabilities span { color: var(--muted); font-size: 10px; line-height: 1.5; }
  .companion-download-actions { display: grid; grid-template-columns: 1fr auto; gap: 8px; margin-top: auto; }
  .download-firefox { min-height: 46px; display: flex; align-items: center; justify-content: space-between; gap: 14px; padding: 0 14px; color: #090909; background: var(--accent); font-size: 10px; font-weight: 700; }
  .download-firefox:hover { filter: brightness(1.06); }
  .view-source { min-width: 78px; min-height: 46px; display: grid; place-items: center; border: 1px solid var(--line); color: var(--muted); font-size: 9px; }
  .view-source:hover { border-color: var(--text); color: var(--text); }
  .download-note { margin: 12px 0 0; color: var(--dim); font-size: 8px; line-height: 1.6; }
  .friends-lower { display: grid; grid-template-columns: 1.05fr .95fr; gap: 12px; }
  .install-card, .boundary-card { padding: 20px; border: 1px solid var(--soft-line); background: #0b0b0b; }
  .friends-card-head { display: flex; align-items: center; justify-content: space-between; gap: 18px; padding-bottom: 14px; border-bottom: 1px solid var(--soft-line); }
  .friends-card-head strong { font-size: 12px; }
  .friends-card-head span { color: var(--dim); font-family: var(--mono); font-size: 8px; }
  .install-steps { margin: 0; padding: 0; list-style: none; counter-reset: step; }
  .install-steps li { counter-increment: step; display: grid; grid-template-columns: 28px minmax(0, 1fr); gap: 11px; align-items: start; padding: 14px 0; border-bottom: 1px solid var(--soft-line); color: var(--muted); font-size: 10px; line-height: 1.55; }
  .install-steps li::before { content: counter(step, decimal-leading-zero); color: var(--accent); font-family: var(--mono); font-size: 9px; }
  .install-steps code { color: var(--text); background: transparent; font-family: var(--mono); font-size: 9px; }
  .boundary-list { margin: 0; padding: 4px 0 0; list-style: none; }
  .boundary-list li { display: grid; grid-template-columns: 9px minmax(0, 1fr); gap: 10px; padding: 12px 0; border-bottom: 1px solid var(--soft-line); color: var(--muted); font-size: 10px; line-height: 1.55; }
  .boundary-list li::before { content: ""; width: 5px; height: 5px; margin-top: 5px; border-radius: 50%; background: var(--green); }
  .boundary-list li.limit::before { background: var(--accent); }
  .tool-tabs { scrollbar-width: thin; }
  @media (max-width: 900px) {
    .friends-hero, .friends-lower { grid-template-columns: 1fr; }
  }
  @media (max-width: 560px) {
    .friends-copy h3 { font-size: 40px; }
    .companion-download-actions { grid-template-columns: 1fr; }
    .view-source { min-height: 40px; }
  }
`;
document.head.append(companionStyle);

const friendsPanel = document.querySelector('.tool-panel[data-panel="friends"]');
if (friendsPanel) {
  friendsPanel.innerHTML = `
    <div class="friends-product">
      <div class="friends-hero">
        <div class="friends-copy">
          <span class="friends-kicker">FIREFOX / LOCAL COMPANION</span>
          <h3>Join the friends your browser can actually see.</h3>
          <p>The website cannot use your logged-in Roblox visibility. The optional Firefox companion runs locally, lists the online friends Roblox returns to your own session, separates friends currently shown as in-game, and opens Roblox-native join links.</p>
          <div class="trust-row">
            <span><i></i>No cookies permission</span>
            <span><i></i>No external analytics</span>
            <span><i></i>No data sent to RoJoiner</span>
            <span><i></i>Source included</span>
          </div>
        </div>

        <article class="companion-download-card">
          <div class="companion-download-top">
            <div class="companion-logo" aria-hidden="true"><svg viewBox="0 0 32 32"><path d="M6 7h10.5c5.6 0 9 2.8 9 7.4 0 3.5-2 6-5.6 7l6.1 4.6h-6.8l-5.4-4.2H12V26H6V7Zm6 5v5h4.2c2.1 0 3.2-.9 3.2-2.5 0-1.7-1.1-2.5-3.2-2.5H12Z"/><circle cx="25" cy="7" r="3"/></svg></div>
            <div class="companion-title"><strong>RoJoiner Companion</strong><span>FIREFOX TEST BUILD</span></div>
            <span class="version-pill">0.2.0</span>
          </div>
          <div class="companion-capabilities">
            <div><b>01</b><span>Lists the online friends visible to your signed-in Roblox session.</span></div>
            <div><b>02</b><span>Filters friends currently shown as in-game and opens direct join attempts.</span></div>
            <div><b>03</b><span>Runs Roblox API requests locally inside Firefox.</span></div>
          </div>
          <div class="companion-download-actions">
            <a class="download-firefox" href="/downloads/rojoiner-companion-firefox-0.2.0.zip" download><span>Download for Firefox</span><span>↓</span></a>
            <a class="view-source" href="https://github.com/xtofuub/RoJoiner/tree/main/companion" target="_blank" rel="noreferrer">Source ↗</a>
          </div>
          <p class="download-note">Unsigned transparent test build. Permanent installation in standard Firefox requires Mozilla signing.</p>
        </article>
      </div>

      <div class="friends-lower">
        <article class="install-card">
          <div class="friends-card-head"><strong>Install the test build</strong><span>ABOUT:DEBUGGING</span></div>
          <ol class="install-steps">
            <li>Download the Firefox ZIP using the button above.</li>
            <li>Open <code>about:debugging#/runtime/this-firefox</code> and choose <strong>Load Temporary Add-on</strong>.</li>
            <li>Select the downloaded ZIP, sign in at Roblox, then pin and open RoJoiner Companion.</li>
          </ol>
        </article>

        <article class="boundary-card">
          <div class="friends-card-head"><strong>What it does—and does not do</strong><span>TRUST BOUNDARY</span></div>
          <ul class="boundary-list">
            <li>Shows online friends and presence already returned to your account.</li>
            <li>Uses Roblox-native <code>userId</code> join links; Roblox still approves or rejects the join.</li>
            <li>Omits malformed, deleted, and unresolved account records.</li>
            <li class="limit">Does not reveal hidden users, private servers, or bypass privacy settings.</li>
          </ul>
        </article>
      </div>
    </div>`;
}
