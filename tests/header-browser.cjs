// Header layout and the requested home copy, with optional local fixtures of the existing fonts.
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('fs'),path=require('path');
const base=process.env.TEST_BASE_URL || 'http://127.0.0.1:8881';
const fontDir=process.env.HEADER_FONT_DIR;
const out='/tmp/adolfo-header-review';
const languages=[['es','/'],['en','/en/'],['de','/de/'],['nb','/no/'],['ru','/ru/'],['nl','/nl/']];
(async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
 try {
  const context=await browser.newContext();
  if(fontDir){
   let css='';
   for(const family of ['dm-sans','manrope'])for(const weight of (family==='manrope'?[400,500,600,700,800]:[400,500,600,700]))css+=fs.readFileSync(path.join(fontDir,family,`${weight}.css`),'utf8').replaceAll('./files/',`${base}/__test_fonts/${family}/`);
   await context.route('https://fonts.googleapis.com/**',r=>r.fulfill({contentType:'text/css',body:css}));
   await context.route('**/__test_fonts/**',r=>{const parts=new URL(r.request().url()).pathname.split('/');return r.fulfill({path:path.join(fontDir,parts.at(-2),'files',path.basename(parts.at(-1)))});});
  }else await context.route('https://fonts.googleapis.com/**',r=>r.abort());
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  fs.mkdirSync(out,{recursive:true});
  for(const width of [320,390,768,1440]){
   await page.setViewportSize({width,height:1000});
   for(const [lang,url] of languages){
    await page.goto(base+url);await page.evaluate(()=>document.fonts.ready);
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`${lang} overflow at ${width}`);
    const geometry=await page.evaluate(()=>{
     const header=document.querySelector('.site-header'),brand=header.querySelector('.brand'),nav=header.querySelector('nav'),selector=header.querySelector('.language-switch');
     const rect=el=>{const r=el.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,right:r.right,bottom:r.bottom};};
     return {header:rect(header),brand:rect(brand),nav:rect(nav),selector:rect(selector),links:[...nav.children].map(rect),flags:[...selector.children].map(rect),paddingTop:parseFloat(getComputedStyle(header).paddingTop),paddingRight:parseFloat(getComputedStyle(header).paddingRight),columnGap:parseFloat(getComputedStyle(nav).columnGap),border:getComputedStyle(nav).borderBottomWidth,borderColor:getComputedStyle(nav).borderBottomColor,menuPadding:parseFloat(getComputedStyle(nav).paddingBottom),nameSize:parseFloat(getComputedStyle(header.querySelector('.brand-name')).fontSize),subSize:parseFloat(getComputedStyle(header.querySelector('.brand-sub')).fontSize),menuSize:parseFloat(getComputedStyle(nav).fontSize)};
    });
    const g=geometry;
    assert(Math.abs(g.selector.right-(g.header.right-g.paddingRight))<1,'Selector must align at the upper right');
    assert(Math.abs(g.selector.y-(g.header.y+g.paddingTop))<1,'Selector must occupy the top row');
    assert(g.nav.y>=g.brand.bottom+12,'Menu must be below identity');
    if(width<=640)assert(g.brand.y>=g.selector.bottom+12,'Mobile identity must clear the flag row');
    else assert(g.brand.right<=g.selector.x-20,'Desktop/tablet blocks must not overlap');
    assert(g.flags.every(r=>r.y===g.flags[0].y),'All six flags must stay in one row');
    assert(g.flags.every(r=>r.right<=g.header.right && r.x>=g.header.x));
    assert.equal(g.border,'1px');assert.equal(g.borderColor,'rgb(20, 40, 61)');assert(g.menuPadding>=12);
    assert.equal(g.nameSize,width<=640?24:28);assert.equal(g.subSize,width<=640?13:14);assert.equal(g.menuSize,width<=640?13:15);
    for(let i=1;i<g.links.length;i++){
     const previous=g.links[i-1],current=g.links[i];
     if(Math.abs(previous.y-current.y)<1)assert(Math.abs(current.x-previous.right-g.columnGap)<1,'Even menu spacing');
    }
    assert.equal((await page.locator('.brand-name').innerText()).replace(/\s+/g,' '),'Manuel Adolfo García Rodríguez');
    assert.equal(await page.locator('header nav a').count(),5);
    assert.deepEqual(await page.locator('header .language-code').allTextContents(),['ES','EN','DE','NO','RU','NL']);
    // A word in the professional identity must not be split over separate lines.
    assert(await page.locator('.brand').evaluate(el=>{
     const walker=document.createTreeWalker(el,NodeFilter.SHOW_TEXT),range=document.createRange();
     while(walker.nextNode())for(const match of walker.currentNode.textContent.matchAll(/[\p{L}\p{M}]+/gu)){
      range.setStart(walker.currentNode,match.index);range.setEnd(walker.currentNode,match.index+match[0].length);
      if(new Set([...range.getClientRects()].map(r=>Math.round(r.y))).size>1)return false;
     }
     return true;
    }),'No split identity words');
    const paragraphs=page.locator('#peritajes > div:last-child > p');assert.equal(await paragraphs.count(),2);
    assert((await paragraphs.nth(0).innerText()).length>100);assert((await paragraphs.nth(1).innerText()).length>100);
    if(lang==='es')assert.deepEqual(await paragraphs.allTextContents(),[
     'Un informe preliminar permite analizar las causas, la documentación disponible y la viabilidad técnica de un caso antes de abordar una pericial completa.',
     'A partir de sus conclusiones, se valorará la conveniencia de elaborar un informe pericial definitivo, estableciendo previamente el alcance y las condiciones del nuevo encargo.'
    ]);
    await page.locator('header').screenshot({path:`${out}/${lang}-header-${width}.png`});
    await page.locator('#peritajes').screenshot({path:`${out}/${lang}-preliminary-${width}.png`});
    if(width===1440){
     const targets=await page.locator('header nav a').evaluateAll(as=>as.map(a=>a.getAttribute('href')));
     for(let i=0;i<targets.length;i++){await page.locator('header nav a').nth(i).click();await page.waitForURL(base+targets[i]);}
    }
    if(width===320){
     await page.goto(base+url);
     const targets=await page.locator('header .language-switch a').evaluateAll(as=>as.map(a=>({href:a.getAttribute('href'),lang:a.lang})));
     for(const target of targets){await page.locator(`header .language-switch a[lang="${target.lang}"]`).click();await page.waitForURL(base+target.href);assert.equal(await page.locator('html').getAttribute('lang'),target.lang);}
    }
   }
  }
  assert.deepEqual(errors,[]);
  console.log('OK: six languages at 320/390/768/1440; larger proportional identity; menu below identity with navy rule; upper-right six-flag row; no overlap/overflow or split identity words; header links; two preliminary paragraphs; real screenshots.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
