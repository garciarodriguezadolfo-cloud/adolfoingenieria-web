// The eight final acceptance checks: every language at the four requested widths.
// Complete raster logo: responsive geometry, images and comparative screenshots.
const {chromium}=require('playwright');
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const base=process.env.TEST_BASE_URL||'http://127.0.0.1:8768',out=process.env.FINAL_OUT||'/tmp/adolfo-pr19-final';
(async()=>{const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox']});try{
 const context=await browser.newContext({deviceScaleFactor:2});const fontDir=process.env.HEADER_FONT_DIR;
 if(fontDir){let css='';for(const family of ['dm-sans','manrope'])for(const weight of (family==='manrope'?[400,500,600,700,800]:[400,500,600,700]))css+=fs.readFileSync(path.join(fontDir,family,`${weight}.css`),'utf8').replaceAll('./files/',`${base}/__test_fonts/${family}/`);await context.route('https://fonts.googleapis.com/**',r=>r.fulfill({contentType:'text/css',body:css}));await context.route('**/__test_fonts/**',r=>{const p=new URL(r.request().url()).pathname.split('/');return r.fulfill({path:path.join(fontDir,p.at(-2),'files',path.basename(p.at(-1)))});});}else await context.route('https://fonts.googleapis.com/**',r=>r.abort());




 fs.mkdirSync(out,{recursive:true});const page=await context.newPage(),report=[],errors=[];page.on('pageerror',e=>errors.push(e.message));
 const baseline=fs.existsSync('/tmp/adolfo-pr18-layout.json')?JSON.parse(fs.readFileSync('/tmp/adolfo-pr18-layout.json')):null;
 for(const width of (process.env.FINAL_WIDTHS?.split(',').map(Number)||[320,390,768,1440]))for(const lang of ['es','en','de','no','ru','nl']){
 await page.setViewportSize({width,height:1000});await page.goto(base+(lang==='es'?'/':`/${lang}/`));await page.evaluate(()=>document.fonts.ready);await page.waitForFunction(()=>document.documentElement.dataset.typographyReady==='true');
 const g=await page.evaluate(()=>{const rect=e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height,right:r.right,bottom:r.bottom};};const header=document.querySelector('header'),nav=header.querySelector('nav'),footer=document.querySelector('footer'),details=footer.querySelector('.footer-details');return {logo:rect(header.querySelector('.brand-logo')),flags:[...header.querySelectorAll('.language-switch a')].map(rect),links:[...nav.querySelectorAll('a')].map(rect),font:parseFloat(getComputedStyle(nav).fontSize),navColor:getComputedStyle(nav).color,border:getComputedStyle(nav).borderBottomColor,headerBg:getComputedStyle(header).backgroundColor,footerBg:getComputedStyle(footer).backgroundColor,footerLogo:rect(footer.querySelector('img')),info:[...details.children].map(rect),footerFont:getComputedStyle(details.children[1]).fontSize};});
 assert.equal(g.flags.length,6);assert(g.flags.every(r=>Math.abs(r.y-g.flags[0].y)<.1),'Six flags on one row');
 assert(Math.abs(g.logo.x+g.logo.w*661/1280-width/2)<1,'Header logo centered');
 assert.equal(g.links.length,5);assert(g.links.every(r=>Math.abs(r.y-g.links[0].y)<.1),'Five menu links on one row');assert(g.links.every(r=>r.x>=0&&r.right<=width),'All links inside screen');assert(Math.abs((g.links[0].x+g.links[4].right)/2-width/2)<1,'Menu group centered');
 assert(g.font>=9.5);assert.equal(g.navColor,'rgb(255, 255, 255)');assert.equal(g.border,'rgb(255, 255, 255)');assert.equal(g.headerBg,'rgb(0, 0, 0)');assert.equal(g.footerBg,'rgb(0, 0, 0)');
 const old=baseline?.[`${lang}-${width}`];if(old){assert.equal(g.logo.w,old.logo.w);assert.equal(g.logo.h,old.logo.h);assert.equal(g.logo.y,old.logo.y);assert.equal(g.footerLogo.w,old.footerLogo.w);assert.equal(g.footerLogo.h,old.footerLogo.h);}
 if(width<=390){assert(Math.abs(g.footerLogo.x+g.footerLogo.w*661/1280-width/2)<1);assert(g.info[0].y>=g.footerLogo.bottom+19.9);assert(g.info.every(r=>r.x===g.info[0].x));}else assert(g.info.every(r=>r.x>=g.footerLogo.right+39.9),'Desktop text remains right of logo without overlap');
 assert.equal(await page.locator('.footer-links a').first().evaluate(e=>getComputedStyle(e,'::after').content),'"·"');assert.equal(g.footerFont,'11px');const line=page.locator('.footer-professional');assert((await line.innerText()).includes('4.702 COITIA'));if(lang==='es')assert.equal(await line.innerText(),'Ingeniero Mecánico | Colegiado n.º 4.702 COITIA');
 assert(await line.evaluate(e=>{const range=document.createRange();range.selectNodeContents(e);const r=[...range.getClientRects()];return new Set(r.map(x=>x.y)).size===1&&r.every(x=>x.right<=innerWidth-20);}),'Registration line complete');
 assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'No horizontal overflow');
 for(const link of await page.locator('header nav a').all()){await link.focus();assert(await link.evaluate(e=>e===document.activeElement));assert.equal((await page.request.get(new URL(await link.getAttribute('href'),base).href)).status(),200);}
 await page.locator('header nav a').last().evaluate(e=>e.blur());
 for(const [selector,part] of [['header','header'],['footer','footer']])await page.locator(selector).screenshot({path:`${out}/${lang}-${part}-${width}.png`});
 report.push({lang,width,font:g.font,menuWidth:g.links[4].right-g.links[0].x});console.log(`OK ${lang} ${width}: ${g.font}px, one menu row`);
 }
 assert.deepEqual(errors,[]);fs.writeFileSync(`${out}/measurements.json`,JSON.stringify(report,null,2));
 }finally{await browser.close();}})().catch(e=>{console.error(e);process.exit(1)});
