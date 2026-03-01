import subprocess
from playwright.sync_api import sync_playwright

def verify():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto('http://localhost:3000/')

        # Look for buttons that represent style options
        page.evaluate("window.scrollBy(0, 500)")
        page.wait_for_selector('.relative > button', timeout=5000)

        cards = page.locator('.relative')
        if cards.count() > 1:
            cards.nth(1).hover()
            page.wait_for_timeout(500)

        page.screenshot(path='/home/jules/verification/hover_screenshot.png', full_page=True)
        browser.close()

if __name__ == '__main__':
    verify()
