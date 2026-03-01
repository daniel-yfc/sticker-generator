import subprocess
from playwright.sync_api import sync_playwright

def verify():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto('http://localhost:3000/')

        # Click "Upload" with a PNG file
        page.locator('input[type="file"]').set_input_files('verification/hover_screenshot.png')

        # Wait for something to appear after uploading
        page.wait_for_selector('button:has-text("Magic Wand")') # Based on common terms

        # Style selector might be there
        page.wait_for_selector('.grid.grid-cols-2')
        cards = page.locator('.grid.grid-cols-2 > div.relative')

        if cards.count() > 1:
            cards.nth(1).scroll_into_view_if_needed()
            cards.nth(1).hover()
            page.wait_for_timeout(500)

        page.screenshot(path='/home/jules/verification/hover_screenshot.png', full_page=True)
        browser.close()

if __name__ == '__main__':
    verify()
