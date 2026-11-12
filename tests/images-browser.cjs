// Render the supplied originals in every language and check uncropped image geometry.
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const base=process.env.TEST_BASE_URL||'http://127.0.0.1:8765';
const out=process.env.IMAGE_SCREENSHOTS||'/tmp/adolfo-images-review';
(async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
 try{
 const context=await browser.newContext();
 const fontDir=process.env.HEADER_FONT_DIR;
 if(fontDir){let css='';for(const family of ['dm-sans','manrope'])for(const weight of (family==='manrope'?[400,500,600,700,800]:[400,500,600,700]))css+=fs.readFileSync(path.join(fontDir,family,`${weight}.css`),'utf8').replaceAll('./files/',`${base}/__test_fonts/${family}/`);
 await context.route('https://fonts.googleapis.com/**',r=>r.fulfill({contentType:'text/css',body:css}));
 await context.route('**/__test_fonts/**',r=>{const parts=new URL(r.request().url()).pathname.split('/');return r.fulfill({path:path.join(fontDir,parts.at(-2),'files',path.basename(parts.at(-1)))});});
 }else await context.route('https://fonts.googleapis.com/**',r=>r.abort());
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));fs.mkdirSync(out,{recursive:true});
 for(const width of [320,390,768,1440])for(const lang of ['es','en','de','no','ru','nl']){
 await page.setViewportSize({width,height:1000});await page.goto(base+(lang==='es'?'/':`/${lang}/`));await page.evaluate(()=>document.fonts.ready);
 await page.locator('.professional-portrait').scrollIntoViewIfNeeded();
 await page.waitForFunction(()=>[...document.querySelectorAll('.original-report img,.professional-portrait')].every(i=>i.complete&&i.naturalWidth>0));
 const metrics=await page.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth+1,images:[...document.querySelectorAll('.original-report img,.professional-portrait')].map(i=>{const r=i.getBoundingClientRect(),s=getComputedStyle(i);return {width:r.width,height:r.height,nw:i.naturalWidth,nh:i.naturalHeight,fit:s.objectFit,radius:s.borderRadius,x:r.x,right:r.right};})}));
 assert(!metrics.overflow,`${lang} ${width}: overflow`);assert.equal(metrics.images.length,2);
 for(const i of metrics.images){assert(Math.abs(i.width/i.height-i.nw/i.nh)<.01,'Original aspect ratio');assert.equal(i.fit,'contain');assert.equal(i.radius,'0px');assert(i.x>=0&&i.right<=width+1);}
 assert(metrics.images[1].width<=220);
 for(const [selector,name] of [['.hero','report'],['#perfil','profile']])await page.locator(selector).screenshot({path:`${out}/${lang}-${name}-${width}.png`});
 if(lang==='es'&&[390,1440].includes(width)){await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:`${out}/es-full-${width}.png`,fullPage:true});}
 console.log(`OK ${lang} ${width}`);
 }
 assert.deepEqual(errors,[]);
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
