// app.js (English-only, with Reset button)

// Helpers
function $(sel, el=document){ return el.querySelector(sel) }
function $all(sel, el=document){ return [...el.querySelectorAll(sel)] }
function copy(text){
  navigator.clipboard.writeText(text).then(()=>{
    toast("Copied to clipboard");
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

// State
const STATE = {
  q: getParam('q') || '',
  cat: getParam('cat') || '',
  sub: getParam('sub') || '',
  favOnly: (getParam('fav') || localStorage.getItem('fav') || '0') === '1',
  data: [],
  favs: new Set(JSON.parse(localStorage.getItem('favs')||'[]'))
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
  dialog: $('#promptDialog'),
  dlgTitle: $('#dlgTitle'),
  dlgBody: $('#dlgBody'),
  dlgClose: $('#dlgClose'),
  copyBtn: $('#copyPrompt')
};

// Init
init().catch(err => {
  console.error(err);
  toast('Failed to load data');
});

async function init(){
  UI.search.value = STATE.q;
  UI.favToggle.checked = STATE.favOnly;
  wireControls();

  let json;
  try{
    json = await (await fetch('assets/data/prompts.json', {cache:'no-store'})).json();
  }catch{
    toast('Failed to load prompts.json');
    return;
  }
  STATE.data = json;
  renderNav();
  renderSubnav();
  renderCards();
}

function wireControls(){
  UI.search.addEventListener('input', e=>{
    STATE.q = e.target.value.trim();
    setParams({q:STATE.q});
    renderCards();
  });
  document.addEventListener('keydown', e=>{
    if(e.key === '/'){ e.preventDefault(); UI.search.focus(); }
  });
  UI.favToggle.addEventListener('change', e=>{
    STATE.favOnly = e.target.checked;
    localStorage.setItem('fav', STATE.favOnly?'1':'0');
    setParams({fav: STATE.favOnly?'1':null});
    renderCards();
  });
  UI.dlgClose.addEventListener('click', ()=> UI.dialog.close());
  UI.copyBtn.addEventListener('click', ()=> copy(UI.dlgBody.textContent||''));

  UI.resetBtn.addEventListener('click', ()=>{
    STATE.cat = '';
    STATE.sub = '';
    STATE.q = '';
    STATE.favOnly = false;
    UI.search.value = '';
    UI.favToggle.checked = false;
    setParams({cat:null, sub:null, q:null, fav:null});
    renderNav(); renderSubnav(); renderCards();
  });
}

function getCategories(){
  const map = new Map();
  for(const d of STATE.data){
    if(!map.has(d.category)) map.set(d.category, new Set());
    map.get(d.category).add(d.subcategory);
  }
  const out = [];
  [...map.keys()].sort((a,b)=>a.localeCompare(b)).forEach(cat=>{
    out.push([cat, [...map.get(cat)].sort((a,b)=>a.localeCompare(b))]);
  });
  return out;
}

function renderNav(){
  UI.categoryList.innerHTML = '';
  const cats = getCategories();
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
    UI.categoryList.appendChild(li);
  }
}

function renderSubnav(){
  UI.subcategoryList.innerHTML = '';
  UI.breadcrumbs.querySelector('span').textContent = STATE.cat || 'Select a category';
  UI.resetBtn.style.display = (STATE.cat || STATE.sub || STATE.q || STATE.favOnly) ? 'inline-block' : 'none';

  if(!STATE.cat){ return; }

  const cats = getCategories();
  const entry = cats.find(([cat])=>cat===STATE.cat);
  const subs = entry? entry[1] : [];
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
    UI.subcategoryList.appendChild(li);
  }
}

function filterData(){
  const q = STATE.q.toLowerCase();
  const inCat = (d)=> !STATE.cat || d.category===STATE.cat;
  const inSub = (d)=> !STATE.sub || d.subcategory===STATE.sub;
  const inFav = (d)=> !STATE.favOnly || STATE.favs.has(d.id);
  const textHit = (d)=>{
    if(!q) return true;
    const T = [d.title, d.prompt, d.category, d.subcategory, ...(d.tags||[])].join(' ').toLowerCase();
    return T.includes(q);
  };
  return STATE.data.filter(d=> inCat(d) && inSub(d) && inFav(d) && textHit(d));
}

function renderCards(){
  const results = filterData();
  UI.cards.innerHTML = '';
  const frag = document.createDocumentFragment();
  for(const d of results){
    frag.appendChild(renderCard(d));
  }
  UI.cards.appendChild(frag);
}

function renderCard(d){
  const article = document.createElement('article');
  article.className = 'card';

  const h = document.createElement('header');
  h.className = 'card-h';
  const title = document.createElement('h3');
  title.className = 'card-title';
  title.textContent = d.title || d.id;
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
  const catSpan = document.createElement('span'); catSpan.className = 'pill'; catSpan.textContent = d.category;
  const subSpan = document.createElement('span'); subSpan.className = 'pill'; subSpan.textContent = d.subcategory;
  meta.appendChild(catSpan); meta.appendChild(subSpan);
  article.appendChild(meta);

  const desc = document.createElement('p');
  desc.className = 'card-desc';
  desc.textContent = d.prompt.slice(0,180) + '…';
  article.appendChild(desc);

  const tagsDiv = document.createElement('div');
  tagsDiv.className = 'tags';
  (d.tags||[]).forEach(t=>{
    const span = document.createElement('span');
    span.className = 'tag'; span.textContent = t;
    tagsDiv.appendChild(span);
  });
  article.appendChild(tagsDiv);

  const f = document.createElement('footer');
  f.className = 'card-f';
  const viewBtn = document.createElement('button');
  viewBtn.className = 'btn';
  viewBtn.textContent = 'View';
  viewBtn.addEventListener('click', ()=> openDialog(d));
  f.appendChild(viewBtn);

  const copyBtn = document.createElement('button');
  copyBtn.className = 'btn';
  copyBtn.textContent = 'Copy';
  copyBtn.addEventListener('click', ()=> copy(d.prompt));
  f.appendChild(copyBtn);

  article.appendChild(f);

  return article;
}

function openDialog(d){
  UI.dlgTitle.textContent = d.title;
  UI.dlgBody.textContent = d.prompt;
  UI.dialog.showModal();
}
