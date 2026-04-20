const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();

  // Desktop — open state
  const desktop = await browser.newPage();
  await desktop.setViewportSize({ width: 1280, height: 900 });
  await desktop.goto('file:///c:/Users/jaxdo/Downloads/EA%20Demo/tmp/homepage.html');
  await desktop.waitForTimeout(600);
  const toggleD = await desktop.$('#witb-toggle');
  await toggleD.scrollIntoViewIfNeeded();
  await desktop.waitForTimeout(200);
  await toggleD.click();
  await desktop.waitForTimeout(900);
  // Capture the full testimonials section
  const rectD = await desktop.$eval('.testimonials', el => {
    const r = el.getBoundingClientRect();
    return { x: Math.max(0, r.x), y: Math.max(0, r.y), width: r.width, height: r.height };
  });
  await desktop.screenshot({ path: 'screenshots/SI Iterate/witb-d-open-v2.png', clip: rectD });

  // Mobile — closed (testimonials visible?)
  const mobile = await browser.newPage();
  await mobile.setViewportSize({ width: 390, height: 844 });
  await mobile.goto('file:///c:/Users/jaxdo/Downloads/EA%20Demo/tmp/homepage.html');
  await mobile.waitForTimeout(600);
  // Scroll to testimonials
  await mobile.$eval('.testimonials', el => el.scrollIntoView());
  await mobile.waitForTimeout(400);
  await mobile.screenshot({ path: 'screenshots/SI Iterate/witb-m-testimonials-closed-v2.png' });

  // Mobile — open state
  const toggle = await mobile.$('#witb-toggle');
  await toggle.click();
  await mobile.waitForTimeout(900);
  await mobile.screenshot({ path: 'screenshots/SI Iterate/witb-m-testimonials-open-v2.png' });

  await browser.close();
  console.log('done');
})();
