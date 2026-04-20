const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  
  // Desktop — open state
  const desktop = await browser.newPage();
  await desktop.setViewportSize({ width: 1280, height: 900 });
  await desktop.goto('file:///c:/Users/jaxdo/Downloads/EA%20Demo/tmp/homepage.html');
  await desktop.waitForTimeout(500);
  const toggleD = await desktop.$('#witb-toggle');
  await toggleD.scrollIntoViewIfNeeded();
  await desktop.screenshot({ path: 'screenshots/SI Iterate/witb-d-section-closed.png', clip: await desktop.$eval('.testimonials', el => { const r = el.getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height }; }) });
  await toggleD.click();
  await desktop.waitForTimeout(800);
  await desktop.screenshot({ path: 'screenshots/SI Iterate/witb-d-section-open.png', clip: await desktop.$eval('.testimonials', el => { const r = el.getBoundingClientRect(); return { x: Math.max(0,r.x), y: Math.max(0,r.y), width: r.width, height: Math.min(r.height, 1200) }; }) });

  // Mobile — open state
  const mobile = await browser.newPage();
  await mobile.setViewportSize({ width: 390, height: 844 });
  await mobile.goto('file:///c:/Users/jaxdo/Downloads/EA%20Demo/tmp/homepage.html');
  await mobile.waitForTimeout(500);
  const toggleM = await mobile.$('#witb-toggle');
  await toggleM.scrollIntoViewIfNeeded();
  await mobile.screenshot({ path: 'screenshots/SI Iterate/witb-m-section-closed.png', clip: await mobile.$eval('.testimonials', el => { const r = el.getBoundingClientRect(); return { x: Math.max(0,r.x), y: Math.max(0,r.y), width: r.width, height: Math.min(r.height+200, 900) }; }) });
  await toggleM.click();
  await mobile.waitForTimeout(800);
  // full page after open
  await mobile.screenshot({ path: 'screenshots/SI Iterate/witb-m-section-open.png', fullPage: true });

  await browser.close();
  console.log('done');
})();
