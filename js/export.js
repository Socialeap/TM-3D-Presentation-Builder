function downloadFile(content, filename) {
    const blob = new Blob([content], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
}

async function handleLogoUpload(event) {
    const fileList = event && event.target ? event.target.files : null;
    const file = fileList && typeof fileList.item === "function" ? fileList.item(0) : fileList && fileList[0];
    if (!file) {
        return;
    }

    assertSupportedUploadImageFile(file, "logo");
    el.logoStatus.textContent = "Loading: " + file.name;

    const previewUrl = await readFileAsDataUrl(file);

    try {
        await loadImageFromSource(previewUrl);
    } catch (error) {
        throw error;
    }

    releasePreviewUrl(state.logoPreviewUrl);

    state.logoFile = file;
    state.logoDataUrl = previewUrl;
    state.logoFileName = file.name;
    state.logoPreviewUrl = previewUrl;
    el.logoStatus.textContent = "Selected: " + file.name + " (" + formatBytes(file.size) + ")";
    updateLogoPreview();
    updateBuilderState();
}

async function handleFaviconUpload(event) {
    const fileList = event && event.target ? event.target.files : null;
    const file = fileList && typeof fileList.item === "function" ? fileList.item(0) : fileList && fileList[0];
    if (!file) {
        updateFaviconPreview();
        return;
    }

    assertSupportedUploadImageFile(file, "favicon");
    el.faviconStatus.textContent = "Loading: " + file.name;

    const sourceUrl = await readFileAsDataUrl(file);
    let previewUrl = sourceUrl;

    try {
        await loadImageFromSource(sourceUrl);
        previewUrl = await createSquareIconDataUrlFromSource(sourceUrl, 64).catch(() => sourceUrl);
    } catch (error) {
        throw error;
    }

    releasePreviewUrl(state.faviconPreviewUrl);

    state.faviconFile = file;
    state.faviconDataUrl = previewUrl;
    state.faviconFileName = file.name;
    state.faviconPreviewUrl = previewUrl;
    el.faviconStatus.textContent = "Selected: " + file.name + " (" + formatBytes(file.size) + ")";
    updateFaviconPreview();
    updateBuilderState();
}

function clearLogo() {
    releasePreviewUrl(state.logoPreviewUrl);

    state.logoFile = null;
    state.logoPreviewUrl = "";
    state.logoDataUrl = "";
    state.logoFileName = "";
    el.logoFile.value = "";
    updateLogoPreview();
    updateFaviconPreview();
    updateBuilderState();
}

function clearFavicon() {
    releasePreviewUrl(state.faviconPreviewUrl);

    state.faviconFile = null;
    state.faviconPreviewUrl = "";
    state.faviconDataUrl = "";
    state.faviconFileName = "";
    el.faviconFile.value = "";
    updateFaviconPreview();
    updateBuilderState();
}

function loadSampleData() {
    state.behaviorByModelKey = {};
    state.activeBehaviorModelKey = "";
    el.brandName.value = "Transcendence Media";
    el.accentColor.value = "#0f6fff";
    el.hudBgColor.value = "#08111d";
    el.agentName.value = "Jordan Ellis";
    el.clientEmail.value = "agent@example.com";
    el.clientPhone.value = "555-012-3456";
    el.contactNote.value = "Ask a question, request pricing, or schedule a private showing.";
    el.gateLabel.value = "Enter Experience";
    resetBehaviorState();

    el.modelList.innerHTML = "";
    createModelRow({
        id: "VtB6EMYs8vp",
        name: "485 Brickell Ave Unit 3208 | Icon Brickell Tower 3",
        location: "W Miami | Brickell Condo",
        musicUrl: "https://files.freemusicarchive.org/storage-freemusicarchive-org/tracks/Bq9HzEyfMcmSBqtJKjVo6KF5hC6JzoF75wgERn04.mp3",
        behavior: {
            hideBranding: true,
            autoPlay: true,
            quickstart: true,
            disableScrollWheelZoom: true,
            hideGuidedPath: true,
        },
    });
    createModelRow({
        id: "q1gb1kxgdkV",
        name: "Event Center - Lobby",
        location: "Rochester, MN, 55902, US",
        musicUrl: "https://files.freemusicarchive.org/storage-freemusicarchive-org/tracks/C5whLiC5lqxj9WwSK3In5gS4LCLTg3cEC6m71d6b.mp3",
        behavior: {
            autoPlay: true,
            disableScrollWheelZoom: true,
            hideHighlightReel: true,
            transitionEnabled: true,
            transitionValue: "2",
        },
    });
    createModelRow({
        id: "AeuaFwk1RVY",
        name: "The Roosevelt Hotel",
        location: "New Orleans, LA, 70112, US",
        musicUrl: "https://files.freemusicarchive.org/storage-freemusicarchive-org/tracks/cWUDw7GdoWh9vgYyK6Vh4EaVxVYb7dqHr4i06ZQK.mp3",
        behavior: {
            autoPlay: true,
            disableScrollWheelZoom: true,
            mlsModeEnabled: true,
            mlsModeValue: "2",
        },
    });
    updateBuilderState();
}

async function generateFile() {
    const draftConfig = buildConfig();
    const messages = validateConfig(draftConfig);

    if (messages.length) {
        setStatus(messages[0], "error");
        updateBuilderState();
        return;
    }

    try {
        const versionInfo = buildVersionInfo();
        const config = await buildExportConfig(versionInfo);
        const productionHtml = buildProductionHtml(config);
        downloadFile(productionHtml, "index.html");
        persistNextVersion(versionInfo);
        refreshVersionUI();
        setStatus("Export complete. Your production file downloaded as index.html (v" + versionInfo.version + ").", "success");
    } catch (error) {
        setStatus((error && error.message) || "Unable to embed one or more assets for export.", "error");
    }
}

function getNetlifyToken() {
    try { return localStorage.getItem(NETLIFY_TOKEN_KEY) || ""; }
    catch (e) { return ""; }
}

function saveNetlifyToken(token) {
    try { localStorage.setItem(NETLIFY_TOKEN_KEY, token); }
    catch (e) { /* localStorage unavailable */ }
}

function showPublishPhase(phase) {
    el.publishDeploying.classList.add("hidden");
    el.publishSuccess.classList.add("hidden");
    el.publishError.classList.add("hidden");
    if (phase) {
        phase.classList.remove("hidden");
        el.publishResult.classList.remove("hidden");
        el.publishResult.scrollIntoView({ behavior: "smooth", block: "center" });
    } else {
        el.publishResult.classList.add("hidden");
    }
}

function saveTokenAndPublish() {
    var token = (el.netlifyToken.value || "").trim();
    if (!token) {
        setStatus("Please paste your Netlify personal access token.", "error");
        el.netlifyToken.focus();
        return;
    }
    saveNetlifyToken(token);
    el.netlifyTokenSetup.classList.add("hidden");
    publishToNetlify();
}

async function publishToNetlify() {
    var token = getNetlifyToken();
    if (!token) {
        showPublishPhase(null);
        el.netlifyTokenSetup.classList.remove("hidden");
        el.netlifyTokenSetup.scrollIntoView({ behavior: "smooth", block: "center" });
        el.netlifyToken.focus();
        setStatus("Connect your Netlify account to publish. Follow the steps below.", "");
        return;
    }

    const draftConfig = buildConfig();
    const messages = validateConfig(draftConfig);
    if (messages.length) {
        setStatus(messages[0], "error");
        updateBuilderState();
        return;
    }

    state.publishState = "deploying";
    el.publishBtn.disabled = true;
    el.publishBtn.textContent = "Publishing\u2026";
    el.publishBtn.classList.add("is-deploying");
    el.netlifyTokenSetup.classList.add("hidden");
    showPublishPhase(el.publishDeploying);

    try {
        const versionInfo = buildVersionInfo();
        const config = await buildExportConfig(versionInfo);
        const html = buildProductionHtml(config);

        const zip = new JSZip();
        zip.file("index.html", html);
        const zipBlob = await zip.generateAsync({ type: "blob" });

        const response = await fetch("https://api.netlify.com/api/v1/sites", {
            method: "POST",
            headers: {
                "Content-Type": "application/zip",
                "Authorization": "Bearer " + token,
            },
            body: zipBlob,
        });

        if (response.status === 401 || response.status === 403) {
            saveNetlifyToken("");
            throw new Error("Your Netlify token was invalid or expired. Click \"Publish to Web\" again to enter a new one.");
        }

        if (!response.ok) {
            throw new Error("Netlify returned an error (status " + response.status + "). Please try again in a moment.");
        }

        const site = await response.json();
        const liveUrl = site.ssl_url || site.url || "";
        const claimUrl = site.claim_url || "";

        if (!liveUrl) {
            throw new Error("Deploy succeeded but no URL was returned. Please try again.");
        }

        state.publishState = "success";
        state.publishUrl = liveUrl;
        state.publishClaimUrl = claimUrl;
        state.publishSiteName = site.name || "";

        el.publishOpen.href = liveUrl;
        el.publishUrlDisplay.value = liveUrl;
        el.publishClaim.href = claimUrl;
        el.publishClaim.classList.toggle("hidden", !claimUrl);
        showPublishPhase(el.publishSuccess);

        persistNextVersion(versionInfo);
        refreshVersionUI();
        setStatus("Published! Your tour is live.", "success");
    } catch (error) {
        state.publishState = "error";
        el.publishErrorMessage.textContent = (error && error.message) || "An unexpected error occurred.";
        showPublishPhase(el.publishError);
        setStatus("Publishing failed. See details below.", "error");
    } finally {
        el.publishBtn.textContent = "Publish to Web";
        el.publishBtn.classList.remove("is-deploying");
        updateBuilderState();
    }
}

function copyPublishUrl() {
    if (!state.publishUrl) return;
    navigator.clipboard.writeText(state.publishUrl).then(function () {
        el.copyPublishUrl.textContent = "Copied!";
        setTimeout(function () { el.copyPublishUrl.textContent = "Copy Link"; }, 2000);
    }).catch(function () {
        el.copyPublishUrl.textContent = "Copy failed";
        setTimeout(function () { el.copyPublishUrl.textContent = "Copy Link"; }, 2000);
    });
}
