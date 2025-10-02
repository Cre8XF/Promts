// app.js med full språkstøtte (EN/NO) og optimaliseringer (lazy + cache)

// Helpers
function $(sel, el=document){ return el.querySelector(sel) }
function $all(sel, el=document){ return [...el.querySelectorAll(sel)] }

function copy(text){
  navigator.clipboard.writeText(text).then(()=>{
    toast(t("copied"));
  }).catch(()=>alert("Could not copy"));
}

function toast(msg){
  let el = document.createElement('div');
  el.className = 'toast';
  el.textContent = msg;
  Object.assign(el.style,{
    position:'fixed', left:'50%', transform:'translateX(-50%)',
    bottom:'24px', padding:'10px 14px', background:'#111827',
    border:'1px solid #334155', borderRadius:'10px', color:'#e6eef7',
    zIndex:9999
  });
  document.body.appendChild(el);
  setTimeout(()=> el.remove(), 1500);
}

function getParam(name){ return new URL(location).searchParams.get(name) }
function setParams(obj){
  const url = new URL(location);
  for(const [k,v] of Object.entries(obj)){
    if(v==null || v==="") url.searchParams.delete(k);
    else url.searchParams.set(k, v);
  }
  history.replaceState(null,"", url);
}

// Translations
const TRANSLATIONS = {
  en: {
    categories: "Categories",
    subcategories: "Subcategories",
    search: "Search (title, text, tags)",
    showAll: "Show All",
    favoritesOnly: "Favorites only",
    language: "Language:",
    reset: "Reset filters",
    view: "View",
    copy: "Copy",
    copied: "Copied to clipboard",
    infoBanner: "⚡ Tip: For best results, it is recommended to use English prompts."
  },
  no: {
    categories: "Kategorier",
    subcategories: "Underkategorier",
    search: "Søk (tittel, tekst, tagger)",
    showAll: "Vis alle",
    favoritesOnly: "Bare favoritter",
    language: "Språk:",
    reset: "Nullstill filter",
    view: "Vis",
    copy: "Kopier",
    copied: "Kopiert til utklippstavle",
    infoBanner: "⚡ Tips: For best resultat anbefales det å bruke engelske prompts."
  }
};

function t(key){
  const lang = STATE.lang || 'en';
  return TRANSLATIONS[lang][key] || TRANSLATIONS['en'][key];
}

// State
const STATE = {
  q: getParam('q') || '',
  cat: getParam('cat') || '',
  sub: getParam('sub') || '',
  favOnly: (getParam('fav') || localStorage.getItem('fav') || '0') === '1',
  data: [],
  favs: new Set(JSON.parse(localStorage.getItem('favs')||'[]')),
  lang: localStorage.getItem('lang') || 'en'
};

// UI refs
const UI = {
  categoryList: $('#categoryList'),
  subcategoryList: $('#subcategoryList'),
  breadcrumbs: $('#breadcrumbs'),
  resetBtn: $('#resetFilters'),
  cards: $('#cards'),
  search: $('#search'),
  favToggle: $('#favToggle'),
  langSelect: $('#langSelect'),
  dialog: $('#promptDialog'),
  dlgTitle: $('#dlgTitle'),
  dlgBody: $('#dlgBody'),
  dlgClose: $('#dlgClose'),
  copyBtn: $('#copyPrompt')
};

// In-memory cache for JSON
let DATA_CACHE = null;

// Init
init().catch(err => {
  console.error(err);
  toast('Failed to load data');
});

async function init(){
  if (UI.search) UI.search.value = STATE.q;
  if (UI.favToggle) UI.favToggle.checked = STATE.favOnly;
  if (UI.langSelect) UI.langSelect.value = STATE.lang;
  wireControls();

  if(!UI.cards) return; // ikke last JSON hvis vi ikke har cards-container

  try{
    if(!DATA_CACHE){
      const res = await fetch('assets/data/prompts.json', {cache:'force-cache'});
      DATA_CACHE = await res.json();
    }
    STATE.data = DATA_CACHE;
  }catch{
    toast('Failed to load prompts.json');
    return;
  }

  renderNav();
  renderSubnav();
  renderCards();
}

// === Update UI texts based on current language ===
function updateUITexts(){
  $("#infoBanner").textContent = t("infoBanner");
  if (UI.search) UI.search.placeholder = t("search");
  $("#favLabel span").textContent = t("favoritesOnly");
  $("#langLabel").textContent = t("language");
}

function wireControls(){
  updateUITexts();

  if(UI.search){
    UI.search.addEventListener('input', e=>{
      STATE.q = e.target.value.trim();
      setParams({q:STATE.q});
      renderCards();
    });
  }

  document.addEventListener('keydown', e=>{
    if(e.key === '/'){ e.preventDefault(); UI.search.focus(); }
  });

  if(UI.favToggle){
    UI.favToggle.addEventListener('change', e=>{
      STATE.favOnly = e.target.checked;
      localStorage.setItem('fav', STATE.favOnly?'1':'0');
      setParams({fav: STATE.favOnly?'1':null});
      renderCards();
    });
  }

  if(UI.dlgClose) UI.dlgClose.addEventListener('click', ()=> UI.dialog.close());
  if(UI.copyBtn) UI.copyBtn.addEventListener('click', ()=> copy(UI.dlgBody.textContent||''));

  if(UI.resetBtn){
    UI.resetBtn.addEventListener('click', ()=>{
      STATE.cat = '';
      STATE.sub = '';
      STATE.q = '';
      STATE.favOnly = false;
      if(UI.search) UI.search.value = '';
      if(UI.favToggle) UI.favToggle.checked = false;
      setParams({cat:null, sub:null, q:null, fav:null});
      renderNav(); renderSubnav(); renderCards();
    });
  }

  if(UI.langSelect){
    UI.langSelect.addEventListener('change', e=>{
      STATE.lang = e.target.value;
      localStorage.setItem('lang', STATE.lang);
      updateUITexts();
      renderNav(); renderSubnav(); renderCards();
    });
  }
}

function getCategories(){
  const map = new Map();
  for(const d of STATE.data){
    const lang = STATE.lang;
    const cat = typeof d.category === 'object' ? d.category[lang] : d.category;
    const sub = typeof d.subcategory === 'object' ? d.subcategory[lang] : d.subcategory;
    if(!map.has(cat)) map.set(cat, new Set());
    map.get(cat).add(sub);
  }
  const out = [];
  [...map.keys()].sort((a,b)=>a.localeCompare(b)).forEach(cat=>{
    out.push([cat, [...map.get(cat)].sort((a,b)=>a.localeCompare(b))]);
  });
  return out;
}

function renderNav(){
  if(!UI.categoryList) return;
  UI.categoryList.innerHTML = '';
  const cats = getCategories();
  UI.categoryList.parentElement.querySelector('h2').textContent = t("categories");

  const frag = document.createDocumentFragment();
  for(const [cat, subs] of cats){
    const li = document.createElement('li');
    const btn = document.createElement('button');
    btn.textContent = `${cat} (${subs.length})`;
    btn.classList.toggle('active', STATE.cat===cat);
    btn.addEventListener('click', ()=>{
      STATE.cat = (STATE.cat===cat) ? '' : cat;
      STATE.sub = '';
      setParams({cat:STATE.cat||null, sub:null});
      renderNav(); renderSubnav(); renderCards();
    });
    li.appendChild(btn);
    frag.appendChild(li);
  }
  UI.categoryList.appendChild(frag);
}

function renderSubnav(){
  if(!UI.subcategoryList) return;
  UI.subcategoryList.innerHTML = '';
  const bc = UI.breadcrumbs.querySelector('span');
  bc.textContent = STATE.cat || t("categories");

  // fjern gamle infobokser
  ['catInfo','subInfo'].forEach(id=>{
    const el = document.getElementById(id);
    if(el) el.remove();
  });

  const lang = STATE.lang;

  if (STATE.cat) {
    const catEntry = STATE.data.find(d => {
      const catName = typeof d.category === 'object' ? d.category[lang] : d.category;
      return catName === STATE.cat;
    });
    if (catEntry) {
      const catInfo = document.createElement('div');
      catInfo.id = 'catInfo';
      catInfo.className = 'info-text';
      const desc = typeof catEntry.catDescription === 'object' ? catEntry.catDescription[lang] : catEntry.catDescription;
      catInfo.textContent = desc || '';
      UI.breadcrumbs.appendChild(catInfo);
    }
  }

  if (STATE.sub) {
    const subEntry = STATE.data.find(d => {
      const catName = typeof d.category === 'object' ? d.category[lang] : d.category;
      const subName = typeof d.subcategory === 'object' ? d.subcategory[lang] : d.subcategory;
      return catName === STATE.cat && subName === STATE.sub;
    });
    if (subEntry) {
      const subInfo = document.createElement('div');
      subInfo.id = 'subInfo';
      subInfo.className = 'info-text';
      const desc = typeof subEntry.subDescription === 'object' ? subEntry.subDescription[lang] : subEntry.subDescription;
      subInfo.textContent = desc || '';
      UI.breadcrumbs.appendChild(subInfo);
    }
  }

  UI.resetBtn.textContent = t("reset");
  UI.resetBtn.style.display = (STATE.cat || STATE.sub || STATE.q || STATE.favOnly) ? 'inline-block' : 'none';

  if(!STATE.cat){ return; }

  UI.subcategoryList.parentElement.querySelector('h2').textContent = t("subcategories");

  const cats = getCategories();
  const entry = cats.find(([cat])=>cat===STATE.cat);
  const subs = entry? entry[1] : [];

  const frag = document.createDocumentFragment();
  for(const sub of subs){
    const li = document.createElement('li');
    const btn = document.createElement('button');
    btn.textContent = sub;
    btn.classList.toggle('active', STATE.sub===sub);
    btn.addEventListener('click', ()=>{
      STATE.sub = (STATE.sub===sub) ? '' : sub;
      setParams({sub:STATE.sub||null});
      renderSubnav(); renderCards();
    });
    li.appendChild(btn);
    frag.appendChild(li);
  }
  UI.subcategoryList.appendChild(frag);
}

function filterData(){
  const q = STATE.q.toLowerCase();
  const lang = STATE.lang;

  const inCat = (d)=> {
    const catName = typeof d.category === 'object' ? d.category[lang] : d.category;
    return !STATE.cat || catName === STATE.cat;
  };
  const inSub = (d)=> {
    const subName = typeof d.subcategory === 'object' ? d.subcategory[lang] : d.subcategory;
    return !STATE.sub || subName === STATE.sub;
  };
  const inFav = (d)=> !STATE.favOnly || STATE.favs.has(d.id);

  const textHit = (d)=>{
    if(!q) return true;
    const title = typeof d.title === 'object' ? d.title[lang] : d.title;
    const prompt = typeof d.prompt === 'object' ? d.prompt[lang] : d.prompt;
    const category = typeof d.category === 'object' ? d.category[lang] : d.category;
    const subcategory = typeof d.subcategory === 'object' ? d.subcategory[lang] : d.subcategory;
    const T = [title, prompt, category, subcategory, ...(d.tags||[])].join(' ').toLowerCase();
    return T.includes(q);
  };

  return STATE.data.filter(d=> inCat(d) && inSub(d) && inFav(d) && textHit(d));
}

function renderCards(){
  if(!UI.cards) return;
  const results = filterData();
  UI.cards.innerHTML = '';
  const frag = document.createDocumentFragment();
  for(const d of results){
    frag.appendChild(renderCard(d));
  }
  UI.cards.appendChild(frag);
}

function renderCard(d){
  const lang = STATE.lang;

  const article = document.createElement('article');
  article.className = 'card';

  const h = document.createElement('header');
  h.className = 'card-h';
  const title = document.createElement('h3');
  title.className = 'card-title';
  title.textContent = typeof d.title === 'object' ? d.title[lang] : d.title;
  h.appendChild(title);

  const favBtn = document.createElement('button');
  favBtn.className = 'fav-btn';
  favBtn.textContent = STATE.favs.has(d.id)? '★' : '☆';
  favBtn.classList.toggle('active', STATE.favs.has(d.id));
  favBtn.addEventListener('click', ()=>{
    if(STATE.favs.has(d.id)) STATE.favs.delete(d.id);
    else STATE.favs.add(d.id);
    localStorage.setItem('favs', JSON.stringify([...STATE.favs]));
    favBtn.classList.toggle('active');
    favBtn.textContent = STATE.favs.has(d.id)? '★' : '☆';
  });
  h.appendChild(favBtn);

  article.appendChild(h);

  const meta = document.createElement('div');
  meta.className = 'card-meta';
  const catSpan = document.createElement('span'); 
  catSpan.className = 'pill'; 
  catSpan.textContent = typeof d.category === 'object' ? d.category[lang] : d.category;
  const subSpan = document.createElement('span'); 
  subSpan.className = 'pill'; 
  subSpan.textContent = typeof d.subcategory === 'object' ? d.subcategory[lang] : d.subcategory;
  meta.appendChild(catSpan); 
  meta.appendChild(subSpan);
  article.appendChild(meta);

  const desc = document.createElement('p');
  desc.className = 'card-desc';
  const promptText = typeof d.prompt === 'object' ? d.prompt[lang] : d.prompt;
  desc.textContent = promptText.slice(0,180) + '…';
  article.appendChild(desc);

  const tagsDiv = document.createElement('div');
  tagsDiv.className = 'tags';
  (d.tags||[]).forEach(t=>{
    const span = document.createElement('span');
    span.className = 'tag'; 
    span.textContent = t;
    tagsDiv.appendChild(span);
  });
  article.appendChild(tagsDiv);

  const f = document.createElement('footer');
  f.className = 'card-f';
  const viewBtn = document.createElement('button');
  viewBtn.className = 'btn';
  viewBtn.textContent = t("view");
  viewBtn.addEventListener('click', ()=> openDialog(d));
  f.appendChild(viewBtn);

  const copyBtn = document.createElement('button');
  copyBtn.className = 'btn';
  copyBtn.textContent = t("copy");
  copyBtn.addEventListener('click', ()=> copy(typeof d.prompt === 'object' ? d.prompt[lang] : d.prompt));
  f.appendChild(copyBtn);

  article.appendChild(f);

  return article;
}

function openDialog(d){
  const lang = STATE.lang;
  UI.dlgTitle.textContent = typeof d.title === 'object' ? d.title[lang] : d.title;
  UI.dlgBody.textContent = typeof d.prompt === 'object' ? d.prompt[lang] : d.prompt;
  UI.dialog.showModal();
}
(function () {
        const btn = document.getElementById('sidebarToggle');
        const hamburger = document.getElementById('hamburgerIcon');
        const close = document.getElementById('closeIcon');
        const sidebar = document.querySelector('.layout > aside');

        if (!btn || !sidebar) return;

        // Toggle sidebar open/close
        btn.addEventListener('click', () => {
          document.body.classList.toggle('sidebar-open');
          const isOpen = document.body.classList.contains('sidebar-open');
          hamburger.style.display = isOpen ? 'none' : 'block';
          close.style.display = isOpen ? 'block' : 'none';
        });

        // Handle category clicks (keep sidebar open)
        const categoryList = document.getElementById('categoryList');
        if (categoryList) {
          categoryList.addEventListener('click', (e) => {
            if (e.target.tagName === 'BUTTON') {
              sidebar.querySelectorAll('#categoryList button').forEach(b => b.classList.remove('active'));
              e.target.classList.add('active');
              // sidebar stays open here
            }
          });
        }

        // Handle subcategory clicks (close sidebar)
        const subcategoryList = document.getElementById('subcategoryList');
        if (subcategoryList) {
          subcategoryList.addEventListener('click', (e) => {
            if (e.target.tagName === 'BUTTON') {
              sidebar.querySelectorAll('#subcategoryList button').forEach(b => b.classList.remove('active'));
              e.target.classList.add('active');
              // close sidebar after subcategory chosen
              document.body.classList.remove('sidebar-open');
              hamburger.style.display = 'block';
              close.style.display = 'none';
            }
          });
        }
      })();