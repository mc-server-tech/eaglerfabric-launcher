let mods = []; // {name, files: {filename: content}, enabled: true}

// Auto-load precommitted mods from manifest
async function loadModsFromFolder() {
  const manifestRes = await fetch('mods/manifest.json');
  if (!manifestRes.ok) return;
  const modFolders = await manifestRes.json();

  for (const folder of modFolders) {
    const folderFiles = {};
    for (const fileName of folder.files) {
      const res = await fetch(`mods/${folder.name}/${fileName}`);
      folderFiles[fileName] = await res.text();
    }
    mods.push({name: folder.name, files: folderFiles, enabled: true});
  }
  updateModMenu();
}

// Import mod folder selected via button
async function importModFiles(fileList) {
  const folderMap = {}; // group files by top folder name
  for (const file of fileList) {
    const relativePath = file.webkitRelativePath || file.name;
    const topFolder = relativePath.split('/')[0];
    if (!folderMap[topFolder]) folderMap[topFolder] = {};
    folderMap[topFolder][relativePath.replace(topFolder + '/', '')] = await file.text();
  }

  for (const folderName of Object.keys(folderMap)) {
    mods.push({name: folderName, files: folderMap[folderName], enabled: true});
  }

  updateModMenu();
}

// Inject enabled mods into WASM client
async function injectMods(iframe) {
  const doc = iframe.contentDocument || iframe.contentWindow.document;

  for (const mod of mods) {
    if (!mod.enabled) continue;
    for (const [filename, content] of Object.entries(mod.files)) {
      const script = doc.createElement('script');
      script.textContent = content;
      doc.body.appendChild(script);
    }
  }
}

// Update mod menu UI
function updateModMenu() {
  const list = document.getElementById('modList');
  list.innerHTML = '';

  mods.forEach((m, idx) => {
    const modDiv = document.createElement('div');
    modDiv.className = 'modItem';

    const toggle = document.createElement('input');
    toggle.type = 'checkbox';
    toggle.checked = m.enabled;
    toggle.addEventListener('change', () => { mods[idx].enabled = toggle.checked; });

    const title = document.createElement('span');
    title.textContent = ' ' + m.name;
    title.style.cursor = 'pointer';

    const fileList = document.createElement('div');
    fileList.className = 'modFiles';
    for (const f of Object.keys(m.files)) {
      const fileDiv = document.createElement('div');
      fileDiv.textContent = f;
      fileList.appendChild(fileDiv);
    }

    title.addEventListener('click', () => {
      fileList.style.display = fileList.style.display === 'none' ? 'block' : 'none';
    });

    modDiv.appendChild(toggle);
    modDiv.appendChild(title);
    modDiv.appendChild(fileList);

    list.appendChild(modDiv);
  });
}

// Launch game
async function launchGame() {
  const iframe = document.getElementById('gameFrame');
  iframe.src = 'astra.html';
  iframe.onload = async () => {
    await injectMods(iframe);
    console.log('Game launched with mods!');
  };
}

// Restart
function restartGame() {
  const iframe = document.getElementById('gameFrame');
  iframe.src = '';
  setTimeout(launchGame, 100);
}

// Fullscreen
function fullscreenGame() {
  const iframe = document.getElementById('gameFrame');
  if (iframe.requestFullscreen) iframe.requestFullscreen();
}

// Download client with all mods
async function downloadClient() {
  const zip = new JSZip();
  const modsZip = zip.folder('mods');

  for (const mod of mods) {
    const folder = modsZip.folder(mod.name);
    for (const [filename, content] of Object.entries(mod.files)) {
      folder.file(filename, content);
    }
  }

  const files = ['astra.html', 'bootstraps.js', 'assets.epw', 'index.html'];
  for (const f of files) {
    const res = await fetch(f);
    const content = await res.text();
    zip.file(f, content);
  }

  const blob = await zip.generateAsync({type:'blob'});
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'EaglerFabricClient.zip';
  link.click();
}

// Event listeners
document.getElementById('importModBtn').addEventListener('change', e => importModFiles(e.target.files));
document.getElementById('launchBtn').addEventListener('click', launchGame);
document.getElementById('restartBtn').addEventListener('click', restartGame);
document.getElementById('fullscreenBtn').addEventListener('click', fullscreenGame);
document.getElementById('modMenuBtn').addEventListener('click', () => {
  document.getElementById('modMenu').style.display = 'block';
});
document.getElementById('closeModMenu').addEventListener('click', () => {
  document.getElementById('modMenu').style.display = 'none';
});

// Initialize
window.addEventListener('DOMContentLoaded', loadModsFromFolder);
