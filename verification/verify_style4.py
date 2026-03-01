import subprocess
from playwright.sync_api import sync_playwright

def verify():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto('http://localhost:3000/')

        # Click "View All"
        page.wait_for_selector('text=View All')
        page.click('text=View All')

        # Now we should see the grid layout of StyleSelector
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
