from playwright.sync_api import Page, expect, sync_playwright
import time
import os

def test_translation(page: Page):
    # Navigate to local file build
    filepath = os.path.abspath("dist/index.html")
    page.goto(f"file://{filepath}")

    # Wait for React to mount
    time.sleep(1)

    # Take screenshot of the app
    page.screenshot(path="verification/app_rendered.png")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()
        page = context.new_page()
        try:
            test_translation(page)
            print("Screenshot saved to verification/app_rendered.png")
        finally:
            browser.close()
