/* Requires Playwright and Chromium; run against a local static server. */
const {chromium} = require('playwright');
const fs = require('fs');
const assert = require('node:assert/strict');
const base = process.env.TEST_BASE_URL || 'http://127.0.0.1:8765';
const root = require('node:path').resolve(__dirname, '..');
const urls = [...fs.readFileSync(root+'/sitemap.xml','utf8').matchAll(/<loc>(.*?)<\/loc>/g)].map(m=>new URL(m[1]).pathname);
urls.push('/aviso-legal/','/en/legal-notice/','/politica-privacidad/','/en/privacy-policy/','/de/impressum/','/de/datenschutz/','/no/juridisk-informasjon/','/no/personvern/','/ru/pravovaya-informatsiya/','/ru/konfidentsialnost/');
const language = path => ({no:'nb'}[path.split('/')[1]] || (['en','de','ru'].includes(path.split('/')[1])?path.split('/')[1]:'es'));
const messages = {es:'no está disponible',en:'unavailable',de:'nicht verfügbar',nb:'ikke tilgjengelig',ru:'недоступна'};
(async()=>{
 const browser = await chromium.launch({executablePath:process.env.CHROMIUM_PATH || '/usr/bin/chromium',headless:true,args:['--no-sandbox']});
 try {
  const context = await browser.newContext();
  await context.route('https://fonts.googleapis.com/**',r=>r.abort());
  const page = await context.newPage();
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  for(const width of [1440,390,320]){
   await page.setViewportSize({width,height:900});
   for(const path of urls){
    const response = await page.goto(base+path);
    assert.equal(response.status(),200,path);
    const lang = language(path);
    assert.equal(await page.locator('html').getAttribute('lang'),lang);
    assert.equal(await page.locator('h1').count(),1);
    assert.equal(await page.locator('link[rel=canonical]').getAttribute('href'),'https://adolfoingenieria.es'+path);
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`Horizontal overflow: ${path} at ${width}`);
    assert.equal(await page.locator('.language-switch a').count(),5);
    const alternatives=await page.locator('.language-switch a').evaluateAll(links=>links.map(a=>({href:a.getAttribute('href'),lang:a.lang})));
    for(const target of alternatives){
      await page.locator(`.language-switch a[lang="${target.lang}"]`).click();
      await page.waitForURL(base+target.href);
      assert.equal(await page.locator('html').getAttribute('lang'),target.lang);
      assert.equal(await page.locator(`.language-switch a[lang="${lang}"]`).getAttribute('href'),path);
    }
    const whatsapp=page.locator('.whatsapp-float');
    assert(await whatsapp.isVisible());
    const box=await whatsapp.boundingBox();
    assert(box.x>=0 && box.x+box.width<=width+1);
    const url=new URL(await whatsapp.getAttribute('href'));
    assert.equal(url.origin+url.pathname,'https://wa.me/34638651175');
    assert(url.searchParams.get('text').length>15);
   }
  }
  for(const path of ['/contacto/','/en/contact/','/de/kontakt/','/no/kontakt/','/ru/kontakty/','/','/en/','/de/','/no/','/ru/']){
   await page.goto(base+path);
   assert(await page.locator('#contact-form button[type=submit]').isDisabled());
   await page.waitForFunction(()=>document.getElementById('contact-status').dataset.state==='error');
   assert((await page.locator('#contact-status').innerText()).includes(messages[language(path)]));
   assert.equal(await page.evaluate(()=>localStorage.length+sessionStorage.length),0);
  }
  const nojs = await browser.newContext({javaScriptEnabled:false});
  await nojs.route('https://fonts.googleapis.com/**',r=>r.abort());
  const staticPage = await nojs.newPage();
  for(const path of urls){
   await staticPage.goto(base+path);
   assert((await staticPage.locator('h1').innerText()).length>0);
   const alternatives=await staticPage.locator('.language-switch a').evaluateAll(links=>links.map(a=>({href:a.getAttribute('href'),lang:a.lang})));
   for(const target of alternatives){
    await staticPage.locator(`.language-switch a[lang="${target.lang}"]`).click();await staticPage.waitForURL(base+target.href);
    assert.equal(await staticPage.locator('html').getAttribute('lang'),target.lang);
   }
  }
  fs.mkdirSync('/tmp/adolfo-preview',{recursive:true});
  await page.setViewportSize({width:1440,height:1000});await page.goto(base+'/');
  await page.screenshot({path:'/tmp/adolfo-preview/home-desktop.png',fullPage:true});
  await page.setViewportSize({width:390,height:844});await page.goto(base+'/certificados-energeticos-alicante/');
  await page.screenshot({path:'/tmp/adolfo-preview/energy-mobile.png',fullPage:true});
  assert.deepEqual(errors,[]);
  console.log('OK: 45 routes at desktop/390px/320px; all five equivalent languages with/without JS; WhatsApp; canonical; honest unconfigured form state; no JS errors.');
 } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
