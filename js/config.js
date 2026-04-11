function buildConfig() {
    persistCurrentBehaviorState();
    const models = collectModels()
        .filter((model) => model.id)
        .map((model) => ({
            id: model.id,
            key: model.key,
            name: model.name || "Untitled Property",
            location: model.location,
            musicUrl: model.musicUrl,
            embedParams: buildCombinedEmbedParams(ensureBehaviorAssignment(model.key)),
        }));

    const gateLabel = el.gateLabel.value.trim() || "Explore Tour";
    const brandName = el.brandName.value.trim();
    const defaultTitle = models[0] ? models[0].name : "Interactive Tour";

    return {
        brandName,
        accentColor: el.accentColor.value,
        hudBgColor: el.hudBgColor.value,
        logoDataUrl: state.logoDataUrl,
        faviconDataUrl: state.faviconDataUrl,
        models,
        embedParams: buildCombinedEmbedParams(),
        gateLabel,
        pageTitle: brandName || defaultTitle,
        contact: {
            agentName: el.agentName.value.trim(),
            email: el.clientEmail.value.trim(),
            phone: el.clientPhone.value.trim(),
            note: el.contactNote.value.trim() || "Ask a question or request a private showing.",
        },
    };
}

async function buildExportConfig(versionInfo) {
    const config = buildConfig();

    if (state.logoFile) {
        config.logoDataUrl = await readFileAsDataUrl(state.logoFile);
    } else if (state.logoDataUrl) {
        config.logoDataUrl = state.logoDataUrl;
    }

    if (state.faviconFile) {
        config.faviconDataUrl = await buildFaviconDataUrlFromFile(state.faviconFile, 64);
    } else if (config.logoDataUrl) {
        config.faviconDataUrl = await createSquareIconDataUrlFromSource(config.logoDataUrl, 64);
    } else {
        config.faviconDataUrl = "";
    }

    config.buildInfo = versionInfo;
    return config;
}

function validateConfig(config) {
    const messages = [];
    const rawModels = collectModels();
    const validModelIdPattern = /^[A-Za-z0-9]{11}$/;

    if (!config.contact.email) {
        messages.push("An agent email address is required for the inquiry form.");
    }

    if (!config.models.length) {
        messages.push("Add at least one Matterport model with an ID.");
    }

    if (!isDarkColor(config.hudBgColor)) {
        messages.push("HUD header background should be a dark color for legibility.");
    }

    rawModels.forEach((model, index) => {
        if (!model.id && (model.name || model.location)) {
            messages.push("Property row " + (index + 1) + " is missing its Matterport model ID.");
        }
        if (model.id && !validModelIdPattern.test(model.id)) {
            messages.push("Property row " + (index + 1) + " has an invalid model ID. Matterport IDs are usually 11 letters/numbers.");
        }
        if (model.musicUrl) {
            try {
                new URL(model.musicUrl);
            } catch (error) {
                messages.push("Property row " + (index + 1) + " has an invalid music URL.");
            }
        }
    });

    if (config.embedParams && config.embedParams.includes("?")) {
        messages.push("Advanced embed parameters should not include a question mark.");
    }

    return messages;
}

function setStatus(message, tone = "") {
    el.statusMessage.textContent = message;
    el.statusMessage.className = "status-message" + (tone ? " " + tone : "");
}

function updateBuilderState() {
    persistCurrentBehaviorState();
    syncRemoveButtons();
    syncActiveBehaviorModelKey();
    setActiveBehaviorModel(state.activeBehaviorModelKey);
    updateBehaviorUI();
    const config = buildConfig();
    const messages = validateConfig(config);
    refreshVersionUI();
    updateFaviconPreview();
    updateMiniPreview(config);
    updateReadinessChecklist(config, messages);
    el.generateBtn.disabled = messages.length > 0;

    if (messages.length) {
        setStatus(messages[0], "error");
    } else {
        setStatus("Ready to export. The generated file will download as index.html.", "success");
    }
}
