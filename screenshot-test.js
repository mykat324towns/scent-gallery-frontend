const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch();
  const resolved = path.resolve('tmp/homepage.html');
  const filePath = 'file:///' + resolved.split('\').join('/');
  
  // Desktop
  const desktopContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const desktopPage = await desktopContext.newPage();
  await desktopPage.goto(filePath, { waitUntil: 'networkidle' });
  await desktopPage.waitForTimeout(500);
  await desktopPage.screenshot({ path: 'screenshots/SI Iterate/polish-desktop-full.png', fullPage: true });
  console.log('✓ Desktop full page');
  await desktopContext.close();
  
  // Mobile
  const mobileContext = await browser.newContext({ viewport: { width: 375, height: 812 } });
  const mobilePage = await mobileContext.newPage();
  await mobilePage.goto(filePath, { waitUntil: 'networkidle' });
  await mobilePage.waitForTimeout(500);
  await mobilePage.screenshot({ path: 'screenshots/SI Iterate/polish-mobile-full.png', fullPage: true });
  console.log('✓ Mobile full page');
  await mobileContext.close();
  
  await browser.close();
})();
