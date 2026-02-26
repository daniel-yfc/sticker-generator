
import { test, expect, chromium } from '@playwright/test';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    console.log('Navigating to app...');
    await page.goto('http://localhost:3000');

    console.log('Checking for main title...');
    await expect(page.getByRole('heading', { name: 'Sticker Maker Pro', exact: true })).toBeVisible();

    console.log('Taking screenshot...');
    await page.screenshot({ path: 'verification/home_page.png' });

    console.log('Verification successful!');
  } catch (error) {
    console.error('Verification failed:', error);
    process.exit(1);
  } finally {
    await browser.close();
  }
})();
