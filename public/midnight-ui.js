const midnightStyle = document.createElement('style');
midnightStyle.textContent = `
  :root {
    --bg: #050505 !important;
    --surface: #111111 !important;
    --surface-2: #161616 !important;
    --paper: #f0ede7 !important;
    --text: #ebebeb !important;
    --muted: #888888 !important;
    --dim: #55514c !important;
    --line: rgba(255, 255, 255, .12) !important;
    --soft-line: rgba(255, 255, 255, .075) !important;
    --accent: #ff6b50 !important;
    --green: #73d69a !important;
    --red: #ff806b !important;
    --mono: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace !important;
  }

  html { scroll-behavior: smooth; background: #050505; }
  body.midnight-reference {
    min-height: 100vh;
    overflow-x: hidden;
    color: var(--text);
    background: var(--bg);
    font-family: Inter, Arial, sans-serif;
    selection-color: white;
  }
  body.midnight-reference::before {
    content: "";
    position: fixed;
    inset: 0;
    z-index: -1;
    pointer-events: none;
    opacity: .18;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 180 180' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.12'/%3E%3C/svg%3E");
    mix-blend-mode: soft-light;
  }
  body.midnight-reference ::selection { color: #fff; background: var(--accent); }
  body.midnight-reference a { text-decoration: none; }
  body.midnight-reference button,
  body.midnight-reference input,
  body.midnight-reference select { font: inherit; }

  .shell { width: min(100% - 64px, 1320px) !important; }

  .site-header {
    position: fixed !important;
    inset: 0 0 auto !important;
    z-index: 100 !important;
    border: 0 !important;
    background: linear-gradient(to bottom, rgba(5,5,5,.88), rgba(5,5,5,.36), transparent) !important;
    transition: background .25s ease, backdrop-filter .25s ease;
  }
  .site-header.scrolled {
    background: rgba(5,5,5,.76) !important;
    backdrop-filter: blur(18px);
  }
  .header-inner {
    width: 100% !important;
    max-width: none !important;
    min-height: 92px !important;
    padding: 0 32px !important;
  }
  .brand { gap: 13px !important; color: #fff !important; font-weight: 700 !important; }
  .brand-mark {
    width: 34px !important;
    height: 34px !important;
    display: grid !important;
    place-items: center !important;
    border-radius: 6px !important;
    color: #050505 !important;
    background: #fff !important;
    transition: transform .3s ease, border-radius .3s ease;
  }
  .brand:hover .brand-mark { transform: rotate(9deg); border-radius: 10px !important; }
  .brand-mark svg { width: 22px !important; height: 22px !important; fill: #050505 !important; }
  .brand-mark circle { fill: var(--accent) !important; }
  .brand > span:last-child { font-size: 13px !important; letter-spacing: -.02em; }
  .header-nav { gap: 30px !important; }
  .header-nav a {
    position: relative;
    color: #888 !important;
    font-size: 12px !important;
    font-weight: 500 !important;
    transition: color .2s ease;
  }
  .header-nav a:hover { color: #fff !important; }
  .header-nav .nav-cta {
    min-height: 42px;
    display: inline-flex;
    align-items: center;
    padding: 0 18px;
    border: 1px solid #333;
    border-radius: 10px;
    color: #fff !important;
    background: #1a1a1a;
    transition: background .25s ease, color .25s ease, transform .25s ease;
  }
  .header-nav .nav-cta:hover { color: #050505 !important; background: #fff; transform: translateY(-1px); }

  .hero {
    position: relative !important;
    width: 100% !important;
    max-width: none !important;
    min-height: 100svh !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    padding: 120px 32px 52px !important;
    overflow: hidden;
    isolation: isolate;
  }
  .hero::before {
    content: "";
    position: absolute;
    inset: 0;
    z-index: -2;
    background:
      radial-gradient(circle at 50% 47%, rgba(65,65,65,.42) 0%, rgba(18,18,18,.38) 27%, rgba(5,5,5,1) 68%),
      #050505;
  }
  .hero::after {
    content: "";
    position: absolute;
    left: 12%;
    right: 12%;
    top: 50%;
    z-index: -1;
    height: 1px;
    opacity: .18;
    background: linear-gradient(90deg, transparent, #fff, transparent);
  }
  .hero-center { width: min(100%, 1600px); text-align: center; }
  .hero-kicker {
    display: inline-flex;
    align-items: center;
    gap: 11px;
    margin-bottom: 30px;
    color: #777;
    font-family: var(--mono);
    font-size: 10px;
    font-weight: 700;
    letter-spacing: .3em;
    text-transform: uppercase;
  }
  .hero-kicker i { width: 7px; height: 7px; border-radius: 50%; background: var(--accent); box-shadow: 0 0 24px rgba(255,107,80,.65); }
  .hero-title {
    margin: 0;
    color: #fff;
    font-size: clamp(82px, 13vw, 230px);
    line-height: .82;
    letter-spacing: -.072em;
    font-weight: 800;
    white-space: nowrap;
  }
  .hero-title span { color: var(--accent); font-weight: 400; }
  .hero-description {
    max-width: 660px;
    margin: 40px auto 0;
    color: #888;
    font-size: clamp(14px, 1.15vw, 18px);
    line-height: 1.75;
  }
  .hero-description strong { color: #e7e7e7; font-weight: 500; }
  .hero-bottom-left,
  .hero-bottom-right {
    position: absolute;
    bottom: 46px;
    z-index: 2;
  }
  .hero-bottom-left { left: 42px; display: flex; align-items: center; gap: 16px; }
  .hero-product-stack { display: flex; padding-left: 9px; }
  .hero-product-stack span {
    width: 38px;
    height: 38px;
    display: grid;
    place-items: center;
    margin-left: -9px;
    border: 2px solid #050505;
    border-radius: 50%;
    color: #bdbdbd;
    background: #181818;
    font-family: var(--mono);
    font-size: 9px;
  }
  .hero-product-stack span:last-child { color: #050505; background: var(--accent); }
  .hero-bottom-left p { margin: 0; color: #777; font-size: 11px; line-height: 1.45; }
  .hero-bottom-right { right: 42px; }
  .hero-bottom-right a {
    display: inline-flex;
    align-items: center;
    gap: 12px;
    padding-bottom: 5px;
    border-bottom: 2px solid #fff;
    color: #fff;
    font-size: 13px;
    font-weight: 600;
    transition: color .2s ease, border-color .2s ease;
  }
  .hero-bottom-right a:hover { color: var(--accent); border-color: var(--accent); }

  .editorial-benefits { padding: 150px 0 120px; }
  .benefits-kicker {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 34px;
    color: #666;
    font-family: var(--mono);
    font-size: 10px;
    font-weight: 700;
    letter-spacing: .28em;
    text-transform: uppercase;
  }
  .benefits-kicker i { width: 8px; height: 8px; border-radius: 50%; background: var(--accent); animation: midnightPulse 2s ease-in-out infinite; }
  .editorial-benefits > h2 {
    max-width: 1080px;
    margin: 0 0 90px;
    color: #fff;
    font-size: clamp(44px, 6.1vw, 86px);
    line-height: 1.04;
    letter-spacing: -.055em;
    font-weight: 500;
  }
  .editorial-benefits > h2 span { color: #575757; }
  .benefit-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
  .benefit-card {
    position: relative;
    min-height: 540px;
    padding: 48px;
    overflow: hidden;
    border-radius: 40px;
  }
  .benefit-card-dark { display: flex; flex-direction: column; justify-content: space-between; background: #111; }
  .benefit-tag {
    width: max-content;
    padding: 9px 14px;
    border: 1px solid #333;
    border-radius: 999px;
    color: #888;
    background: #1a1a1a;
    font-family: var(--mono);
    font-size: 9px;
    letter-spacing: .13em;
    text-transform: uppercase;
  }
  .benefit-card h3 {
    margin: auto 0 0;
    color: #fff;
    font-size: clamp(50px, 5.6vw, 80px);
    line-height: .96;
    letter-spacing: -.065em;
  }
  .benefit-card h3 span { display: block; color: #4c4c4c; transition: color .35s ease; }
  .benefit-card:hover h3 span { color: #747474; }
  .benefit-card-coral {
    display: grid;
    place-items: center;
    background: linear-gradient(135deg, #ff6b50, #d94c36);
  }
  .editorial-window {
    width: min(100%, 510px);
    overflow: hidden;
    border-radius: 16px;
    color: #111;
    background: #efefef;
    box-shadow: 0 34px 90px rgba(0,0,0,.38);
    transition: transform .55s cubic-bezier(.22,1,.36,1);
  }
  .benefit-card-coral:hover .editorial-window { transform: scale(1.035) rotate(-.35deg); }
  .window-top { height: 44px; display: flex; align-items: center; gap: 7px; padding: 0 15px; border-bottom: 1px solid #d4d4d4; background: #f8f8f8; }
  .window-top i { width: 9px; height: 9px; border-radius: 50%; background: #d7d7d7; }
  .window-top i:first-child { background: #ff786d; }
  .window-top i:nth-child(2) { background: #f0c64f; }
  .window-top i:nth-child(3) { background: #64c96f; }
  .window-url { width: 42%; height: 8px; margin-left: 12px; border-radius: 20px; background: #dedede; }
  .window-body { min-height: 310px; display: grid; grid-template-columns: 125px 1fr; }
  .window-side { padding: 22px 15px; background: #141414; }
  .window-side strong { color: #fff; font-size: 11px; }
  .window-side span { display: block; height: 7px; margin-top: 16px; border-radius: 4px; background: #2c2c2c; }
  .window-side span:nth-child(3) { width: 74%; background: var(--accent); }
  .window-content { padding: 25px; background: #ececec; }
  .window-content > span { color: #777; font-family: var(--mono); font-size: 8px; letter-spacing: .15em; }
  .window-content h4 { margin: 12px 0 22px; font-size: 28px; letter-spacing: -.045em; }
  .window-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 9px; }
  .window-grid div { min-height: 82px; padding: 14px; border-radius: 9px; background: #fff; }
  .window-grid b, .window-grid small { display: block; }
  .window-grid b { font-size: 18px; }
  .window-grid small { margin-top: 22px; color: #888; font-size: 8px; }

  .workspace-section { padding: 110px 0 160px !important; background: #050505 !important; }
  .section-heading {
    display: block !important;
    margin-bottom: 70px !important;
    border-bottom: 1px solid #222 !important;
    padding-bottom: 34px !important;
  }
  .section-heading > span { display: block !important; margin-bottom: 18px; color: var(--accent) !important; font-family: var(--mono); font-size: 10px !important; letter-spacing: .35em; }
  .section-heading h2 { margin: 0 !important; color: #fff !important; font-size: clamp(54px, 8vw, 112px) !important; line-height: .9 !important; letter-spacing: -.065em !important; }
  .section-heading p { max-width: 650px; margin: 25px 0 0 !important; color: #777 !important; font-size: 14px !important; line-height: 1.7 !important; }
  .workspace { border: 0 !important; background: transparent !important; }
  .tool-tabs {
    position: sticky !important;
    top: 104px !important;
    z-index: 30 !important;
    width: max-content !important;
    max-width: 100% !important;
    min-height: 56px !important;
    display: flex !important;
    gap: 4px !important;
    margin: 0 auto 18px !important;
    padding: 7px !important;
    overflow-x: auto !important;
    border: 1px solid rgba(255,255,255,.1) !important;
    border-radius: 18px !important;
    background: rgba(17,17,17,.82) !important;
    backdrop-filter: blur(16px) !important;
    box-shadow: 0 18px 60px rgba(0,0,0,.26) !important;
  }
  .tool-tab {
    flex: 0 0 auto !important;
    min-height: 40px !important;
    padding: 0 16px !important;
    border: 0 !important;
    border-radius: 12px !important;
    color: #777 !important;
    background: transparent !important;
    font-size: 10px !important;
    font-weight: 600 !important;
    transition: color .2s ease, background .2s ease, transform .2s ease !important;
  }
  .tool-tab:hover { color: #fff !important; background: #202020 !important; }
  .tool-tab.active { color: #050505 !important; background: var(--accent) !important; }
  .tool-panel {
    min-height: 560px !important;
    padding: clamp(26px, 4vw, 54px) !important;
    border: 1px solid rgba(255,255,255,.085) !important;
    border-radius: 40px !important;
    background: #101010 !important;
    box-shadow: 0 28px 100px rgba(0,0,0,.2) !important;
  }
  .panel-intro { gap: 50px !important; margin-bottom: 42px !important; }
  .panel-code { color: var(--accent) !important; letter-spacing: .22em !important; }
  .panel-intro h3,
  .friends-copy h3 { margin-top: 17px !important; color: #fff !important; font-size: clamp(38px, 5vw, 68px) !important; line-height: .98 !important; letter-spacing: -.058em !important; font-weight: 600 !important; }
  .panel-intro > p,
  .friends-copy > p { color: #777 !important; font-size: 13px !important; line-height: 1.75 !important; }

  .tool-form { gap: 12px !important; }
  .tool-form label { margin-bottom: 10px !important; color: #777 !important; font-family: var(--mono) !important; font-size: 9px !important; letter-spacing: .13em !important; text-transform: uppercase !important; }
  .input-shell,
  .tool-form select,
  .network-controls input {
    min-height: 58px !important;
    border: 1px solid #2c2c2c !important;
    border-radius: 15px !important;
    color: #fff !important;
    background: #0a0a0a !important;
    transition: border-color .2s ease, background .2s ease !important;
  }
  .input-shell:focus-within,
  .tool-form select:focus,
  .network-controls input:focus { border-color: var(--accent) !important; background: #0d0d0d !important; }
  .input-shell input { color: #fff !important; }
  .input-shell input::placeholder { color: #4f4f4f !important; }
  .submit-button {
    min-height: 58px !important;
    padding: 0 22px !important;
    border: 0 !important;
    border-radius: 15px !important;
    color: #050505 !important;
    background: var(--accent) !important;
    font-weight: 750 !important;
    transition: transform .2s ease, filter .2s ease !important;
  }
  .submit-button:hover { transform: translateY(-2px) !important; filter: brightness(1.06) !important; }
  .check-field { border-radius: 15px !important; }

  .tool-state { margin-top: 30px !important; }
  .empty-state,
  .loading-block,
  .error-block,
  .player-result,
  .game-result,
  .compare-result,
  .network-result,
  .permission-card,
  .companion-download-card,
  .install-card,
  .boundary-card {
    border-color: rgba(255,255,255,.09) !important;
    border-radius: 24px !important;
    background: #0b0b0b !important;
  }
  .empty-state,
  .loading-block,
  .error-block { padding: 26px !important; }
  .metric-grid > div,
  .diagnostic-list,
  .quick-actions,
  .server-card,
  .compare-profile,
  .mutual-card,
  .network-summary,
  .network-card,
  .saved-item {
    border-color: rgba(255,255,255,.08) !important;
    background: #111 !important;
  }
  .server-card,
  .network-card,
  .mutual-card { border-radius: 16px !important; }
  .button,
  .server-actions a,
  .server-actions button,
  .quick-actions button,
  .quick-actions a,
  .network-card-actions button,
  .network-card-actions a,
  .quiet-button,
  .view-source { border-radius: 10px !important; }
  .button.primary,
  .server-actions a,
  .download-firefox { color: #050505 !important; background: var(--accent) !important; }
  .player-identity img,
  .game-summary > img,
  .compare-avatar,
  .mutual-avatar,
  .network-summary-avatar,
  .network-card-avatar,
  .saved-item img { border-radius: 12px !important; }

  .friends-hero { gap: 22px !important; }
  .friends-product { gap: 22px !important; }
  .companion-download-card { padding: 28px !important; }
  .companion-logo { border-radius: 14px !important; }
  .trust-row span,
  .version-pill { border-radius: 999px !important; }
  .friends-lower { gap: 18px !important; }
  .network-notice { border-radius: 0 12px 12px 0 !important; }
  .network-history button { border-radius: 999px !important; }
  .relationship-banner { border-radius: 0 !important; }

  .privacy-section {
    position: relative;
    padding: 180px 0 190px !important;
    overflow: hidden;
    border-top: 1px solid #171717;
    color: #fff !important;
    background: #050505 !important;
  }
  .privacy-section::before {
    content: "";
    position: absolute;
    right: -10vw;
    top: 8%;
    width: 42vw;
    height: 42vw;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(255,107,80,.13), transparent 67%);
  }
  .privacy-grid { gap: 100px !important; }
  .section-code { color: var(--accent) !important; letter-spacing: .3em !important; }
  .privacy-section h2 {
    max-width: 850px !important;
    margin-top: 28px !important;
    color: #fff !important;
    font-size: clamp(52px, 7.8vw, 112px) !important;
    line-height: .9 !important;
    letter-spacing: -.07em !important;
  }
  .privacy-copy p { color: #777 !important; font-size: 15px !important; }
  .privacy-copy ul { border-color: #222 !important; }
  .privacy-copy li { border-color: #222 !important; color: #b6b6b6 !important; }

  footer.reference-footer {
    position: relative;
    padding: 170px 0 46px !important;
    overflow: hidden;
    border-top: 1px solid #191919 !important;
    background: #050505;
  }
  .footer-kicker { color: var(--accent); font-family: var(--mono); font-size: 10px; letter-spacing: .35em; }
  .footer-display {
    margin: 36px 0 70px;
    color: #fff;
    font-size: clamp(82px, 13vw, 182px);
    line-height: .78;
    letter-spacing: -.075em;
    font-weight: 800;
  }
  .footer-display span { color: #383838; }
  .footer-links { display: flex; flex-wrap: wrap; align-items: center; gap: 12px; }
  .footer-links a {
    min-height: 52px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0 20px;
    border: 1px solid #2e2e2e;
    border-radius: 999px;
    color: #aaa;
    font-size: 11px;
    transition: color .2s ease, background .2s ease, border-color .2s ease, transform .2s ease;
  }
  .footer-links a:first-child { border-color: var(--accent); color: #050505; background: var(--accent); }
  .footer-links a:hover { color: #050505; border-color: #fff; background: #fff; transform: translateY(-2px); }
  .footer-meta {
    display: flex;
    justify-content: space-between;
    gap: 30px;
    margin-top: 110px;
    padding-top: 28px;
    border-top: 1px solid #161616;
    color: #444;
    font-family: var(--mono);
    font-size: 9px;
    letter-spacing: .11em;
    text-transform: uppercase;
  }

  .floating-tool-nav {
    position: fixed;
    left: 50%;
    bottom: 26px;
    z-index: 110;
    display: flex;
    align-items: center;
    gap: 3px;
    padding: 7px;
    transform: translateX(-50%);
    border: 1px solid rgba(255,255,255,.1);
    border-radius: 18px;
    background: rgba(17,17,17,.84);
    backdrop-filter: blur(18px);
    box-shadow: 0 24px 80px rgba(0,0,0,.5);
  }
  .floating-tool-nav button {
    min-height: 39px;
    padding: 0 13px;
    border: 0;
    border-radius: 11px;
    color: #777;
    background: transparent;
    font-size: 9px;
    font-weight: 650;
    cursor: pointer;
    transition: color .2s ease, background .2s ease;
  }
  .floating-tool-nav button:hover { color: #fff; background: #222; }
  .floating-tool-nav button.active { color: #050505; background: var(--accent); }

  .editorial-reveal { opacity: 0; transform: translateY(28px); transition: opacity .8s cubic-bezier(.22,1,.36,1), transform .8s cubic-bezier(.22,1,.36,1); }
  .editorial-reveal.visible { opacity: 1; transform: translateY(0); }

  @keyframes midnightPulse { 0%,100% { opacity: .45; transform: scale(.85); } 50% { opacity: 1; transform: scale(1.15); } }

  @media (max-width: 980px) {
    .header-nav a:not(.nav-cta) { display: none; }
    .hero-title { font-size: clamp(76px, 15vw, 145px); }
    .benefit-grid { grid-template-columns: 1fr; }
    .benefit-card { min-height: 480px; }
    .privacy-grid { grid-template-columns: 1fr !important; }
    .floating-tool-nav { display: none; }
  }

  @media (max-width: 680px) {
    .shell { width: min(100% - 30px, 1320px) !important; }
    .header-inner { min-height: 76px !important; padding: 0 15px !important; }
    .header-nav .nav-cta { min-height: 38px; padding: 0 13px; }
    .hero { min-height: 92svh !important; padding: 104px 15px 70px !important; }
    .hero-title { font-size: clamp(62px, 18.5vw, 112px); white-space: normal; }
    .hero-kicker { margin-bottom: 22px; font-size: 8px; letter-spacing: .22em; }
    .hero-description { margin-top: 28px; font-size: 13px; }
    .hero-bottom-left { left: 15px; bottom: 24px; }
    .hero-bottom-right { right: 15px; bottom: 27px; }
    .hero-bottom-left p { display: none; }
    .editorial-benefits { padding: 100px 0 84px; }
    .editorial-benefits > h2 { margin-bottom: 54px; }
    .benefit-card { min-height: 390px; padding: 28px; border-radius: 28px; }
    .benefit-card h3 { font-size: 48px; }
    .window-body { min-height: 245px; grid-template-columns: 86px 1fr; }
    .window-content { padding: 17px; }
    .window-content h4 { font-size: 22px; }
    .workspace-section { padding: 70px 0 100px !important; }
    .section-heading { margin-bottom: 42px !important; }
    .tool-tabs { position: relative !important; top: auto !important; width: 100% !important; justify-content: flex-start !important; margin-bottom: 12px !important; border-radius: 14px !important; }
    .tool-panel { min-height: auto !important; padding: 24px 18px !important; border-radius: 26px !important; }
    .panel-intro { gap: 18px !important; margin-bottom: 30px !important; }
    .privacy-section { padding: 105px 0 115px !important; }
    footer.reference-footer { padding-top: 110px !important; }
    .footer-display { margin-bottom: 48px; }
    .footer-meta { flex-direction: column; margin-top: 70px; }
  }

  @media (prefers-reduced-motion: reduce) {
    .editorial-reveal { opacity: 1; transform: none; transition: none; }
    .benefit-card-coral:hover .editorial-window,
    .header-nav .nav-cta:hover,
    .footer-links a:hover { transform: none; }
  }
`;
document.head.append(midnightStyle);

document.body.classList.add('midnight-reference');
const theme = document.querySelector('meta[name="theme-color"]');
if (theme) theme.setAttribute('content', '#050505');

const header = document.querySelector('.header-inner');
if (header) {
  header.innerHTML = `
    <a class="brand" href="/" aria-label="RoJoiner home">
      <span class="brand-mark" aria-hidden="true"><svg viewBox="0 0 32 32"><path d="M6 7h10.5c5.6 0 9 2.8 9 7.4 0 3.5-2 6-5.6 7l6.1 4.6h-6.8l-5.4-4.2H12V26H6V7Zm6 5v5h4.2c2.1 0 3.2-.9 3.2-2.5 0-1.7-1.1-2.5-3.2-2.5H12Z"/><circle cx="25" cy="7" r="3"/></svg></span>
      <span>RoJoiner</span>
    </a>
    <nav class="header-nav" aria-label="Primary navigation">
      <a href="#toolkit">Toolkit</a>
      <a href="#privacy">Privacy</a>
      <a href="https://github.com/xtofuub/RoJoiner" target="_blank" rel="noreferrer">Source ↗</a>
      <a class="nav-cta" href="#toolkit">Open tools</a>
    </nav>`;
}

const hero = document.querySelector('.hero');
if (hero) {
  hero.innerHTML = `
    <div class="hero-center editorial-reveal">
      <p class="hero-kicker"><i></i> Roblox public joining toolkit</p>
      <h1 class="hero-title"><span>/</span>rojoiner</h1>
      <p class="hero-description"><strong>Browse public servers, compare accounts, explore public friend networks, and join visible friends</strong> from one transparent open-source interface.</p>
    </div>
    <div class="hero-bottom-left">
      <div class="hero-product-stack" aria-hidden="true"><span>P</span><span>S</span><span>F</span><span>R</span></div>
      <p>Public by design.<br />Local where it matters.</p>
    </div>
    <div class="hero-bottom-right"><a href="#toolkit">Open toolkit <span>↓</span></a></div>`;
}

const workspaceSection = document.querySelector('.workspace-section');
if (workspaceSection && !document.querySelector('.editorial-benefits')) {
  const benefits = document.createElement('section');
  benefits.className = 'editorial-benefits shell';
  benefits.innerHTML = `
    <div class="benefits-kicker editorial-reveal"><i></i> Why jump through five different Roblox pages?</div>
    <h2 class="editorial-reveal">A focused toolkit that helps you <span>browse faster</span>, understand public connections, and launch Roblox with less friction.</h2>
    <div class="benefit-grid">
      <article class="benefit-card benefit-card-dark editorial-reveal">
        <span class="benefit-tag">Public server tools</span>
        <h3>Browse faster.<span>Join sooner.</span></h3>
      </article>
      <article class="benefit-card benefit-card-coral editorial-reveal" aria-label="RoJoiner toolkit preview">
        <div class="editorial-window">
          <div class="window-top"><i></i><i></i><i></i><span class="window-url"></span></div>
          <div class="window-body">
            <div class="window-side"><strong>R.</strong><span></span><span></span><span></span><span></span></div>
            <div class="window-content"><span>ROJOINER / TOOLKIT</span><h4>Public tools. Clear limits.</h4><div class="window-grid"><div><b>Players</b><small>Presence & joins</small></div><div><b>Servers</b><small>Browse & hop</small></div><div><b>Network</b><small>Public friends</small></div><div><b>Firefox</b><small>Local companion</small></div></div></div>
          </div>
        </div>
      </article>
    </div>`;
  workspaceSection.before(benefits);
}

const sectionHeading = document.querySelector('.section-heading');
if (sectionHeading) {
  sectionHeading.innerHTML = `<span>01 / TOOLKIT</span><div><h2>Pick a tool.</h2><p>Search public Roblox data, browse live server listings, compare profiles, explore public friend lists, or use the local Firefox companion for your own visible friends.</p></div>`;
  sectionHeading.classList.add('editorial-reveal');
}

const privacyHeading = document.querySelector('.privacy-grid > div:first-child');
if (privacyHeading) {
  privacyHeading.innerHTML = `<span class="section-code">02 / BOUNDARY</span><h2>Useful without pretending privacy does not exist.</h2>`;
  privacyHeading.classList.add('editorial-reveal');
}
const privacyCopy = document.querySelector('.privacy-copy');
privacyCopy?.classList.add('editorial-reveal');

const footer = document.querySelector('footer');
if (footer) {
  footer.className = 'reference-footer';
  footer.innerHTML = `
    <div class="shell">
      <span class="footer-kicker">ROJOINER / OPEN SOURCE</span>
      <h2 class="footer-display editorial-reveal">JOIN<br /><span>SMARTER.</span></h2>
      <div class="footer-links editorial-reveal">
        <a href="#toolkit">Open toolkit</a>
        <a href="/downloads/rojoiner-companion-firefox-0.2.0.zip" download>Firefox companion ↓</a>
        <a href="https://github.com/xtofuub/RoJoiner" target="_blank" rel="noreferrer">GitHub ↗</a>
      </div>
      <div class="footer-meta"><span>© 2026 RoJoiner</span><span>Not affiliated with Roblox Corporation</span><span>Public data / local companion</span></div>
    </div>`;
}

function activateTool(name) {
  const tab = document.querySelector(`.tool-tab[data-tab="${name}"]`);
  if (!tab) return;
  tab.click();
  document.querySelector('#toolkit')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

const tools = [
  ['players', 'Players'],
  ['servers', 'Servers'],
  ['compare', 'Compare'],
  ['network', 'Network'],
  ['library', 'Library'],
  ['friends', 'Firefox'],
];
const floating = document.createElement('div');
floating.className = 'floating-tool-nav';
floating.setAttribute('aria-label', 'Quick tool navigation');
floating.innerHTML = tools.map(([name, label]) => `<button type="button" data-floating-tool="${name}">${label}</button>`).join('');
document.body.append(floating);
floating.querySelectorAll('[data-floating-tool]').forEach((button) => button.addEventListener('click', () => activateTool(button.dataset.floatingTool)));

function syncFloatingNav() {
  const active = document.querySelector('.tool-tab.active')?.dataset.tab || 'players';
  floating.querySelectorAll('[data-floating-tool]').forEach((button) => button.classList.toggle('active', button.dataset.floatingTool === active));
}
const tabObserver = new MutationObserver(syncFloatingNav);
document.querySelectorAll('.tool-tab').forEach((tab) => tabObserver.observe(tab, { attributes: true, attributeFilter: ['class'] }));
syncFloatingNav();

const siteHeader = document.querySelector('.site-header');
function syncHeader() { siteHeader?.classList.toggle('scrolled', window.scrollY > 24); }
window.addEventListener('scroll', syncHeader, { passive: true });
syncHeader();

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    entry.target.classList.add('visible');
    revealObserver.unobserve(entry.target);
  });
}, { threshold: .12, rootMargin: '0px 0px -40px' });
document.querySelectorAll('.editorial-reveal').forEach((node) => revealObserver.observe(node));
