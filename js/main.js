el.addModel.addEventListener("click", () => {
    createModelRow();
    updateBuilderState();
});

el.chooseLogo.addEventListener("click", () => {
    el.logoFile.value = "";
    el.logoFile.click();
});

el.chooseFavicon.addEventListener("click", () => {
    el.faviconFile.value = "";
    el.faviconFile.click();
});

el.logoFile.addEventListener("change", (event) => {
    handleLogoUpload(event).catch((error) => {
        el.logoFile.value = "";
        el.logoStatus.textContent = state.logoFileName
            ? "Selected: " + state.logoFileName
            : "Logo load failed";
        setStatus(error.message || "Unable to read logo file.", "error");
    });
});

el.faviconFile.addEventListener("change", (event) => {
    handleFaviconUpload(event).catch((error) => {
        el.faviconFile.value = "";
        el.faviconStatus.textContent = state.faviconFileName
            ? "Selected: " + state.faviconFileName
            : "Favicon load failed";
        setStatus(error.message || "Unable to read favicon file.", "error");
    });
});

el.clearLogo.addEventListener("click", clearLogo);
el.clearFavicon.addEventListener("click", clearFavicon);
el.openBehaviorSettings.addEventListener("click", () => {
    updateBehaviorUI();
    setBehaviorModalOpen(true);
});
el.closeBehaviorSettings.addEventListener("click", () => setBehaviorModalOpen(false));
el.behaviorModalBackdrop.addEventListener("click", () => setBehaviorModalOpen(false));
el.behaviorGroups.addEventListener("change", handleBehaviorControlEvent);
el.behaviorGroups.addEventListener("input", handleBehaviorControlEvent);
el.customEmbedParams.addEventListener("input", () => {
    state.behavior.customParams = el.customEmbedParams.value;
    updateBuilderState();
});
el.customEmbedParams.addEventListener("change", () => {
    state.behavior.customParams = el.customEmbedParams.value;
    updateBuilderState();
});
el.behaviorModelSelect.addEventListener("change", () => {
    setActiveBehaviorModel(el.behaviorModelSelect.value);
    updateBuilderState();
});
el.generateBtn.addEventListener("click", generateFile);
el.publishBtn.addEventListener("click", publishToNetlify);
el.publishRedownload.addEventListener("click", redownloadPublishZip);
el.sampleBtn.addEventListener("click", loadSampleData);

const SETUP_GUIDE_HTML = [
    '<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8">',
    '<meta name="viewport" content="width=device-width,initial-scale=1.0">',
    '<title>GitHub Pages Setup Guide</title>',
    '<style>',
    '*{box-sizing:border-box}',
    'body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;',
    'margin:0;padding:16px;color:#e2e8f0;background:#0f172a;display:flex;justify-content:center}',
    '#c{width:100%;max-width:420px;background:#1e293b;padding:24px;border-radius:12px;',
    'box-shadow:0 8px 24px rgba(0,0,0,0.4)}',
    'h1{margin:0 0 4px;text-align:center;font-size:1.4em;color:#f1f5f9}',
    '.sub{font-size:0.85em;text-align:center;color:#94a3b8;margin:0 0 20px}',
    'h2{font-size:1em;color:#94a3b8;margin:20px 0 10px;text-transform:uppercase;',
    'letter-spacing:0.06em;font-weight:600}',
    'ol,ul{padding:0;list-style:none;margin:0}',
    'li{display:flex;align-items:start;margin-bottom:10px;padding:10px 12px;',
    'background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);',
    'border-radius:8px;transition:opacity 0.2s}',
    'input[type=checkbox]{margin-top:3px;margin-right:10px;width:16px;height:16px;',
    'cursor:pointer;accent-color:#0f6fff;flex-shrink:0}',
    'label{cursor:pointer;line-height:1.45;font-size:0.88em}',
    '.st{font-weight:700;display:block;margin-bottom:2px;color:#e2e8f0}',
    '.sd{font-size:0.85em;color:#94a3b8;display:block}',
    'input[type=checkbox]:checked+label{text-decoration:line-through;color:#475569}',
    'input[type=checkbox]:checked+label .sd{color:#475569}',
    'a{color:#38bdf8}a:hover{color:#7dd3fc}',
    '.tip{border-left:3px solid #22d3ee;background:rgba(34,211,238,0.06);',
    'padding:8px 12px;margin:8px 0;border-radius:4px;font-size:0.82em;color:#94a3b8}',
    '.close-btn{display:block;width:100%;margin-top:20px;padding:10px;',
    'background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.12);',
    'color:#94a3b8;border-radius:8px;font-size:0.85em;cursor:pointer;text-align:center}',
    '.close-btn:hover{background:rgba(255,255,255,0.1);color:#e2e8f0}',
    '</style></head><body><div id="c">',
    '<h1>GitHub Pages Setup</h1>',
    '<p class="sub">Get your Matterport tour online in 5 steps.</p>',
    '<h2>Setup Steps</h2><ol>',
    '<li><input type="checkbox" id="s1"><label for="s1">',
    '<strong class="st">Create a GitHub Account</strong>',
    'Go to <a href="https://github.com" target="_blank" rel="noopener">GitHub.com</a> ',
    'and click <strong>Sign Up</strong>. Follow the prompts to create your username and verify your email.',
    '</label></li>',
    '<li><input type="checkbox" id="s2"><label for="s2">',
    '<strong class="st">Create a Repository</strong>',
    'Click the <strong>+</strong> icon in the top-right corner, select <strong>New repository</strong>. ',
    'Give it a simple name, ensure <strong>Public</strong> is selected, and click <strong>Create repository</strong>.',
    '</label></li>',
    '<li><input type="checkbox" id="s3"><label for="s3">',
    '<strong class="st">Upload Your Index File</strong>',
    'On the next screen, click <strong>uploading an existing file</strong>. ',
    'Drag and drop your <strong>index.html</strong> file into the browser, then click <strong>Commit changes</strong>.',
    '</label></li>',
    '<li><input type="checkbox" id="s4"><label for="s4">',
    '<strong class="st">Launch the Page</strong>',
    'Click the <strong>Settings</strong> tab. On the sidebar click <strong>Pages</strong>. ',
    'In the <strong>Branch</strong> dropdown, select <strong>main</strong>, and click <strong>Save</strong>.',
    '</label></li>',
    '<li><input type="checkbox" id="s5"><label for="s5">',
    '<strong class="st">Get Your URL</strong>',
    'Refresh the page after a minute. A banner will say <strong>"Your site is live at..."</strong> ',
    'followed by a link. Click that link!',
    '</label></li></ol>',
    '<h2>Pro Tips</h2><ul>',
    '<li><input type="checkbox" id="t1"><label for="t1">',
    '<span class="sd"><strong>File Naming:</strong> Your file must be named <code>index.html</code> (lowercase) for this method to work automatically.</span>',
    '</label></li>',
    '<li><input type="checkbox" id="t2"><label for="t2">',
    '<span class="sd"><strong>Easy Updates:</strong> To update your tour, use <strong>Add file &rarr; Upload files</strong> and drop the new index.html in to overwrite the old one. The link updates automatically.</span>',
    '</label></li>',
    '<li><input type="checkbox" id="t3"><label for="t3">',
    '<span class="sd"><strong>Privacy Note:</strong> Public repositories mean your code is viewable on GitHub. Avoid putting sensitive information directly in the configuration.</span>',
    '</label></li>',
    '<li><input type="checkbox" id="t4"><label for="t4">',
    '<span class="sd"><strong>Custom Domains:</strong> You can replace "github.io" by connecting a custom domain (like <code>tours.yourbrand.com</code>) under <strong>Pages</strong> settings.</span>',
    '</label></li></ul>',
    '<button class="close-btn" onclick="window.close()">Close Guide</button>',
    '</div></body></html>',
].join("");

el.openSetupGuide.addEventListener("click", function () {
    var w = Math.round(window.screen.width * 0.25);
    var h = Math.round(window.screen.height * 0.75);
    var left = window.screen.width - w;
    var top = 100;
    var features = "width=" + w + ",height=" + h + ",left=" + left + ",top=" + top
        + ",resizable=yes,scrollbars=yes,status=no,toolbar=no,menubar=no,location=no";
    var blob = new Blob([SETUP_GUIDE_HTML], { type: "text/html" });
    var url = URL.createObjectURL(blob);
    window.open(url, "GitHubSetupGuide", features);
});

el.toggleReadiness.addEventListener("click", () => {
    const isShowing = !el.readinessContent.classList.contains("hidden");
    el.readinessContent.classList.toggle("hidden", isShowing);
    el.toggleReadiness.textContent = isShowing ? "Export Readiness" : "Hide";
    el.toggleReadiness.className = isShowing ? "btn-secondary" : "btn-outline";
});

[
    el.brandName,
    el.accentColor,
    el.hudBgColor,
    el.agentName,
    el.clientEmail,
    el.clientPhone,
    el.contactNote,
    el.gateLabel,
].forEach((input) => input.addEventListener("input", updateBuilderState));

document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && state.behaviorModalOpen) {
        setBehaviorModalOpen(false);
    }
});

function boot() {
    renderBehaviorGroups();
    resetBehaviorState();
    createModelRow();
    refreshVersionUI();
    updateLogoPreview();
    updateFaviconPreview();
    updateBuilderState();
}

boot();
