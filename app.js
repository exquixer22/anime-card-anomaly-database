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

function statsHtml(stats) {
  return `
    <div class="stats">
      <div class="stat health-stat"><b>HEALTH</b>${fmt(stats.health)}</div>
      <div class="stat attack-stat"><b>ATTACK</b>${fmt(stats.attack)}</div>
      <div class="stat speed-stat"><b>SPEED</b>${fmt(stats.speed)}</div>
    </div>`;
}

function formatAbilityDescription(text) {
  let safe = esc(text);

  safe = safe.replace(
    /\.\s+(?=Every\s+\d+\s+Global\s+Turns)/i,
    ".</p><p>"
  );

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

  safe = safe.replace(
    /(\b\d+(?:\.\d+)?%\s+chance\b)/gi,
    '<span class="ability-chance">$1</span>'
  );

  safe = safe.replace(
    /(\bdodges?\b)/gi,
    '<span class="ability-dodge">$1</span>'
  );

  safe = safe.replace(
    /(\b\d+(?:\.\d+)?%\s+Attack\b)/gi,
    '<span class="ability-attack">$1</span>'
  );

  return `<p>${safe}</p>`;
}

function renderCards() {
  const q = $("#search").value.toLowerCase().trim();
  const offField = $("#offFieldFilter").value;

  // The front page intentionally displays only the Classic version of each character.
  const filtered = cards.filter(c => {
    const text = [
      c.characterName,
      c.abilityName,
      c.abilityDescription
    ].join(" ").toLowerCase();

    return (!q || text.includes(q)) &&
      (!offField || String(c.hasOffFieldEffects) === offField) &&
      c.rarities && c.rarities.Classic;
  });

  $("#count").textContent =
    `Showing ${filtered.length} of ${filtered.length} Classic cards`;

  $("#cardGrid").innerHTML = filtered.map(c => {
    const originalIndex = cards.indexOf(c);
    const stats = c.rarities.Classic;

    return `
      <article class="card ${cardRarityClass("Classic")}" data-index="${originalIndex}">
        <span class="badge ${rarityClass("Classic")}">Classic</span>
        <h3>${esc(c.characterName)}</h3>

        ${statsHtml(stats)}

        <div class="ability">
          <h4>${esc(c.abilityName)}</h4>
        </div>

        <div class="card-footer">
          <p class="odds">${esc(stats.odds)}</p>
          <p class="offfield">
            ${c.hasOffFieldEffects
              ? "✓ Has Off-Field Effects"
              : "✕ No Off-Field Effects"}
          </p>
        </div>
      </article>`;
  }).join("") || "<p>No cards found.</p>";

  document.querySelectorAll(".card").forEach(el => {
    el.onclick = () => openCard(Number(el.dataset.index));
  });
}

function availableRarities(c) {
  return rarityOrder.filter(r => c.rarities && c.rarities[r]);
}

function renderModalCard(c, rarity) {
  const stats = c.rarities[rarity];
  if (!stats) return;

  const rarityButtons = availableRarities(c).map(r => `
    <button class="rarity-toggle ${r === rarity ? "active" : ""} ${cardRarityClass(r)}"
      data-rarity="${esc(r)}">${esc(r)}</button>
  `).join("");

  $("#modalContent").innerHTML = `
    <div class="rarity-toggle-row">
      ${rarityButtons}
    </div>

    <div id="modalCard" class="modal-card ${cardRarityClass(rarity)}">
      <span class="badge ${rarityClass(rarity)}">${esc(rarity)}</span>
      <h2>${esc(c.characterName)}</h2>

      ${statsHtml(stats)}

      <p class="odds">${esc(stats.odds)}</p>

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
    </div>
  `;

  document.querySelectorAll(".rarity-toggle").forEach(button => {
    button.onclick = () => renderModalCard(c, button.dataset.rarity);
  });
}

function openCard(index) {
  const c = cards[index];
  if (!c) return;

  const firstRarity = c.rarities.Classic
    ? "Classic"
    : availableRarities(c)[0];

  renderModalCard(c, firstRarity);
  $("#modal").classList.remove("hidden");
}

$("#search").addEventListener("input", renderCards);
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
    renderCards();
  })
  .catch(err => {
    console.error(err);
    $("#cardGrid").innerHTML =
      "<p>Unable to load the card database.</p>";
  });
