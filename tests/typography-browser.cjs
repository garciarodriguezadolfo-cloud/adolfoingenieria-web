// Local visual review; optional Fontsource fixtures use the existing font families only.
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {execFileSync}=require('node:child_process');
const root=path.resolve(__dirname,'..');
const base=process.env.TEST_BASE_URL || 'http://127.0.0.1:8765';
const out=process.env.TYPOGRAPHY_SCREENSHOTS || '/tmp/adolfo-typography/after';
const fontDir=process.env.TYPOGRAPHY_FONT_DIR;
const routes=JSON.parse(execFileSync('python3',['-c',"import sys,json;sys.path.insert(0,'tools');from build_site import PATHS;print(json.dumps(PATHS))"],{cwd:root,encoding:'utf8'}));
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH || '/usr/bin/chromium',headless:true,args:['--no-sandbox']});
 try {
  const context=await browser.newContext();
  if(fontDir){
   let css='';
   for(const family of ['dm-sans','manrope'])for(const weight of (family==='manrope'?[400,500,600,700,800]:[400,500,600,700])){
    css+=fs.readFileSync(path.join(fontDir,family,`${weight}.css`),'utf8').replaceAll('./files/',`${base}/__test_fonts/${family}/`);
   }
   await context.route('https://fonts.googleapis.com/**',r=>r.fulfill({contentType:'text/css',body:css}));
   await context.route('**/__test_fonts/**',r=>{
    const parts=new URL(r.request().url()).pathname.split('/');
    return r.fulfill({path:path.join(fontDir,parts.at(-2),'files',path.basename(parts.at(-1)))});
   });
  }else await context.route('https://fonts.googleapis.com/**',r=>r.abort());
  const page=await context.newPage();
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  const metrics=[];fs.mkdirSync(out,{recursive:true});
  for(const width of [1440,1024,768,390,320]){
   await page.setViewportSize({width,height:1000});
   for(const [key,translations] of Object.entries(routes))for(const [lang,url] of Object.entries(translations)){
    assert.equal((await page.goto(base+url)).status(),200);
    await page.evaluate(()=>document.fonts.ready);
    await page.waitForFunction(()=>document.documentElement.dataset.typographyReady==='true');
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`Horizontal overflow: ${url} at ${width}`);
    for(const el of await page.locator('h1,h2,h3,.lead,.eyebrow,.hero-foot,.about-lead,.section-heading>p,.service-list p,.form-note,label,input,textarea,select,button,nav a').all()){
     assert.notEqual(await el.evaluate(e=>getComputedStyle(e).textAlign),'justify',`UI/short text justified: ${url}`);
    }
    const result=await page.evaluate(()=>{
     const result=[];
     for(const p of document.querySelectorAll('p.reading-prose')){
      const style=getComputedStyle(p),box=p.getBoundingClientRect();
      if(style.textAlign!=='justify')continue;
      const lines=new Map();
      const walker=document.createTreeWalker(p,NodeFilter.SHOW_TEXT);
      while(walker.nextNode()){
       const node=walker.currentNode;
       for(const match of node.textContent.matchAll(/\S+/gu)){
        const range=document.createRange();range.setStart(node,match.index);range.setEnd(node,match.index+match[0].length);
        for(const rect of range.getClientRects()){
         if(!rect.width)continue;
         const y=Math.round(rect.y*2)/2;
         if(!lines.has(y))lines.set(y,[]);
         lines.get(y).push({left:rect.left,right:rect.right});
        }
       }
      }
      const gaps=[];
      for(const spans of lines.values()){
       spans.sort((a,b)=>a.left-b.left);
       for(let i=1;i<spans.length;i++)if(spans[i].left>=spans[i-1].right)gaps.push(spans[i].left-spans[i-1].right);
      }
      result.push({width:box.width,fontSize:parseFloat(style.fontSize),maxGap:Math.max(0,...gaps),lines:lines.size,hyphens:style.hyphens,text: p.textContent.slice(0,100)});
     }
     return result;
    });
    for(const p of result)assert(p.maxGap<=p.fontSize*.8+.2,`Excessive spacing: ${url} at ${width}: ${p.maxGap}px`);
    if(width<768)assert.equal(result.length,0,`Mobile must keep left alignment: ${url}`);
    metrics.push(...result.map(p=>({lang,key,viewport:width,...p})));
    if(['energy','home','privacy'].includes(key) && [1440,768,390].includes(width)){
     const capture=key==='energy'?page.locator('.section.expertise').first():key==='home'?page.locator('.hero'):page.locator('.legal-content section').nth(1);
     await capture.screenshot({path:path.join(out,`${lang}-${key}-${width}.png`)});
     if(key==='energy')await page.locator('.section.expertise > div:last-child > p').first().screenshot({path:path.join(out,`${lang}-prose-${width}.png`)});
     if(key==='home')await page.locator('.section.about').screenshot({path:path.join(out,`${lang}-profile-${width}.png`)});
    }
   }
   console.log(`OK: all 54 pages at ${width}px`);
  }
  // The new stylesheet must leave the contact controls, selector and WhatsApp styles unchanged.
  await page.goto(base+'/nl/contact/');await page.evaluate(()=>document.fonts.ready);
  const unchanged=async()=>page.evaluate(()=>{
   const props=['fontFamily','fontSize','lineHeight','color','backgroundColor','textAlign','padding','borderWidth','borderRadius'];
   return [...document.querySelectorAll('form,form label,form input,form textarea,form select,form button,.form-note,.language-switch,.language-switch a,.whatsapp-float,nav a')].map(el=>Object.fromEntries(props.map(p=>[p,getComputedStyle(el)[p]])));
  });
  const after=await unchanged();
  await page.evaluate(()=>document.querySelector('link[href^="/typography.css"]').disabled=true);
  assert.deepEqual(after,await unchanged());
  // Without JavaScript, no paragraph should be justified, even in a wide column.
  const nojs=await browser.newContext({javaScriptEnabled:false,viewport:{width:1440,height:1000}});
  await nojs.route('https://fonts.googleapis.com/**',r=>r.abort());
  const staticPage=await nojs.newPage();
  for(const url of Object.values(routes.energy)){
   await staticPage.goto(base+url);
   assert(await staticPage.locator('.reading-prose').evaluateAll(ps=>ps.every(p=>getComputedStyle(p).textAlign==='left')));
  }
  await nojs.close();
  // Resize the same page to check the observer clears desktop justification on mobile.
  await page.setViewportSize({width:1440,height:1000});await page.goto(base+'/certificados-energeticos-alicante/');
  await page.waitForFunction(()=>document.documentElement.dataset.typographyReady==='true');
  await page.setViewportSize({width:320,height:1000});
  await page.waitForFunction(()=>[...document.querySelectorAll('.reading-prose')].every(p=>getComputedStyle(p).textAlign!=='justify'));
  assert.deepEqual(errors,[]);
  fs.writeFileSync(path.join(out,'spacing.json'),JSON.stringify(metrics,null,2));
  const worst=[...metrics].sort((a,b)=>b.maxGap-a.maxGap).slice(0,15);
  console.log(JSON.stringify({fontFixtures:!!fontDir,justifiedParagraphChecks:metrics.length,worst},null,2));
  console.log('OK: short/UI text excluded; mobile left alignment; unchanged forms, language selector and WhatsApp styles; screenshots and word-gap measurements saved.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
