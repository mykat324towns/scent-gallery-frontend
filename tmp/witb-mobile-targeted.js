const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('file:///c:/Users/jaxdo/Downloads/EA%20Demo/tmp/homepage.html');
  await page.waitForTimeout(600);
  
  // Scroll to testimonials section
  await page.evaluate(() => {
    const s = document.querySelector('.testimonials');
    if (s) s.scrollIntoView({ behavior: 'instant' });
  });
  await page.waitForTimeout(600);
  
  // Screenshot: testimonials section in viewport
  await page.screenshot({ path: 'screenshots/SI Iterate/mobile-testimonials-targeted.png' });

  // Now also check cards 3 and 4 visibility after scroll
  const info = await page.evaluate(() => {
    return [...document.querySelectorAll('.testimonial-card')].map((c, i) => ({
      index: i,
      isVisible: c.classList.contains('is-visible'),
      opacity: getComputedStyle(c).opacity,
      rect: (() => { const r = c.getBoundingClientRect(); return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) }; })()
    }));
  });
  console.log(JSON.stringify(info, null, 2));

  await browser.close();
})();
