// Filter/Sort Bar — pill toggle (UI prototype)

(function () {
  const pills = document.querySelectorAll('.filter-pill');
  const countBadge = document.querySelector('.filter-bar__count');

  pills.forEach(pill => {
    pill.addEventListener('click', () => {
      pill.classList.toggle('is-active');
      pill.setAttribute('aria-pressed', pill.classList.contains('is-active'));
      updateCount();
    });
  });

  function updateCount() {
    const active = document.querySelectorAll('.filter-pill.is-active').length;
    if (countBadge) {
      countBadge.textContent = active;
      countBadge.classList.toggle('is-visible', active > 0);
    }
  }
})();
