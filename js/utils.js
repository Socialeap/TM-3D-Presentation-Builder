function escapeForScript(value) {
    return JSON.stringify(value)
        .replace(/</g, "\\u003c")
        .replace(/>/g, "\\u003e")
        .replace(/&/g, "\\u0026");
}

function formatBytes(byteLength) {
    if (!byteLength) {
        return "0 B";
    }
    const units = ["B", "KB", "MB", "GB"];
    let value = byteLength;
    let unitIndex = 0;
    while (value >= 1024 && unitIndex < units.length - 1) {
        value /= 1024;
        unitIndex += 1;
    }
    return value.toFixed(value >= 10 || unitIndex === 0 ? 0 : 1) + " " + units[unitIndex];
}

function formatVersion(stateValue) {
    return stateValue.major + "." + stateValue.minor;
}

function readVersionState() {
    try {
        const raw = localStorage.getItem(VERSION_STORAGE_KEY);
        if (!raw) {
            return { ...DEFAULT_VERSION_STATE };
        }

        const parsed = JSON.parse(raw);
        const major = Number.isInteger(parsed.major) ? parsed.major : DEFAULT_VERSION_STATE.major;
        const minor = Number.isInteger(parsed.minor) ? parsed.minor : DEFAULT_VERSION_STATE.minor;

        return {
            major,
            minor,
            lastExportedVersion: typeof parsed.lastExportedVersion === "string" ? parsed.lastExportedVersion : "",
            lastExportedAt: typeof parsed.lastExportedAt === "string" ? parsed.lastExportedAt : "",
        };
    } catch (error) {
        return { ...DEFAULT_VERSION_STATE };
    }
}

function buildVersionInfo() {
    const versionState = readVersionState();
    const exportedAt = new Date();
    return {
        major: versionState.major,
        minor: versionState.minor,
        version: formatVersion(versionState),
        exportedAtIso: exportedAt.toISOString(),
        exportedAtLabel: exportedAt.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" }),
        lastExportedVersion: versionState.lastExportedVersion,
        lastExportedAt: versionState.lastExportedAt,
    };
}

function persistNextVersion(currentVersionInfo) {
    const nextState = {
        major: currentVersionInfo.major,
        minor: currentVersionInfo.minor + 1,
        lastExportedVersion: currentVersionInfo.version,
        lastExportedAt: currentVersionInfo.exportedAtIso,
    };
    try {
        localStorage.setItem(VERSION_STORAGE_KEY, JSON.stringify(nextState));
    } catch (error) {
        return;
    }
}

function refreshVersionUI() {
    const versionInfo = buildVersionInfo();
    const latestDate = versionInfo.lastExportedAt
        ? new Date(versionInfo.lastExportedAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })
        : "";

    el.versionDisplay.textContent = "v" + versionInfo.version;
    return versionInfo;
}

function getFileExtension(fileName = "") {
    const lastDot = fileName.lastIndexOf(".");
    return lastDot >= 0 ? fileName.slice(lastDot + 1).toLowerCase() : "";
}

function isSupportedUploadImageFile(file) {
    if (!file) {
        return false;
    }

    const extension = getFileExtension(file.name || "");
    return SUPPORTED_UPLOAD_IMAGE_MIME_TYPES.has(file.type) || SUPPORTED_UPLOAD_IMAGE_EXTENSIONS.has(extension);
}

function assertSupportedUploadImageFile(file, label) {
    if (!file) {
        throw new Error("No " + label + " file was selected.");
    }

    if (!isSupportedUploadImageFile(file)) {
        throw new Error("Please choose a " + SUPPORTED_UPLOAD_IMAGE_LABEL + " file for the " + label + ".");
    }
}

function readFileAsDataUrl(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        let finished = false;

        // Important: Chromium Bug Workaround for Virtual File Systems (e.g. Google Drive/iCloud on Mac)
        // When selecting a dataless cloud file that isn't cached locally yet, the file reader can hang
        // forever silently without throwing an error or resolving. A timeout allows us to catch it.
        const timeoutId = setTimeout(() => {
            if (!finished) {
                finished = true;
                reader.abort();
                reject(new Error("Reading the selected file timed out. This usually happens when the file is stored in Google Drive or iCloud and hasn't finished downloading. Please right-click the file and select 'Download Now', or copy the image to your Desktop first."));
            }
        }, 4000);

        reader.onload = () => {
            if (!finished) {
                finished = true;
                clearTimeout(timeoutId);
                resolve(reader.result);
            }
        };

        reader.onerror = () => {
            if (!finished) {
                finished = true;
                clearTimeout(timeoutId);
                reject(new Error("Unable to read file. If this file is stored in a cloud folder like Google Drive, please make sure it is fully downloaded locally."));
            }
        };

        reader.readAsDataURL(file);
    });
}

function releasePreviewUrl(value) {
    if (value && String(value).startsWith("blob:")) {
        URL.revokeObjectURL(value);
    }
}

function loadImageFromSource(source) {
    return new Promise((resolve, reject) => {
        const image = new Image();
        let settled = false;

        const finalize = (callback) => {
            if (settled) {
                return;
            }
            settled = true;
            image.onload = null;
            image.onerror = null;
            callback();
        };

        image.onload = () => finalize(() => resolve(image));
        image.onerror = () => finalize(() => reject(new Error("This browser could not preview the selected image file.")));
        image.src = source;

        if (image.complete) {
            if (image.naturalWidth > 0) {
                finalize(() => resolve(image));
            } else if (image.naturalWidth === 0) {
                finalize(() => reject(new Error("This browser could not preview the selected image file.")));
            }
        }
    });
}

async function createSquareIconDataUrlFromSource(source, size = 64) {
    const image = await loadImageFromSource(source);
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");

    if (!context) {
        throw new Error("Canvas is not available for favicon processing.");
    }

    const width = image.naturalWidth || image.width;
    const height = image.naturalHeight || image.height;
    const scale = Math.max(size / width, size / height);
    const drawWidth = width * scale;
    const drawHeight = height * scale;
    const offsetX = (size - drawWidth) / 2;
    const offsetY = (size - drawHeight) / 2;

    canvas.width = size;
    canvas.height = size;
    context.clearRect(0, 0, size, size);
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = "high";
    context.drawImage(image, offsetX, offsetY, drawWidth, drawHeight);

    return canvas.toDataURL("image/png");
}

async function createSquareIconDataUrlFromFile(file, size = 64) {
    const dataUrl = await readFileAsDataUrl(file);
    return await createSquareIconDataUrlFromSource(dataUrl, size);
}

async function buildFaviconDataUrlFromFile(file, size = 64) {
    try {
        return await createSquareIconDataUrlFromFile(file, size);
    } catch (error) {
        return await readFileAsDataUrl(file);
    }
}

function hexToRgbChannels(hex) {
    const normalized = hex.replace("#", "");
    const safeHex = normalized.length === 3
        ? normalized.split("").map((value) => value + value).join("")
        : normalized;

    return {
        r: parseInt(safeHex.slice(0, 2), 16),
        g: parseInt(safeHex.slice(2, 4), 16),
        b: parseInt(safeHex.slice(4, 6), 16),
    };
}

function isDarkColor(hex) {
    const channels = hexToRgbChannels(hex);
    const luminance = (0.2126 * channels.r + 0.7152 * channels.g + 0.0722 * channels.b) / 255;
    return luminance <= 0.42;
}
