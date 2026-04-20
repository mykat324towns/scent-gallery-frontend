const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();

  // --- Mobile: full testimonials section (closed) ---
  const mob1 = await browser.newPage();
  await mob1.setViewportSize({ width: 390, height: 844 });
  await mob1.goto('file:///c:/Users/jaxdo/Downloads/EA%20Demo/tmp/homepage.html');
  await mob1.waitForTimeout(600);
  await mob1.evaluate(() => document.querySelector('.testimonials').scrollIntoView({ behavior: 'instant' }));
  await mob1.waitForTimeout(300);
  const tRect = await mob1.$eval('.testimonials', el => {
    const r = el.getBoundingClientRect();
    return { x: 0, y: Math.max(0, r.y), width: 390, height: Math.min(r.height, 1800) };
  });
  await mob1.screenshot({ path: 'screenshots/SI Iterate/final-mobile-testimonials-closed.png', clip: tRect });

  // --- Mobile: WITB open ---
  const mob2 = await browser.newPage();
  await mob2.setViewportSize({ width: 390, height: 844 });
  await mob2.goto('file:///c:/Users/jaxdo/Downloads/EA%20Demo/tmp/homepage.html');
  await mob2.waitForTimeout(600);
  await mob2.evaluate(() => document.getElementById('witb-toggle').scrollIntoView({ behavior: 'instant', block: 'center' }));
  await mob2.waitForTimeout(200);
  await mob2.click('#witb-toggle');
  await mob2.waitForTimeout(900);
  const bpRect = await mob2.$eval('#box-panel', el => {
    const r = el.getBoundingClientRect();
    return { x: 0, y: Math.max(0, r.y), width: 390, height: Math.min(r.height + 40, 1800) };
  });
  await mob2.screenshot({ path: 'screenshots/SI Iterate/final-mobile-witb-open.png', clip: bpRect });

  // --- Desktop: WITB open ---
  const desk = await browser.newPage();
  await desk.setViewportSize({ width: 1280, height: 900 });
  await desk.goto('file:///c:/Users/jaxdo/Downloads/EA%20Demo/tmp/homepage.html');
  await desk.waitForTimeout(600);
  await desk.evaluate(() => document.getElementById('witb-toggle').scrollIntoView({ behavior: 'instant', block: 'center' }));
  await desk.waitForTimeout(200);
  await desk.click('#witb-toggle');
  await desk.waitForTimeout(900);
  const dRect = await desk.$eval('.testimonials', el => {
    const r = el.getBoundingClientRect();
    return { x: 0, y: Math.max(0, r.y), width: 1280, height: Math.min(r.height, 1400) };
  });
  await desk.screenshot({ path: 'screenshots/SI Iterate/final-desktop-witb-open.png', clip: dRect });

  await browser.close();
  console.log('done');
})();
