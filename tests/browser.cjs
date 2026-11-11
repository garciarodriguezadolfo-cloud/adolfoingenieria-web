/* Requires Playwright and Chromium; run against a local static server. */
const {chromium} = require('playwright');
const fs = require('fs');
const assert = require('node:assert/strict');
const base = process.env.TEST_BASE_URL || 'http://127.0.0.1:8765';
const root = require('node:path').resolve(__dirname, '..');
const urls = [...fs.readFileSync(root+'/sitemap.xml','utf8').matchAll(/<loc>(.*?)<\/loc>/g)].map(m=>new URL(m[1]).pathname);
urls.push('/aviso-legal/','/en/legal-notice/','/politica-privacidad/','/en/privacy-policy/');
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
    const lang = path.startsWith('/en/')?'en':'es';
    assert.equal(await page.locator('html').getAttribute('lang'),lang);
    assert.equal(await page.locator('h1').count(),1);
    assert.equal(await page.locator('link[rel=canonical]').getAttribute('href'),'https://adolfoingenieria.es'+path);
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`Horizontal overflow: ${path} at ${width}`);
    const alternate=await page.locator('#lang').getAttribute('href');
    await page.locator('#lang').click();await page.waitForURL(base+alternate);
    assert.equal(await page.locator('#lang').getAttribute('href'),path);
   }
  }
  for(const path of ['/contacto/','/en/contact/','/','/en/']){
   await page.goto(base+path);
   const outbound=[];
   const onRequest=r=>{if(r.method()!=='GET')outbound.push(r.url());};
   page.on('request',onRequest);
   await page.locator('[name=nombre]').fill('Prueba / Test');
   await page.locator('[name=email]').fill('test@example.org');
   await page.locator('[name=mensaje]').fill('<script>Test</script> — consulta técnica');
   await page.locator('#contact-form button[type=submit]').click();
   assert(await page.locator('#draft-output').isVisible());
   assert((await page.locator('#enquiry-draft').inputValue()).includes('<script>Test</script>'));
   assert((await page.locator('#contact-status').innerText()).includes(path.startsWith('/en/')?'No message':'No se ha enviado'));
   const compose = await page.locator('#open-email').getAttribute('href');
   assert(compose.startsWith('mailto:garciarodriguezadolfo@gmail.com?'));
   assert.equal(new URL(compose).searchParams.get('body'), await page.locator('#enquiry-draft').inputValue());
   await page.locator('#copy-draft').click();
   assert((await page.locator('#contact-status').innerText()).length>0);
   assert.deepEqual(outbound,[],'Draft must not transmit form data');
   assert.equal(await page.evaluate(()=>localStorage.length+sessionStorage.length),0);
   page.off('request',onRequest);
  }
  const nojs = await browser.newContext({javaScriptEnabled:false});
  await nojs.route('https://fonts.googleapis.com/**',r=>r.abort());
  const staticPage = await nojs.newPage();
  for(const path of urls){
   await staticPage.goto(base+path);
   assert((await staticPage.locator('h1').innerText()).length>0);
   const alternate=await staticPage.locator('#lang').getAttribute('href');
   await staticPage.locator('#lang').click();await staticPage.waitForURL(base+alternate);
  }
  fs.mkdirSync('/tmp/adolfo-preview',{recursive:true});
  await page.setViewportSize({width:1440,height:1000});await page.goto(base+'/');
  await page.screenshot({path:'/tmp/adolfo-preview/home-desktop.png',fullPage:true});
  await page.setViewportSize({width:390,height:844});await page.goto(base+'/certificados-energeticos-alicante/');
  await page.screenshot({path:'/tmp/adolfo-preview/energy-mobile.png',fullPage:true});
  assert.deepEqual(errors,[]);
  console.log('OK: 18 routes at desktop/390px/320px; language pairs with/without JS; canonical; local draft/copy without transmission or storage; no JS errors.');
 } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
