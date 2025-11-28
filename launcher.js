let mods = []; // {name, files: {filename: content}, enabled: true}
let gameFrame = document.getElementById('gameFrame');

// Load precommitted mods from manifest
async function loadModsFromFolder() {
  try {
    const res = await fetch('mods/manifest.json');
    if (!res.ok) return;
    const modFolders = await res.json();
    for (const folder of modFolders) {
      const folderFiles = {};
      for (const fileName of folder.files) {
        const fileRes = await fetch(`mods/${folder.name}/${fileName}`);
        folderFiles[fileName] = await fileRes.text();
      }
      mods.push({name: folder.name, files: folderFiles, enabled: true});
    }
    updateModMenu();
  } catch(e){ console.warn('No preloaded mods'); }
}

// Import mod folders via file picker
async function importModFiles(fileList) {
  const folderMap = {};
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
async function injectMods() {
  const iframeDoc = gameFrame.contentDocument || gameFrame.contentWindow.document;
  for (const mod of mods) {
    if (!mod.enabled) continue;
    for (const [filename, content] of Object.entries(mod.files)) {
      const script = iframeDoc.createElement('script');
      script.textContent = content;
      iframeDoc.body.appendChild(script);
    }
  }
}

// Update mod menu UI
function updateModMenu() {
  const list = document.getElementById('modList');
  list.innerHTML = '';
  mods.forEach((m, idx) => {
    const div = document.createElement('div');
    div.className = 'modItem';
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = m.enabled;
    checkbox.addEventListener('change', () => mods[idx].enabled = checkbox.checked);
    const title = document.createElement('span');
    title.textContent = ' ' + m.name;
    title.style.cursor = 'pointer';

    const filesDiv = document.createElement('div');
    filesDiv.className = 'modFiles';
    for (const f of Object.keys(m.files)) {
      const fileDiv = document.createElement('div');
      fileDiv.textContent = f;
      filesDiv.appendChild(fileDiv);
    }

    title.addEventListener('click', () => {
      filesDiv.style.display = filesDiv.style.display === 'none' ? 'block' : 'none';
    });

    div.appendChild(checkbox);
    div.appendChild(title);
    div.appendChild(filesDiv);
    list.appendChild(div);
  });
}

// Launch the WASM client
function launchGame() {
  gameFrame.src = 'astra.html'; // or your WASM HTML
  gameFrame.onload = () => {
    // Delay to ensure WASM runtime is initialized
    setTimeout(async () => {
      await injectMods();
      console.log('Game launched with mods!');
    }, 1000);
  };
}

// Restart
function restartGame() {
  gameFrame.src = '';
  setTimeout(launchGame, 100);
}

// Fullscreen
function fullscreenGame() {
  if (gameFrame.requestFullscreen) gameFrame.requestFullscreen();
}

// Download client with mods
async function downloadClient() {
  const zip = new JSZip();
  const modsZip = zip.folder('mods');
  for (const mod of mods) {
    const folder = modsZip.folder(mod.name);
    for (const [filename, content] of Object.entries(mod.files)) {
      folder.file(filename, content);
    }
  }

  const files = ['astra.html','bootstraps.js','assets.epw','index.html'];
  for (const f of files) {
    try {
      const res = await fetch(f);
      zip.file(f, await res.text());
    } catch(e){ console.warn(`Missing file: ${f}`); }
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
