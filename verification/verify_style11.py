import subprocess
from playwright.sync_api import sync_playwright

def verify():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto('http://localhost:3000/')

        # Click "Upload" with a PNG file
        page.locator('input[type="file"]').set_input_files('/home/jules/verification/hover_screenshot.png')

        # In sidebar mode it uses "w-10 h-10 rounded-md" or similar.
        page.wait_for_selector('.w-10.h-10.rounded-md', timeout=5000)

        cards = page.locator('.relative')

        if cards.count() > 1:
            # We want to hover over the first element that acts as a style container
            cards.nth(1).scroll_into_view_if_needed()
            cards.nth(1).hover()
            page.wait_for_timeout(500)

        page.screenshot(path='/home/jules/verification/hover_screenshot_final.png', full_page=True)
        browser.close()

if __name__ == '__main__':
    verify()
