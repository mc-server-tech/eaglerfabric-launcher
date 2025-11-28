let mods = []; // {name, code}

async function loadZipMod(file) {
  const zip = await JSZip.loadAsync(file);
  zip.forEach((path, entry) => {
    entry.async('string').then(content => {
      mods.push({name: path, code: content});
      updateModMenu();
    });
  });
}

document.getElementById('importMod').addEventListener('change', async (e) => {
  const files = e.target.files;
  for (const file of files) {
    if (file.name.endsWith('.zip')) {
      await loadZipMod(file);
    } else if (file.name.endsWith('.js')) {
      const text = await file.text();
      mods.push({name: file.name, code: text});
      updateModMenu();
    }
  }
});

// Update mod menu UI
function updateModMenu() {
  const list = document.getElementById('modList');
  list.innerHTML = '';
  mods.forEach(m => {
    const li = document.createElement('li');
    li.textContent = m.name;
    list.appendChild(li);
  });
}

// Inject mods into iframe before starting game
async function injectMods(iframe) {
  const doc = iframe.contentDocument || iframe.contentWindow.document;
  mods.forEach(mod => {
    const script = doc.createElement('script');
    script.textContent = mod.code;
    doc.body.appendChild(script);
  });
}

// Launch game
document.getElementById('launchBtn').addEventListener('click', async () => {
  const iframe = document.getElementById('gameFrame');
  iframe.src = 'astra.html';
  iframe.onload = async () => {
    await injectMods(iframe);
    console.log('Game launched with mods!');
  };
});

// Restart
document.getElementById('restartBtn').addEventListener('click', () => {
  const iframe = document.getElementById('gameFrame');
  iframe.src = '';
  setTimeout(() => { iframe.src = 'astra.html'; }, 100);
});

// Fullscreen
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

// Download client with mods
document.getElementById('downloadBtn').addEventListener('click', async () => {
  const zip = new JSZip();
  const modsZip = zip.folder('mods');
  mods.forEach(m => modsZip.file(m.name, m.code));

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
