const uploadMod = document.getElementById("uploadMod");
const injectBtn = document.getElementById("injectModsBtn");
const downloadBtn = document.getElementById("downloadAllBtn");
const modMenuDiv = document.getElementById("modMenu");
const statusEl = document.getElementById("status");
const iframe = document.getElementById("clientFrame").contentWindow;

let modsList = [];

// Helper to sanitize mod names
function safeName(name) { return name.replace(/[^a-zA-Z0-9._-]/g, "_"); }

// Load built-in mods (EaglerAPI first)
async function loadBuiltInMods() {
    const builtIns = ["eaglerapi", "sodium", "lithium", "replay"];
    for (const modId of builtIns) {
        modsList.push({
            id: modId,
            folder: `mods/${modId}`,
            name: modId,
            enabled: true
        });
    }
    updateModMenu();
}

// Inject uploaded mods (.zip or folder)
injectBtn.addEventListener("click", async () => {
    if (!uploadMod.files.length) { statusEl.innerText="Select a file!"; return; }
    statusEl.innerText = "Injecting mods...\n";

    for (const file of uploadMod.files) {
        try {
            const arrayBuffer = await file.arrayBuffer();
            const zip = await JSZip.loadAsync(arrayBuffer);
            const modId = safeName(file.name.replace(/\.zip|\.jar$/i, ""));
            const files = {};

            for (const k of Object.keys(zip.files)) {
                if (!zip.files[k].dir) files[k] = await zip.files[k].async("string");
            }

            modsList.push({id: modId, folder: null, files, enabled: true});
            statusEl.innerText += `Injected: ${modId}\n`;
        } catch(e){ statusEl.innerText += `Error with ${file.name}: ${e.message}\n`; }
    }
    updateModMenu();
});

// Update Mod Menu UI
function updateModMenu() {
    modMenuDiv.innerHTML = "";
    for (const mod of modsList) {
        const div = document.createElement("div");
        div.className = "mod-entry";
        div.innerHTML = `<span>${mod.name}</span>
                         <button onclick="toggleMod('${mod.id}')">${mod.enabled?'Disable':'Enable'}</button>`;
        modMenuDiv.appendChild(div);
    }
}

// Toggle mod on/off
function toggleMod(modId) {
    const mod = modsList.find(m=>m.id===modId);
    if (!mod) return;
    mod.enabled = !mod.enabled;
    updateModMenu();
}

// Download single playable HTML
downloadBtn.addEventListener("click", async () => {
    statusEl.innerText = "Generating playable HTML...";
    let htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>EaglerFabric Launcher - With Mods</title>
</head>
<body>
<iframe id="clientFrame" src="Eaglercraft_1.12_Offline_en_US.html" width="100%" height="600px"></iframe>
<script>
`;

    // Inject EaglerAPI first
    const eaglerapiMod = modsList.find(m=>m.id==="eaglerapi");
    if(eaglerapiMod){
        if(eaglerapiMod.files){
            for(const path in eaglerapiMod.files){
                htmlContent += `\n/* ${path} */\n` + eaglerapiMod.files[path] + "\n";
            }
        }
    }

    // Inject all other enabled mods
    for(const mod of modsList){
        if(!mod.enabled || mod.id==="eaglerapi") continue;
        if(mod.files){
            for(const path in mod.files){
                htmlContent += `\n/* ${path} */\n` + mod.files[path] + "\n";
            }
        }
    }

    htmlContent += "\n</script>\n</body>\n</html>";

    const blob = new Blob([htmlContent], {type:"text/html"});
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "EaglerFabric_With_Mods.html";
    a.click();
    statusEl.innerText = "Playable HTML ready!";
});

// Initialize
loadBuiltInMods();
