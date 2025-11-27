const folderPicker = document.getElementById('folderPicker');
const btnScan = document.getElementById('btnScan');
const btnPlay = document.getElementById('btnPlay');
const btnDownload = document.getElementById('btnDownload');
const modListDiv = document.getElementById('modList');
const iframe = document.getElementById('gameFrame');

let uploadedFiles = [];
let modsMap = new Map();

btnScan.onclick = async () => {
  uploadedFiles = Array.from(folderPicker.files || []);
  if (!uploadedFiles.length) { alert('Select a folder'); return; }

  modsMap.clear();
  for (const f of uploadedFiles) {
    const rel = f.webkitRelativePath || f.name;
    const top = rel.split('/')[0];
    if (!modsMap.has(top)) modsMap.set(top, { files: new Map(), descriptor: null });
    modsMap.get(top).files.set(rel.replace(`${top}/`, ''), f);
  }

  for (const [modName, obj] of modsMap) {
    if (obj.files.has('mod.json')) {
      try { obj.descriptor = JSON.parse(await obj.files.get('mod.json').text()); } 
      catch (e) { obj.descriptor = null; }
    }
  }
  renderModList();
};

function renderModList() {
  modListDiv.innerHTML = '';
  for (const [modName, obj] of modsMap) {
    const d = obj.descriptor;
    const el = document.createElement('div');
    el.style.marginBottom = '6px';
    el.innerHTML = `<strong>${d?.id||modName}</strong> <small>${d?.version||''}</small>
      <div><button data-mod="${modName}" class="btnRemove">Remove</button></div>`;
    modListDiv.appendChild(el);
  }
  for (const b of document.getElementsByClassName('btnRemove')) {
    b.onclick = (ev) => {
      modsMap.delete(ev.target.dataset.mod);
      renderModList();
    };
  }
}

btnPlay.onclick = async () => {
  if (modsMap.size === 0) { alert('No mods added'); return; }

  const modsPayload = {};
  for (const [modName, obj] of modsMap) {
    modsPayload[modName] = { files: {}, descriptor: obj.descriptor || {} };
    for (const [relPath, file] of obj.files) {
      const blobUrl = URL.createObjectURL(file.slice());
      modsPayload[modName].files[relPath] = blobUrl;
    }
  }

  iframe.contentWindow.postMessage({ type: 'EAGLERFABRIC_INJECT_MODS', mods: modsPayload }, '*');
  alert('Mods sent to client iframe. Press M in-game to open Mod Menu.');
};

btnDownload.onclick = async () => {
  const zip = new JSZip();

  async function addFile(url, pathInZip) {
    const resp = await fetch(url);
    if (resp.ok) zip.file(pathInZip, await resp.arrayBuffer());
  }
  await addFile('eagler-client/EaglerCraft_1.12_Offline_en_US.html', 'eagler-client/EaglerCraft_1.12_Offline_en_US.html');

  for (const [modName, obj] of modsMap) {
    const modFolder = zip.folder(`mods/${modName}`);
    for (const [relPath, file] of obj.files) {
      modFolder.file(relPath, await file.arrayBuffer());
    }
  }

  const content = await zip.generateAsync({ type: 'blob' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(content);
  a.download = 'eaglerfabric_with_mods.zip';
  a.click();
};
