(async function () {
  // ---------- DOM ----------
  const $ = (sel, el = document) => el.querySelector(sel);

  const q = $('#q');
  const force = $('#forceNo');
  const grid = $('#grid');
  const stats = $('#stats');
  const tpl = $('#card-tpl');

  const modeAnd = $('#modeAnd');
  const btnClear = $('#btnClear');
  const btnExport = $('#btnExport');
  const langSel = $('#lang');

  // Sidebar
  const filtersLeft = $('#filtersLeft');
  const facetSearch = $('#facetSearch');
  const facetList = $('#facetList');
  const presetBar = $('#presetBar');
  const btnSelectAll = $('#btnSelectAll');
  const btnSelectNone = $('#btnSelectNone');
  const btnDrawer = $('#btnDrawer');

  // ---------- Konstanter ----------
  const UNT_TAG = 'Uten kategori';
  const UNCATEG_EN = 'Uncategorized';

  // Visnings-etiketter for tags (NO/EN)
  const TAG_LABELS = {
    "Koding & Dev": { no:"Koding & Dev", en:"Coding & Dev" },
    "Data & analyse": { no:"Data & analyse", en:"Data & Analytics" },
    "SEO": { no:"SEO", en:"SEO" },
    "E-post & kommunikasjon": { no:"E-post & kommunikasjon", en:"Email & Communication" },
    "Juridisk/Policy": { no:"Juridisk/Policy", en:"Legal/Policy" },
    "Prosjekt & produkt": { no:"Prosjekt & produkt", en:"Project & Product" },
    "Læring & undervisning": { no:"Læring & undervisning", en:"Learning & Teaching" },
    "Sosiale medier & markedsføring": { no:"Sosiale medier & markedsføring", en:"Social Media & Marketing" },
    "Design & UX": { no:"Design & UX", en:"Design & UX" },
    "Spill & hobby": { no:"Spill & hobby", en:"Games & Hobby" },
    "Helse & livsstil": { no:"Helse & livsstil", en:"Health & Lifestyle" },
    "Reise": { no:"Reise", en:"Travel" },
    "Kreativt innhold": { no:"Kreativt innhold", en:"Creative Content" },
    "Jobb & karriere (HR)": { no:"Jobb & karriere (HR)", en:"Jobs & Career (HR)" },
    "Coaching & personlig utvikling": { no:"Coaching & personlig utvikling", en:"Coaching & Personal Growth" },
    "Sport & underholdning": { no:"Sport & underholdning", en:"Sports & Entertainment" },
    "Mat & drikke": { no:"Mat & drikke", en:"Food & Drink" },
    "Eksperimentelt/lek": { no:"Eksperimentelt/lek", en:"Experimental/Play" },
    "Meta / AI": { no:"Meta / AI", en:"Meta / AI" },
    "Forskning & språk": { no:"Forskning & språk", en:"Research & Language" },
  };

  const PRESETS = [
    { id:'preset-writing',   labelNo:'Skriving + SoMe', labelEn:'Writing + Social', tags:["Skriving & innhold","Sosiale medier & markedsføring"] },
    { id:'preset-dev',       labelNo:'Koding + Data',   labelEn:'Code + Data',      tags:["Koding & Dev","Data & analyse"] },
    { id:'preset-learning',  labelNo:'Læring + Prosjekt', labelEn:'Learning + Product', tags:["Læring & undervisning","Prosjekt & produkt"] },
    { id:'preset-design',    labelNo:'Design + SEO',    labelEn:'Design + SEO',     tags:["Design & UX","SEO"] },
  ];

  // ---------- State ----------
  let data = [];
  let tagRules = {};
  let allTags = [];
  let activeTags = new Set();
  let mode = 'or';
  let lang = 'no';
  let facetFilter = ''; // søk i kategorier

  // ---------- Utils ----------
  const norm = (s) => (s || '').toLowerCase().normalize('NFKD');
  const label = (tag) => TAG_LABELS[tag] ? (lang === 'en' ? TAG_LABELS[tag].en : TAG_LABELS[tag].no) : tag;
  const labelUncat = (n) => (lang === 'en' ? `${UNCATEG_EN} (${n})` : `${UNT_TAG} (${n})`);

  function toast(msg) {
    const div = document.createElement('div');
    div.textContent = msg;
    Object.assign(div.style, {
      position:'fixed', bottom:'16px', left:'50%', transform:'translateX(-50%)',
      padding:'8px 12px', background:'#182028', border:'1px solid #2a394a',
      borderRadius:'10px', color:'#e7edf3', zIndex: 9999
    });
    document.body.appendChild(div);
    setTimeout(() => div.remove(), 900);
  }
  function copyText(text) {
    navigator.clipboard.writeText(text).then(()=>toast('Kopiert!'),()=>{
      const ta=document.createElement('textarea');ta.value=text;document.body.appendChild(ta);
      ta.select();document.execCommand('copy');ta.remove();toast('Kopiert!');
    });
  }

  // Språkstyrte felt
  const getTitle = (item) =>
    lang === 'en' ? (item.act_en || item.act_no || item.act || '') : (item.act_no || item.act_en || item.act || '');
  const getBody = (item) =>
    lang === 'en' ? (item.prompt_en || item.prompt_no || item.prompt || '') : (item.prompt_no || item.prompt_en || item.prompt || '');

  // Tagging – bruker begge språk
  async function loadTagRules(){ try{ const r=await fetch('./assets/tags-map.json'); return await r.json(); } catch{ return {}; } }
  function buildRegex(str){ const parts=String(str).split('|').map(s=>s.trim()).filter(Boolean);
    const esc=p=>p.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'); const tokens=parts.map(p=>`\\b${esc(p)}\\b`); return new RegExp(`(${tokens.join('|')})`,'i'); }
  const TITLE_BONUS=1, MAX_TAGS=3;
  const DENY={ "Spill & hobby":[/design\b/i,/\bpost\b/i] };
  const PRIORITY={
    "Koding & Dev":100, "Data & analyse":95, "SEO":90, "E-post & kommunikasjon":85, "Juridisk/Policy":85,
    "Prosjekt & produkt":80, "Læring & undervisning":65, "Sosiale medier & markedsføring":70, "Design & UX":60,
    "Spill & hobby":50, "Helse & livsstil":50, "Reise":40, "Kreativt innhold":60, "Jobb & karriere (HR)":75,
    "Coaching & personlig utvikling":70, "Sport & underholdning":55, "Mat & drikke":50, "Eksperimentelt/lek":45,
    "Meta / AI":80, "Forskning & språk":70
  };
  function scoreWithThreshold(hTitle,hBody,rules,thr){
    const scores={};
    for (const [kw,tag] of Object.entries(rules)){
      if (DENY[tag] && DENY[tag].some(re=>re.test(hTitle)||re.test(hBody))) continue;
      const rx=buildRegex(kw); let hits=0;
      const bm=hBody.match(new RegExp(rx.source,'gi')); if (bm) hits+=bm.length;
      const tm=hTitle.match(new RegExp(rx.source,'gi')); if (tm) hits+=tm.length+TITLE_BONUS;
      if (hits>=thr) scores[tag]=(scores[tag]||0)+hits;
    }
    return Object.entries(scores).map(([t,s])=>[t,s+(PRIORITY[t]||0)]).sort((a,b)=>b[1]-a[1]).slice(0,MAX_TAGS).map(x=>x[0]);
  }
  function inferTags(item,rules){
    if (Array.isArray(item.tags) && item.tags.length) return item.tags;
    const titleAll=[item.act_no,item.act_en,item.act].filter(Boolean).join(' ').toLowerCase();
    const bodyAll=[item.prompt_no,item.prompt_en,item.prompt].filter(Boolean).join('\n').toLowerCase();
    let tags=scoreWithThreshold(titleAll,bodyAll,rules,2);
    if (tags.length) return tags;
    tags=scoreWithThreshold(titleAll,bodyAll,rules,1);
    return tags.length ? tags : ['Eksperimentelt/lek'];
  }

  // URL-state
  function parseURLState(){
    const u=new URL(location.href), qp=u.searchParams;
    return {
      q: qp.get('q')||'',
      tags: (qp.get('tags')||'').split(',').map(s=>s.trim()).filter(Boolean),
      mode: (qp.get('mode')||'or').toLowerCase()==='and'?'and':'or',
      lang: (qp.get('lang')||'no').toLowerCase()==='en'?'en':'no'
    };
  }
  function pushURLState({ qVal, tags, mode, lang }){
    const u=new URL(location.href), qp=u.searchParams;
    qVal?qp.set('q',qVal):qp.delete('q');
    (tags&&tags.length)?qp.set('tags',tags.join(',')):qp.delete('tags');
    qp.set('mode',mode==='and'?'and':'or');
    qp.set('lang',lang==='en'?'en':'no');
    history.replaceState({},'',`${u.pathname}?${qp.toString()}`);
  }

  // Facet rendering
  function computeCounts(list){
    const m = Object.fromEntries(allTags.map(t=>[t,0]));
    list.forEach(i => (i.tags||[]).forEach(t => { if (m[t]!==undefined) m[t]++; }));
    const none = list.reduce((acc,i)=>acc+((i.tags&&i.tags.length)?0:1),0);
    m[UNT_TAG]=none;
    return m;
  }

  function renderFacetList(counts){
    facetList.innerHTML='';
    // Sortering: valgte først -> flest treff -> alfabetisk
    const items = allTags
      .filter(t => t !== UNT_TAG || (counts[UNT_TAG] || 0) > 0) // skjul "Uten kategori" når 0
      .filter(t => !facetFilter || norm(label(t)).includes(norm(facetFilter)))
      .map(t => ({ tag:t, lbl:label(t), cnt:counts[t]||0, sel:activeTags.has(t) }))
      .sort((a,b) => (b.sel - a.sel) || (b.cnt - a.cnt) || a.lbl.localeCompare(b.lbl,'nb'));

    for (const it of items){
      const row = document.createElement('label');
      row.className = 'facet-item';
      row.innerHTML = `
        <input type="checkbox" ${it.sel?'checked':''} data-tag="${it.tag}"/>
        <span>${it.lbl}</span>
        <span class="count">${it.cnt}</span>
      `;
      facetList.appendChild(row);
    }
  }

  function renderPresets(){
    presetBar.innerHTML='';
    PRESETS.forEach(p => {
      const b=document.createElement('button');
      b.className='preset';
      b.textContent = (lang==='en'?p.labelEn:p.labelNo);
      b.addEventListener('click', () => {
        activeTags = new Set(p.tags);
        doFilter(true);
      });
      presetBar.appendChild(b);
    });
  }

  // Cards
  function renderCards(list){
    grid.innerHTML='';
    stats.textContent = `${list.length} av ${data.length} treff`;
    const frag=document.createDocumentFragment();
    list.forEach(item=>{
      const node=tpl.content.cloneNode(true);
      $('.title',node).textContent=getTitle(item);

      const tagsWrap=$('.tags',node);
      (item.tags||[]).forEach(t=>{
        const sp=document.createElement('span'); sp.className='tag'; sp.textContent=label(t);
        sp.title = `Filtrer på: ${label(t)}`;
        sp.addEventListener('click',()=>{ activeTags.has(t)?activeTags.delete(t):activeTags.add(t); doFilter(true); });
        tagsWrap.appendChild(sp);
      });

      const bodyText=getBody(item);
      $('.prompt',node).textContent=bodyText;

      // Sett knappetekster etter språk
      const btnCopy=$('.copy',node), btnIns=$('.insert',node);
      btnCopy.textContent = (lang === 'en') ? 'Copy' : 'Kopier';
      btnIns.textContent  = (lang === 'en') ? 'Copy' : 'Kopier + “Svar på norsk”';

      // Handling
      btnCopy.addEventListener('click',()=>copyText(bodyText));
      btnIns.addEventListener('click',()=>{
        const base=bodyText.trim(); const needsDot=!/[.!?]\s*$/.test(base);
        const text=(lang==='no' && force.checked) ? base + (needsDot?'.':'') + ' Svar på norsk.' : base;
        copyText(text);
      });

      frag.appendChild(node);
    });
    grid.appendChild(frag);
  }

  function applyTagFilter(list){
    if (!activeTags.size) return list;
    const a=Array.from(activeTags), wantsNone=a.includes(UNT_TAG), other=a.filter(t=>t!==UNT_TAG);
    return list.filter(it=>{
      const has=new Set(it.tags||[]); const matchNone=wantsNone?(has.size===0):false;
      if (mode==='and') { const ok=other.every(t=>has.has(t)); return wantsNone ? (matchNone && ok) : ok; }
      const ok = other.length ? other.some(t=>has.has(t)) : false;
      return matchNone || ok;
    });
  }

  function doFilter(updateURL){
    const qVal=norm(q.value);
    // 1) søk
    let searchList=data;
    if (qVal) searchList = data.filter(it => norm(getTitle(it)).includes(qVal) || norm(getBody(it)).includes(qVal));
    // 2) counts + facets
    const counts=computeCounts(searchList);
    renderFacetList(counts);
    // 3) kategori-filter
    const finalList = applyTagFilter(searchList);
    // 4) render
    renderCards(finalList);
    // 5) URL
    if (updateURL) pushURLState({ qVal:q.value, tags:Array.from(activeTags), mode, lang });
  }

  // ---------- Init ----------
  try{
    const res=await fetch('./assets/prompts.json'); data=await res.json();
    tagRules=await loadTagRules();
    data=data.map(it=>({ ...it, tags:(Array.isArray(it.tags)&&it.tags.length)?it.tags:inferTags(it,tagRules) }));
    const fromRules=Array.from(new Set(Object.values(tagRules)));
    allTags = fromRules.sort((a,b)=>a.localeCompare(b,'nb'));
    allTags.push(UNT_TAG);
  }catch(e){ console.error('Kunne ikke laste filer',e); data=[]; allTags=[]; }

  // URL -> state
  const st=parseURLState();
  q.value=st.q||''; mode=st.mode||'or'; lang=st.lang||'no';
  modeAnd.checked=(mode==='and'); if (langSel) langSel.value=lang;
  renderPresets();

  // Events
  let tId;
  q.addEventListener('input',()=>{ clearTimeout(tId); tId=setTimeout(()=>doFilter(true),120); });
  modeAnd.addEventListener('change',()=>{ mode=modeAnd.checked?'and':'or'; doFilter(true); });
  if (langSel){ langSel.addEventListener('change',()=>{ lang=(langSel.value==='en')?'en':'no'; renderPresets(); doFilter(true); }); }
  facetSearch.addEventListener('input',()=>{ facetFilter=facetSearch.value; doFilter(false); });

  facetList.addEventListener('change',(e)=>{
    const cb=e.target.closest('input[type="checkbox"]'); if (!cb) return;
    const t=cb.dataset.tag; if (!t) return;
    if (cb.checked) activeTags.add(t); else activeTags.delete(t);
    // Lukk drawer på mobil for snappier UX
    if (window.innerWidth <= 980) filtersLeft.classList.remove('open');
    doFilter(true);
  });
  btnSelectAll.addEventListener('click',()=>{ activeTags=new Set(allTags.filter(t=>t!==UNT_TAG)); doFilter(true); });
  btnSelectNone.addEventListener('click',()=>{ activeTags.clear(); doFilter(true); });

  btnClear.addEventListener('click',()=>{ activeTags.clear(); mode='or'; modeAnd.checked=false; q.value=''; facetSearch.value=''; facetFilter=''; doFilter(true); });
  btnExport.addEventListener('click',()=>{
    const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
    const url=URL.createObjectURL(blob); const a=document.createElement('a');
    a.href=url; a.download='prompts-tagget.json'; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(()=>URL.revokeObjectURL(url),1000);
  });

  btnDrawer?.addEventListener('click',()=>{ filtersLeft.classList.toggle('open'); });

  // Første render
  doFilter(false);
  pushURLState({ qVal:q.value, tags:Array.from(activeTags), mode, lang });
})();
