const modsFolder = 'mods/';
let mods = [];

// Load mods dynamically
async function loadMods() {
  // For simplicity, mods are assumed to be JS files in the mods folder
  // You can expand this to read JSON descriptors for each mod if needed
  // Example: EaglerAPI.js, exampleMod.js
  const modFiles = ['EaglerAPI.js']; // Add other mod JS filenames here or auto-detect
  
  for (const file of modFiles) {
    const script = document.createElement('script');
    script.src = `${modsFolder}${file}`;
    document.body.appendChild(script);
    mods.push(file);
  }

  updateModMenu();
}

// Update Mod Menu UI
function updateModMenu() {
  const modList = document.getElementById('modList');
  modList.innerHTML = '';
  mods.forEach(mod => {
    const li = document.createElement('li');
    li.textContent = mod;
    modList.appendChild(li);
  });
}

// Launch the game
document.getElementById('launchBtn').addEventListener('click', () => {
  loadMods(); // Load mods before starting game
  document.getElementById('gameFrame').src = 'astra.html';
});

// Restart the game
document.getElementById('restartBtn').addEventListener('click', () => {
  document.getElementById('gameFrame').src = '';
  setTimeout(() => {
    document.getElementById('gameFrame').src = 'astra.html';
  }, 100);
});

// Fullscreen toggle
document.getElementById('fullscreenBtn').addEventListener('click', () => {
  const iframe = document.getElementById('gameFrame');
  if (iframe.requestFullscreen) iframe.requestFullscreen();
});

// Mod menu toggle
document.getElementById('modMenuBtn').addEventListener('click', () => {
  const menu = document.getElementById('modMenu');
  menu.style.display = 'block';
});

document.getElementById('closeModMenu').addEventListener('click', () => {
  document.getElementById('modMenu').style.display = 'none';
});

// Download client with mods
document.getElementById('downloadBtn').addEventListener('click', async () => {
  const zip = new JSZip();

  // Add mods folder
  const modsZip = zip.folder('mods');
  for (const mod of mods) {
    const response = await fetch(`${modsFolder}${mod}`);
    const content = await response.text();
    modsZip.file(mod, content);
  }

  // Add other necessary files
  const filesToAdd = ['astra.html', 'bootstraps.js', 'assets.epw', 'index.html'];
  for (const f of filesToAdd) {
    const res = await fetch(f);
    const content = await res.text();
    zip.file(f, content);
  }

  // Generate ZIP
  const blob = await zip.generateAsync({type:"blob"});
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'EaglerFabricClient.zip';
  link.click();
});
