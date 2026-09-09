let cards = [];
const $ = s => document.querySelector(s);
const borderOrder = ["Classic", "Scarlet", "Holographic", "Astral", "Anomaly"];

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

function borderClass(r) {
  return "border-" + String(r).replace(/[^a-zA-Z]/g, "");
}

function cardBorderClass(r) {
  return "card-" + String(r).replace(/[^a-zA-Z]/g, "");
}

const obtainColors = {
  "Base Pack": "#778892",
  "Manhwa Pack": "#013478",
  "Isekai Pack": "#7deaa8",
  "Sylvan Anomaly": "#399069",
  "Cyber Anomaly": "#729dce",
  "Boss": "#5c0909",
  "Raid": "#FFD700",
  "Rain Weather": "#4A90B8",
  "Snow Weather": "#D8F3FF",
  "Time Madness Weather": "#8B5CF6",
  "Ink Fall Weather": "#171A2B",
  "Blood Moon Weather": "#8F1D2C",
  "Solar Wrath Weather": "#FF7A00",
  "Storm Weather": "#354052",
  "Black Out Weather": "#080A0F",
  "Launch Celebration": "#E040FB"
};

function obtainBadgeHtml(obtain) {
  if (!obtain) return "";
  const color = obtainColors[obtain] || "#778892";
  const fallbackClass = obtainColors[obtain] ? "" : " obtain-color-missing";
  return `<span class="obtain-badge${fallbackClass}" style="--obtain-color:${esc(color)}">${esc(obtain)}</span>`;
}

function oddsDenominator(odds) {
  try {
    return Number(String(odds).split("/")[1].replace(/,/g, "").trim());
  } catch {
    return Infinity;
  }
}

function isSupportCard(stats) {
  return (
    stats.health === undefined || stats.health === null ||
    stats.attack === undefined || stats.attack === null ||
    stats.speed === undefined || stats.speed === null
  );
}

function statsHtml(stats, reserveSpace = false) {
  // Support cards do not have Health, Attack, or Speed.
  const hasStats = !isSupportCard(stats);

  if (!hasStats) {
    // On the front page, reserve the same space as a normal stat row so the
    // ability and odds align with regular cards. The details modal stays compact.
    return reserveSpace ? '<div class="stats stats-placeholder" aria-hidden="true"></div>' : "";
  }

  return `
    <div class="stats">
      <div class="stat health-stat"><b>HEALTH</b>${fmt(stats.health)}</div>
      <div class="stat attack-stat"><b>ATTACK</b>${fmt(stats.attack)}</div>
      <div class="stat speed-stat"><b>SPEED</b>${fmt(stats.speed)}</div>
    </div>`;
}

function formatAbilityDescription(text, cardName = "") {
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

  // Colors only a specific occurrence of a match.
  // Example: the first "evade" can be cyan while a later "evade" stays white.
  function markOccurrence(regex, className, occurrence = 1) {
    let count = 0;
    safe = safe.replace(regex, (...args) => {
      count += 1;
      if (count !== occurrence) return args[0];

      const token = `\uE000${protectedParts.length}\uE001`;
      protectedParts.push(`<span class="${className}">${args[0]}</span>`);
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
  // The screenshot colors only the FIRST "evade" (cyan).
  // The later "evade" in "After a successful evade" remains white.
  if (cardName === "Coward Goblin") {
    mark(/\b30%\s+chance\b/gi, "ability-chance");
    markOccurrence(/\bevade\b/gi, "ability-dodge", 1);
    mark(/\bcounterattacks\b/gi, "ability-damage");
    mark(/\b150%\b/gi, "ability-damage");
  }

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
let activeSort = {
  stat: "odds",
  direction: "desc"
};

function updateSortControls() {
  document.querySelectorAll(".sort-stat").forEach(button => {
    const stat = button.dataset.stat;
    const arrow = button.querySelector(".sort-arrow");
    const isActive = activeSort.stat === stat;

    button.classList.toggle("active", isActive);

    if (!isActive) {
      arrow.textContent = "↕";
      button.setAttribute("aria-label", `Sort by ${stat}`);
      return;
    }

    const isAscending = activeSort.direction === "asc";
    arrow.textContent = isAscending ? "↑" : "↓";
    button.setAttribute(
      "aria-label",
      `Sort by ${stat}: ${isAscending ? "lowest first" : "highest first"}`
    );
  });
}

function renderCards() {
  const q = $("#search").value.toLowerCase().trim();
  const offField = $("#offFieldFilter").value;

  // Front page displays one Classic card per character.
  const filtered = cards
    .filter(c => {
      const text = [
        c.characterName,
        c.abilityName,
        c.abilityDescription
      ].join(" ").toLowerCase();

      return (!q || text.includes(q)) &&
        (!offField || String(c.hasOffFieldEffects) === offField) &&
        c.borders && c.borders.Classic;
    })
    .sort((a, b) => {
      const aStats = a.borders.Classic;
      const bStats = b.borders.Classic;
      const aIsSupport = isSupportCard(aStats);
      const bIsSupport = isSupportCard(bStats);

      const oddsTieBreak = () =>
        (oddsDenominator(aStats.odds) - oddsDenominator(bStats.odds)) ||
        a.characterName.localeCompare(b.characterName);

      // Default ordering remains by odds until a stat is selected.
      if (activeSort.stat === "odds") return oddsTieBreak();

      // Support cards have no numeric stats, so keep them after normal cards.
      if (aIsSupport !== bIsSupport) return aIsSupport ? 1 : -1;
      if (aIsSupport && bIsSupport) return oddsTieBreak();

      const aValue = Number(aStats[activeSort.stat]);
      const bValue = Number(bStats[activeSort.stat]);

      const difference = activeSort.direction === "desc"
        ? bValue - aValue
        : aValue - bValue;

      return difference || oddsTieBreak();
    });

  $("#count").textContent =
    `Showing ${filtered.length} of ${filtered.length} Classic Border cards`;

  $("#cardGrid").innerHTML = filtered.map(c => {
    const originalIndex = cards.indexOf(c);
    const stats = c.borders.Classic;

    return `
      <article class="card ${cardBorderClass("Classic")}" data-index="${originalIndex}">
        <div class="card-meta">
          <span class="badge ${borderClass("Classic")}">${isSupportCard(stats) ? "Support" : "Classic"}</span>
          ${obtainBadgeHtml(c.obtain)}
        </div>
        <h3>${esc(c.characterName)}</h3>

        ${statsHtml(stats, true)}

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

function availableBorders(c) {
  return borderOrder.filter(r => c.borders && c.borders[r]);
}

function renderModalCard(c, border) {
  const stats = c.borders[border];
  if (!stats) return;

  const borderButtons = availableBorders(c).map(r => `
    <button class="border-toggle ${r === border ? "active" : ""} ${cardBorderClass(r)}"
      data-border="${esc(r)}">${esc(r)}</button>
  `).join("");

  $("#modalContent").innerHTML = `
    <div class="border-toggle-row">
      ${borderButtons}
    </div>

    <div id="modalCard" class="modal-card ${cardBorderClass(border)}">
      <div class="card-meta">
        <span class="badge ${borderClass(border)}">${isSupportCard(stats) ? "Support" : esc(border)}</span>
        ${obtainBadgeHtml(c.obtain)}
      </div>
      <h2>${esc(c.characterName)}</h2>

      ${statsHtml(stats)}

      <p class="odds">${esc(stats.odds)}</p>

      <hr>

      <h3>${esc(c.abilityName)}</h3>

      <div class="ability-description">
        ${formatAbilityDescription(c.abilityDescription, c.characterName)}
      </div>

      ${c.hasOffFieldEffects
        ? '<div class="modal-offfield-row"><span class="ability-offfield">OFF-FIELD</span></div>'
        : ''}
    </div>
  `;

  document.querySelectorAll(".border-toggle").forEach(button => {
    button.onclick = () => renderModalCard(c, button.dataset.border);
  });
}

function openCard(index) {
  const c = cards[index];
  if (!c) return;

  const firstBorder = c.borders.Classic
    ? "Classic"
    : availableBorders(c)[0];

  renderModalCard(c, firstBorder);
  $("#modal").classList.remove("hidden");
}

$("#search").addEventListener("input", renderCards);
$("#offFieldFilter").addEventListener("change", renderCards);

document.querySelectorAll(".sort-stat").forEach(button => {
  button.addEventListener("click", () => {
    const selectedStat = button.dataset.stat;

    // Clicking the same stat toggles descending ↔ ascending.
    // Clicking a new stat starts with highest-first.
    if (activeSort.stat === selectedStat) {
      activeSort.direction =
        activeSort.direction === "desc" ? "asc" : "desc";
    } else {
      activeSort = {
        stat: selectedStat,
        direction: "desc"
      };
    }

    updateSortControls();
    renderCards();
  });
});

updateSortControls();

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
