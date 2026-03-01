import subprocess
from playwright.sync_api import sync_playwright

def verify():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto('http://localhost:3000/')

        # Click "Upload" with a PNG file
        page.locator('input[type="file"]').set_input_files('/home/jules/verification/hover_screenshot.png')

        # Check if style selection shows up
        page.wait_for_selector('h2:has-text("1. ")')

        cards = page.locator('.grid > div.relative')

        if cards.count() > 1:
            cards.nth(1).scroll_into_view_if_needed()
            cards.nth(1).hover()
            page.wait_for_timeout(500)

        page.screenshot(path='/home/jules/verification/hover_screenshot_2.png', full_page=True)
        browser.close()

if __name__ == '__main__':
    verify()
