import subprocess
from playwright.sync_api import sync_playwright

def verify():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto('http://localhost:3000/')

        # Wait for "3D Animation" style card (or other default)
        page.wait_for_selector('text=3D Animation')

        # Find the second button which should be a style card
        cards = page.locator('.relative > button')
        if cards.count() > 1:
            cards.nth(1).hover()
            page.wait_for_timeout(500)

        page.screenshot(path='verification/hover_screenshot.png')
        browser.close()

if __name__ == '__main__':
    verify()
