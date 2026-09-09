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
  return `
    <div class="stats">
      <div class="stat health-stat"><b>HEALTH</b>${fmt(stats.health)}</div>
      <div class="stat attack-stat"><b>ATTACK</b>${fmt(stats.attack)}</div>
      <div class="stat speed-stat"><b>SPEED</b>${fmt(stats.speed)}</div>
    </div>`;
}

function formatAbilityDescription(text) {
  let safe = esc(text);

  // Match the screenshot spacing for separate recurring/raid effects.
  safe = safe.replace(
    /\.\s+(?=Every\s+\d+\s+Global\s+Turns|In\s+raids,)/i,
    ".</p><p>"
  );

  // Exact phrase colors from the uploaded card screenshots.
  safe = safe.replace(
    /(\b50%\s+of\s+this\s+card&#039;s\s+damage\b)/gi,
    '<span class="ability-card-damage">$1</span>'
  );

  // Slime: the complete phrase "10% less damage" is gold.
  safe = safe.replace(
    /(\b\d+(?:\.\d+)?%\s+less\s+damage\b)/gi,
    '<span class="ability-less-damage">$1</span>'
  );

  // Hole: the complete capped amount phrase is green.
  safe = safe.replace(
    /(\b100%\s+of\s+this\s+card&#039;s\s+maximum\s+HP\b)/gi,
    '<span class="ability-max-hp">$1</span>'
  );

  // Hole: HP and SPEED have different colors.
  safe = safe.replace(
    /(\bHP\b)(\s+and\s+)(\bSPEED\b)/gi,
    '<span class="ability-hp">$1</span>$2<span class="ability-speed">$3</span>'
  );

  // Hole: the reduction amount is purple.
  safe = safe.replace(
    /(\bby\s+)(10%)(?=\.)/i,
    '$1<span class="ability-reduction">$2</span>'
  );

  // Demon: only "10% HP" is green.
  safe = safe.replace(
    /(\b\d+(?:\.\d+)?%\s+HP\b)/gi,
    '<span class="ability-hp-percent">$1</span>'
  );

  // Marine / Living Artillery / World Champion / Blue Cat formatting.
  safe = safe.replace(
    /(\b\d+\s+shots?\b)/gi,
    '<span class="ability-shots">$1</span>'
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

  // Pusu Pusu: Burn is orange.
  safe = safe.replace(
    /(\bBurn\b)/gi,
    '<span class="ability-burn">$1</span>'
  );

  // Cyber K.O.K.O: Kokoverclock is purple.
  safe = safe.replace(
    /(\bKokoverclock\b)/gi,
    '<span class="ability-kokoverclock">$1</span>'
  );

  // Cyber K.O.K.O: the complete "250% of its Attack" phrase is orange.
  safe = safe.replace(
    /(\b250%\s+of\s+its\s+Attack\b)/gi,
    '<span class="ability-cyber-attack">$1</span>'
  );

  // The Cyclist: SPEED is cyan and "damage dealt" is orange.
  safe = safe.replace(
    /(\bdamage\s+dealt\b)/gi,
    '<span class="ability-damage">$1</span>'
  );

  // Knucklehead ninja: "Evades" is cyan.
  safe = safe.replace(
    /(\bEvades\b)/gi,
    '<span class="ability-evade">$1</span>'
  );

  // Eldergrove: Shield is cyan; the percentage + maximum HP phrases are green.
  safe = safe.replace(
    /(\bShield\b)/gi,
    '<span class="ability-shield">$1</span>'
  );

  safe = safe.replace(
    /(\b(?:25|10)%\s+of\s+maximum\s+HP\b)/gi,
    '<span class="ability-max-hp">$1</span>'
  );

  // Thunder Boy: chance is gold and Stun is yellow.
  safe = safe.replace(
    /(\b20%\s+chance\b)/gi,
    '<span class="ability-chance">$1</span>'
  );
  safe = safe.replace(
    /(\bStun\b)/gi,
    '<span class="ability-stun">$1</span>'
  );

  // FPLN-67: "doubles its Speed" is cyan.
  safe = safe.replace(
    /(\bdoubles\s+its\s+Speed\b)/gi,
    '<span class="ability-speed">$1</span>'
  );

  // FPLN-67: "2 separate attacks" is orange/gold.
  safe = safe.replace(
    /(\b2\s+separate\s+attacks\b)/gi,
    '<span class="ability-fighter-attacks">$1</span>'
  );

  // Young Hunter: only ATTACK and 50% are pink/red; "by" remains the normal color.
  safe = safe.replace(
    /(\bATTACK\b)(\s+by\s+)(50%)/gi,
    '<span class="ability-attack">$1</span>$2<span class="ability-attack">$3</span>'
  );

  // Skyroot: "2 enemies" and "250% total damage" are orange/gold; ATTACK is red.
  safe = safe.replace(
    /(\b2\s+enemies\b)/gi,
    '<span class="ability-fighter-attacks">$1</span>'
  );

  safe = safe.replace(
    /(\b250%\s+total\s+damage\b)/gi,
    '<span class="ability-damage">$1</span>'
  );

  // Chad of Conquerors: SPEED + 30% are cyan; ATTACK + 10% are red.
  safe = safe.replace(
    /(\bSPEED\b)(\s+by\s+)(30%)/gi,
    '<span class="ability-speed">$1</span>$2<span class="ability-speed">$3</span>'
  );

  safe = safe.replace(
    /(\bATTACK\b)(\s+by\s+)(10%)/gi,
    '<span class="ability-attack">$1</span>$2<span class="ability-attack">$3</span>'
  );

  // SPDR-06: "200% damage" is orange/peach and "survives at 1 HP" is green.
  safe = safe.replace(
    /(\b200%\s+damage\b)/gi,
    '<span class="ability-damage">$1</span>'
  );

  safe = safe.replace(
    /(\bsurvives\s+at\s+1\s+HP\b)/gi,
    '<span class="ability-max-hp">$1</span>'
  );

  // Any "# turn(s)" or "# Global Turn(s)" is always light gray.
  safe = safe.replace(
    /(\b\d+\s+(?:Global\s+)?Turns?\b)/gi,
    '<span class="ability-turn">$1</span>'
  );

  // Standalone SPEED remains cyan (e.g. Ball of Feathers).
  safe = safe.replace(
    /(?<!>)\bSPEED\b(?!<)/g,
    '<span class="ability-speed">SPEED</span>'
  );

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
