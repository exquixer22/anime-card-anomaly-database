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

function oddsDenominator(odds) {
  try {
    return Number(String(odds).split("/")[1].replace(/,/g, "").trim());
  } catch {
    return Infinity;
  }
}

function statsHtml(stats) {
  // Support cards do not have Health, Attack, or Speed.
  if (
    stats.health === undefined || stats.health === null ||
    stats.attack === undefined || stats.attack === null ||
    stats.speed === undefined || stats.speed === null
  ) {
    return "";
  }

  return `
    <div class="stats">
      <div class="stat health-stat"><b>HEALTH</b>${fmt(stats.health)}</div>
      <div class="stat attack-stat"><b>ATTACK</b>${fmt(stats.attack)}</div>
      <div class="stat speed-stat"><b>SPEED</b>${fmt(stats.speed)}</div>
    </div>`;
}

function formatAbilityDescription(text) {
  let safe = esc(text);

  // Keep highlighted text protected while applying multiple color rules.
  // This prevents later rules from matching words inside generated <span> HTML.
  const protectedParts = [];

  function mark(regex, className) {
    safe = safe.replace(regex, (...args) => {
      const matched = args[0];
      const token = `\uE000${protectedParts.length}\uE001`;
      protectedParts.push(`<span class="${className}">${matched}</span>`);
      return token;
    });
  }

  function markCustom(regex, renderer) {
    safe = safe.replace(regex, (...args) => {
      const token = `\uE000${protectedParts.length}\uE001`;
      protectedParts.push(renderer(...args));
      return token;
    });
  }

  // Match the screenshot spacing for separate recurring/raid effects.
  safe = safe.replace(
    /\.\s+(?=Every\s+\d+\s+Global\s+Turns|In\s+raids,)/i,
    ".</p><p>"
  );

  // Exact phrase colors from the card screenshots.
  mark(/\b50%\s+of\s+this\s+card&#039;s\s+damage\b/gi, "ability-card-damage");
  mark(/\b\d+(?:\.\d+)?%\s+less\s+damage\b/gi, "ability-less-damage");
  mark(/\b100%\s+of\s+this\s+card&#039;s\s+maximum\s+HP\b/gi, "ability-max-hp");

  // Hole: HP and SPEED use different colors.
  markCustom(
    /\bHP\b(\s+and\s+)\bSPEED\b/gi,
    (match, separator) =>
      `<span class="ability-hp">HP</span>${separator}<span class="ability-speed">SPEED</span>`
  );

  // Hole: "by 10%" is purple.
  mark(/\bby\s+10%(?=\.)/gi, "ability-reduction");

  // Demon: only "10% HP" is green.
  mark(/\b\d+(?:\.\d+)?%\s+HP\b/gi, "ability-hp-percent");

  // Cyber K.O.K.O.
  mark(/\bKokoverclock\b/gi, "ability-kokoverclock");
  mark(/\b250%\s+of\s+its\s+Attack\b/gi, "ability-cyber-attack");

  // Eldergrove.
  mark(/\b(?:25|10)%\s+of\s+maximum\s+HP\b/gi, "ability-max-hp");
  mark(/\bShield\b/gi, "ability-shield");

  // FPLN-67.
  mark(/\bdoubles\s+its\s+Speed\b/gi, "ability-speed");
  mark(/\b2\s+separate\s+attacks\b/gi, "ability-fighter-attacks");

  // Young Hunter.
  markCustom(
    /\bATTACK\b(\s+by\s+)50%/g,
    (match, separator) =>
      `<span class="ability-attack">ATTACK</span>${separator}<span class="ability-attack">50%</span>`
  );

  // Skyroot.
  mark(/\b2\s+enemies\b/gi, "ability-fighter-attacks");
  mark(/\b250%\s+total\s+damage\b/gi, "ability-damage");

  // Chad of Conquerors.
  markCustom(
    /\bSPEED\b(\s+by\s+)30%/g,
    (match, separator) =>
      `<span class="ability-speed">SPEED</span>${separator}<span class="ability-speed">30%</span>`
  );
  markCustom(
    /\bATTACK\b(\s+by\s+)10%/g,
    (match, separator) =>
      `<span class="ability-attack">ATTACK</span>${separator}<span class="ability-attack">10%</span>`
  );

  // SPDR-06.
  mark(/\b200%\s+damage\b/gi, "ability-damage");
  mark(/\bsurvives\s+at\s+1\s+HP\b/gi, "ability-max-hp");

  // Thornveil: the entire phrase is orange/peach.
  mark(/\b20%\s+of\s+Thornveil&#039;s\s+ATTACK\b/gi, "ability-damage");

  // The Fake: HP is green, ATTACK is red, SPEED is blue.
  mark(/\bHP\b/g, "ability-hp");
  mark(/\bATTACK\b/g, "ability-attack");
  mark(/\bSPEED\b/g, "ability-speed");

  // Lucky Clown: chance is orange/peach; dodge is blue.
  mark(/\b20%\s+chance\b/gi, "ability-chance");
  mark(/\bdodge\b/gi, "ability-dodge");

  // Bloomera.
  mark(/\bSpring\s+Pollen\b/gi, "ability-max-hp");
  mark(/\b20%\s+dodge\s+chance\b/gi, "ability-speed");
  mark(/\b50%\b/gi, "ability-max-hp");

  // Coward Goblin.
  mark(/\b30%\s+chance\b/gi, "ability-chance");
  mark(/\bevade\b/gi, "ability-dodge");
  mark(/\bcounterattacks\b/gi, "ability-damage");
  mark(/\b10%\b/gi, "ability-damage");

  // Log: the entire phrase is blue.
  mark(/\b10%\s+chance\s+to\s+dodge\b/gi, "ability-speed");

  // General screenshot formatting.
  mark(/\b\d+\s+shots?\b/gi, "ability-shots");
  mark(/\b\d+(?:\.\d+)?%\s+damage\b/gi, "ability-damage");
  mark(/\b\d+(?:\.\d+)?%\s+chance\b/gi, "ability-chance");
  mark(/\bdodges?\b/gi, "ability-dodge");
  mark(/\b\d+(?:\.\d+)?%\s+Attack\b/gi, "ability-attack");
  mark(/\bBurn\b/gi, "ability-burn");
  mark(/\bdamage\s+dealt\b/gi, "ability-damage");
  mark(/\bEvades\b/gi, "ability-evade");
  mark(/\b20%\s+chance\b/gi, "ability-chance");
  mark(/\bStun\b/gi, "ability-stun");

  // Any "# turn(s)" or "# Global Turn(s)" is always light gray.
  mark(/\b\d+\s+(?:Global\s+)?Turns?\b/gi, "ability-turn");

  // Standalone SPEED remains cyan.
  mark(/\bSPEED\b/g, "ability-speed");

  // Skyroot's remaining standalone ATTACK is red.
  mark(/\bATTACK\b/g, "ability-attack");

  // Restore protected HTML only after all text matching is complete.
  safe = safe.replace(/\uE000(\d+)\uE001/g, (_, index) => protectedParts[Number(index)]);

  return `<p>${safe}</p>`;
}
function renderCards() {
  const q = $("#search").value.toLowerCase().trim();
  const offField = $("#offFieldFilter").value;

  // Front page displays one Classic card per character.
  // Cards are always ordered by odds: higher odds first (1/2, 1/3, 1/5...).
  const filtered = cards
    .filter(c => {
      const text = [
        c.characterName,
        c.abilityName,
        c.abilityDescription
      ].join(" ").toLowerCase();

      return (!q || text.includes(q)) &&
        (!offField || String(c.hasOffFieldEffects) === offField) &&
        c.rarities && c.rarities.Classic;
    })
    .sort((a, b) => {
      const oddsDifference =
        oddsDenominator(a.rarities.Classic.odds) -
        oddsDenominator(b.rarities.Classic.odds);

      // If odds are the same, sort alphabetically by character name.
      return oddsDifference ||
        a.characterName.localeCompare(b.characterName);
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
          ${c.hasOffFieldEffects
            ? '<span class="ability-offfield">OFF-FIELD</span>'
            : ''}
        </div>

        <div class="card-footer">
          <p class="odds">${esc(stats.odds)}</p>
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

      ${c.hasOffFieldEffects
        ? '<div class="modal-offfield-row"><span class="ability-offfield">OFF-FIELD</span></div>'
        : ''}
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
