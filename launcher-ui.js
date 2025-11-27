const status = document.getElementById("status");
const modUpload = document.getElementById("modUpload");
const playBtn = document.getElementById("playBtn");
const modListUL = document.getElementById("modList");

// Loaded mods in memory
let loadedMods = [];

// Handle mod folder upload
modUpload.addEventListener("change", async (event) => {
    const files = Array.from(event.target.files);
    status.textContent = `Loading ${files.length} files...`;
    loadedMods = [];
    modListUL.innerHTML = "";

    // Group files by top-level folder (mod folder)
    const modsMap = {};

    for (const file of files) {
        const relPath = file.webkitRelativePath || file.name;
        const topFolder = relPath.split("/")[0];
        if (!modsMap[topFolder]) modsMap[topFolder] = [];
        modsMap[topFolder].push(file);
    }

    // Process each mod folder
    for (const modName in modsMap) {
        const modFiles = modsMap[modName];
        const mod = { name: modName, files: [] };

        for (const file of modFiles) {
            const content = await file.arrayBuffer();
            mod.files.push({ path: file.webkitRelativePath || file.name, content });
        }

        loadedMods.push(mod);

        // Add to ModMenu UI
        const li = document.createElement("li");
        li.textContent = modName;
        modListUL.appendChild(li);
    }

    status.textContent = `Loaded ${loadedMods.length} mod(s).`;
});

// Play button logic
playBtn.addEventListener("click", () => {
    status.textContent = "Initializing EaglerFabric WASM client...";

    // Ensure EaglerAPI is available
    if (!window.EaglerAPI) {
        status.textContent = "EaglerAPI not loaded! Check api/api.js";
        return;
    }

    // Inject mods in order: EaglerAPI first
    console.log("Injecting EaglerAPI...");
    if (window.EaglerAPI.init) window.EaglerAPI.init();

    loadedMods.forEach(mod => {
        console.log(`Injecting mod: ${mod.name}`);
        mod.files.forEach(f => {
            // If JS file, inject as script
            if (f.path.endsWith(".js")) {
                const blob = new Blob([f.content], { type: "application/javascript" });
                const script = document.createElement("script");
                script.src = URL.createObjectURL(blob);
                document.body.appendChild(script);
            }
            // Assets / configs could be handled here
        });
    });

    // Launch WASM client in iframe
    const existingIframe = document.getElementById("eaglerClient");
    if (existingIframe) existingIframe.remove();

    const iframe = document.createElement("iframe");
    iframe.id = "eaglerClient";
    iframe.src = "Eaglercraft_1.12_Offline_en_US.html"; // Your WASM HTML client
    iframe.width = "100%";
    iframe.height = "800px";
    iframe.style.border = "none";
    document.body.appendChild(iframe);

    status.textContent = "Game launched!";
});
