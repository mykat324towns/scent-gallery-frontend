const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('file:///c:/Users/jaxdo/Downloads/EA%20Demo/tmp/homepage.html');
  await page.waitForTimeout(800);

  // Get position of testimonials section
  const info = await page.evaluate(() => {
    const s = document.querySelector('.testimonials');
    const r = s ? s.getBoundingClientRect() : null;
    const cards = [...document.querySelectorAll('.testimonial-card')].map(c => ({
      opacity: getComputedStyle(c).opacity,
      visibility: getComputedStyle(c).visibility,
      classes: c.className
    }));
    return { rect: r, cards, scrollY: window.scrollY, bodyH: document.body.scrollHeight };
  });
  console.log(JSON.stringify(info, null, 2));

  // Full page screenshot
  await page.screenshot({ path: 'screenshots/SI Iterate/mobile-fullpage-v2.png', fullPage: true });

  await browser.close();
})();
