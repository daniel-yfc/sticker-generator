import subprocess
from playwright.sync_api import sync_playwright

def verify():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto('http://localhost:3000/')

        # Click "Upload" with a PNG file to get past the hero view
        # Wait for the file input to be visible and upload
        page.locator('input[type="file"]').set_input_files('/home/jules/verification/hover_screenshot.png')

        # When uploaded, it changes to WORKSPACE LAYOUT and mode="sidebar"
        page.wait_for_selector('button:has-text("Information")')

        # Style selector uses .grid in grid mode, but in sidebar mode it's a div list
        cards = page.locator('.relative')

        if cards.count() > 1:
            cards.nth(1).scroll_into_view_if_needed()
            cards.nth(1).hover()
            page.wait_for_timeout(500)

        page.screenshot(path='/home/jules/verification/hover_screenshot_final.png', full_page=True)
        browser.close()

if __name__ == '__main__':
    verify()
