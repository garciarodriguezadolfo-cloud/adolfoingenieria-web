// Scope regression: unchanged header layout and one-line professional registration.
// Complete raster logo: responsive geometry, images and comparative screenshots.
const {chromium}=require('playwright');
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const base=process.env.TEST_BASE_URL||'http://127.0.0.1:8768',out='/tmp/adolfo-registration-review';
(async()=>{const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox']});try{
 const context=await browser.newContext();const fontDir=process.env.HEADER_FONT_DIR;
 if(fontDir){let css='';for(const family of ['dm-sans','manrope'])for(const weight of (family==='manrope'?[400,500,600,700,800]:[400,500,600,700]))css+=fs.readFileSync(path.join(fontDir,family,`${weight}.css`),'utf8').replaceAll('./files/',`${base}/__test_fonts/${family}/`);await context.route('https://fonts.googleapis.com/**',r=>r.fulfill({contentType:'text/css',body:css}));await context.route('**/__test_fonts/**',r=>{const p=new URL(r.request().url()).pathname.split('/');return r.fulfill({path:path.join(fontDir,p.at(-2),'files',path.basename(p.at(-1)))});});}else await context.route('https://fonts.googleapis.com/**',r=>r.abort());




 fs.mkdirSync(out,{recursive:true});const page=await context.newPage(),before=process.env.REGISTRATION_BASELINE==='1',measurements={};
 for(const width of [320,390,768,1440])for(const lang of ['es','en','de','no','ru','nl']){
 await page.setViewportSize({width,height:1000});await page.goto(base+(lang==='es'?'/':`/${lang}/`));await page.evaluate(()=>document.fonts.ready);
 const key=`${lang}-${width}`;
 const m=await page.evaluate(()=>{const rect=e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height};};return {header:rect(document.querySelector('header')),nav:rect(document.querySelector('header nav')),flags:rect(document.querySelector('header .language-switch')),logo:rect(document.querySelector('.brand-logo')),footerLogo:rect(document.querySelector('.footer-logo'))};});measurements[key]=m;
 if(!before){
 const baselinePath='/tmp/adolfo-registration-before.json';const old=fs.existsSync(baselinePath)?JSON.parse(fs.readFileSync(baselinePath))[key]:null;if(old){assert.deepEqual(m.header,old.header,'Header dimensions unchanged');assert.deepEqual(m.nav,old.nav,'Menu geometry unchanged');assert.deepEqual(m.flags,old.flags,'Language selector geometry unchanged');
 assert.equal(m.logo.w,old.logo.w);assert.equal(m.logo.h,old.logo.h);assert.equal(m.logo.y,old.logo.y);assert(Math.abs(m.logo.x-old.logo.x-(width<=640?-4:0))<.1);
 assert.equal(m.footerLogo.w,old.footerLogo.w);assert.equal(m.footerLogo.h,old.footerLogo.h);}
 assert(Math.abs(m.footerLogo.x+m.footerLogo.w*661/1280-width/2)<1,'Visible footer logo centered after transparent inset compensation');
 assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'No overflow');
 const line=page.locator('.footer-professional');const text=await line.innerText();assert(text.includes('4.702 COITIA'));if(lang==='es')assert.equal(text,'Ingeniero Mecánico | Colegiado n.º 4.702 COITIA');
 assert(await line.evaluate(e=>{const range=document.createRange();range.selectNodeContents(e);const rects=[...range.getClientRects()];return new Set(rects.map(r=>r.y)).size===1&&rects.every(r=>r.right<=innerWidth-20)&&getComputedStyle(e).whiteSpace==='nowrap';}),'Registration line fits on one line');
 const f=await page.locator('footer').evaluate(e=>({pad:parseFloat(getComputedStyle(e).paddingLeft),left:e.querySelector('.footer-details').getBoundingClientRect().x,font:parseFloat(getComputedStyle(e.querySelector('.footer-details')).fontSize),align:getComputedStyle(e.querySelector('.footer-details')).textAlign}));assert(Math.abs(f.pad-f.left)<1);assert.equal(f.font,10);assert.equal(f.align,'left');
 for(const [selector,part] of [['header','header'],['footer','footer']])await page.locator(selector).screenshot({path:`${out}/${lang}-${part}-${width}.png`});
 }
 console.log(`OK ${before?'before':'after'} ${key}`);
 }
 if(before)fs.writeFileSync('/tmp/adolfo-registration-before.json',JSON.stringify(measurements));
 }finally{await browser.close();}})().catch(e=>{console.error(e);process.exit(1)});
