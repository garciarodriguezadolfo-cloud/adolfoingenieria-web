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
  for(const width of [1440,768,390,320]){
   await page.setViewportSize({width,height:900});
   for(const path of ['/','/en/','/de/','/no/','/ru/','/nl/','/nl/energiecertificaten-alicante/','/nl/contact/']){
    await page.goto(base+path);
    const links=page.locator('.language-switch a');
    assert.equal(await links.count(),6);
    assert.deepEqual(await links.evaluateAll(a=>a.map(x=>x.getAttribute('aria-label'))),names);
    assert.deepEqual(await links.locator('.language-code').allTextContents(),['ES','EN','DE','NO','RU','NL']);
    for(const link of await links.all()){
     const flag=await link.locator('img').boundingBox(),code=await link.locator('.language-code').boundingBox();
     assert(Math.abs(code.y-flag.y-flag.height-4)<0.1,'Code must be exactly 4px below flag');
     assert.equal(await link.evaluate(el=>getComputedStyle(el).display),'flex');
     assert.equal(await link.evaluate(el=>getComputedStyle(el).flexDirection),'column');
     assert(Math.abs((code.x+code.width/2)-(flag.x+flag.width/2))<1,'Code must be centered under flag');
     assert.equal(await link.locator('.language-code').getAttribute('aria-hidden'),'true');
    }
    const images=await links.locator('img').evaluateAll(imgs=>imgs.map(img=>({complete:img.complete,loaded:img.naturalWidth>0,rect:{width:img.getBoundingClientRect().width,height:img.getBoundingClientRect().height}})));
    for(const image of images){assert(image.complete && image.loaded);assert.deepEqual(image.rect,{width:21,height:14});}
    const boxes=await links.evaluateAll(a=>a.map(x=>({x:x.getBoundingClientRect().x,y:x.getBoundingClientRect().y,width:x.getBoundingClientRect().width,height:x.getBoundingClientRect().height})));
    assert(boxes.every(b=>b.height===44 && b.width===32),'Equal link dimensions');
    assert(boxes.slice(1).every((b,i)=>Math.abs(b.x-boxes[i].x-boxes[i].width-4)<0.1),'Uniform horizontal gap');
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
  const nojs=await browser.newContext({javaScriptEnabled:false});
  await nojs.route('https://fonts.googleapis.com/**',r=>r.abort());
  const staticPage=await nojs.newPage({viewport:{width:320,height:900}});
  await staticPage.goto(base+'/nl/energiecertificaten-alicante/');
  const alternatives=await staticPage.locator('.language-switch a').evaluateAll(links=>links.map(a=>({href:a.getAttribute('href'),lang:a.lang})));
  for(const target of alternatives){
   await staticPage.locator(`.language-switch a[lang="${target.lang}"]`).click();
   await staticPage.waitForURL(base+target.href);
   assert.equal(await staticPage.locator('html').getAttribute('lang'),target.lang);
   assert.equal(await staticPage.locator('.language-code').count(),6);
  }
  await staticPage.goto(base+'/404.html');
  assert.deepEqual(await staticPage.locator('.language-code').allTextContents(),['ES','EN','DE','NO','RU','NL']);
  await nojs.close();
  // Reproduce an old cached selector stylesheet and later conflicting generic rules.
  const stale=await browser.newContext();
  await stale.route('https://fonts.googleapis.com/**',r=>r.abort());
  const sharedCss=fs.readFileSync(require('node:path').join(__dirname,'../styles.css'),'utf8');
  await stale.route('**/styles.css',r=>r.fulfill({contentType:'text/css',body:sharedCss.replace('.language-switch a{position:relative;display:inline-flex;flex-direction:column;', '.language-switch a{position:relative;display:inline-flex;flex-direction:row;')}));
  const stalePage=await stale.newPage();
  for(const width of [1440,768,390,320]){
   await stalePage.setViewportSize({width,height:900});
   await stalePage.goto(base+'/');
   await stalePage.addStyleTag({content:'.site-header .language-switch a, .language-switch a { display: inline-flex; flex-direction: row; }'});
   for(const link of await stalePage.locator('.language-switch a').all()){
    const flag=await link.locator('img').boundingBox(),code=await link.locator('.language-code').boundingBox();
    assert(Math.abs(code.y-flag.y-flag.height-4)<0.1);
    assert(Math.abs((code.x+code.width/2)-(flag.x+flag.width/2))<0.1);
   }
   await stalePage.screenshot({path:`/tmp/adolfo-preview/selector-stale-css-${width}.png`});
  }
  await stale.close();
  console.log('OK: exact 4px vertical gaps; equal dimensions; cached CSS and conflicting-rule regression; centered codes under all flags; six equivalent service pages without JS; 404; six local flags loaded at 21x14; one compact row at 1440/768/390/320px; accessible names; active indicator; Tab order, visible focus and Enter navigation.');
 } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
