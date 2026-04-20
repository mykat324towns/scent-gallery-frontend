// Collection Grid — scroll reveal for cards

(function () {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

  document.querySelectorAll('.collection__grid .product-card').forEach((card, i) => {
    card.classList.add('reveal');
    card.style.transitionDelay = `${i * 60}ms`;
    observer.observe(card);
  });
})();
