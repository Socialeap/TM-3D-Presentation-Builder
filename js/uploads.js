function createModelRow(data = {}) {
    const fragment = el.modelTemplate.content.cloneNode(true);
    const row = fragment.querySelector(".model-row");
    const modelKey = data.key || createModelKey();
    row.dataset.modelKey = modelKey;
    state.behaviorByModelKey[modelKey] = cloneBehaviorState(data.behavior || state.behaviorByModelKey[modelKey] || DEFAULT_BEHAVIOR_STATE);
    row.querySelector(".m-id").value = data.id || "";
    row.querySelector(".m-name").value = data.name || "";
    row.querySelector(".m-loc").value = data.location || "";
    row.querySelector(".m-music").value = data.musicUrl || "";
    row.querySelector(".remove-model").addEventListener("click", () => {
        if (el.modelList.children.length === 1) {
            setStatus("At least one property row must remain.", "error");
            return;
        }
        delete state.behaviorByModelKey[modelKey];
        row.remove();
        updateBuilderState();
    });
    row.querySelectorAll("input").forEach((input) => {
        input.addEventListener("input", updateBuilderState);
    });
    el.modelList.appendChild(fragment);
    syncRemoveButtons();
    if (!state.activeBehaviorModelKey) {
        setActiveBehaviorModel(modelKey);
    }
}

function syncRemoveButtons() {
    const buttons = el.modelList.querySelectorAll(".remove-model");
    const disable = buttons.length === 1;
    buttons.forEach((button) => {
        button.disabled = disable;
        button.title = disable ? "At least one property row is required." : "Remove this property";
    });
}

function collectModels() {
    return Array.from(el.modelList.querySelectorAll(".model-row")).map((row) => {
        const key = row.dataset.modelKey || "";
        const id = row.querySelector(".m-id").value.trim();
        const name = row.querySelector(".m-name").value.trim();
        const location = row.querySelector(".m-loc").value.trim();
        const musicUrl = row.querySelector(".m-music").value.trim();
        return { key, id, name, location, musicUrl };
    });
}

function updateLogoPreview() {
    const previewSrc = state.logoPreviewUrl || state.logoDataUrl;

    if (previewSrc) {
        el.logoPreview.src = previewSrc;
        el.logoPreview.classList.remove("hidden");
        el.logoPreviewEmpty.classList.add("hidden");
        el.logoStatus.textContent = state.logoFileName
            ? "Selected: " + state.logoFileName
            : "Logo ready";
        el.miniLogo.src = previewSrc;
        el.miniLogo.classList.remove("hidden");
        el.miniLogoFallback.classList.add("hidden");
    } else {
        el.logoPreview.removeAttribute("src");
        el.logoPreview.classList.add("hidden");
        el.logoPreviewEmpty.classList.remove("hidden");
        el.logoStatus.textContent = "No file uploaded";
        el.miniLogo.removeAttribute("src");
        el.miniLogo.classList.add("hidden");
        el.miniLogoFallback.classList.remove("hidden");
    }
}

function updateFaviconPreview() {
    const previewSrc = state.faviconPreviewUrl || state.logoPreviewUrl || state.logoDataUrl;
    const fallbackAvailable = Boolean(state.logoFile || state.logoPreviewUrl || state.logoDataUrl);

    if (previewSrc) {
        el.faviconPreview.src = previewSrc;
        el.faviconPreview.classList.remove("hidden");
        el.faviconPreviewEmpty.classList.add("hidden");
        el.faviconStatus.textContent = state.faviconFileName
            ? "Selected: " + state.faviconFileName
            : (fallbackAvailable ? "Using primary logo as fallback" : "No favicon selected");
    } else {
        el.faviconPreview.removeAttribute("src");
        el.faviconPreview.classList.add("hidden");
        el.faviconPreviewEmpty.classList.remove("hidden");
        el.faviconStatus.textContent = fallbackAvailable ? "Using primary logo as fallback" : "No favicon selected";
    }
}

function updateMiniPreview(config) {
    const activeModel = config.models[0] || { name: "Property Title", location: "Location", id: "" };
    el.miniBrandName.textContent = config.brandName || "";
    el.miniTitle.textContent = activeModel.name || "Property Title";
    el.miniLocation.textContent = activeModel.location || "Location";
    el.miniSelector.textContent = config.models.length === 1
        ? activeModel.name || "1 property"
        : config.models.length + " properties";
    el.miniCta.textContent = config.contact.agentName
        ? "Contact " + config.contact.agentName
        : "Get In Touch";
    el.miniAudio.textContent = "Mute";
    el.miniAudioGroup.style.display = activeModel.musicUrl ? "inline-flex" : "none";
    document.documentElement.style.setProperty("--accent", config.accentColor);

    if (activeModel.id && /^[A-Za-z0-9]{11}$/.test(activeModel.id)) {
        const previewUrl = buildBehaviorPreviewUrl(activeModel.id, state.behavior);
        if (el.previewFrame.src !== previewUrl) {
            el.previewFrame.src = previewUrl;
        }
    } else {
        el.previewFrame.removeAttribute("src");
    }
}


function updateReadinessChecklist(config, messages) {
    const checks = [
        { pass: config.models.length > 0, label: "Models" },
        { pass: Boolean(config.contact.email), label: "Email" },
        { pass: Boolean(config.brandName), label: "Brand" },
        { pass: Boolean(state.logoFile || state.logoDataUrl), label: "Logo" },
        { pass: isDarkColor(config.hudBgColor), label: "HUD Color" },
        { pass: !messages.length, label: "Valid" },
    ];

    const failCount = checks.filter(function (c) { return !c.pass; }).length;
    el.readinessSummary.textContent = failCount
        ? failCount + " item" + (failCount > 1 ? "s" : "") + " need attention"
        : "Ready to export";
    el.readinessSummary.style.color = failCount ? "#f87171" : "#34d399";

    el.readinessChecklist.innerHTML = checks.map(function (item) {
        var cls = item.pass ? "pass" : "fail";
        var icon = item.pass ? "\u2713" : "\u2717";
        return "<span class=\"readiness-chip " + cls + "\">" + icon + " " + item.label + "</span>";
    }).join("");
}
