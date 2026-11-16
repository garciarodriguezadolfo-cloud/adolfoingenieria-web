// Compare actual menu geometry against the approved branch base.
const {chromium}=require('playwright');
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const base=process.env.TEST_BASE_URL||'http://127.0.0.1:8768',out=process.env.SPACING_OUT||'/tmp/adolfo-navigation-spacing';
(async()=>{const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox']});try{
 const context=await browser.newContext({deviceScaleFactor:2});const fontDir=process.env.HEADER_FONT_DIR;
 if(fontDir){let css='';for(const family of ['dm-sans','manrope'])for(const weight of (family==='manrope'?[400,500,600,700,800]:[400,500,600,700]))css+=fs.readFileSync(path.join(fontDir,family,`${weight}.css`),'utf8').replaceAll('./files/',`${base}/__test_fonts/${family}/`);await context.route('https://fonts.googleapis.com/**',r=>r.fulfill({contentType:'text/css',body:css}));await context.route('**/__test_fonts/**',r=>{const p=new URL(r.request().url()).pathname.split('/');return r.fulfill({path:path.join(fontDir,p.at(-2),'files',path.basename(p.at(-1)))});});}else await context.route('https://fonts.googleapis.com/**',r=>r.abort());

 fs.mkdirSync(out,{recursive:true});const page=await context.newPage(),before=process.env.SPACING_BASELINE==='1',report={};
 for(const width of [320,390,768,1440])for(const lang of ['es','en','de','no','ru','nl']){
 await page.setViewportSize({width,height:900});await page.goto(base+(lang==='es'?'/':`/${lang}/`));await page.evaluate(()=>document.fonts.ready);await page.waitForFunction(()=>document.documentElement.dataset.typographyReady==='true');
 const m=await page.evaluate(()=>{const rect=e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height,right:r.right,bottom:r.bottom};};const h=document.querySelector('header'),nav=h.querySelector('nav'),s=getComputedStyle(nav),p=getComputedStyle(nav,'::after');return {header:rect(h),logo:rect(h.querySelector('.brand-logo')),flags:rect(h.querySelector('.language-switch')),nav:rect(nav),links:[...nav.querySelectorAll('a')].map(rect),labels:[...nav.querySelectorAll('a')].map(a=>a.textContent),hrefs:[...nav.querySelectorAll('a')].map(a=>a.getAttribute('href')),font:s.font,fontSize:s.fontSize,color:s.color,gap:parseFloat(s.columnGap),border:parseFloat(s.borderBottomWidth),line:{width:parseFloat(p.width),height:parseFloat(p.height),bottom:parseFloat(p.bottom),left:parseFloat(p.left),translate:p.transform==='none'?0:new DOMMatrix(p.transform).m41,color:p.backgroundColor}};});report[`${lang}-${width}`]=m;
 assert.equal(m.links.length,6);assert(m.links.every(r=>Math.abs(r.y-m.links[0].y)<.1));assert(m.links.every(r=>r.x>=0&&r.right<=width));assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
 if(!before){const path=`${out}/baseline.json`;const old=JSON.parse(fs.readFileSync(path))[`${lang}-${width}`];
 for(const field of ['header','logo','flags','labels','hrefs','font','fontSize','color'])assert.deepEqual(m[field],old[field],`${lang}-${width}: preserve ${field}`);
 for(let i=0;i<6;i++){assert.equal(m.links[i].y,old.links[i].y);assert.equal(m.links[i].h,old.links[i].h);}
 assert(Math.abs(m.gap-old.gap-(width<=640?1:4))<.02,'Increase actual gap without changing font');
 const menuCenter=(m.links[0].x+m.links[5].right)/2;assert(Math.abs(menuCenter-width/2)<1);assert.equal(m.line.height,1);assert.equal(m.line.color,'rgb(255, 255, 255)');assert(Math.abs(m.line.width/m.nav.w-.94)<.001);
 assert(Math.abs(m.nav.x+m.line.left+m.line.translate+m.line.width/2-menuCenter)<1,'Underline centered on actual menu');
 const gap=m.nav.bottom-m.border-m.line.bottom-m.line.height-Math.max(...m.links.map(r=>r.bottom));assert(Math.abs(gap-12)<.1,`Uniform underline separation: ${gap}`);
 for(const link of await page.locator('header nav a').all()){await link.focus();assert(await link.evaluate(e=>e===document.activeElement));assert.equal((await page.request.get(new URL(await link.getAttribute('href'),base).href)).status(),200);}await page.locator('header nav a').last().evaluate(e=>e.blur());
 }
 for(const [selector,part] of [['header','header'],['header nav','menu']])await page.locator(selector).screenshot({path:`${out}/${before?'before':'after'}-${lang}-${part}-${width}.png`});console.log(`OK ${before?'before':'after'} ${lang} ${width}: ${m.fontSize}, gap ${m.gap}`);
 }
 fs.writeFileSync(`${out}/${before?'baseline':'after'}.json`,JSON.stringify(report,null,2));
 }finally{await browser.close();}})().catch(e=>{console.error(e);process.exit(1)});
