// =========================
// Eagler Mod Loader (Full)
// =========================

// Stores loaded mods
const EAGLER_MODS = [];

// Inject script into iframe client
function injectScriptIntoClient(iframe, code) {
    const doc = iframe.contentWindow.document;
    const script = doc.createElement("script");
    script.type = "text/javascript";
    script.textContent = code;
    doc.head.appendChild(script);
}

// Load a mod folder
async function loadModFolder(fileList, iframe) {
    const mod = {
        id: "",
        files: [],
        manifest: null
    };

    // Scan through zip input or folder input
    for (const file of fileList) {
        const path = file.webkitRelativePath || file.name;

        if (path.endsWith("mod.json")) {
            const text = await file.text();
            mod.manifest = JSON.parse(text);
            mod.id = mod.manifest.id;
        } else if (path.endsWith(".js")) {
            mod.files.push(file);
        }
    }

    if (!mod.manifest) {
        alert("Invalid mod: missing mod.json");
        return;
    }

    // Read each JS file and inject to iframe
    for (const jsFile of mod.files) {
        const code = await jsFile.text();
        injectScriptIntoClient(iframe, code);
    }

    // Register mod
    EAGLER_MODS.push(mod);

    console.log(`Loaded mod: ${mod.manifest.id}`);
    return mod;
}

// === Attach to UI ===
window.EaglerLoader = {
    loadModFolder,
    EAGLER_MODS
};
