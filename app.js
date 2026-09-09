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
  "Spooky Weather": "#100D18",
  "Black Out Weather": "#080A0F",
  "Launch Celebration": "#E040FB"
};

const sourceLabels = {
  "Base Pack": "Base",
  "Manhwa Pack": "Manhwa",
  "Isekai Pack": "Isekai",
  "Boss": "Boss",
  "Raid": "Raid",
  "Rain Weather": "Rain",
  "Snow Weather": "Snow",
  "Storm Weather": "Storm",
  "Blood Moon Weather": "Blood Moon",
  "Black Out Weather": "Black Out",
  "Solar Wrath Weather": "Solar Wrath",
  "Spooky Weather": "Spooky",
  "Ink Fall Weather": "Ink Fall",
  "Time Madness Weather": "Time Madness",
  "Sylvan Anomaly": "Sylvan",
  "Cyber Anomaly": "Cyber",
  "Launch Celebration": "Event",
  "Event": "Event"
};

const sourceIcons = {
  "Base Pack": "pack",
  "Manhwa Pack": "pack",
  "Isekai Pack": "pack",
  "Boss": "boss",
  "Raid": "raid",
  "Rain Weather": "weather",
  "Snow Weather": "weather",
  "Storm Weather": "weather",
  "Blood Moon Weather": "weather",
  "Black Out Weather": "weather",
  "Solar Wrath Weather": "weather",
  "Spooky Weather": "weather",
  "Ink Fall Weather": "weather",
  "Time Madness Weather": "weather",
  "Sylvan Anomaly": "anomaly",
  "Cyber Anomaly": "anomaly",
  "Launch Celebration": "event",
  "Event": "event"
};

function sourceLabel(source) {
  return sourceLabels[source] || source || "";
}

function sourceIconHtml(source) {
  const icon = sourceIcons[source];
  return icon
    ? `<img class="source-icon" src="assets/source-icons/${icon}.png" alt="" aria-hidden="true">`
    : "";
}

function obtainBadgeHtml(obtain) {
  if (!obtain) return "";
  const color = obtainColors[obtain] || "#778892";
  const fallbackClass = obtainColors[obtain] ? "" : " obtain-color-missing";
  return `<span class="obtain-badge${fallbackClass}" style="--obtain-color:${esc(color)}">${sourceIconHtml(obtain)}<span>${esc(sourceLabel(obtain))}</span></span>`;
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

  // Match paragraph spacing from the original card descriptions.
  // Paragraph breaks are assigned individually so we do not accidentally
  // insert breaks into abilities that should remain as one paragraph.

  // Cyber K.O.K.O — Kokoverclock:
  // Break after: "At the start of battle, every allied Koko gains Kokoverclock."
  if (cardName === "Cyber K.O.K.O") {
    safe = safe.replace(
      /(Kokoverclock\.)\s+/i,
      "$1</p><p>"
    );
  }

  // Eldergrove — Ancient Roots:
  // Break after: "On entry, gains a Shield equal to 25% of maximum HP."
  if (cardName === "Eldergrove") {
    safe = safe.replace(
      /(maximum\s+HP\.)\s+(?=Every\s+3\s+turns)/i,
      "$1</p><p>"
    );
  }

  // Individual paragraph breaks based on the original card descriptions.
  // Each rule targets a specific card so other abilities keep their intended spacing.

  // FPLN-67 — Fighter Jet.
  if (cardName === "FPLN-67") {
    safe = safe.replace(
      /(doubles\s+its\s+Speed\.)\s+(?=Performs)/i,
      "$1</p><p>"
    );
  }

  // Young Hunter — Rock.
  if (cardName === "Young Hunter") {
    safe = safe.replace(
      /(Attacks\s+once\s+every\s+2\s+turns\.)\s+(?=Each\s+time)/i,
      "$1</p><p>"
    );
  }

  // SPDR-06 — Spider Robot.
  if (cardName === "SPDR-06") {
    safe = safe.replace(
      /(deals\s+200%\s+damage\s+to\s+that\s+enemy\.)\s+(?=The\s+first\s+time)/i,
      "$1</p><p>"
    );
  }

  // Lucky Clown — Clown Luck.
  if (cardName === "Lucky Clown") {
    safe = safe.replace(
      /(Has\s+a\s+20%\s+chance\s+to\s+dodge\s+an\s+incoming\s+attack\.)\s+(?=After\s+attacking)/i,
      "$1</p><p>"
    );
  }

  // Bloomera — Spring Pollen.
  if (cardName === "Bloomera") {
    safe = safe.replace(
      /(allied\s+team\s+for\s+7\s+turns\.)\s+(?=While\s+Spring\s+Pollen)/i,
      "$1</p><p>"
    );
  }

  // Coward Goblin — Lucky Goblin.
  if (cardName === "Coward Goblin") {
    safe = safe.replace(
      /(Has\s+a\s+30%\s+chance\s+to\s+evade\s+the\s+incoming\s+attack\.)\s+(?=After\s+a\s+successful\s+evade)/i,
      "$1</p><p>"
    );
  }

  // New ability descriptions — paragraph breaks matched to the original cards.

  // The Fake — Engine.
  if (cardName === "The fake") {
    safe = safe.replace(
      /(opposing\s+card&#039;s\s+HP,\s+ATTACK,\s+and\s+SPEED\s+by\s+15%\.)\s+(?=In\s+raids,)/i,
      "$1</p><p>"
    );
  }

  // SWRM-87 — Swarm Carrier.
  if (cardName === "SWRM-87") {
    safe = safe.replace(
      /(directly\s+before\s+S\.Mini-87\.)\s+(?=On\s+death,)/i,
      "$1</p><p>"
    );
    safe = safe.replace(
      /(deploys\s+5\s+S\.Mini-87\s+at\s+once\.)\s+(?=Each\s+S\.Mini-87)/i,
      "$1</p><p>"
    );
  }

  // Ninja Traitor — Special Eye.
  if (cardName === "Ninja Traitor") {
    safe = safe.replace(
      /(incoming\s+attack\.)\s+(?=Each\s+attack\s+has)/i,
      "$1</p><p>"
    );
  }

  // Legs Fighter — Women Lover.
  if (cardName === "Legs Fighter") {
    safe = safe.replace(
      /(female\s+cards\.)\s+(?=Gains\s+50%)/i,
      "$1</p><p>"
    );
  }

  // Fatherboard — Overclock.
  if (cardName === "Fatherboard") {
    safe = safe.replace(
      /(enters\s+Overheat\s+Mode\.)\s+(?=While\s+in\s+Overheat\s+Mode,)/i,
      "$1</p><p>"
    );
    safe = safe.replace(
      /(current\s+HP\s+each\s+turn\.)\s+(?=If\s+Fatherboard\s+dies)/i,
      "$1</p><p>"
    );
  }

  // Existing general formatting for recurring/raid effects.
  safe = safe.replace(
    /\.\s+(?=Every\s+\d+\s+Global\s+Turns|In\s+raids,)/i,
    ".</p><p>"
  );

  // Exact phrase colors from the card screenshots.
  mark(/\b50%\s+of\s+this\s+card&#039;s\s+damage\b/gi, "ability-card-damage");
  mark(/\b\d+(?:\.\d+)?%\s+less\s+damage\b/gi, "ability-less-damage");
  mark(/\b100%\s+of\s+this\s+card&#039;s\s+maximum\s+HP\b/gi, "ability-max-hp");

  // Spiritual Pressure (Hole): colors are assigned by exact occurrence.
  // First paragraph: HP is green, SPEED is cyan, and 10% is purple.
  // Second paragraph: the first HP in "HP reduction" stays white.
  // The ending phrase "100% of this card's maximum HP" is green.
  if (cardName === "Hole") {
    markCustom(
      /\bHP\b(\s+and\s+)\bSPEED\b/gi,
      (match, separator) =>
        `<span class="ability-hp">HP</span>${separator}<span class="ability-speed">SPEED</span>`
    );

    mark(/\b10%(?=\.)/g, "ability-reduction");

    // Protect this exact white occurrence from the later general HP rule.
    markCustom(/\bHP\s+reduction\b/g, match => match);
  }

  // Demon: only "10% HP" is green.
  mark(/\b\d+(?:\.\d+)?%\s+HP\b/gi, "ability-hp-percent");

  // Cyber K.O.K.O.
  mark(/\bKokoverclock\b/gi, "ability-kokoverclock");
  mark(/\b250%\s+of\s+its\s+Attack\b/gi, "ability-cyber-attack");

  // Eldergrove.
  mark(/\b(?:25|10)%\s+of\s+maximum\s+HP\b/gi, "ability-max-hp");
  mark(/\bShield\b/gi, "ability-shield");

  // FPLN-67.
  if (cardName === "FPLN-67") {
    mark(/\bdoubles\s+its\s+Speed\b/gi, "ability-speed");
    mark(/\b2\s+separate\s+attacks\b/gi, "ability-fighter-attacks");
  }

  // Light as a Feather (Ball of feathers): only SPEED is cyan.
  // The rest of the sentence remains white.

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

  // New ability descriptions — exact screenshot color assignments.

  // The fake — Engine.
  // First HP is green; the later "HP" in "HP reduction" remains white.
  if (cardName === "The fake") {
    markOccurrence(/\bHP\b/g, "ability-hp", 1);
    mark(/\bATTACK\b/g, "ability-attack");
    mark(/\bSPEED\b/g, "ability-speed");
    mark(/15%/g, "ability-reduction");
    markCustom(/\bHP\s+reduction\b/g, match => match);
  }

  // SWRM-87 — Swarm Carrier.
  if (cardName === "SWRM-87") {
    mark(/\b5\s+S\.Mini-87\b/g, "ability-kokoverclock");
    mark(/15%\s+of\s+SWRM-87&#039;s\s+current\s+stats/gi, "ability-max-hp");
  }

  // Ninja Traitor — Special Eye.
  if (cardName === "Ninja Traitor") {
    mark(/\b20%\s+chance\b/gi, "ability-chance");
    mark(/\bdodge\b/gi, "ability-chance");
    mark(/200%\s+total\s+damage/gi, "ability-damage");
  }

  // Legs Fighter — Women Lover.
  if (cardName === "Legs Fighter") {
    mark(/\bfemale\s+cards\b/gi, "ability-kokoverclock");
    mark(/50%\s+ATTACK/gi, "ability-attack");
  }

  // Prince — Warrior Pride.
  if (cardName === "Prince") {
    mark(/\b10%\b/g, "ability-max-hp");
    mark(/20%\s+ATTACK\s+difference/gi, "ability-attack");
    mark(/\b100%\b/g, "ability-max-hp");
  }

  // M.KA-21 — Big Mecha.
  if (cardName === "M.KA-21") {
    mark(/\+10%\s+max\s+HP,\s+Attack,\s+and\s+Speed/gi, "ability-max-hp");
  }

  // Fatherboard — Overclock.
  if (cardName === "Fatherboard") {
    mark(/\bOverheat\s+Mode\b/gi, "ability-kokoverclock");
    mark(/30%\s+more\s+damage/gi, "ability-damage");
    mark(/10%\s+of\s+its\s+current\s+HP/gi, "ability-max-hp");
    mark(/70%\s+of\s+maximum\s+HP/gi, "ability-max-hp");
  }

  // The Fake: HP is green, ATTACK is red, SPEED is blue.
  mark(/\bHP\b/g, "ability-hp");
  mark(/\bATTACK\b/g, "ability-attack");
  mark(/\bSPEED\b/g, "ability-speed");

  // Bloomera — Spring Pollen.
  // This must run BEFORE the general 20% chance/dodge rules below.
  // mark() protects matches with tokens, so running the general rules first
  // would split "20% dodge chance" into separate pieces.
  if (cardName === "Bloomera") {
    // Only the first occurrence shown in the first sentence is green.
    mark(
      /\bSpring\s+Pollen\b(?=\s+across\s+the\s+allied\s+team)/gi,
      "ability-max-hp"
    );
    // The whole phrase is one cyan span.
    mark(/20%\s+dodge\s+chance/gi, "ability-speed");
    mark(/50%/g, "ability-max-hp");
  }

  // Lucky Clown: chance is orange/peach; dodge is blue.
  // Skip these generic rules for Bloomera because its exact phrase above
  // has already been assigned as one cyan span.
  if (cardName !== "Bloomera") {
    mark(/\b20%\s+chance\b/gi, "ability-chance");
    mark(/\bdodge\b/gi, "ability-dodge");
  }

  // Coward Goblin.
  // The screenshot colors only the FIRST "evade" (cyan).
  // The later "evade" in "After a successful evade" remains white.
  if (cardName === "Coward Goblin") {
    mark(/\b30%\s+chance\b/gi, "ability-chance");
    markOccurrence(/\bevade\b/gi, "ability-dodge", 1);
    mark(/\bcounterattacks\b/gi, "ability-damage");
    // 150% uses the same orange/peach shade as Cursed Vines.
    mark(/150%/g, "ability-damage");
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
const CARDS_PER_PAGE = 16;
let currentPage = 1;
let lastPageCount = 1;

let activeSort = {
  stat: "odds",
  direction: "desc"
};

function resetToFirstPage() {
  currentPage = 1;
}

function renderPagination(totalItems) {
  const pagination = $("#pagination");
  const totalPages = Math.max(1, Math.ceil(totalItems / CARDS_PER_PAGE));
  lastPageCount = totalPages;

  if (currentPage > totalPages) currentPage = totalPages;

  // Keep the control compact like the reference screenshot:
  // first five pages, an ellipsis when needed, and the last page.
  const pages = [];
  if (totalPages <= 6) {
    for (let page = 1; page <= totalPages; page++) pages.push(page);
  } else {
    for (let page = 1; page <= Math.min(5, totalPages); page++) pages.push(page);
    if (totalPages > 6) pages.push("ellipsis");
    pages.push(totalPages);
  }

  pagination.innerHTML = `
    <button class="page-btn page-prev" type="button" ${currentPage === 1 ? "disabled" : ""}>Prev</button>
    ${pages.map(page => {
      if (page === "ellipsis") {
        return '<span class="page-ellipsis" aria-hidden="true">…</span>';
      }
      return `<button class="page-btn page-number ${page === currentPage ? "active" : ""}"
        type="button" data-page="${page}" ${page === currentPage ? 'aria-current="page"' : ""}>${page}</button>`;
    }).join("")}
    <button class="page-btn page-next" type="button" ${currentPage === totalPages ? "disabled" : ""}>Next</button>
  `;

  const goToPage = page => {
    currentPage = Math.min(Math.max(page, 1), lastPageCount);
    renderCards();
    // Keep navigation convenient when the list is long.
    $("#cardGrid").scrollIntoView({ behavior: "smooth", block: "start" });
  };

  pagination.querySelector(".page-prev").onclick = () => goToPage(currentPage - 1);
  pagination.querySelector(".page-next").onclick = () => goToPage(currentPage + 1);
  pagination.querySelectorAll("[data-page]").forEach(button => {
    button.onclick = () => goToPage(Number(button.dataset.page));
  });
}

function updateSortControls() {
  document.querySelectorAll(".sort-stat").forEach(button => {
    const stat = button.dataset.stat;
    const arrow = button.querySelector(".sort-arrow");
    const isActive = activeSort.stat === stat;

    button.classList.toggle("active", isActive);

    if (!isActive) {
      arrow.textContent = "↕";
      button.setAttribute(
        "aria-label",
        `Sort by ${stat}. Click for highest first.`
      );
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
  const source = $("#sourceFilter").value;

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
        (!source || String(c.obtain || "").trim() === source) &&
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

  const totalPages = Math.max(1, Math.ceil(filtered.length / CARDS_PER_PAGE));
  if (currentPage > totalPages) currentPage = totalPages;

  const startIndex = (currentPage - 1) * CARDS_PER_PAGE;
  const pageCards = filtered.slice(startIndex, startIndex + CARDS_PER_PAGE);

  $("#cardGrid").innerHTML = pageCards.map(c => {
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

  renderPagination(filtered.length);

  if (filtered.length) {
    const showingStart = startIndex + 1;
    const showingEnd = Math.min(startIndex + CARDS_PER_PAGE, filtered.length);
    $("#count").textContent =
      `Showing ${showingStart}–${showingEnd} of ${filtered.length} Classic Border cards`;
  } else {
    $("#count").textContent = "Showing 0 cards";
  }
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

$("#search").addEventListener("input", () => {
  resetToFirstPage();
  renderCards();
});
$("#offFieldFilter").addEventListener("change", () => {
  resetToFirstPage();
  renderCards();
});
const sourceFilterButton = $("#sourceFilterButton");
const sourceFilterMenu = $("#sourceFilterMenu");

function closeSourceFilter() {
  sourceFilterMenu.classList.add("hidden");
  sourceFilterButton.setAttribute("aria-expanded", "false");
}

function setSourceFilter(value) {
  $("#sourceFilter").value = value;
  const selected = sourceFilterMenu.querySelector(`[data-source="${CSS.escape(value)}"]`);
  const selectedLabel = selected
    ? selected.querySelector(".source-filter-item-label")?.textContent
    : "All Sources";
  sourceFilterButton.querySelector(".source-filter-selected").textContent = selectedLabel || "All Sources";
  sourceFilterMenu.querySelectorAll(".source-filter-item").forEach(item => {
    item.classList.toggle("selected", item.dataset.source === value);
  });
  closeSourceFilter();
  resetToFirstPage();
  renderCards();
}

sourceFilterButton.addEventListener("click", event => {
  event.stopPropagation();
  const willOpen = sourceFilterMenu.classList.contains("hidden");
  sourceFilterMenu.classList.toggle("hidden", !willOpen);
  sourceFilterButton.setAttribute("aria-expanded", String(willOpen));
});

sourceFilterMenu.querySelectorAll(".source-filter-item").forEach(item => {
  item.addEventListener("click", () => setSourceFilter(item.dataset.source));
});

document.addEventListener("click", event => {
  if (!event.target.closest(".source-filter-wrap")) closeSourceFilter();
});

document.querySelectorAll(".sort-stat").forEach(button => {
  button.addEventListener("click", () => {
    const selectedStat = button.dataset.stat;

    // Three-click cycle:
    // 1st click: highest first ↓
    // 2nd click: lowest first ↑
    // 3rd click: original odds order ↕
    if (activeSort.stat !== selectedStat) {
      activeSort = {
        stat: selectedStat,
        direction: "desc"
      };
    } else if (activeSort.direction === "desc") {
      activeSort = {
        stat: selectedStat,
        direction: "asc"
      };
    } else {
      activeSort = {
        stat: "odds",
        direction: "desc"
      };
    }

    updateSortControls();
    resetToFirstPage();
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
