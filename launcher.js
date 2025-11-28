const modsFolder = 'mods/';
let mods = [];

// Dynamically detect all JS files in mods folder
async function detectMods() {
  // If you have a list or manifest, use it here.
  // For now, manually list mods:
  mods = ['EaglerAPI.js']; // Add other JS mods as needed
  updateModMenu();
}

// Inject mods into iframe before launching client
async function injectMods(iframe) {
  const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;

  for (const mod of mods) {
    const response = await fetch(`${modsFolder}${mod}`);
    const code = await response.text();
    const script = iframeDoc.createElement('script');
    script.textContent = code;
    iframeDoc.body.appendChild(script);
  }
}

// Launch the game
document.getElementById('launchBtn').addEventListener('click', async () => {
  const iframe = document.getElementById('gameFrame');

  // Load the iframe with the WASM client
  iframe.src = 'astra.html';

  // Wait for iframe to load
  iframe.onload = async () => {
    await detectMods();
    await injectMods(iframe);
    console.log('Game launched with mods!');
  };
});

// Restart the game
document.getElementById('restartBtn').addEventListener('click', () => {
  const iframe = document.getElementById('gameFrame');
  iframe.src = '';
  setTimeout(() => { iframe.src = 'astra.html'; }, 100);
});

// Fullscreen toggle
document.getElementById('fullscreenBtn').addEventListener('click', () => {
  const iframe = document.getElementById('gameFrame');
  if (iframe.requestFullscreen) iframe.requestFullscreen();
});

// Mod menu toggle
document.getElementById('modMenuBtn').addEventListener('click', () => {
  document.getElementById('modMenu').style.display = 'block';
});

document.getElementById('closeModMenu').addEventListener('click', () => {
  document.getElementById('modMenu').style.display = 'none';
});

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

// Download full client
document.getElementById('downloadBtn').addEventListener('click', async () => {
  const zip = new JSZip();

  // Add mods
  const modsZip = zip.folder('mods');
  for (const mod of mods) {
    const res = await fetch(`${modsFolder}${mod}`);
    const content = await res.text();
    modsZip.file(mod, content);
  }

  // Add required files
  const files = ['astra.html', 'bootstraps.js', 'assets.epw', 'index.html'];
  for (const f of files) {
    const res = await fetch(f);
    const content = await res.text();
    zip.file(f, content);
  }

  const blob = await zip.generateAsync({type: 'blob'});
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'EaglerFabricClient.zip';
  link.click();
});
