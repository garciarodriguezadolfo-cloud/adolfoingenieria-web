// Six real empty indexes, accessible navigation, equivalent languages and mobile layout.
// The eight final acceptance checks: every language at the four requested widths.
// Complete raster logo: responsive geometry, images and comparative screenshots.
const {chromium}=require('playwright');
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const base=process.env.TEST_BASE_URL||'http://127.0.0.1:8768',out=process.env.ARTICLES_OUT||'/tmp/adolfo-articles-review';
(async()=>{const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox']});try{
 const context=await browser.newContext({deviceScaleFactor:2});const fontDir=process.env.HEADER_FONT_DIR;
 if(fontDir){let css='';for(const family of ['dm-sans','manrope'])for(const weight of (family==='manrope'?[400,500,600,700,800]:[400,500,600,700]))css+=fs.readFileSync(path.join(fontDir,family,`${weight}.css`),'utf8').replaceAll('./files/',`${base}/__test_fonts/${family}/`);await context.route('https://fonts.googleapis.com/**',r=>r.fulfill({contentType:'text/css',body:css}));await context.route('**/__test_fonts/**',r=>{const p=new URL(r.request().url()).pathname.split('/');return r.fulfill({path:path.join(fontDir,p.at(-2),'files',path.basename(p.at(-1)))});});}else await context.route('https://fonts.googleapis.com/**',r=>r.abort());





 fs.mkdirSync(out,{recursive:true});const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 const ui=JSON.parse(fs.readFileSync(path.join(__dirname,'../site/article-locales.json')));const route=l=>(l==='es'?'/':`/${l}/`)+ui[l].slug+'/';
 for(const width of (process.env.ARTICLE_WIDTHS?.split(',').map(Number)||[320,390,768,1440]))for(const lang of ['es','en','de','no','ru','nl']){
 await page.setViewportSize({width,height:900});assert.equal((await page.goto(base+route(lang))).status(),200);await page.evaluate(()=>document.fonts.ready);await page.waitForFunction(()=>document.documentElement.dataset.typographyReady==='true');
 assert.equal(await page.locator('h1').innerText(),ui[lang].h1);assert.equal(await page.locator('.service-hero .lead').innerText(),ui[lang].intro);assert.equal(await page.locator('.article-empty').innerText(),ui[lang].empty);assert.equal(await page.locator('main article,main time').count(),0);
 const graph=JSON.parse(await page.locator('script[type="application/ld+json"]').textContent())['@graph'];assert.equal(graph[1]['@type'],'CollectionPage');assert(!graph.some(n=>n['@type']==='Article'));assert.equal(graph.find(n=>n['@type']==='ItemList').numberOfItems,0);
 const menu=page.locator('header nav a');assert.equal(await menu.count(),6);assert.equal(await menu.nth(4).innerText(),ui[lang].label);assert.equal(await menu.nth(4).getAttribute('href'),route(lang));if(lang==='es')assert.deepEqual(await menu.allTextContents(),['Inicio','Peritajes','Servicios','Sobre mí','Artículos','Contacto']);
 const boxes=await menu.evaluateAll(es=>es.map(e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,right:r.right};}));assert(boxes.every(r=>Math.abs(r.y-boxes[0].y)<.1),'Menu remains on one line');assert(boxes.every(r=>r.x>=0&&r.right<=width));assert(Math.abs((boxes[0].x+boxes.at(-1).right)/2-width/2)<1);
 const flags=await page.locator('header .language-switch a').evaluateAll(es=>es.map(e=>e.getBoundingClientRect().y));assert(flags.every(y=>y===flags[0]));assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'No horizontal overflow');
 for(const target of ['es','en','de','no','ru','nl'])assert.equal(await page.locator(`.language-switch a[hreflang="${target==='no'?'nb':target}"]`).getAttribute('href'),route(target));
 await menu.nth(3).focus();await page.keyboard.press('Tab');assert(await menu.nth(4).evaluate(e=>e===document.activeElement));await Promise.all([page.waitForNavigation({waitUntil:'load'}),page.keyboard.press('Enter')]);assert.equal(page.url(),base+route(lang));await page.evaluate(()=>document.fonts.ready);await page.locator('header nav a').nth(4).evaluate(e=>e.blur());
 assert((await page.locator('.whatsapp-float').getAttribute('href')).startsWith('https://wa.me/34638651175'));assert.equal(await page.locator('.brand img').count(),1);assert.equal(await page.locator('.footer-logo').count(),1);
 await page.locator('header').screenshot({path:`${out}/${lang}-header-${width}.png`});await page.evaluate(()=>scrollTo(0,document.documentElement.scrollHeight));await page.screenshot({path:`${out}/${lang}-index-${width}.png`,fullPage:true});console.log(`OK ${lang} articles ${width}`);
 }
 // Native equivalent-language links must work without application JavaScript.
 const nojs=await browser.newContext({javaScriptEnabled:false});await nojs.route('https://fonts.googleapis.com/**',r=>r.abort());const staticPage=await nojs.newPage();
 for(const target of ['es','en','de','no','ru','nl']){await staticPage.goto(base+route('es'));await staticPage.locator(`.language-switch a[hreflang="${target==='no'?'nb':target}"]`).click();await staticPage.waitForURL(base+route(target));assert.equal(await staticPage.locator('h1').innerText(),ui[target].h1);}
 await nojs.close();assert.deepEqual(errors,[]);console.log('OK native language navigation without JavaScript');
 }finally{await browser.close();}})().catch(e=>{console.error(e);process.exit(1)});
