// Acceptance checks for the real PDF-based publication, no form submission.
const {chromium}=require('playwright');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const base=process.env.TEST_BASE_URL||'http://127.0.0.1:8776';
const out=process.env.ARTICLE_REVIEW_OUT||'/tmp/adolfo-first-article-review';
const root=path.resolve(__dirname,'..');
const article=JSON.parse(fs.readFileSync(root+'/site/articles.json'))[0];
const ui=JSON.parse(fs.readFileSync(root+'/site/article-locales.json'));
const langs=Object.keys(article.translations);
const index=l=>(l==='es'?'/':`/${l}/`)+ui[l].slug+'/';
const route=l=>index(l)+article.translations[l].slug+'/';
(async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
 try{
  const context=await browser.newContext({deviceScaleFactor:1});
  const fontDir=process.env.HEADER_FONT_DIR;
  if(fontDir){
   let css='';for(const family of ['dm-sans','manrope'])for(const weight of (family==='manrope'?[400,500,600,700,800]:[400,500,600,700]))css+=fs.readFileSync(path.join(fontDir,family,`${weight}.css`),'utf8').replaceAll('./files/',`${base}/__test_fonts/${family}/`);
   await context.route('https://fonts.googleapis.com/**',r=>r.fulfill({contentType:'text/css',body:css}));
   await context.route('**/__test_fonts/**',r=>{const p=new URL(r.request().url()).pathname.split('/');return r.fulfill({path:path.join(fontDir,p.at(-2),'files',path.basename(p.at(-1)))});});
  }else await context.route('https://fonts.googleapis.com/**',r=>r.abort());
  fs.mkdirSync(out,{recursive:true});
  const page=await context.newPage(),errors=[],failed=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('response',r=>{if(r.url().startsWith(base)&&r.status()>=400)failed.push([r.status(),r.url()]);});
  for(const width of [320,390,768,1440])for(const lang of langs){
   const c=article.translations[lang];await page.setViewportSize({width,height:900});
   assert.equal((await page.goto(base+route(lang))).status(),200);
   await page.evaluate(()=>document.fonts.ready);
   await page.waitForFunction(()=>document.documentElement.dataset.typographyReady==='true');
   assert.equal(await page.locator('h1').innerText(),c.title);
   assert.equal(await page.locator('h1').count(),1);
   assert.equal(await page.locator('html').getAttribute('lang'),lang==='no'?'nb':lang);
   assert.equal(await page.title(),c.seo_title);
   assert.equal(await page.locator('link[rel=canonical]').getAttribute('href'),'https://adolfoingenieria.es'+route(lang));
   assert((await page.locator('.article-byline').innerText()).includes('Manuel Adolfo García Rodríguez'));
   assert((await page.locator('.article-byline').innerText()).includes(c.professional_title));
   for(const s of c.sections){assert((await page.locator('.article-body').innerText()).includes(s.heading));for(const p of s.paragraphs)assert((await page.locator('.article-body').innerText()).includes(p));}
   assert.equal(await page.locator('figcaption').innerText(),c.image_caption);
   const img=page.locator('.article-figure img');
   const dims=await img.evaluate(e=>({complete:e.complete,naturalWidth:e.naturalWidth,naturalHeight:e.naturalHeight,width:e.clientWidth,height:e.clientHeight,fit:getComputedStyle(e).objectFit}));
   assert(dims.complete&&dims.naturalWidth===1600&&dims.naturalHeight===679);
   assert(Math.abs(dims.width/dims.height-1600/679)<.03);
   assert.notEqual(dims.fit,'cover');
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'No horizontal overflow');
   const menu=await page.locator('header nav a').evaluateAll(es=>es.map(e=>({y:e.getBoundingClientRect().y,h:e.getBoundingClientRect().height,lines:e.innerText.split('\n').length})));
   assert(menu.every(e=>Math.abs(e.y-menu[0].y)<1&&e.lines===1));
   const graph=JSON.parse(await page.locator('script[type="application/ld+json"]').innerText())['@graph'];
   const schema=graph.find(n=>n['@type']==='Article');assert.equal(schema.author.name,'Manuel Adolfo García Rodríguez');assert.equal(schema.author.jobTitle,c.professional_title);assert.equal(schema.image.width,1600);
   const canonical='https://adolfoingenieria.es';
   for(const target of langs){const code=target==='no'?'nb':target;assert.equal(await page.locator(`head link[hreflang="${code}"]`).getAttribute('href'),canonical+route(target));assert.equal(await page.locator(`header a[hreflang="${code}"]`).getAttribute('href'),route(target));}
   await page.evaluate(()=>scrollTo(0,0));
   await page.screenshot({path:`${out}/${lang}-article-${width}.png`,fullPage:true});
   await page.locator('.article-body .text-link').click();await page.waitForURL(base+index(lang));
   const card=page.locator('.article-list article');assert.equal(await card.count(),1);
   assert((await card.innerText()).includes(c.category));assert.equal(await card.locator('time').getAttribute('datetime'),article.date_published);
   await page.evaluate(()=>document.fonts.ready);
   await page.screenshot({path:`${out}/${lang}-index-${width}.png`,fullPage:true});
   await card.locator('a').click();await page.waitForURL(base+route(lang));
   // Follow each equivalent page and return, preserving the service/article identity.
   for(const target of langs){await page.locator(`header a[hreflang="${target==='no'?'nb':target}"]`).click();await page.waitForURL(base+route(target));await page.locator(`header a[hreflang="${lang==='no'?'nb':lang}"]`).click();await page.waitForURL(base+route(lang));}
   console.log(`OK ${lang} ${width}px: article, index, image, schema, language round trips`);
  }
  const staticContext=await browser.newContext({javaScriptEnabled:false});await staticContext.route('https://fonts.googleapis.com/**',r=>r.abort());const staticPage=await staticContext.newPage();
  for(const lang of langs){await staticPage.goto(base+route(lang));assert.equal(await staticPage.locator('h1').innerText(),article.translations[lang].title);await staticPage.locator('header a[hreflang="es"]').click();await staticPage.waitForURL(base+route('es'));}
  assert.deepEqual(errors,[]);assert.deepEqual(failed,[]);
  console.log('OK: six articles and indexes at 320/390/768/1440; no 404/JS errors; native navigation without JS.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
