// Utility functions for mod handling
async function getFilesFromDirectoryInput(input) {
    if (!input.files || input.files.length === 0) return [];
    return Array.from(input.files);
}

async function extractZipFiles(file) {
    const zip = await JSZip.loadAsync(file);
    const entries = [];
    await Promise.all(
        Object.keys(zip.files).map(async (key) => {
            const entry = zip.files[key];
            if (!entry.dir) {
                const blob = await entry.async("blob");
                const f = new File([blob], key);
                entries.push(f);
            }
        })
    );
    return entries;
}

function onIframeLoaded(iframe, callback) {
    iframe.addEventListener("load", () => callback(iframe.contentWindow));
}

window.LoaderUtils = { getFilesFromDirectoryInput, extractZipFiles, onIframeLoaded };
