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

        # Hover over the 5th element which should be the 3D Render one, showing the tooltip to the right
        cards = page.locator('.space-y-2 > .relative')

        if cards.count() > 4:
            cards.nth(4).scroll_into_view_if_needed()
            cards.nth(4).hover()
            page.wait_for_timeout(500)

        page.screenshot(path='/home/jules/verification/hover_screenshot_final2.png', full_page=True)
        browser.close()

if __name__ == '__main__':
    verify()
