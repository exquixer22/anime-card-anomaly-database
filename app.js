let cards=[];
const $=s=>document.querySelector(s);

fetch('cards.json').then(r=>r.json()).then(data=>{
  cards=data;
  populateFilters();
  renderCards();
});

function populateFilters(){
  const rarities=[...new Set(cards.map(c=>c.rarity).filter(Boolean))];
  const types=[...new Set(cards.map(c=>c.abilityType).filter(Boolean))];
  rarities.forEach(v=>$('#rarityFilter').insertAdjacentHTML('beforeend',`<option value="${v}">${v}</option>`));
  types.forEach(v=>$('#typeFilter').insertAdjacentHTML('beforeend',`<option value="${v}">${v}</option>`));
}

function renderCards(){
  const q=$('#search').value.toLowerCase();
  const rarity=$('#rarityFilter').value;
  const type=$('#typeFilter').value;
  const filtered=cards.filter(c=>{
    const text=[c.name,c.title,c.ability,c.description,c.id].join(' ').toLowerCase();
    return (!q||text.includes(q))&&(!rarity||c.rarity===rarity)&&(!type||c.abilityType===type);
  });
  $('#count').textContent=`Showing ${filtered.length} of ${cards.length} cards`;
  $('#cardGrid').innerHTML=filtered.map(c=>`
    <article class="card" data-id="${c.id}">
      <span class="badge rarity">${esc(c.rarity)}</span>
      <span class="badge">${esc(c.abilityType)}</span>
      <h3>${esc(c.name)}</h3>
      <p class="subtitle">${esc(c.title)} • #${esc(c.id)}</p>
      <div class="ability"><h4>${esc(c.ability)}</h4><p>${esc(short(c.description,150))}</p></div>
      <div class="meta"><span>⚔ ATK: ${esc(c.stats.attack)}</span><span>⚡ SPD: ${esc(c.stats.speed)}</span></div>
    </article>`).join('')||'<p>No cards found.</p>';
  document.querySelectorAll('.card').forEach(el=>el.onclick=()=>openCard(el.dataset.id));
}

function openCard(id){
  const c=cards.find(x=>x.id===id);
  if(!c)return;
  $('#modalContent').innerHTML=`
    <span class="badge rarity">${esc(c.rarity)}</span> <span class="badge">${esc(c.abilityType)}</span>
    <h2>${esc(c.name)}</h2><p class="subtitle">${esc(c.title)} • Card #${esc(c.id)}</p>
    <h3>${esc(c.ability)}</h3><p>${esc(c.description)}</p>
    <hr><h3>Stats</h3>
    <div class="meta"><span>Level: ${esc(c.stats.level)}</span><span>Attack: ${esc(c.stats.attack)}</span><span>Speed: ${esc(c.stats.speed)}</span></div>`;
  $('#modal').classList.remove('hidden');
}
function esc(v){return String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));}
function short(s,n){return s.length>n?s.slice(0,n-1)+'…':s;}

$('#search').addEventListener('input',renderCards);
$('#rarityFilter').addEventListener('change',renderCards);
$('#typeFilter').addEventListener('change',renderCards);
document.querySelectorAll('.nav-btn').forEach(b=>b.onclick=()=>{
  document.querySelectorAll('.nav-btn').forEach(x=>x.classList.remove('active'));
  document.querySelectorAll('.page').forEach(x=>x.classList.remove('active'));
  b.classList.add('active'); $('#'+b.dataset.page).classList.add('active');
});
$('#closeModal').onclick=()=>$('#modal').classList.add('hidden');
$('#modal').onclick=e=>{if(e.target===$('#modal'))$('#modal').classList.add('hidden');};
