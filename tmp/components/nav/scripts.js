// Nav — sticky scroll + mobile drawer

(function () {
  const nav = document.querySelector('.nav');
  const hamburger = document.querySelector('.nav__hamburger');
  const drawer = document.querySelector('.nav__drawer');
  const drawerOverlay = document.querySelector('.nav__drawer-overlay');
  const drawerClose = document.querySelector('.nav__drawer-close');

  // Sticky on scroll
  const scrollHandler = () => {
    nav.classList.toggle('is-scrolled', window.scrollY > 10);
  };
  window.addEventListener('scroll', scrollHandler, { passive: true });
  scrollHandler();

  // Mobile drawer open
  if (hamburger) {
    hamburger.addEventListener('click', () => {
      const isOpen = drawer.classList.toggle('is-open');
      hamburger.classList.toggle('is-open', isOpen);
      document.body.style.overflow = isOpen ? 'hidden' : '';
      hamburger.setAttribute('aria-expanded', isOpen);
    });
  }

  const closeDrawer = () => {
    drawer.classList.remove('is-open');
    hamburger.classList.remove('is-open');
    document.body.style.overflow = '';
    hamburger.setAttribute('aria-expanded', 'false');
  };

  if (drawerOverlay) drawerOverlay.addEventListener('click', closeDrawer);
  if (drawerClose) drawerClose.addEventListener('click', closeDrawer);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && drawer.classList.contains('is-open')) closeDrawer();
  });
})();
