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
        id: "SxQL3iGyoDo",
        name: "Main Residence",
        location: "Malibu, CA",
        musicUrl: "https://cdn.example.com/main-residence.mp3",
        behavior: {
            hideBranding: true,
            autoPlay: true,
            quickstart: true,
            disableScrollWheelZoom: true,
            hideGuidedPath: true,
        },
    });
    createModelRow({
        id: "7y3sRwLe9Jp",
        name: "Guest House",
        location: "Malibu, CA",
        musicUrl: "https://cdn.example.com/guest-house.mp3",
        behavior: {
            autoPlay: true,
            disableScrollWheelZoom: true,
            hideHighlightReel: true,
            transitionEnabled: true,
            transitionValue: "2",
        },
    });
    createModelRow({
        id: "kA7mX2pQw8Z",
        name: "Community Clubhouse",
        location: "Pacific Coast Highway",
        musicUrl: "",
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
        el.netlifyTokenSetup.classList.remove("hidden");
        el.publishResult.classList.add("hidden");
        el.netlifyToken.focus();
        setStatus("Connect your Netlify account to publish. Paste your token below.", "");
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
    el.publishResult.classList.add("hidden");
    el.netlifyTokenSetup.classList.add("hidden");
    setStatus("Packaging and deploying your tour\u2026", "");

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
            throw new Error("Token was rejected by Netlify. Click Publish to Web again to enter a new token.");
        }

        if (!response.ok) {
            throw new Error("Netlify returned status " + response.status);
        }

        const site = await response.json();
        const liveUrl = site.ssl_url || site.url || "";
        const claimUrl = site.claim_url || "";

        if (!liveUrl) {
            throw new Error("Deploy succeeded but no URL was returned.");
        }

        state.publishState = "success";
        state.publishUrl = liveUrl;
        state.publishClaimUrl = claimUrl;
        state.publishSiteName = site.name || "";

        el.publishUrl.href = liveUrl;
        el.publishUrl.textContent = liveUrl;
        el.publishMeta.textContent = "Site: " + state.publishSiteName;
        el.publishClaim.href = claimUrl;
        el.publishClaim.classList.toggle("hidden", !claimUrl);
        el.publishResult.classList.remove("hidden");

        persistNextVersion(versionInfo);
        refreshVersionUI();
        setStatus("Published! Your tour is live.", "success");
    } catch (error) {
        state.publishState = "error";
        setStatus(
            ((error && error.message) || "Publishing failed.") +
            ' Use "Generate index.html" to download and host manually instead.',
            "error"
        );
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
        setTimeout(function () { el.copyPublishUrl.textContent = "Copy URL"; }, 2000);
    }).catch(function () {
        el.copyPublishUrl.textContent = "Copy failed";
        setTimeout(function () { el.copyPublishUrl.textContent = "Copy URL"; }, 2000);
    });
}
