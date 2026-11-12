// Native flag links: accessibility, keyboard navigation and compact responsive layout.
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const base=process.env.TEST_BASE_URL || 'http://127.0.0.1:8765';
const names=['Español','English','Deutsch','Norsk bokmål','Русский','Nederlands'];
(async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
 try {
  const context=await browser.newContext();
  await context.route('https://fonts.googleapis.com/**',r=>r.abort());
  const page=await context.newPage();
  fs.mkdirSync('/tmp/adolfo-preview',{recursive:true});
  for(const width of [1440,390,320]){
   await page.setViewportSize({width,height:900});
   for(const path of ['/','/nl/','/nl/energiecertificaten-alicante/','/nl/contact/']){
    await page.goto(base+path);
    const links=page.locator('.language-switch a');
    assert.equal(await links.count(),6);
    assert.deepEqual(await links.evaluateAll(a=>a.map(x=>x.getAttribute('aria-label'))),names);
    const images=await links.locator('img').evaluateAll(imgs=>imgs.map(img=>({complete:img.complete,loaded:img.naturalWidth>0,rect:{width:img.getBoundingClientRect().width,height:img.getBoundingClientRect().height}})));
    for(const image of images){assert(image.complete && image.loaded);assert.deepEqual(image.rect,{width:24,height:16});}
    const boxes=await links.evaluateAll(a=>a.map(x=>({x:x.getBoundingClientRect().x,y:x.getBoundingClientRect().y,width:x.getBoundingClientRect().width,height:x.getBoundingClientRect().height})));
    assert(boxes.every(b=>b.y===boxes[0].y && b.x>=0 && b.x+b.width<=width),'Flags must fit in one row');
    const active=page.locator('.language-switch [aria-current=page]');
    assert.equal(await active.count(),1);
    assert.equal(await active.getAttribute('href'),path);
    assert.equal(await active.evaluate(el=>getComputedStyle(el,'::after').height),'2px');
    await page.locator('nav a').last().focus();
    for(let i=0;i<names.length;i++){
     await page.keyboard.press('Tab');
     assert(await links.nth(i).evaluate(el=>el===document.activeElement));
     assert.equal(await links.nth(i).evaluate(el=>el.matches(':focus-visible')),true);
    }
    await page.keyboard.press('Enter');
    const target=await links.nth(5).getAttribute('href');
    await page.waitForURL(base+target);
    assert.equal(await page.locator('html').getAttribute('lang'),'nl');
    await page.keyboard.press('Tab');
    await page.mouse.click(width-2,300); // Remove focus outline for the screenshot.
    await page.evaluate(()=>scrollTo(0,0));
    await page.screenshot({path:`/tmp/adolfo-preview/flags-${width}-${path.replaceAll('/','_')}.png`});
   }
  }
  console.log('OK: six local flags loaded at 24x16; one compact row at 1440/390/320px; accessible names; active indicator; Tab order, visible focus and Enter navigation.');
 } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
