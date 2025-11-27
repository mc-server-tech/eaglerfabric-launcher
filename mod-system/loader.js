(function(){
  const mods = [];
  function registerMod(descriptor, main){ mods.push({descriptor, main, enabled:true}); }
  window.EaglerFabric = { registerMod, getMods: ()=>mods };

  window.addEventListener('message', async (ev)=>{
    const msg = ev.data;
    if(!msg || msg.type!=='EAGLERFABRIC_INJECT_MODS') return;
    const modsObj = msg.mods;
    for(const modName of Object.keys(modsObj)){
      const m = modsObj[modName];
      if(m.files['index.js']){
        try{
          const module = await import(m.files['index.js']);
          if(typeof module.default==='function') module.default(window.EaglerFabric);
          registerMod(m.descriptor||{id:modName}, module);
        }catch(e){ console.error('Failed to load mod', modName,e); }
      }
    }
  });

  const menu = document.createElement('div');
  menu.style.position='absolute'; menu.style.top='40px'; menu.style.left='40px';
  menu.style.zIndex='99999'; menu.style.background='rgba(0,0,0,0.8)'; menu.style.color='#fff';
  menu.style.padding='8px'; menu.style.display='none';
  document.body.appendChild(menu);

  window.addEventListener('keydown', e=>{
    if(e.key==='M'){ menu.style.display = menu.style.display==='none'?'block':'none'; renderMenu(); }
  });

  function renderMenu(){
    menu.innerHTML = '<strong>Mods</strong><div id="mod-list"></div>';
    const list = document.getElementById('mod-list');
    list.innerHTML = '';
    mods.forEach((m,i)=>{
      const el = document.createElement('div');
      el.style.marginTop='6px';
      el.innerHTML = `${m.descriptor?.id||'mod'+i} - <button data-idx="${i}">${m.enabled?'Disable':'Enable'}</button>`;
      list.appendChild(el);
    });
    list.querySelectorAll('button').forEach(btn=>{
      btn.onclick = ev=>{
        const i=+ev.target.dataset.idx;
        mods[i].enabled = !mods[i].enabled;
        renderMenu();
      };
    });
  }
})();
