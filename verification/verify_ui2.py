from playwright.sync_api import Page, expect, sync_playwright
import time

def test_translation(page: Page):
    # Navigate to local server
    page.goto("http://localhost:3000")

    # Wait for React to mount and render some known text (like welcome_desc)
    page.wait_for_selector('h1', timeout=5000)

    # Take screenshot of the app
    page.screenshot(path="verification/app_rendered2.png")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()
        page = context.new_page()
        try:
            test_translation(page)
            print("Screenshot saved to verification/app_rendered2.png")
        finally:
            browser.close()
