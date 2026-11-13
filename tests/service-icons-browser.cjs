const {chromium}=require('playwright');
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const base=process.env.TEST_BASE_URL||'http://127.0.0.1:8766',out='/tmp/adolfo-service-icons',baseline=process.env.ICONS_BASELINE==='1';
(async()=>{const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox']});try{
 const context=await browser.newContext();const fontDir=process.env.HEADER_FONT_DIR;
 if(fontDir){let css='';for(const family of ['dm-sans','manrope'])for(const weight of (family==='manrope'?[400,500,600,700,800]:[400,500,600,700]))css+=fs.readFileSync(path.join(fontDir,family,`${weight}.css`),'utf8').replaceAll('./files/',`${base}/__test_fonts/${family}/`);await context.route('https://fonts.googleapis.com/**',r=>r.fulfill({contentType:'text/css',body:css}));await context.route('**/__test_fonts/**',r=>{const p=new URL(r.request().url()).pathname.split('/');return r.fulfill({path:path.join(fontDir,p.at(-2),'files',path.basename(p.at(-1)))});});}else await context.route('https://fonts.googleapis.com/**',r=>r.abort());
 fs.mkdirSync(out,{recursive:true});const page=await context.newPage(),data={};
 for(const width of [320,390,768,1440])for(const lang of ['es','en','de','no','ru','nl']){
 await page.setViewportSize({width,height:1000});await page.goto(base+(lang==='es'?'/':`/${lang}/`));await page.evaluate(()=>document.fonts.ready);const list=page.locator('#servicios .service-list');await list.scrollIntoViewIfNeeded();
 const rows=list.locator('article'),key=`${lang}-${width}`;assert.equal(await rows.count(),5);
 data[key]=await rows.evaluateAll(es=>es.map(e=>{const r=e.getBoundingClientRect(),a=e.querySelector('a');return {x:r.x,width:r.width,height:r.height,href:a.getAttribute('href'),text:e.querySelector('h3').textContent};}));
 assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
 if(!baseline){if(fs.existsSync(`${out}/baseline.json`)){const previous=JSON.parse(fs.readFileSync(`${out}/baseline.json`));assert.deepEqual(data[key],previous[key],`${key} row geometry/content/links changed`);}
 const icons=list.locator('img.service-icon');assert.equal(await icons.count(),5);await page.waitForFunction(()=>[...document.querySelectorAll('#servicios img')].every(i=>i.complete&&i.naturalWidth));
 for(let i=0;i<5;i++){const icon=icons.nth(i);await icon.scrollIntoViewIfNeeded();const b=await icon.boundingBox();assert.equal(b.width,30);assert.equal(b.height,30);assert.equal(await icon.getAttribute('alt'),'');const link=rows.nth(i).locator('a');assert(await page.evaluate(({x,y})=>!!document.elementFromPoint(x,y)?.closest('a'),{x:b.x+b.width/2,y:b.y+b.height/2}),'Icon area remains clickable');await link.focus();assert(await link.evaluate(e=>e===document.activeElement));await Promise.all([page.waitForURL(base+data[key][i].href),page.keyboard.press('Enter')]);assert.equal((await page.request.get(page.url())).status(),200);await page.goBack();await page.evaluate(()=>document.fonts.ready);}
 }
 await page.locator('#servicios').screenshot({path:`${out}/${baseline?'before':'after'}-${key}.png`});console.log(`OK ${baseline?'before':'after'} ${key}`);
 }
 if(baseline)fs.writeFileSync(`${out}/baseline.json`,JSON.stringify(data,null,2));
 }finally{await browser.close();}})().catch(e=>{console.error(e);process.exit(1)});
