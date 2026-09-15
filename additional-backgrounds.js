/* Adds popup artwork classes for the newest background set without modifying app.js. */
(() => {
  const originalRenderModalCard = window.renderModalCard;
  if (typeof originalRenderModalCard !== "function") return;

  const popupBackgroundCards = new Set(Array.from({length: 17}, (_, i) => i + 61));

  window.renderModalCard = function(c, border) {
    originalRenderModalCard(c, border);
    const index = cards.indexOf(c);
    const modalCard = document.getElementById("modalCard");
    if (modalCard && popupBackgroundCards.has(index)) {
      modalCard.classList.add(`bg-${index}`);
    }
  };
})();
