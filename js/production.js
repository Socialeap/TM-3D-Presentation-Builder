function buildProductionHtml(config) {
    const serializedConfig = escapeForScript(config);
    const safeTitle = config.pageTitle.replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const hudRgb = hexToRgbChannels(config.hudBgColor || "#08111d");
    const hudSurface = `rgba(${hudRgb.r}, ${hudRgb.g}, ${hudRgb.b}, 0.76)`;
    const hudSurfaceSoft = `rgba(${hudRgb.r}, ${hudRgb.g}, ${hudRgb.b}, 0.54)`;
    const faviconMarkup = config.faviconDataUrl
        ? `<link rel="icon" href="${config.faviconDataUrl}">`
        : "";
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${safeTitle}</title>
    ${faviconMarkup}
    <meta name="build-version" content="${config.buildInfo ? "v" + config.buildInfo.version : ""}">
    <meta name="build-date" content="${config.buildInfo ? config.buildInfo.exportedAtIso : ""}">
    <style>
:root {
    --accent: #0f6fff;
    --bg: #08111d;
    --surface: ${hudSurface};
    --surface-soft: ${hudSurfaceSoft};
    --surface-strong: rgba(10, 17, 28, 0.92);
    --line: rgba(255, 255, 255, 0.14);
    --text: #ffffff;
    --muted: rgba(255, 255, 255, 0.72);
    --shadow: 0 20px 50px rgba(0, 0, 0, 0.36);
    --radius-lg: 20px;
    --radius-md: 14px;
    --radius-sm: 8px;
}

* { box-sizing: border-box; }

html, body {
    margin: 0;
    width: 100%;
    height: 100%;
    overflow: hidden;
    background: var(--bg);
    font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    color: var(--text);
}

body {
    position: relative;
}

iframe {
    width: 100%;
    height: 100%;
    border: 0;
    background: #000;
    transition: opacity 0.28s ease;
}

.tour-shell {
    position: fixed;
    inset: 0;
}

.tour-shell.is-loading iframe {
    opacity: 0.55;
}

.scrim {
    position: fixed;
    inset: 0;
    pointer-events: none;
    background:
        radial-gradient(circle at top left, rgba(0, 0, 0, 0.42), transparent 28%),
        linear-gradient(180deg, rgba(0, 0, 0, 0.36), transparent 22%),
        linear-gradient(0deg, rgba(0, 0, 0, 0.44), transparent 20%);
    z-index: 5;
}

.hud {
    position: fixed;
    inset: 0;
    z-index: 10;
    padding: 18px;
    pointer-events: none;
}

.interactive {
    pointer-events: auto;
}

.hud-header {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 11;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    padding: 8px 18px;
    background: var(--surface);
    border-bottom: 1px solid var(--line);
    backdrop-filter: blur(18px);
    transition: background 0.3s ease, border-color 0.3s ease, padding 0.3s ease;
}

.hud-header.is-hidden {
    background: transparent;
    border-bottom-color: transparent;
    backdrop-filter: none;
    box-shadow: none;
}

.hud-header > *:not(.header-controls):not(.mobile-menu-toggle),
.header-controls > *:not(.hud-toggle) {
    transition: opacity 0.3s ease, transform 0.3s ease;
}

.hud-header.is-hidden > *:not(.header-controls):not(.mobile-menu-toggle),
.hud-header.is-hidden .header-controls > *:not(.hud-toggle) {
    opacity: 0;
    transform: translateY(-20px);
    pointer-events: none;
}

.hud-toggle {
    pointer-events: auto;
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 8px 16px;
    border-radius: 999px;
    color: var(--text);
    background: rgba(255, 255, 255, 0.08);
    border: 1px solid rgba(255, 255, 255, 0.14);
    font-weight: 600;
    font-size: 0.84rem;
    cursor: pointer;
    transition: all 0.2s ease;
    white-space: nowrap;
}

.hud-toggle:hover {
    background: rgba(255, 255, 255, 0.1);
}

.header-brand {
    display: flex;
    align-items: center;
    gap: 12px;
    min-width: 0;
}

.header-brand img {
    max-width: 120px;
    max-height: 32px;
    object-fit: contain;
    display: block;
    flex-shrink: 0;
}

.brand-name {
    font-size: 0.96rem;
    font-weight: 700;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.header-property {
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
    flex: 1;
    overflow: hidden;
    white-space: nowrap;
}

.property-eyebrow {
    display: flex;
    align-items: center;
    margin: 0;
    gap: 8px;
}

.eyebrow-label {
    color: var(--muted);
    font-size: 0.8rem;
    letter-spacing: 0.08em;
    text-transform: uppercase;
}

.property-title {
    margin: 0;
    font-size: 1rem;
    font-weight: 600;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.property-location {
    margin: 0;
    color: var(--muted);
    font-size: 0.9rem;
}

.property-location::before {
    content: "\\u2022";
    margin-right: 8px;
    opacity: 0.5;
}

.header-controls {
    display: flex;
    gap: 10px;
    align-items: center;
    justify-content: flex-end;
    min-width: 0;
    white-space: nowrap;
}

select,
input,
textarea,
button,
a {
    font: inherit;
}

select,
input[type="text"],
input[type="email"],
input[type="tel"],
textarea {
    width: 100%;
    border: 1px solid rgba(255, 255, 255, 0.14);
    border-radius: var(--radius-sm);
    background: rgba(255, 255, 255, 0.08);
    color: var(--text);
    padding: 12px 14px;
}

textarea {
    min-height: 118px;
    resize: vertical;
}

select:focus,
input:focus,
textarea:focus {
    outline: none;
    border-color: var(--accent);
    box-shadow: 0 0 0 4px color-mix(in srgb, var(--accent) 18%, transparent);
}

option {
    color: #0f172a;
}

.picker-wrap {
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
}

.picker-wrap label {
    font-size: 0.72rem;
    color: var(--muted);
    letter-spacing: 0.06em;
    text-transform: uppercase;
    white-space: nowrap;
}

.picker-wrap select {
    padding: 8px 12px;
    font-size: 0.84rem;
    border-radius: 999px;
    min-width: 120px;
}

.cta-button,
.ghost-button,
.drawer-button,
.quick-action {
    appearance: none;
    border: 0;
    text-decoration: none;
    cursor: pointer;
    transition: transform 0.14s ease, opacity 0.2s ease, background 0.2s ease, border-color 0.2s ease;
}

.cta-button:hover,
.ghost-button:hover,
.drawer-button:hover,
.quick-action:hover {
    transform: translateY(-1px);
}

.cta-button,
.ghost-button {
    border-radius: 999px;
}

.drawer-button,
.quick-action {
    border-radius: var(--radius-sm);
}

.cta-button {
    background: var(--accent);
    color: #fff;
    padding: 8px 16px;
    font-weight: 700;
    font-size: 0.84rem;
    box-shadow: 0 8px 20px color-mix(in srgb, var(--accent) 24%, transparent);
}

.ghost-button {
    background: rgba(255, 255, 255, 0.08);
    color: var(--text);
    padding: 8px 16px;
    font-weight: 600;
    font-size: 0.84rem;
    border: 1px solid rgba(255, 255, 255, 0.14);
}

.status-pill {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    padding: 0;
    color: var(--muted);
    font-size: 0.92rem;
}

.audio-box {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    min-width: 0;
    background: rgba(255, 255, 255, 0.08);
    border: 1px solid rgba(255, 255, 255, 0.14);
    padding: 6px 14px;
    border-radius: 999px;
}

.audio-box input[type="range"] {
    width: 112px;
    accent-color: var(--accent);
}

.mobile-menu-toggle {
    display: none;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    border-radius: var(--radius-sm);
    background: rgba(255, 255, 255, 0.08);
    border: 1px solid rgba(255, 255, 255, 0.14);
    color: var(--text);
    cursor: pointer;
    transition: background 0.15s ease;
    pointer-events: auto;
    flex-shrink: 0;
}

.mobile-menu-toggle:hover {
    background: rgba(255, 255, 255, 0.14);
}

.drawer {
    position: fixed;
    top: 0;
    right: 0;
    width: min(440px, 100vw);
    height: 100%;
    z-index: 30;
    background: var(--surface-strong);
    backdrop-filter: blur(18px);
    border-left: 1px solid var(--line);
    box-shadow: -24px 0 60px rgba(0, 0, 0, 0.42);
    transform: translateX(102%);
    transition: transform 0.28s ease;
    display: flex;
    flex-direction: column;
}

.drawer.open {
    transform: translateX(0);
}

.drawer-header,
.drawer-content,
.drawer-footer {
    padding: 22px 24px;
}

.drawer-header {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    align-items: flex-start;
    border-bottom: 1px solid var(--line);
}

.drawer-header h2 {
    margin: 0 0 4px;
    font-size: 1.55rem;
    font-weight: 750;
    letter-spacing: -0.01em;
}

.drawer-subtitle {
    margin: 0;
    color: var(--muted);
    font-size: 0.92rem;
    line-height: 1.55;
}

.drawer-content {
    flex: 1;
    overflow: auto;
    display: grid;
    gap: 18px;
}

.drawer-copy {
    margin: 0;
    color: rgba(255, 255, 255, 0.88);
    line-height: 1.7;
}

.welcome-note {
    display: grid;
    gap: 8px;
    padding: 16px;
    border-radius: 16px;
    background: linear-gradient(180deg, rgba(255, 138, 61, 0.12), rgba(255, 255, 255, 0.04));
    border: 1px solid color-mix(in srgb, var(--accent) 24%, rgba(255, 255, 255, 0.08));
}

.welcome-kicker,
.quick-contact-label {
    color: var(--accent);
    font-size: 0.75rem;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
}

.quick-contact-block {
    display: grid;
    gap: 10px;
}

.quick-actions {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 10px;
}

.quick-action {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    min-height: 50px;
    padding: 12px 10px;
    background: rgba(255, 255, 255, 0.04);
    color: #fff;
    border: 1px solid rgba(255, 255, 255, 0.1);
    font-weight: 650;
    font-size: 0.92rem;
}

.quick-action svg {
    width: 17px;
    height: 17px;
    flex-shrink: 0;
}

.quick-action.is-disabled,
.drawer-button.is-disabled {
    opacity: 0.42;
    pointer-events: none;
}

.drawer-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
}

.floating-field {
    position: relative;
}

.floating-field input,
.floating-field textarea {
    padding: 20px 14px 10px;
    background: rgba(255, 255, 255, 0.05);
    border-color: rgba(255, 255, 255, 0.12);
    border-radius: var(--radius-sm);
}

.floating-field input[readonly] {
    background: rgba(255, 255, 255, 0.03);
    color: rgba(255, 255, 255, 0.9);
}

.floating-field textarea {
    min-height: 136px;
}

.floating-field label {
    position: absolute;
    left: 12px;
    top: 14px;
    padding: 0 4px;
    color: rgba(255, 255, 255, 0.62);
    background: color-mix(in srgb, var(--surface-strong) 96%, transparent);
    border-radius: 999px;
    pointer-events: none;
    transform-origin: left center;
    transition: transform 0.18s ease, color 0.18s ease, top 0.18s ease;
}

.floating-field input:focus + label,
.floating-field input:not(:placeholder-shown) + label,
.floating-field textarea:focus + label,
.floating-field textarea:not(:placeholder-shown) + label {
    top: -8px;
    transform: scale(0.84);
    color: var(--accent);
}

.drawer-button {
    background: var(--accent);
    color: #fff;
    width: 100%;
    min-height: 50px;
    padding: 14px 18px;
    font-weight: 700;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 16px 34px color-mix(in srgb, var(--accent) 24%, transparent);
}

.drawer-footer {
    border-top: 1px solid var(--line);
    display: grid;
    gap: 10px;
    background: rgba(255, 255, 255, 0.02);
}

.email-providers {
    display: grid;
    gap: 8px;
}

.email-providers.hidden {
    display: none;
}

.provider-label {
    font-size: 0.78rem;
    color: var(--muted);
    letter-spacing: 0.06em;
    text-transform: uppercase;
}

.provider-row {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
}

.provider-btn {
    flex: 1;
    min-width: 70px;
    padding: 10px 8px;
    border-radius: var(--radius-sm);
    background: rgba(255, 255, 255, 0.06);
    border: 1px solid rgba(255, 255, 255, 0.12);
    color: var(--text);
    font-size: 0.82rem;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.15s ease, border-color 0.15s ease;
    text-align: center;
}

.provider-btn:hover {
    background: rgba(255, 255, 255, 0.12);
    border-color: var(--accent);
}

.drawer-disclaimer {
    margin: 0;
    color: rgba(255, 255, 255, 0.54);
    font-size: 0.76rem;
    line-height: 1.5;
    font-style: italic;
}

.build-stamp {
    margin: 0;
    color: var(--muted);
    font-size: 0.86rem;
    line-height: 1.45;
    text-align: left;
}

.gatekeeper {
    position: fixed;
    inset: 0;
    z-index: 40;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 22px;
    background:
        linear-gradient(180deg, rgba(5, 9, 15, 0.86), rgba(5, 9, 15, 0.94)),
        radial-gradient(circle at top right, rgba(255, 255, 255, 0.08), transparent 24%);
}

.gate-card {
    width: min(560px, 100%);
    text-align: center;
    padding: 36px 28px;
    border-radius: 28px;
    background: rgba(11, 19, 32, 0.86);
    border: 1px solid var(--line);
    box-shadow: 0 34px 80px rgba(0, 0, 0, 0.42);
    backdrop-filter: blur(18px);
}

.gate-logo {
    margin: 0 auto 18px;
    min-height: 48px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.gate-logo img {
    max-width: min(240px, 100%);
    max-height: 72px;
    object-fit: contain;
}

.gate-card h1 {
    margin: 0 0 10px;
    font-size: clamp(1.7rem, 4vw, 2.4rem);
}

.gate-card p {
    margin: 0 0 24px;
    color: var(--muted);
    line-height: 1.65;
}

.gate-actions {
    display: inline-flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 12px;
}

.gate-status {
    margin-top: 14px;
    color: var(--muted);
    font-size: 0.92rem;
    min-height: 1.4em;
}

.loading-tag {
    opacity: 0;
    transition: opacity 0.2s ease;
}

.tour-shell.is-loading .loading-tag {
    opacity: 1;
}

.sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    border: 0;
}

/* --- Tablet breakpoint --- */
@media (max-width: 900px) {
    .hud-header {
        flex-wrap: wrap;
        padding: 10px 16px;
    }

    .header-brand img {
        max-width: 100px;
        max-height: 28px;
    }

    .brand-name {
        font-size: 0.88rem;
    }

    .property-title {
        font-size: 0.92rem;
    }

    .header-controls {
        gap: 8px;
    }

    .picker-wrap label {
        display: none;
    }

    .header-controls,
    .picker-wrap {
        min-width: 0;
    }
}

/* --- Mobile breakpoint --- */
@media (max-width: 640px) {
    .hud-header {
        flex-wrap: wrap;
        padding: 10px 14px;
        gap: 6px;
    }

    .header-brand {
        order: 1;
        flex: 1;
        gap: 8px;
    }

    .header-brand img {
        max-width: 80px;
        max-height: 24px;
    }

    .brand-name {
        font-size: 0.82rem;
    }

    .mobile-menu-toggle {
        order: 2;
        display: flex;
    }

    .header-property {
        order: 3;
        width: 100%;
        flex: unset;
        gap: 5px;
        font-size: 0.85rem;
    }

    .eyebrow-label {
        font-size: 0.65rem;
    }

    .property-title {
        font-size: 0.85rem;
    }

    .property-location {
        font-size: 0.75rem;
    }

    .header-controls {
        order: 4;
        width: 100%;
        display: none;
        flex-direction: column;
        gap: 8px;
        padding-top: 10px;
        border-top: 1px solid var(--line);
    }

    .header-controls.mobile-open {
        display: flex;
    }

    .picker-wrap {
        width: 100%;
        flex-direction: column;
        gap: 4px;
    }

    .picker-wrap label {
        display: block;
        font-size: 0.7rem;
    }

    .picker-wrap select {
        width: 100%;
    }

    .cta-button,
    .ghost-button {
        min-height: 44px;
        font-size: 0.88rem;
    }

    .audio-box {
        width: 100%;
        justify-content: space-between;
    }

    .audio-box input[type="range"] {
        flex: 1;
        width: auto;
        min-width: 80px;
    }

    .hud-toggle {
        width: 100%;
        justify-content: center;
        min-height: 44px;
    }

    .hud {
        padding: 12px;
    }

    .drawer {
        width: 100vw;
    }

    .drawer-grid {
        grid-template-columns: 1fr;
    }

    .gate-card {
        padding: 28px 20px;
    }
}
    </style>
</head>
<body>
    <div class="tour-shell" id="tour-shell">
<iframe
    id="tour-frame"
    title="Matterport tour"
    allow="fullscreen; xr-spatial-tracking; gyroscope; accelerometer"
    referrerpolicy="strict-origin-when-cross-origin"></iframe>
    </div>
    <div class="scrim" aria-hidden="true"></div>

    <div class="hud">
<header class="hud-header interactive" id="hud-header">
    <div class="header-brand" id="brand-lockup">
        <img id="hud-logo" alt="Brand logo">
        <div class="brand-name" id="hud-brand-name"></div>
    </div>

    <div class="header-property">
        <div class="property-eyebrow">
            <span class="eyebrow-label">Now Touring:</span>
            <span class="status-pill loading-tag" id="loading-tag">Loading next property...</span>
        </div>
        <span class="property-title" id="property-title"></span>
        <span class="property-location" id="property-location"></span>
    </div>

    <div class="header-controls">
        <div class="picker-wrap">
            <label for="property-select">Property Collection:</label>
            <select id="property-select" aria-label="Switch property"></select>
        </div>
        <button type="button" class="cta-button" id="contact-toggle">Contact Agent</button>
        <div class="audio-box" id="audio-box">
            <button type="button" class="ghost-button" id="mute-toggle" aria-pressed="false">Mute</button>
            <label class="sr-only" for="volume-range">Music volume</label>
            <input type="range" id="volume-range" min="0" max="1" step="0.05" value="0.35">
        </div>
        <button type="button" class="ghost-button hud-toggle interactive" id="hud-toggle" aria-expanded="true">Hide HUD</button>
    </div>

    <button type="button" class="mobile-menu-toggle interactive" id="mobile-menu" aria-label="Menu" aria-expanded="false">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="3" y1="5" x2="17" y2="5"/><line x1="3" y1="10" x2="17" y2="10"/><line x1="3" y1="15" x2="17" y2="15"/></svg>
    </button>
</header>
    </div>

    <aside class="drawer" id="contact-drawer" aria-hidden="true">
<div class="drawer-header">
    <div>
        <h2>Get In Touch</h2>
        <p class="drawer-subtitle" id="drawer-subtitle"></p>
    </div>
    <button type="button" class="ghost-button" id="close-drawer" aria-label="Close contact drawer">Close</button>
</div>
<div class="drawer-content">
    <div class="welcome-note">
        <span class="welcome-kicker">Welcome Note</span>
        <p class="drawer-copy" id="contact-note"></p>
    </div>

    <div class="quick-contact-block">
        <span class="quick-contact-label">Quick Contact</span>
        <div class="quick-actions">
            <a id="call-link" class="quick-action" href="#">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.86 19.86 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.86 19.86 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.12.9.33 1.78.62 2.62a2 2 0 0 1-.45 2.11L8 9.91a16 16 0 0 0 6.09 6.09l1.46-1.28a2 2 0 0 1 2.11-.45c.84.29 1.72.5 2.62.62A2 2 0 0 1 22 16.92z"></path>
                </svg>
                <span>Call</span>
            </a>
            <a id="sms-link" class="quick-action" href="#">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                </svg>
                <span>Text</span>
            </a>
            <button type="button" id="email-link" class="quick-action">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <rect x="3" y="5" width="18" height="14" rx="2"></rect>
                    <path d="m4 7 8 6 8-6"></path>
                </svg>
                <span>Email</span>
            </button>
        </div>
    </div>

    <div class="drawer-grid">
        <div class="floating-field">
            <input type="text" id="lead-name" placeholder=" " autocomplete="name">
            <label for="lead-name">Your Name</label>
        </div>
        <div class="floating-field">
            <input type="email" id="lead-email" placeholder=" " autocomplete="email">
            <label for="lead-email">Your Email</label>
        </div>
    </div>

    <div class="drawer-grid">
        <div class="floating-field">
            <input type="tel" id="lead-phone" placeholder=" " autocomplete="tel">
            <label for="lead-phone">Your Phone</label>
        </div>
        <div class="floating-field">
            <input type="text" id="lead-property" placeholder=" " readonly>
            <label for="lead-property">Selected Property</label>
        </div>
    </div>

    <div class="floating-field">
        <textarea id="lead-message" placeholder=" "></textarea>
        <label for="lead-message">Message</label>
    </div>
</div>
<div class="drawer-footer">
    <p class="drawer-disclaimer">This form uses the visitor's mail client. No data is stored on a server.</p>
    <button type="button" class="drawer-button" id="send-email">Open Email Draft</button>
    <div class="email-providers hidden" id="email-providers">
        <span class="provider-label">Choose your email service:</span>
        <div class="provider-row">
            <button type="button" class="provider-btn" data-provider="gmail">Gmail</button>
            <button type="button" class="provider-btn" data-provider="outlook">Outlook</button>
            <button type="button" class="provider-btn" data-provider="yahoo">Yahoo</button>
            <button type="button" class="provider-btn" data-provider="mailto">Mail App</button>
            <button type="button" class="provider-btn" data-provider="copy">Copy</button>
        </div>
    </div>
    <p class="build-stamp" id="build-stamp"></p>
</div>
    </aside>

    <div class="gatekeeper" id="gatekeeper">
<div class="gate-card">
    <div class="gate-logo" id="gate-logo-wrap">
        <img id="gate-logo" alt="Brand logo">
    </div>
    <h1 id="gate-title"></h1>
    <p id="gate-description"></p>
    <div class="gate-actions">
        <button type="button" class="cta-button" id="enter-tour"></button>
        <button type="button" class="ghost-button" id="enter-muted">Enter Muted</button>
    </div>
    <div class="gate-status" id="gate-status"></div>
</div>
    </div>

    <audio id="ambient-audio" loop preload="auto"></audio>

    <script>
const CONFIG = ${serializedConfig};

const state = {
    activeIndex: 0,
    started: false,
    audioMuted: false,
    audioEnabled: false,
    audioSource: "",
    frameReady: false,
    headerVisible: true,
    headerAutoCollapsed: false,
    headerHideTimer: 0,
};

const el = {
    tourShell: document.getElementById("tour-shell"),
    frame: document.getElementById("tour-frame"),
    hudHeader: document.getElementById("hud-header"),
    hudToggle: document.getElementById("hud-toggle"),
    brandLockup: document.getElementById("brand-lockup"),
    hudLogo: document.getElementById("hud-logo"),
    hudBrandName: document.getElementById("hud-brand-name"),
    propertyTitle: document.getElementById("property-title"),
    propertyLocation: document.getElementById("property-location"),
    propertySelect: document.getElementById("property-select"),
    contactToggle: document.getElementById("contact-toggle"),
    audioBox: document.getElementById("audio-box"),
    muteToggle: document.getElementById("mute-toggle"),
    volumeRange: document.getElementById("volume-range"),
    mobileMenu: document.getElementById("mobile-menu"),
    drawer: document.getElementById("contact-drawer"),
    closeDrawer: document.getElementById("close-drawer"),
    drawerSubtitle: document.getElementById("drawer-subtitle"),
    contactNote: document.getElementById("contact-note"),
    callLink: document.getElementById("call-link"),
    smsLink: document.getElementById("sms-link"),
    emailLink: document.getElementById("email-link"),
    leadName: document.getElementById("lead-name"),
    leadEmail: document.getElementById("lead-email"),
    leadPhone: document.getElementById("lead-phone"),
    leadProperty: document.getElementById("lead-property"),
    leadMessage: document.getElementById("lead-message"),
    sendEmail: document.getElementById("send-email"),
    emailProviders: document.getElementById("email-providers"),
    buildStamp: document.getElementById("build-stamp"),
    gatekeeper: document.getElementById("gatekeeper"),
    gateLogoWrap: document.getElementById("gate-logo-wrap"),
    gateLogo: document.getElementById("gate-logo"),
    gateTitle: document.getElementById("gate-title"),
    gateDescription: document.getElementById("gate-description"),
    gateStatus: document.getElementById("gate-status"),
    enterTour: document.getElementById("enter-tour"),
    enterMuted: document.getElementById("enter-muted"),
    audio: document.getElementById("ambient-audio"),
};

function safeText(value, fallback) {
    return value && String(value).trim() ? String(value).trim() : fallback;
}

function normalizePhone(value) {
    return String(value || "").replace(/[^\\d+]/g, "");
}

function buildMatterportUrl(model) {
    const url = new URL("https://my.matterport.com/show/");
    url.searchParams.set("m", model.id);

    const extraParams = new URLSearchParams(model.embedParams || "");
    extraParams.forEach((value, key) => {
        if (key) {
            url.searchParams.set(key, value);
        }
    });

    return url.toString();
}

function getActiveModel() {
    return CONFIG.models[state.activeIndex];
}

function getActiveMusicSource() {
    const model = getActiveModel();
    return model && model.musicUrl ? String(model.musicUrl).trim() : "";
}

function closeMobileMenu() {
    var controls = el.hudHeader.querySelector(".header-controls");
    if (controls) {
        controls.classList.remove("mobile-open");
        el.mobileMenu.setAttribute("aria-expanded", "false");
    }
}

function setDrawerOpen(isOpen) {
    el.drawer.classList.toggle("open", isOpen);
    el.drawer.setAttribute("aria-hidden", String(!isOpen));

    if (isOpen) {
        closeMobileMenu();
        setHeaderVisible(true);
        window.clearTimeout(state.headerHideTimer);
    }
}

function setHeaderVisible(isVisible) {
    if (!isVisible) { closeMobileMenu(); }
    state.headerVisible = isVisible;
    el.hudHeader.classList.toggle("is-hidden", !isVisible);
    el.hudToggle.textContent = isVisible ? "Hide HUD" : "Show HUD";
    el.hudToggle.setAttribute("aria-expanded", String(isVisible));
}

function scheduleHeaderAutoHide() {
    if (!state.started || state.headerAutoCollapsed) {
        return;
    }

    window.clearTimeout(state.headerHideTimer);
    state.headerHideTimer = window.setTimeout(() => {
        if (!el.drawer.classList.contains("open")) {
            setHeaderVisible(false);
            state.headerAutoCollapsed = true;
        }
    }, 2200);
}

function updateQuickActions() {
    const model = getActiveModel();
    const propertyText = safeText(model.name, "this property");
    const locationText = model.location ? " in " + model.location : "";
    const agentName = safeText(CONFIG.contact.agentName, "the listing agent");
    const phone = normalizePhone(CONFIG.contact.phone);

    el.drawerSubtitle.textContent = "Connect with " + agentName + " about " + propertyText + ".";
    el.contactNote.textContent = safeText(CONFIG.contact.note, "Ask a question or request a private showing.");
    el.leadProperty.value = propertyText + (model.location ? " | " + model.location : "");

    if (phone) {
        el.callLink.href = "tel:" + phone;
        el.callLink.classList.remove("is-disabled");

        const smsBody = encodeURIComponent("Hi " + agentName + ", I'm interested in " + propertyText + locationText + ".");
        el.smsLink.href = "sms:" + phone + "?body=" + smsBody;
        el.smsLink.classList.remove("is-disabled");
    } else {
        el.callLink.href = "#";
        el.callLink.classList.add("is-disabled");
        el.smsLink.href = "#";
        el.smsLink.classList.add("is-disabled");
    }

    if (CONFIG.contact.email) {
        el.emailLink.classList.remove("is-disabled");
    } else {
        el.emailLink.classList.add("is-disabled");
    }
}

function renderPropertyPicker() {
    el.propertySelect.innerHTML = "";
    CONFIG.models.forEach((model, index) => {
        const option = document.createElement("option");
        option.value = String(index);
        option.textContent = model.location
            ? model.name + " | " + model.location
            : model.name;
        el.propertySelect.appendChild(option);
    });
    el.propertySelect.value = String(state.activeIndex);
}

function renderBrand() {
    const showLogo = Boolean(CONFIG.logoDataUrl);
    const brandName = safeText(CONFIG.brandName, safeText(CONFIG.contact.agentName, "Luxury Property Tour"));

    if (showLogo) {
        el.hudLogo.src = CONFIG.logoDataUrl;
        el.hudLogo.hidden = false;
        el.gateLogo.src = CONFIG.logoDataUrl;
        el.gateLogo.hidden = false;
    } else {
        el.hudLogo.hidden = true;
        el.gateLogo.hidden = true;
        el.gateLogoWrap.style.display = "none";
    }

    el.hudBrandName.textContent = brandName;
}

function renderBuildStamp() {
    if (!CONFIG.buildInfo || !CONFIG.buildInfo.version) {
        el.buildStamp.textContent = "";
        return;
    }

    el.buildStamp.textContent = "Build v" + CONFIG.buildInfo.version + " | " + safeText(CONFIG.buildInfo.exportedAtLabel, "");
}

function renderGateCopy() {
    const activeModel = getActiveModel();
    const hasMusic = Boolean(getActiveMusicSource());
    el.gateTitle.textContent = safeText(CONFIG.brandName, safeText(activeModel.name, "Interactive Tour"));
    el.gateDescription.textContent = "Open " + safeText(activeModel.name, "the Matterport experience") +
        (hasMusic ? " with optional ambient audio." : ".") +
        " Use the centered HUD toggle any time you want the full presentation controls.";
    el.enterTour.textContent = safeText(CONFIG.gateLabel, "Explore Tour");
    el.enterMuted.style.display = hasMusic ? "" : "none";
    el.gateStatus.textContent = hasMusic ? "" : "No background audio configured for this property.";
}

async function syncAudioForActiveModel(autoplay = false) {
    const source = getActiveMusicSource();
    state.audioEnabled = Boolean(source);

    if (!source) {
        state.audioSource = "";
        el.audio.pause();
        el.audio.removeAttribute("src");
        el.audio.load();
        el.audioBox.style.display = "none";
        return;
    }

    el.audioBox.style.display = "inline-flex";
    el.audio.volume = Number(el.volumeRange.value);

    if (state.audioSource !== source) {
        el.audio.pause();
        el.audio.src = source;
        el.audio.load();
        state.audioSource = source;
    }

    if (autoplay && state.started && !state.audioMuted) {
        try {
            await el.audio.play();
        } catch (error) {
            state.audioMuted = true;
            el.audio.muted = true;
            updateMuteLabel();
        }
    }
}

function renderProperty() {
    const model = getActiveModel();
    el.propertyTitle.textContent = safeText(model.name, "Property Tour");
    el.propertyLocation.textContent = safeText(model.location, "Explore the full interactive experience.");
    el.leadMessage.value = "Hello, I would like more information about " + safeText(model.name, "this property") + ".";
    updateQuickActions();
    renderGateCopy();
}

async function loadTour(index) {
    state.activeIndex = index;
    state.frameReady = false;
    el.propertySelect.value = String(index);
    renderProperty();
    await syncAudioForActiveModel(state.started);
    el.tourShell.classList.add("is-loading");
    el.frame.src = buildMatterportUrl(getActiveModel());
}

function buildEmailParts() {
    var model = getActiveModel();
    var lines = [
        "Property: " + safeText(model.name, "Property") + (model.location ? " | " + model.location : ""),
        "Name: " + safeText(el.leadName.value, "Not provided"),
        "Email: " + safeText(el.leadEmail.value, "Not provided"),
        "Phone: " + safeText(el.leadPhone.value, "Not provided"),
        "",
        "Message:",
        safeText(el.leadMessage.value, "I would like more information."),
    ];
    return {
        to: CONFIG.contact.email,
        subject: "Inquiry: " + safeText(model.name, "Property Tour"),
        body: lines.join("\\n"),
    };
}

function openProviderCompose(provider, triggerBtn) {
    var parts = buildEmailParts();
    var to = encodeURIComponent(parts.to);
    var subject = encodeURIComponent(parts.subject);
    var body = encodeURIComponent(parts.body);
    var url = "";

    if (provider === "gmail") {
        url = "https://mail.google.com/mail/?view=cm&to=" + to + "&su=" + subject + "&body=" + body;
    } else if (provider === "outlook") {
        url = "https://outlook.live.com/mail/0/deeplink/compose?to=" + parts.to + "&subject=" + subject + "&body=" + body;
    } else if (provider === "yahoo") {
        url = "https://compose.mail.yahoo.com/?to=" + to + "&subject=" + subject + "&body=" + body;
    } else if (provider === "mailto") {
        url = "mailto:" + parts.to + "?subject=" + subject + "&body=" + body;
    } else if (provider === "copy") {
        var text = "To: " + parts.to + "\\nSubject: " + parts.subject + "\\n\\n" + parts.body;
        navigator.clipboard.writeText(text).then(function () {
            if (triggerBtn) {
                triggerBtn.textContent = "Copied!";
                setTimeout(function () { triggerBtn.textContent = "Copy"; }, 2000);
            }
        });
        return;
    }

    if (url) {
        window.open(url, "_blank", "noopener");
    }
}

function handleSendEmailClick() {
    if (!CONFIG.contact.email) { return; }
    el.emailProviders.classList.toggle("hidden");
}


async function startExperience(muted) {
    if (state.started) {
        el.gatekeeper.remove();
        return;
    }

    state.started = true;
    state.audioMuted = Boolean(muted);
    el.audio.muted = state.audioMuted;
    updateMuteLabel();
    await syncAudioForActiveModel(!muted);

    if (state.audioEnabled && !muted) {
        el.gateStatus.textContent = "Ambient audio started.";
    }

    el.gatekeeper.remove();
    if (state.frameReady) {
        scheduleHeaderAutoHide();
    }
}

function updateMuteLabel() {
    el.muteToggle.textContent = state.audioMuted ? "Unmute" : "Mute";
    el.muteToggle.setAttribute("aria-pressed", String(state.audioMuted));
}

function boot() {
    document.documentElement.style.setProperty("--accent", CONFIG.accentColor || "#0f6fff");

    if (window.location.protocol === "file:") {
        el.gateTitle.textContent = "Web Hosting Required";
        el.gateDescription.textContent = "This tour must be served from a web server to load the Matterport 3D model. Upload this file to GitHub Pages or any web host, then visit the hosted URL.";
        el.enterTour.textContent = "Requires Web Hosting";
        el.enterTour.disabled = true;
        el.enterTour.style.opacity = "0.5";
        el.enterMuted.style.display = "none";
        el.gateStatus.textContent = "Open from https:// to start the experience.";
        return;
    }

    if (!Array.isArray(CONFIG.models) || !CONFIG.models.length) {
        document.body.innerHTML = "<p style=\\"padding:24px;font-family:sans-serif;color:white;background:#08111d;\\">This tour file is missing Matterport model data.</p>";
        return;
    }

    renderBrand();
    renderPropertyPicker();
    renderProperty();
    renderBuildStamp();

    updateMuteLabel();
    syncAudioForActiveModel(false);

    if (!CONFIG.logoDataUrl) {
        el.brandLockup.style.gap = "0";
    }

    setHeaderVisible(true);
    loadTour(0);
}

el.propertySelect.addEventListener("change", async (event) => {
    closeMobileMenu();
    await loadTour(Number(event.target.value));
});

el.hudToggle.addEventListener("click", () => {
    closeMobileMenu();
    const nextVisible = !state.headerVisible;
    setHeaderVisible(nextVisible);
    if (nextVisible) {
        window.clearTimeout(state.headerHideTimer);
    }
});

el.contactToggle.addEventListener("click", () => setDrawerOpen(true));
el.closeDrawer.addEventListener("click", () => {
    setDrawerOpen(false);
});
el.emailLink.addEventListener("click", function (event) {
    event.preventDefault();
    handleSendEmailClick();
});
el.sendEmail.addEventListener("click", handleSendEmailClick);
el.emailProviders.addEventListener("click", function (event) {
    var btn = event.target.closest("[data-provider]");
    if (btn) { openProviderCompose(btn.getAttribute("data-provider"), btn); }
});
el.enterTour.addEventListener("click", () => startExperience(false));
el.enterMuted.addEventListener("click", () => startExperience(true));

el.mobileMenu.addEventListener("click", function () {
    if (!state.headerVisible) {
        setHeaderVisible(true);
        window.clearTimeout(state.headerHideTimer);
    }
    var controls = el.hudHeader.querySelector(".header-controls");
    var isOpen = controls.classList.toggle("mobile-open");
    el.mobileMenu.setAttribute("aria-expanded", String(isOpen));
});

el.volumeRange.addEventListener("input", () => {
    el.audio.volume = Number(el.volumeRange.value);
});

el.muteToggle.addEventListener("click", async () => {
    if (!getActiveMusicSource()) {
        return;
    }

    state.audioMuted = !state.audioMuted;
    el.audio.muted = state.audioMuted;
    updateMuteLabel();

    if (!state.audioMuted) {
        try {
            await syncAudioForActiveModel(true);
        } catch (error) {
            state.audioMuted = true;
            el.audio.muted = true;
            updateMuteLabel();
        }
    }
});

el.frame.addEventListener("load", () => {
    state.frameReady = true;
    el.tourShell.classList.remove("is-loading");
    scheduleHeaderAutoHide();
});

document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
        setDrawerOpen(false);
    }
});

boot();
    </script>
</body>
</html>`;
}
