function cloneBehaviorState(source = DEFAULT_BEHAVIOR_STATE) {
    return { ...DEFAULT_BEHAVIOR_STATE, ...source };
}

function resetBehaviorState(overrides = {}) {
    state.behavior = cloneBehaviorState(overrides);
}

function createModelKey() {
    const key = "model-" + state.nextModelKey;
    state.nextModelKey += 1;
    return key;
}

function getModelRows() {
    return Array.from(el.modelList.querySelectorAll(".model-row"));
}

function getModelLabel(model, index) {
    if (model.name && model.location) {
        return model.name + " | " + model.location;
    }

    if (model.name) {
        return model.name;
    }

    if (model.location) {
        return model.location;
    }

    return "Property " + (index + 1);
}

function getCurrentBehaviorModel() {
    return collectModels().find((model) => model.key === state.activeBehaviorModelKey) || null;
}

function ensureBehaviorAssignment(modelKey) {
    if (!modelKey) {
        return cloneBehaviorState();
    }

    if (!state.behaviorByModelKey[modelKey]) {
        state.behaviorByModelKey[modelKey] = cloneBehaviorState();
    }

    return state.behaviorByModelKey[modelKey];
}

function persistCurrentBehaviorState() {
    if (!state.activeBehaviorModelKey) {
        return;
    }

    state.behaviorByModelKey[state.activeBehaviorModelKey] = cloneBehaviorState(state.behavior);
}

function syncActiveBehaviorModelKey() {
    const models = collectModels();
    const availableKeys = new Set(models.map((model) => model.key));

    Object.keys(state.behaviorByModelKey).forEach((key) => {
        if (!availableKeys.has(key)) {
            delete state.behaviorByModelKey[key];
        }
    });

    if (state.activeBehaviorModelKey && availableKeys.has(state.activeBehaviorModelKey)) {
        return;
    }

    state.activeBehaviorModelKey = models[0] ? models[0].key : "";
}

function setActiveBehaviorModel(modelKey) {
    if (!modelKey) {
        state.activeBehaviorModelKey = "";
        resetBehaviorState();
        return;
    }

    if (state.activeBehaviorModelKey === modelKey) {
        state.behavior = cloneBehaviorState(ensureBehaviorAssignment(modelKey));
        return;
    }

    persistCurrentBehaviorState();
    state.activeBehaviorModelKey = modelKey;
    state.behavior = cloneBehaviorState(ensureBehaviorAssignment(modelKey));
}

function getBehaviorOptionParamLabel(option) {
    if (!option.control) {
        return option.param + "=" + option.fixedValue;
    }

    if (option.control.type === "select") {
        return option.param + "=" + (option.control.defaultValue || "value");
    }

    return option.param + "=...";
}

function renderBehaviorControl(option) {
    if (!option.control) {
        return "";
    }

    const control = option.control;
    const controlId = "behavior-control-" + control.key;

    if (control.type === "select") {
        return `
            <div class="behavior-control">
                <label for="${controlId}">${control.label}</label>
                <select id="${controlId}" data-control-key="${control.key}">
                    ${control.choices.map((choice) => `<option value="${choice.value}">${choice.label}</option>`).join("")}
                </select>
            </div>
        `;
    }

    const inputType = control.type === "number" ? "number" : "text";
    const minAttr = control.min ? ` min="${control.min}"` : "";
    const stepAttr = control.step ? ` step="${control.step}"` : "";
    const placeholderAttr = control.placeholder ? ` placeholder="${control.placeholder}"` : "";
    return `
        <div class="behavior-control">
            <label for="${controlId}">${control.label}</label>
            <input type="${inputType}" id="${controlId}" data-control-key="${control.key}"${minAttr}${stepAttr}${placeholderAttr}>
        </div>
    `;
}

function renderBehaviorGroups() {
    el.behaviorGroups.innerHTML = TOUR_BEHAVIOR_GROUPS.map((group) => `
        <section class="behavior-group">
            <div>
                <h4>${group.title}</h4>
                <p>${group.description}</p>
            </div>
            <div class="behavior-options">
                ${group.options.map((option) => `
                    <div class="behavior-option-card">
                        <label class="behavior-option-toggle">
                            <input type="checkbox" data-behavior-key="${option.key}">
                            <div>
                                <div class="behavior-option-top">
                                    <span class="behavior-option-title">${option.label}</span>
                                    <span class="behavior-option-param">${getBehaviorOptionParamLabel(option)}</span>
                                </div>
                                <p class="behavior-option-desc">${option.description}</p>
                            </div>
                        </label>
                        ${renderBehaviorControl(option)}
                    </div>
                `).join("")}
            </div>
        </section>
    `).join("");
}

function normalizeCustomParams(value) {
    let normalized = String(value || "").trim();

    if (!normalized) {
        return "";
    }

    if (/^https?:\/\//i.test(normalized)) {
        try {
            normalized = new URL(normalized).search;
        } catch (error) {
            return normalized.replace(/^[?#&]+/, "");
        }
    }

    return normalized.replace(/^[?#&]+/, "");
}

function appendParamsFromString(target, rawValue) {
    const normalized = normalizeCustomParams(rawValue);
    let count = 0;

    if (!normalized) {
        return count;
    }

    const customParams = new URLSearchParams(normalized);
    customParams.forEach((value, key) => {
        if (!key || key === "m") {
            return;
        }

        target.set(key, value);
        count += 1;
    });

    return count;
}

function getSelectedBehaviorEntries(behaviorState = state.behavior) {
    return TOUR_BEHAVIOR_OPTIONS.reduce((entries, option) => {
        if (!behaviorState[option.key]) {
            return entries;
        }

        let value = option.fixedValue;
        if (option.control) {
            value = String(behaviorState[option.control.key] || option.control.defaultValue || "").trim();
        }

        if (!value) {
            return entries;
        }

        entries.push({
            key: option.key,
            label: option.summary || option.label,
            param: option.param,
            value,
        });
        return entries;
    }, []);
}

function buildCombinedEmbedParams(behaviorState = state.behavior) {
    const params = new URLSearchParams();

    getSelectedBehaviorEntries(behaviorState).forEach((entry) => {
        params.set(entry.param, entry.value);
    });

    appendParamsFromString(params, behaviorState.customParams);
    return params.toString();
}

function getCustomParamCount(behaviorState = state.behavior) {
    const params = new URLSearchParams();
    return appendParamsFromString(params, behaviorState.customParams);
}

function buildBehaviorPreviewUrl(modelId, behaviorState = state.behavior) {
    const url = new URL("https://my.matterport.com/show/");
    url.searchParams.set("m", modelId);

    const params = new URLSearchParams(buildCombinedEmbedParams(behaviorState));
    params.forEach((value, key) => {
        if (key && key !== "m") {
            url.searchParams.set(key, value);
        }
    });

    return url.toString();
}

function updateBehaviorModelOptions() {
    const models = collectModels();
    const selectedKey = state.activeBehaviorModelKey;

    el.behaviorModelSelect.innerHTML = "";

    if (!models.length) {
        const placeholder = document.createElement("option");
        placeholder.value = "";
        placeholder.textContent = "No property rows yet";
        el.behaviorModelSelect.appendChild(placeholder);
        el.behaviorModelSelect.disabled = true;
        state.activeBehaviorModelKey = "";
        return;
    }

    models.forEach((model, index) => {
        const option = document.createElement("option");
        option.value = model.key;
        option.textContent = getModelLabel(model, index);
        el.behaviorModelSelect.appendChild(option);
    });

    el.behaviorModelSelect.disabled = false;
    state.activeBehaviorModelKey = models.some((model) => model.key === selectedKey)
        ? selectedKey
        : models[0].key;
    el.behaviorModelSelect.value = state.activeBehaviorModelKey;
}

function updateBehaviorSummary() {
    const currentModel = getCurrentBehaviorModel();
    const selectedEntries = getSelectedBehaviorEntries(state.behavior);
    const customParamCount = getCustomParamCount(state.behavior);
    const totalSelections = selectedEntries.length + customParamCount;
    const summaryLabels = selectedEntries.map((entry) => entry.label);

    if (customParamCount) {
        summaryLabels.push(customParamCount > 1 ? "Custom / Deep-Link Parameters" : "Custom Parameter");
    }

    el.behaviorCount.textContent = totalSelections === 1
        ? "1 parameter selected"
        : totalSelections + " parameters selected";
    el.behaviorModelLabel.textContent = currentModel
        ? "Assigned to: " + getModelLabel(currentModel, collectModels().findIndex((model) => model.key === currentModel.key))
        : "Assigned to: No property selected";
    el.behaviorSummary.textContent = summaryLabels.length
        ? summaryLabels.join(", ")
        : "No optional parameters selected.";
    el.behaviorChipList.innerHTML = [
        ...selectedEntries.map((entry) => `<span class="behavior-chip">${entry.param}=${entry.value}</span>`),
        ...(customParamCount ? [`<span class="behavior-chip">Custom / Deep-Link</span>`] : []),
    ].join("");
}

function updateBehaviorPreviewLink() {
    const currentModel = getCurrentBehaviorModel();
    const modelId = currentModel ? currentModel.id : "";
    const validModelIdPattern = /^[A-Za-z0-9]{11}$/;

    if (!modelId || !validModelIdPattern.test(modelId)) {
        el.behaviorPreviewLink.href = "#";
        el.behaviorPreviewLink.textContent = currentModel
            ? "Enter a valid Matterport model ID for the selected property to preview its behavior settings."
            : "Add at least one property row to preview these behavior settings.";
        el.behaviorPreviewLink.classList.add("is-disabled");
        return;
    }

    const previewUrl = buildBehaviorPreviewUrl(modelId, state.behavior);
    el.behaviorPreviewLink.href = previewUrl;
    el.behaviorPreviewLink.textContent = previewUrl;
    el.behaviorPreviewLink.classList.remove("is-disabled");
}

function syncBehaviorControls() {
    TOUR_BEHAVIOR_OPTIONS.forEach((option) => {
        const checkbox = el.behaviorGroups.querySelector(`[data-behavior-key="${option.key}"]`);
        if (checkbox) {
            checkbox.checked = Boolean(state.behavior[option.key]);
        }

        if (!option.control) {
            return;
        }

        const controlElement = el.behaviorGroups.querySelector(`[data-control-key="${option.control.key}"]`);
        if (!controlElement) {
            return;
        }

        controlElement.value = state.behavior[option.control.key];
        controlElement.disabled = !state.behavior[option.key];
    });

    el.customEmbedParams.value = state.behavior.customParams;
    updateBehaviorModelOptions();
    el.embedParams.value = buildCombinedEmbedParams(state.behavior);
    updateBehaviorSummary();
    updateBehaviorPreviewLink();
}

function updateBehaviorUI() {
    syncBehaviorControls();
}

function setBehaviorModalOpen(isOpen) {
    state.behaviorModalOpen = isOpen;
    el.behaviorModalShell.classList.toggle("is-open", isOpen);
    el.behaviorModalShell.setAttribute("aria-hidden", String(!isOpen));
    document.body.classList.toggle("modal-open", isOpen);
}

function handleBehaviorControlEvent(event) {
    const target = event.target;

    if (!(target instanceof HTMLInputElement) && !(target instanceof HTMLSelectElement)) {
        return;
    }

    const behaviorKey = target.getAttribute("data-behavior-key");
    if (behaviorKey) {
        state.behavior[behaviorKey] = target.checked;
        updateBuilderState();
        return;
    }

    const controlKey = target.getAttribute("data-control-key");
    if (controlKey) {
        state.behavior[controlKey] = target.value;
        updateBuilderState();
    }
}
