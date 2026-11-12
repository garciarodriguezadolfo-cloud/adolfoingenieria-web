// Link-only fixtures: never contact WhatsApp or send messages.
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const base=process.env.TEST_BASE_URL || 'http://127.0.0.1:8765';
(async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
 try {
  const context=await browser.newContext();
  await context.route('https://fonts.googleapis.com/**',r=>r.abort());
  await context.route('https://wa.me/**',r=>r.fulfill({contentType:'text/html',body:'<title>WhatsApp link fixture</title>'}));
  const page=await context.newPage();
  fs.mkdirSync('/tmp/adolfo-preview',{recursive:true});
  for(const width of [1440,390,320]){
   await page.setViewportSize({width,height:900});
   for(const [lang,path] of [['es','/contacto/'],['en','/en/contact/'],['de','/de/kontakt/'],['nb','/no/kontakt/'],['ru','/ru/kontakty/']]){
    await page.goto(base+path);
    const link=page.locator('.whatsapp-float');
    const href=await link.getAttribute('href');
    const popupPromise=context.waitForEvent('page');
    await link.click();const popup=await popupPromise;
    await popup.waitForLoadState();assert.equal(popup.url(),href);
    assert.equal(await popup.title(),'WhatsApp link fixture');await popup.close();
    await page.locator('[name=mensaje]').scrollIntoViewIfNeeded();
    await page.locator('[name=mensaje]').fill('Test WhatsApp layout');
    await page.locator('[name=privacy]').check();
    await page.locator('footer').scrollIntoViewIfNeeded();
    const footer=await page.locator('footer').boundingBox(),button=await link.boundingBox();
    assert(footer.y+footer.height<=button.y,`Footer overlap: ${lang} at ${width}`);
    await page.screenshot({path:`/tmp/adolfo-preview/contact-${lang}-${width}.png`,fullPage:true});
   }
  }
  await page.goto(base+'/404.html');assert.equal(await page.locator('.language-switch a').count(),5);assert(await page.locator('.whatsapp-float').isVisible());
  console.log('OK: WhatsApp clicks open the exact translated URL in a new tab for all five languages at 1440/390/320px; form controls usable; footer unobscured; shared 404. No external WhatsApp requests.');
 } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
