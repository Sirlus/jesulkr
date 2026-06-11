import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  console.log('=== Jesulkr Button Test ===\n');
  
  // Go to the app
  await page.goto('http://localhost:4174');
  await page.waitForLoadState('networkidle');
  console.log('1. Page loaded');
  
  // Click Korean language button if language modal is shown
  const langModal = await page.$('.languageModal');
  if (langModal && !await langModal.evaluate(el => el.classList.contains('hidden'))) {
    await page.click('button:has-text("한국어")');
    console.log('2. Selected Korean language');
    await page.waitForTimeout(500);
  }
  
  // Check initial state
  const bodyClass = await page.evaluate(() => document.body.className);
  console.log(`3. Body class: "${bodyClass}"`);
  
  // Click "전투 화면으로" button (might be hidden in design mode)
  try {
    const toBattleBtn = await page.$('.designerCloseBtn');
    if (toBattleBtn && await toBattleBtn.isVisible()) {
      await toBattleBtn.click();
      console.log('4. Clicked 전투 화면으로 button');
      await page.waitForTimeout(500);
      
      // Check toast message
      const toast = await page.$('#toast');
      const toastText = toast ? await toast.textContent() : 'none';
      console.log(`5. Toast: "${toastText}"`);
      
      // Check state again
      const bodyClass2 = await page.evaluate(() => document.body.className);
      console.log(`6. Body class after click: "${bodyClass2}"`);
    } else {
      console.log('4. 전투 화면으로 not visible (already in battle mode?)');
    }
  } catch (e) {
    console.log(`ERROR clicking toBattle: ${e.message}`);
  }
  
  // Check if in design mode, try switching to battle via toBattle button
  if (bodyClass.includes('mode-design')) {
    console.log('\n=== In design mode, trying to transition ===');
    
    // Click toBattle button
    await page.click('.designerCloseBtn');
    await page.waitForTimeout(500);
    
    const bodyClassAfter = await page.evaluate(() => document.body.className);
    console.log(`After click - Body class: "${bodyClassAfter}"`);
    
    // Check for toast
    const toast = await page.$('#toast');
    if (toast) {
      const isVisible = await toast.evaluate(el => !el.classList.contains('hidden'));
      if (isVisible) {
        const toastText = await toast.textContent();
        console.log(`Toast visible: "${toastText}"`);
      }
    }
  }
  
  console.log('\n=== Test Complete ===');
  await browser.close();
})();
