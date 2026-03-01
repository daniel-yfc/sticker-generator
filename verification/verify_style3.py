import subprocess
from playwright.sync_api import sync_playwright

def verify():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto('http://localhost:3000/')

        # Click "View All" or upload a photo to get to step 2 which has the StyleSelector
        # Looking at App.tsx to see how to trigger StyleSelector...
        # Ah, actually StyleSelector is Step 1 in the main app layout.

        page.wait_for_selector('.grid.grid-cols-2')
        cards = page.locator('.grid.grid-cols-2 > div.relative')

        if cards.count() > 1:
            # Scroll it into view
            cards.nth(1).scroll_into_view_if_needed()
            # Hover over it
            cards.nth(1).hover()
            page.wait_for_timeout(500)

        page.screenshot(path='/home/jules/verification/hover_screenshot.png', full_page=True)
        browser.close()

if __name__ == '__main__':
    verify()
