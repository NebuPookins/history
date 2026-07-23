(function () {
  function initCard(card) {
    if (card.dataset.fcInit) return;
    card.dataset.fcInit = "1";
    card.setAttribute("tabindex", "0");
    card.setAttribute("role", "button");
    card.setAttribute("aria-pressed", "false");

    function toggle() {
      const flipped = card.classList.toggle("is-flipped");
      card.setAttribute("aria-pressed", flipped ? "true" : "false");
    }

    card.addEventListener("click", toggle);
    card.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        toggle();
      }
    });
  }

  document.querySelectorAll(".flashcard").forEach(initCard);
})();
