let cards=[];
const $=s=>document.querySelector(s);
const rarityOrder=["Classic","Scarlet","Holographic","Astral","Anomaly"];

fetch('cards.json').then(r=>r.json()).then(data=>{
  cards=data;
  populateFilters();
  renderCards();
});

function fmt(n){return Number(n).toLocaleString('en-US');}
function rarityClass(r){return 'rarity-'+String(r).replace(/[^a-zA-Z]/g,'');}

function populateFilters(){
  rarityOrder.forEach(v=>$('#rarityFilter').insertAdjacentHTML('beforeend',`<option value="${v}">${v}</option>`));
}

function renderCards(){
  const q=$('#search').value.toLowerCase().trim();
  const rarity=$('#rarityFilter').value;
  const offField=$('#offFieldFilter').value;

  const filtered=cards.filter(c=>{
    const text=[c.characterName,c.rarity,c.abilityName,c.abilityDescription].join(' ').toLowerCase();
    return (!q||text.includes(q)) &&
           (!rarity||c.rarity===rarity) &&
           (!offField||String(c.hasOffFieldEffects)===offField);
  });

  $('#count').textContent=`Showing ${filtered.length} of ${cards.length} cards`;
  $('#cardGrid').innerHTML=filtered.map((c,i)=>`
    <article class="card" data-index="${i}">
      <span class="badge ${rarityClass(c.rarity)}">${esc(c.rarity)}</span>
      <h3>${esc(c.characterName)}</h3>
      <div class="stats">
        <div class="stat"><b>❤️ HEALTH</b>${fmt(c.health)}</div>
        <div class="stat"><b>⚔ ATTACK</b>${fmt(c.attack)}</div>
        <div class="stat"><b>⚡ SPEED</b>${fmt(c.speed)}</div>
      </div>
      <p class="odds">🎲 Odds: ${esc(c.odds)}</p>
      <div class="ability"><h4>${esc(c.abilityName)}</h4><p>${esc(short(c.abilityDescription,150))}</p></div>
      ${c.hasOffFieldEffects?'<p class="offfield">✓ Has Off-Field Effects</p>':''}
    </article>`).join('')||'<p>No cards found.</p>';

  document.querySelectorAll('.card').forEach(el=>el.onclick=()=>openCard(Number(el.dataset.index)));
}

function openCard(index){
  const c=cards[index]; if(!c)return;
  $('#modalContent').innerHTML=`
    <span class="badge ${rarityClass(c.rarity)}">${esc(c.rarity)}</span>
    <h2>${esc(c.characterName)}</h2>
    <div class="stats">
      <div class="stat"><b>❤️ HEALTH</b>${fmt(c.health)}</div>
      <div class="stat"><b>⚔ ATTACK</b>${fmt(c.attack)}</div>
      <div class="stat"><b>⚡ SPEED</b>${fmt(c.speed)}</div>
    </div>
    <p class="odds">🎲 <strong>Odds:</strong> ${esc(c.odds)}</p>
    <hr>
    <h3>${esc(c.abilityName)}</h3>
    <p>${esc(c.abilityDescription)}</p>
    <p class="offfield">${c.hasOffFieldEffects?'✓ Has Off-Field Effects':'✕ No Off-Field Effects'}</p>`;
  $('#modal').classList.remove('hidden');
}

function short(s,n){return s.length>n?s.slice(0,n-1)+'…':s;}
function esc(v){return String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));}

$('#search').addEventListener('input',renderCards);
$('#rarityFilter').addEventListener('change',renderCards);
$('#offFieldFilter').addEventListener('change',renderCards);

document.querySelectorAll('.nav-btn').forEach(b=>b.onclick=()=>{
  document.querySelectorAll('.nav-btn').forEach(x=>x.classList.remove('active'));
  document.querySelectorAll('.page').forEach(x=>x.classList.remove('active'));
  b.classList.add('active'); $('#'+b.dataset.page).classList.add('active');
});

$('#closeModal').onclick=()=>$('#modal').classList.add('hidden');
$('#modal').onclick=e=>{if(e.target===$('#modal'))$('#modal').classList.add('hidden');};
