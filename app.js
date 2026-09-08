let cards = [];
const $ = s => document.querySelector(s);
const rarityOrder = ["Classic", "Scarlet", "Holographic", "Astral", "Anomaly"];

function fmt(n) {
  return Number(n).toLocaleString("en-US");
}

function esc(v) {
  return String(v ?? "").replace(/[&<>"']/g, m => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[m]));
}

function rarityClass(r) {
  return "rarity-" + String(r).replace(/[^a-zA-Z]/g, "");
}

function cardRarityClass(r) {
  return "card-" + String(r).replace(/[^a-zA-Z]/g, "");
}

function statsHtml(c) {
  return `
    <div class="stats">
      <div class="stat health-stat"><b>HEALTH</b>${fmt(c.health)}</div>
      <div class="stat attack-stat"><b>ATTACK</b>${fmt(c.attack)}</div>
      <div class="stat speed-stat"><b>SPEED</b>${fmt(c.speed)}</div>
    </div>`;
}

/* This function MUST exist before the card details are opened. */
function formatAbilityDescription(text) {
  let safe = esc(text);

  // Separate recurring Global Turn effects into their own paragraph.
  safe = safe.replace(
    /\.\s+(?=Every\s+\d+\s+Global\s+Turns)/i,
    ".</p><p>"
  );

  // Living Artillery formatting from the screenshot.
  safe = safe.replace(
    /(\b\d+\s+shots?\b)/gi,
    '<span class="ability-shots">$1</span>'
  );

  safe = safe.replace(
    /(\b\d+\s+Global\s+Turns\b)/gi,
    '<span class="ability-global">$1</span>'
  );

  safe = safe.replace(
    /(\b\d+(?:\.\d+)?%\s+damage\b)/gi,
    '<span class="ability-damage">$1</span>'
  );

  // Lucky Human formatting from the screenshot.
  // "30% chance" is gold.
  safe = safe.replace(
    /(\b\d+(?:\.\d+)?%\s+chance\b)/gi,
    '<span class="ability-chance">$1</span>'
  );

  // Both "dodge" and "dodges" are cyan.
  safe = safe.replace(
    /(\bdodges?\b)/gi,
    '<span class="ability-dodge">$1</span>'
  );

  // "10% Attack" is red/pink.
  safe = safe.replace(
    /(\b\d+(?:\.\d+)?%\s+Attack\b)/gi,
    '<span class="ability-attack">$1</span>'
  );

  return `<p>${safe}</p>`;
}

function populateFilters() {
  rarityOrder.forEach(v => {
    $("#rarityFilter").insertAdjacentHTML(
      "beforeend",
      `<option value="${v}">${v}</option>`
    );
  });
}

function renderCards() {
  const q = $("#search").value.toLowerCase().trim();
  const rarity = $("#rarityFilter").value;
  const offField = $("#offFieldFilter").value;

  const filtered = cards.filter(c => {
    const text = [
      c.characterName,
      c.rarity,
      c.abilityName,
      c.abilityDescription
    ].join(" ").toLowerCase();

    return (!q || text.includes(q)) &&
      (!rarity || c.rarity === rarity) &&
      (!offField || String(c.hasOffFieldEffects) === offField);
  });

  $("#count").textContent =
    `Showing ${filtered.length} of ${cards.length} cards`;

  $("#cardGrid").innerHTML = filtered.map((c, i) => `
    <article class="card ${cardRarityClass(c.rarity)}" data-index="${i}">
      <span class="badge ${rarityClass(c.rarity)}">${esc(c.rarity)}</span>
      <h3>${esc(c.characterName)}</h3>

      ${statsHtml(c)}

      <div class="ability">
        <h4>${esc(c.abilityName)}</h4>
      </div>

      <div class="card-footer">
        <p class="odds">${esc(c.odds)}</p>
        <p class="offfield">
          ${c.hasOffFieldEffects
            ? "✓ Has Off-Field Effects"
            : "✕ No Off-Field Effects"}
        </p>
      </div>
    </article>
  `).join("") || "<p>No cards found.</p>";

  document.querySelectorAll(".card").forEach(el => {
    el.onclick = () => openCard(Number(el.dataset.index));
  });
}

function openCard(index) {
  const c = cards[index];
  if (!c) return;

  $("#modalContent").innerHTML = `
    <span class="badge ${rarityClass(c.rarity)}">${esc(c.rarity)}</span>
    <h2>${esc(c.characterName)}</h2>

    ${statsHtml(c)}

    <p class="odds">${esc(c.odds)}</p>

    <hr>

    <h3>${esc(c.abilityName)}</h3>

    <div class="ability-description">
      ${formatAbilityDescription(c.abilityDescription)}
    </div>

    <p class="offfield">
      ${c.hasOffFieldEffects
        ? "✓ Has Off-Field Effects"
        : "✕ No Off-Field Effects"}
    </p>
  `;

  $("#modal").classList.remove("hidden");
}

$("#search").addEventListener("input", renderCards);
$("#rarityFilter").addEventListener("change", renderCards);
$("#offFieldFilter").addEventListener("change", renderCards);

document.querySelectorAll(".nav-btn").forEach(b => {
  b.onclick = () => {
    document.querySelectorAll(".nav-btn").forEach(x =>
      x.classList.remove("active")
    );
    document.querySelectorAll(".page").forEach(x =>
      x.classList.remove("active")
    );

    b.classList.add("active");
    $("#" + b.dataset.page).classList.add("active");
  };
});

$("#closeModal").onclick = () =>
  $("#modal").classList.add("hidden");

$("#modal").onclick = e => {
  if (e.target === $("#modal")) {
    $("#modal").classList.add("hidden");
  }
};

fetch("cards.json")
  .then(r => r.json())
  .then(data => {
    cards = data;
    populateFilters();
    renderCards();
  })
  .catch(err => {
    console.error(err);
    $("#cardGrid").innerHTML =
      "<p>Unable to load the card database.</p>";
  });
