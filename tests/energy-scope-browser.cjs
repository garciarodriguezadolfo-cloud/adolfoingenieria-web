// Verify energy-page content and responsive layout in all six languages.
// Responsive content and geographic scope checks for the three affected services.
const {chromium}=require('playwright');
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const base=process.env.TEST_BASE_URL||'http://127.0.0.1:8767',out='/tmp/adolfo-energy-review';
(async()=>{const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox']});try{
 const context=await browser.newContext();const fontDir=process.env.HEADER_FONT_DIR;
 if(fontDir){let css='';for(const family of ['dm-sans','manrope'])for(const weight of (family==='manrope'?[400,500,600,700,800]:[400,500,600,700]))css+=fs.readFileSync(path.join(fontDir,family,`${weight}.css`),'utf8').replaceAll('./files/',`${base}/__test_fonts/${family}/`);await context.route('https://fonts.googleapis.com/**',r=>r.fulfill({contentType:'text/css',body:css}));await context.route('**/__test_fonts/**',r=>{const p=new URL(r.request().url()).pathname.split('/');return r.fulfill({path:path.join(fontDir,p.at(-2),'files',path.basename(p.at(-1)))});});}else await context.route('https://fonts.googleapis.com/**',r=>r.abort());


 fs.mkdirSync(out,{recursive:true});const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 const service=JSON.parse(fs.readFileSync(path.join(__dirname,'../site/services.json'))).find(s=>s.key==='energy');
 for(const width of [320,390,768,1440])for(const lang of (process.env.ENERGY_LANGS?.split(',')||['es','en','de','no','ru','nl'])){
 const data=service[lang],url=base+(lang==='es'?'/':`/${lang}/`)+data.slug+'/';await page.setViewportSize({width,height:1000});assert.equal((await page.goto(url)).status(),200);await page.evaluate(()=>document.fonts.ready);
 assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`${lang} ${width}: overflow`);
 const hero=page.locator('.service-hero'),scope=page.locator('main>section.expertise').nth(2);
 assert.equal(await hero.locator('p.lead').count(),2);assert.equal(await scope.locator('div:last-child>p').count(),2);
 assert.equal(await hero.locator('h1').innerText(),data.h1+'.');assert.deepEqual(await hero.locator('p.lead').allTextContents(),data.lead.split('\n\n'));
 assert.equal(await scope.locator('h2').innerText(),data.sections[2][0]);assert.deepEqual(await scope.locator('div:last-child>p').allTextContents(),data.sections[2][1].split('\n\n'));
 const text=await page.locator('main').innerText();assert(!/Benidorm|Benissa|Villajoyosa|Callosa|Бенидорм|Аликанте|Alicante/.test(text));
 assert.equal(await page.locator('.language-switch a').count(),6);assert((await page.locator('.whatsapp-float').getAttribute('href')).startsWith('https://wa.me/34638651175'));
 await hero.screenshot({path:`${out}/${lang}-hero-${width}.png`});await scope.screenshot({path:`${out}/${lang}-scope-${width}.png`});console.log(`OK energy ${lang} ${width}`);
 }
 assert.deepEqual(errors,[]);
 }finally{await browser.close();}})().catch(e=>{console.error(e);process.exit(1)});
