(function () {
  function initCard(card) {
    if (card.dataset.fcInit) return;
    card.dataset.fcInit = "1";
    card.setAttribute("tabindex", "0");
    card.setAttribute("role", "button");
    card.setAttribute("aria-pressed", "false");

    // Both faces stay in the DOM at all times; only a 3D CSS transform
    // hides the inactive one visually. Screen readers don't perceive that
    // transform, so without aria-hidden they announce the answer right
    // after the question, revealing it before the user can attempt recall.
    const front = card.querySelector(".flashcard-front");
    const back = card.querySelector(".flashcard-back");
    if (back) back.setAttribute("aria-hidden", "true");

    function toggle() {
      const flipped = card.classList.toggle("is-flipped");
      card.setAttribute("aria-pressed", flipped ? "true" : "false");
      if (front) front.setAttribute("aria-hidden", flipped ? "true" : "false");
      if (back) back.setAttribute("aria-hidden", flipped ? "false" : "true");
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
