// PR18 is the mandatory layout reference; compare exact approved geometry.
// Complete raster logo: responsive geometry, images and comparative screenshots.
const {chromium}=require('playwright');
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const base=process.env.TEST_BASE_URL||'http://127.0.0.1:8768',out='/tmp/adolfo-pr19-correction';
(async()=>{const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox']});try{
 const context=await browser.newContext();const fontDir=process.env.HEADER_FONT_DIR;
 if(fontDir){let css='';for(const family of ['dm-sans','manrope'])for(const weight of (family==='manrope'?[400,500,600,700,800]:[400,500,600,700]))css+=fs.readFileSync(path.join(fontDir,family,`${weight}.css`),'utf8').replaceAll('./files/',`${base}/__test_fonts/${family}/`);await context.route('https://fonts.googleapis.com/**',r=>r.fulfill({contentType:'text/css',body:css}));await context.route('**/__test_fonts/**',r=>{const p=new URL(r.request().url()).pathname.split('/');return r.fulfill({path:path.join(fontDir,p.at(-2),'files',path.basename(p.at(-1)))});});}else await context.route('https://fonts.googleapis.com/**',r=>r.abort());




 fs.mkdirSync(out,{recursive:true});const page=await context.newPage(),before=process.env.CORRECTION_BASELINE==='1',data={};
 for(const width of [320,390,768,1440])for(const lang of ['es','en','de','no','ru','nl']){
 await page.setViewportSize({width,height:1000});await page.goto(base+(lang==='es'?'/':`/${lang}/`));await page.evaluate(()=>document.fonts.ready);await page.waitForFunction(()=>document.documentElement.dataset.typographyReady==='true');
 const key=`${lang}-${width}`;
 const m=await page.evaluate(()=>{const rect=(e,offset=0)=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y-offset,w:r.width,h:r.height};};const f=document.querySelector('footer'),fy=f.getBoundingClientRect().y,d=f.querySelector('.footer-details'),copyright=d.children[0],professional=d.children[1],legal=d.children[2];return {header:rect(document.querySelector('header')),nav:rect(document.querySelector('header nav')),flags:rect(document.querySelector('header .language-switch')),logo:rect(document.querySelector('.brand-logo')),footer:rect(f,fy),footerLogo:rect(f.querySelector('img'),fy),copyright:rect(copyright,fy),legal:rect(legal,fy),copyrightText:copyright.textContent,legalText:legal.textContent,professional:rect(professional,fy),font:getComputedStyle(professional).fontSize,gap:getComputedStyle(d).gap};});data[key]=m;
 if(!before){const p='/tmp/adolfo-pr18-layout.json';const old=fs.existsSync(p)?JSON.parse(fs.readFileSync(p))[key]:null;
 if(old){for(const field of ['header','nav','flags','footer','copyright','legal','copyrightText','legalText','professional','font','gap'])assert.deepEqual(m[field],old[field],`${key}: preserve ${field}`);assert.equal(m.logo.w,old.logo.w);assert.equal(m.logo.h,old.logo.h);assert.equal(m.logo.y,old.logo.y);assert.equal(m.footerLogo.w,old.footerLogo.w);assert.equal(m.footerLogo.h,old.footerLogo.h);assert.equal(m.footerLogo.y,old.footerLogo.y);if(width>=768)assert.equal(m.footerLogo.x,old.footerLogo.x,'Desktop footer follows mandatory PR18 distribution');}
 assert(Math.abs(m.logo.x+m.logo.w*661/1280-width/2)<1,'Visible header logo centered');
 if(width<=390)assert(Math.abs(m.footerLogo.x+m.footerLogo.w*661/1280-width/2)<1,'Mobile footer logo centered without reflow');
 const line=page.locator('.footer-professional');assert((await line.innerText()).includes('4.702 COITIA'));if(lang==='es')assert.equal(await line.innerText(),'Ingeniero Mecánico | Colegiado n.º 4.702 COITIA');assert.equal(m.font,'11px');
 assert(await line.evaluate(e=>{const range=document.createRange();range.selectNodeContents(e);const r=[...range.getClientRects()];return new Set(r.map(x=>x.y)).size===1&&r.every(x=>x.right<=innerWidth-20);}),'One complete registration line');assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
 }
 for(const [selector,part] of [['header','header'],['footer','footer']])await page.locator(selector).screenshot({path:`${out}/${before?'before':'after'}-${lang}-${part}-${width}.png`});console.log(`OK ${before?'before':'after'} ${key}`);
 }
 if(before)fs.writeFileSync('/tmp/adolfo-pr18-layout.json',JSON.stringify(data));
 }finally{await browser.close();}})().catch(e=>{console.error(e);process.exit(1)});
