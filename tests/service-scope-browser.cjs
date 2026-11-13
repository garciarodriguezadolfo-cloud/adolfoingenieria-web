// Responsive content and geographic scope checks for the three affected services.
const {chromium}=require('playwright');
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const base=process.env.TEST_BASE_URL||'http://127.0.0.1:8767',out='/tmp/adolfo-scope-review';
(async()=>{const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox']});try{
 const context=await browser.newContext();const fontDir=process.env.HEADER_FONT_DIR;
 if(fontDir){let css='';for(const family of ['dm-sans','manrope'])for(const weight of (family==='manrope'?[400,500,600,700,800]:[400,500,600,700]))css+=fs.readFileSync(path.join(fontDir,family,`${weight}.css`),'utf8').replaceAll('./files/',`${base}/__test_fonts/${family}/`);await context.route('https://fonts.googleapis.com/**',r=>r.fulfill({contentType:'text/css',body:css}));await context.route('**/__test_fonts/**',r=>{const p=new URL(r.request().url()).pathname.split('/');return r.fulfill({path:path.join(fontDir,p.at(-2),'files',path.basename(p.at(-1)))});});}else await context.route('https://fonts.googleapis.com/**',r=>r.abort());

 fs.mkdirSync(out,{recursive:true});const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 const services=JSON.parse(fs.readFileSync(path.join(__dirname,'../site/services.json')));
 if(!process.env.SCOPE_HOME_ONLY)for(const width of [320,390,768,1440])for(const lang of (process.env.SCOPE_LANGS?.split(',')||['es','en','de','no','ru','nl']))for(const key of ['expert','occupancy','opening']){
 const service=services.find(s=>s.key===key),url=base+(lang==='es'?'/':`/${lang}/`)+service[lang].slug+'/';
 await page.setViewportSize({width,height:1000});const response=await page.goto(url);assert.equal(response.status(),200);await page.evaluate(()=>document.fonts.ready);
 assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`${key} ${lang} ${width}: horizontal overflow`);
 const hero=page.locator('.service-hero');assert.equal(await hero.locator('h1').count(),1);
 if(key!=='expert')assert.equal(await hero.locator('p.lead').count(),2);
 const section=page.locator('main > section.expertise').nth(key==='expert'?2:3);
 if(key==='expert')assert.equal(await section.locator('div:last-child > p').count(),2);
 if(key==='occupancy'){const visible=await page.locator('main').innerText();assert(!/Benidorm|Benissa|Villajoyosa|Callosa|Бенидорм/.test(visible));}
 if(lang==='es'){
 if(key==='expert')assert.equal(await section.locator('h2').innerText(),'Perito judicial en toda España');
 if(key==='occupancy')assert.equal(await hero.locator('h1').innerText(),'Certificados de segunda ocupación en la Costa Blanca.');
 if(key==='opening')assert.equal(await hero.locator('h1').innerText(),'Aperturas y cambios de titularidad en la Costa Blanca.');
 }
 assert(await page.locator('.whatsapp-float').getAttribute('href').then(x=>x.startsWith('https://wa.me/34638651175')));
 await hero.screenshot({path:`${out}/${key}-${lang}-hero-${width}.png`});await section.screenshot({path:`${out}/${key}-${lang}-scope-${width}.png`});
 console.log(`OK ${key} ${lang} ${width}`);
 }

 for(const width of [320,390,1440])for(const lang of ['es','en','de','no','ru','nl']){
 await page.setViewportSize({width,height:1000});await page.goto(base+(lang==='es'?'/':`/${lang}/`));await page.evaluate(()=>document.fonts.ready);
 assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
 const rows=page.locator('#servicios article');assert.equal(await rows.count(),5);
 for(const key of ['occupancy','opening']){const data=services.find(s=>s.key===key)[lang];assert.equal(await rows.filter({has:page.locator(`a[href$="/${data.slug}/"]`)}).locator('p').innerText(),data.coverage);}
 assert.equal(await page.locator('#servicios .service-icon').count(),5);
 await page.locator('#servicios').screenshot({path:`${out}/home-${lang}-${width}.png`});console.log(`OK home ${lang} ${width}`);
 }
 assert.deepEqual(errors,[]);
 }finally{await browser.close();}})().catch(e=>{console.error(e);process.exit(1)});
