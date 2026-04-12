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
el.publishRedownload.addEventListener("click", redownloadPublishHtml);
el.sampleBtn.addEventListener("click", loadSampleData);

const SETUP_GUIDE_HTML = [
    '<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8">',
    '<meta name="viewport" content="width=device-width,initial-scale=1.0">',
    '<title>Publish Your Tour on Netlify</title>',
    '<style>',
    '*{box-sizing:border-box}',
    'body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;',
    'margin:0;padding:16px;color:#e2e8f0;background:#0f172a;display:flex;justify-content:center}',
    '#c{width:100%;max-width:440px;background:#1e293b;padding:24px;border-radius:12px;',
    'box-shadow:0 8px 24px rgba(0,0,0,0.4)}',
    'h1{margin:0 0 4px;text-align:center;font-size:1.4em;color:#f1f5f9}',
    '.sub{font-size:0.85em;text-align:center;color:#94a3b8;margin:0 0 20px}',
    'h2{font-size:1em;color:#94a3b8;margin:20px 0 10px;text-transform:uppercase;',
    'letter-spacing:0.06em;font-weight:600}',
    'ol,ul{padding:0;list-style:none;margin:0;counter-reset:step}',
    'ol li{counter-increment:step}',
    'ol li label .st::before{content:counter(step) ". ";color:#00c7b7}',
    'li{display:flex;align-items:start;margin-bottom:10px;padding:10px 12px;',
    'background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);',
    'border-radius:8px;transition:opacity 0.2s}',
    'input[type=checkbox]{margin-top:3px;margin-right:10px;width:16px;height:16px;',
    'cursor:pointer;accent-color:#00c7b7;flex-shrink:0}',
    'label{cursor:pointer;line-height:1.45;font-size:0.88em}',
    '.st{font-weight:700;display:block;margin-bottom:2px;color:#e2e8f0}',
    '.sd{font-size:0.85em;color:#94a3b8;display:block}',
    'input[type=checkbox]:checked+label{text-decoration:line-through;color:#475569}',
    'input[type=checkbox]:checked+label .sd{color:#475569}',
    'a{color:#38bdf8}a:hover{color:#7dd3fc}',
    '.tip{border-left:3px solid #00c7b7;background:rgba(0,199,183,0.06);',
    'padding:8px 12px;margin:8px 0;border-radius:4px;font-size:0.82em;color:#94a3b8}',
    '.pdf-link{display:block;text-align:center;margin:16px 0 0;padding:10px;',
    'background:rgba(0,199,183,0.08);border:1px solid rgba(0,199,183,0.2);',
    'color:#00c7b7;border-radius:8px;font-size:0.85em;text-decoration:none}',
    '.pdf-link:hover{background:rgba(0,199,183,0.14);color:#5eead4}',
    '.close-btn{display:block;width:100%;margin-top:12px;padding:10px;',
    'background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.12);',
    'color:#94a3b8;border-radius:8px;font-size:0.85em;cursor:pointer;text-align:center}',
    '.close-btn:hover{background:rgba(255,255,255,0.1);color:#e2e8f0}',
    '</style></head><body><div id="c">',
    '<h1>Publish Your HUD Presentation</h1>',
    '<p class="sub">Get your Matterport tour live on the web in 8 quick steps.</p>',
    '<h2>Publish Steps</h2><ol>',
    '<li><input type="checkbox" id="s1"><label for="s1">',
    '<strong class="st">Generate Your File</strong>',
    'In the builder, click <strong>Publish to Web</strong> (or <strong>Generate index.html</strong>). ',
    'Your tour file will download automatically.',
    '</label></li>',
    '<li><input type="checkbox" id="s2"><label for="s2">',
    '<strong class="st">Go to Netlify</strong>',
    'Open <a href="https://app.netlify.com" target="_blank" rel="noopener">app.netlify.com</a> ',
    'and click <strong>Sign up</strong> to create a free account.',
    '</label></li>',
    '<li><input type="checkbox" id="s3"><label for="s3">',
    '<strong class="st">Enter Your Name</strong>',
    'Fill in your first and last name on the "Nice to meet you" screen.',
    '</label></li>',
    '<li><input type="checkbox" id="s4"><label for="s4">',
    '<strong class="st">Select Personal</strong>',
    'When asked "How are you planning to use Netlify?", choose <strong>Personal</strong>.',
    '</label></li>',
    '<li><input type="checkbox" id="s5"><label for="s5">',
    '<strong class="st">Select Beginner</strong>',
    'For "What\'s your experience building on the web?", choose <strong>Beginner</strong>.',
    '</label></li>',
    '<li><input type="checkbox" id="s6"><label for="s6">',
    '<strong class="st">Find the Upload Area</strong>',
    'On the "Deploy your first project" screen, scroll down past the AI agent section ',
    'to <strong>Upload your project files</strong>.',
    '</label></li>',
    '<li><input type="checkbox" id="s7"><label for="s7">',
    '<strong class="st">Upload Your File</strong>',
    'Drag and drop your downloaded <strong>index.html</strong> file into the upload area, ',
    'or click <strong>browse to upload</strong> to select it.',
    '</label></li>',
    '<li><input type="checkbox" id="s8"><label for="s8">',
    '<strong class="st">Get Your Live URL</strong>',
    'Your site is published! Click the green <strong>.netlify.app</strong> link shown on screen ',
    'to view your live Matterport tour.',
    '</label></li></ol>',
    '<h2>Pro Tips</h2><ul>',
    '<li><input type="checkbox" id="t1"><label for="t1">',
    '<span class="sd"><strong>Updating Your Tour:</strong> To update, go to your Netlify dashboard, ',
    'open the site, and drag in a new index.html. The same URL updates automatically.</span>',
    '</label></li>',
    '<li><input type="checkbox" id="t2"><label for="t2">',
    '<span class="sd"><strong>Custom Domains:</strong> You can replace the ".netlify.app" URL with your own ',
    'domain (like <code>tours.yourbrand.com</code>) in Netlify\'s domain settings.</span>',
    '</label></li>',
    '<li><input type="checkbox" id="t3"><label for="t3">',
    '<span class="sd"><strong>Future Deploys:</strong> After your first setup, log in to Netlify and drag a new file ',
    'onto your <strong>Projects</strong> page to deploy additional sites instantly.</span>',
    '</label></li></ul>',
    '<a class="pdf-link" href="https://github.com/Socialeap/TM-3D-Presentation-Builder/blob/main/docs/Publish-HUD-Presentation-for-MP.pdf" ',
    'target="_blank" rel="noopener">View Full Step-by-Step PDF Guide with Screenshots</a>',
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
    window.open(url, "NetlifyPublishGuide", features);
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
