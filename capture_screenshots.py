from playwright.sync_api import sync_playwright
import time
import os
import sys

# Fix encoding for Windows console
if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')

def capture_website():
    with sync_playwright() as p:
        # Launch browser
        browser = p.chromium.launch(headless=False)
        context = browser.new_context(viewport={'width': 1920, 'height': 1080})
        page = context.new_page()
        
        print("Navigating to http://localhost:5500...")
        page.goto('http://localhost:5500', wait_until='networkidle')
        time.sleep(2)
        
        # Create screenshots directory
        os.makedirs('screenshots', exist_ok=True)
        
        # 1. Take initial full page screenshot
        print("Taking screenshot 1: Initial page load...")
        page.screenshot(path='screenshots/01_initial_load.png', full_page=True)
        
        # 2. Take viewport screenshot of hero section
        print("Taking screenshot 2: Hero section viewport...")
        page.screenshot(path='screenshots/02_hero_viewport.png')
        
        # Extract all text content
        print("\n" + "="*80)
        print("EXTRACTING PAGE CONTENT")
        print("="*80)
        
        # Get navbar content
        navbar_text = page.locator('nav, header').all_text_contents()
        print(f"\n📍 NAVBAR CONTENT:\n{navbar_text}")
        
        # Get hero section content
        hero_selectors = ['section:first-of-type', '.hero', '[class*="hero"]', 'main > div:first-child', 'main > section:first-child']
        hero_text = ""
        for selector in hero_selectors:
            try:
                if page.locator(selector).count() > 0:
                    hero_text = page.locator(selector).first.all_text_contents()
                    break
            except:
                continue
        print(f"\n📍 HERO SECTION CONTENT:\n{hero_text}")
        
        # Search for "Say What You Can't Say" specifically
        page_html = page.content()
        if "Say What You Can't Say" in page_html:
            print("\n✅ FOUND: 'Say What You Can't Say' appears on the page!")
            # Try to find the exact element
            elements = page.get_by_text("Say What You Can't Say", exact=False).all()
            print(f"Found {len(elements)} element(s) containing this text")
        else:
            print("\n❌ NOT FOUND: 'Say What You Can't Say' does not appear on the page")
        
        # Get all headings
        h1_texts = page.locator('h1').all_text_contents()
        h2_texts = page.locator('h2').all_text_contents()
        h3_texts = page.locator('h3').all_text_contents()
        
        print(f"\n📍 ALL H1 HEADINGS:\n{h1_texts}")
        print(f"\n📍 ALL H2 HEADINGS:\n{h2_texts}")
        print(f"\n📍 ALL H3 HEADINGS:\n{h3_texts}")
        
        # 3. Scroll down slowly and take screenshots
        viewport_height = page.viewport_size['height']
        page_height = page.evaluate('() => document.body.scrollHeight')
        
        scroll_step = viewport_height // 2  # Scroll half viewport at a time
        current_scroll = 0
        screenshot_num = 3
        
        print(f"\n📍 Starting scroll capture (Page height: {page_height}px)...")
        
        while current_scroll < page_height:
            current_scroll += scroll_step
            page.evaluate(f'window.scrollTo(0, {current_scroll})')
            time.sleep(1)  # Wait for animations/lazy loading
            
            print(f"Taking screenshot {screenshot_num}: Scrolled to {current_scroll}px...")
            page.screenshot(path=f'screenshots/{screenshot_num:02d}_scroll_{current_scroll}px.png')
            screenshot_num += 1
            
            # Stop after reasonable number of screenshots
            if screenshot_num > 15:
                break
        
        # Scroll back to top
        page.evaluate('window.scrollTo(0, 0)')
        time.sleep(1)
        
        # 4. Try to find and click Sign In/Sign Up button
        print("\n📍 Looking for Sign In/Sign Up button...")
        
        sign_in_selectors = [
            'text=/sign in/i',
            'text=/sign up/i',
            'text=/login/i',
            'button:has-text("Sign In")',
            'button:has-text("Sign Up")',
            'a:has-text("Sign In")',
            'a:has-text("Sign Up")',
            '[href*="signin"]',
            '[href*="signup"]',
            '[href*="login"]'
        ]
        
        clicked = False
        for selector in sign_in_selectors:
            try:
                element = page.locator(selector).first
                if element.is_visible(timeout=1000):
                    print(f"Found button with selector: {selector}")
                    element.click()
                    clicked = True
                    break
            except:
                continue
        
        if clicked:
            time.sleep(2)  # Wait for modal to appear
            print(f"Taking screenshot {screenshot_num}: Auth modal...")
            page.screenshot(path=f'screenshots/{screenshot_num:02d}_auth_modal.png')
            
            # Get modal content
            modal_text = page.locator('[role="dialog"], .modal, [class*="modal"]').all_text_contents()
            print(f"\n📍 AUTH MODAL CONTENT:\n{modal_text}")
        else:
            print("❌ Could not find Sign In/Sign Up button")
        
        print("\n" + "="*80)
        print("SCREENSHOT CAPTURE COMPLETE")
        print("="*80)
        print(f"Screenshots saved to: {os.path.abspath('screenshots')}")
        
        # Keep browser open for a moment
        time.sleep(3)
        
        browser.close()

if __name__ == "__main__":
    capture_website()
