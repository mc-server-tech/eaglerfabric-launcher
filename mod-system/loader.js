const EAGLER_MODS = [];

function injectScriptIntoClient(iframe, code) {
    const doc = iframe.contentWindow.document;
    const script = doc.createElement("script");
    script.type = "text/javascript";
    script.textContent = code;
    doc.head.appendChild(script);
}

async function loadModFolder(fileList, iframe) {
    const mod = { id: "", files: [], manifest: null };
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

    for (const jsFile of mod.files) {
        const code = await jsFile.text();
        injectScriptIntoClient(iframe, code);
    }

    EAGLER_MODS.push(mod);
    return mod;
}

window.EaglerLoader = { loadModFolder, EAGLER_MODS };
