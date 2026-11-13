// Complete raster logo: responsive geometry, images and comparative screenshots.
const {chromium}=require('playwright');
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const base=process.env.TEST_BASE_URL||'http://127.0.0.1:8768',out='/tmp/adolfo-logo-review';
(async()=>{const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox']});try{
 const context=await browser.newContext();const fontDir=process.env.HEADER_FONT_DIR;
 if(fontDir){let css='';for(const family of ['dm-sans','manrope'])for(const weight of (family==='manrope'?[400,500,600,700,800]:[400,500,600,700]))css+=fs.readFileSync(path.join(fontDir,family,`${weight}.css`),'utf8').replaceAll('./files/',`${base}/__test_fonts/${family}/`);await context.route('https://fonts.googleapis.com/**',r=>r.fulfill({contentType:'text/css',body:css}));await context.route('**/__test_fonts/**',r=>{const p=new URL(r.request().url()).pathname.split('/');return r.fulfill({path:path.join(fontDir,p.at(-2),'files',path.basename(p.at(-1)))});});}else await context.route('https://fonts.googleapis.com/**',r=>r.abort());



 fs.mkdirSync(out,{recursive:true});const page=await context.newPage(),before=process.env.BRAND_BASELINE==='1';
 for(const width of [320,390,768,1440])for(const lang of (before?['es']:(process.env.BRAND_LANGS?.split(',')||['es','en','de','no','ru','nl']))){
 await page.setViewportSize({width,height:1000});await page.goto(base+(lang==='es'?'/':`/${lang}/`));await page.evaluate(()=>document.fonts.ready);
 assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`${lang} ${width}: overflow`);
 if(!before){const images=page.locator('.brand img,.footer-logo');assert.equal(await images.count(),2);await page.locator('footer').scrollIntoViewIfNeeded();await page.waitForFunction(()=>[...document.querySelectorAll('.brand img,.footer-logo')].every(i=>i.complete&&i.naturalWidth));assert((await page.locator('.brand-logo').getAttribute('alt')).startsWith('Manuel Adolfo García Rodríguez'));assert.equal(await page.locator('.brand-symbol,.brand-initial,.brand-name,.brand-sub').count(),0);
 const g=await page.evaluate(()=>{const rect=e=>{const r=e.getBoundingClientRect();return {y:r.y,right:r.right,bottom:r.bottom};};return {brand:rect(document.querySelector('.brand')),nav:rect(document.querySelector('header nav')),flags:[...document.querySelectorAll('header .language-switch a')].map(rect)};});assert(g.nav.y>=g.brand.bottom+10);assert(g.flags.every(f=>f.y===g.flags[0].y));
 const style=await page.evaluate(()=>{const header=document.querySelector('header'),logo=header.querySelector('.brand-logo'),r=logo.getBoundingClientRect(),footer=document.querySelector('footer');return {centre:r.x+r.width*661/1280,header:getComputedStyle(header).backgroundColor,footer:getComputedStyle(footer).backgroundColor,nav:getComputedStyle(header.querySelector('nav')).color,codes:[...header.querySelectorAll('.language-code')].map(e=>getComputedStyle(e).color),flagWidths:[...header.querySelectorAll('.language-switch img')].map(e=>e.getBoundingClientRect().width),footerWidth:footer.querySelector('img').getBoundingClientRect().width};});
 assert(Math.abs(style.centre-width/2)<1);assert.equal(style.header,'rgb(0, 0, 0)');assert.equal(style.footer,'rgb(0, 0, 0)');assert.equal(style.nav,'rgb(255, 255, 255)');assert(style.codes.every(c=>c==='rgb(255, 255, 255)'));assert(style.flagWidths.every(w=>w===18));assert(style.footerWidth<=260);

 for(const i of await images.evaluateAll(es=>es.map(e=>({w:e.width,h:e.height,nw:e.naturalWidth,nh:e.naturalHeight})))){assert(Math.abs(i.w/i.h-i.nw/i.nh)<.08);assert(i.w<=i.nw);}
 await page.locator('.brand').focus();assert(await page.locator('.brand').evaluate(e=>e===document.activeElement));assert.equal(await page.locator('header nav a').count(),5);assert.equal(await page.locator('.footer-links a').count(),2);}
 await page.locator('.brand').evaluate(e=>e.blur());
 for(const [selector,part] of [['header','header'],['footer','footer']])await page.locator(selector).screenshot({path:`${out}/${before?'before':'after'}-${lang}-${part}-${width}.png`});console.log(`OK ${before?'before':'after'} ${lang} ${width}`);
 }
 }finally{await browser.close();}})().catch(e=>{console.error(e);process.exit(1)});
