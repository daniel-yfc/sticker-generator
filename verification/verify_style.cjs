const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    await page.goto('http://localhost:3000/');

    // Wait for styles to load (we expect text "Step 1" or something)
    await page.waitForLoadState('networkidle');

    // Hover over the second style option
    const styles = await page.$$('button:has-text("Information")');
    // Just find a style card using a general selector, the grid items
    const styleCards = await page.$$('.relative > button');
    if (styleCards.length > 1) {
      await styleCards[1].hover();
      // Wait for animation or tooltip
      await page.waitForTimeout(500);
    }

    await page.screenshot({ path: 'verification/hover_screenshot.png' });
    console.log('Screenshot saved to verification/hover_screenshot.png');

  } catch (err) {
    console.error('Error during verification:', err);
  } finally {
    await browser.close();
  }
})();
