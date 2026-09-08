let cards = [];
const $ = (s) => document.querySelector(s);
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
    </div>
  `;
}

function populateFilters() {
  const filter = $("#rarityFilter");
  rarityOrder.forEach(v => {
    filter.insertAdjacentHTML("beforeend", `<option value="${v}">${v}</option>`);
  });
}

function formatAbilityDescription(text) {
  let safe = esc(text);

  // Put recurring Global Turn effects in a separate paragraph.
  safe = safe.replace(
    /\.(\s*)(Every\s+\d+\s+Global Turns)/i,
    ".</p><p>$2"
  );

  // Highlight damage percentages.
  safe = safe.replace(
    /(\d+(?:\.\d+)?%)/g,
    '<span class="ability-accent">$1</span>'
  );

  // Highlight shot and missile counts.
  safe = safe.replace(
    /(\d+)(?=\s+(?:shots?|missiles?))/gi,
    '<span class="ability-accent">$1</span>'
  );

  return `<div class="ability-description"><p>${safe}</p></div>`;
}

function renderCards() {
  const q = $("#search").value.toLowerCase().trim();
  const rarity = $("#rarityFilter").value;
  const offField = $("#offFieldFilter").value;

  // Keep the ORIGINAL card index so clicking filtered cards opens the correct card.
  const filtered = cards
    .map((card, originalIndex) => ({ card, originalIndex }))
    .filter(({ card: c }) => {
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

  $("#count").textContent = `Showing ${filtered.length} of ${cards.length} cards`;

  $("#cardGrid").innerHTML = filtered.map(({ card: c, originalIndex }) => `
    <article class="card ${cardRarityClass(c.rarity)}" data-index="${originalIndex}">
      <span class="badge ${rarityClass(c.rarity)}">${esc(c.rarity)}</span>
      <h3>${esc(c.characterName)}</h3>
      ${statsHtml(c)}
      <div class="ability">
        <h4>${esc(c.abilityName)}</h4>
      </div>
      <div class="card-footer">
        <p class="odds">${esc(c.odds)}</p>
        <p class="offfield">
          ${c.hasOffFieldEffects ? "✓ Has Off-Field Effects" : "✕ No Off-Field Effects"}
        </p>
      </div>
    </article>
  `).join("") || "<p>No cards found.</p>";
}

function openCard(index) {
  const c = cards[index];
  if (!c) return;

  const modalContent = $("#modalContent");
  const modal = $("#modal");

  if (!modalContent || !modal) {
    console.error("Modal elements were not found.");
    return;
  }

  modalContent.innerHTML = `
    <span class="badge ${rarityClass(c.rarity)}">${esc(c.rarity)}</span>
    <h2>${esc(c.characterName)}</h2>
    ${statsHtml(c)}
    <p class="odds">${esc(c.odds)}</p>
    <hr>
    <h3>${esc(c.abilityName)}</h3>
    ${formatAbilityDescription(c.abilityDescription)}
    <p class="offfield">
      ${c.hasOffFieldEffects ? "✓ Has Off-Field Effects" : "✕ No Off-Field Effects"}
    </p>
  `;

  modal.classList.remove("hidden");
}

// Event delegation: clicking any card works even after filtering/rerendering.
$("#cardGrid").addEventListener("click", (e) => {
  const card = e.target.closest(".card");
  if (!card) return;

  const index = Number(card.dataset.index);
  openCard(index);
});

$("#search").addEventListener("input", renderCards);
$("#rarityFilter").addEventListener("change", renderCards);
$("#offFieldFilter").addEventListener("change", renderCards);

document.querySelectorAll(".nav-btn").forEach(button => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".nav-btn").forEach(x => x.classList.remove("active"));
    document.querySelectorAll(".page").forEach(x => x.classList.remove("active"));

    button.classList.add("active");
    const page = $("#" + button.dataset.page);
    if (page) page.classList.add("active");
  });
});

$("#closeModal").addEventListener("click", () => {
  $("#modal").classList.add("hidden");
});

$("#modal").addEventListener("click", (e) => {
  if (e.target === $("#modal")) {
    $("#modal").classList.add("hidden");
  }
});

fetch("cards.json")
  .then(response => {
    if (!response.ok) throw new Error("Could not load cards.json");
    return response.json();
  })
  .then(data => {
    cards = Array.isArray(data) ? data : [];
    populateFilters();
    renderCards();
  })
  .catch(error => {
    console.error(error);
    $("#cardGrid").innerHTML = "<p>Unable to load the card database.</p>";
  });
