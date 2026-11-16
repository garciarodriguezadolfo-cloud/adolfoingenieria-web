// Seven-language regression and French acceptance checks. Never sends real email.
const {chromium}=require('playwright');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),base=process.env.TEST_BASE_URL||'http://127.0.0.1:8776';
const out=process.env.FRENCH_OUT||'/tmp/adolfo-french-review';
const ui=JSON.parse(fs.readFileSync(root+'/site/article-locales.json'));
const locales=JSON.parse(fs.readFileSync(root+'/site/locales/fr.json'));
const languages=Object.keys(ui),htmlLang=l=>l==='no'?'nb':l;
const routeLang=r=>languages.find(l=>l!=='es'&&r.startsWith('/'+l+'/'))||'es';
const paths=[];
function walk(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){if(e.name.startsWith('.')||['node_modules','site','assets','docs','tools','tests'].includes(e.name))continue;const p=path.join(dir,e.name);if(e.isDirectory())walk(p);else if(e.name==='index.html')paths.push('/'+path.relative(root,path.dirname(p)).split(path.sep).filter(Boolean).join('/')+(path.dirname(p)===root?'':'/'));}}
walk(root);
const setupFonts=async c=>{const dir=process.env.HEADER_FONT_DIR;if(!dir)return c.route('https://fonts.googleapis.com/**',r=>r.abort());let css='';for(const f of ['dm-sans','manrope'])for(const w of (f==='manrope'?[400,500,600,700,800]:[400,500,600,700]))css+=fs.readFileSync(path.join(dir,f,`${w}.css`),'utf8').replaceAll('./files/',`${base}/__test_fonts/${f}/`);await c.route('https://fonts.googleapis.com/**',r=>r.fulfill({contentType:'text/css',body:css}));await c.route('**/__test_fonts/**',r=>{const p=new URL(r.request().url()).pathname.split('/');return r.fulfill({path:path.join(dir,p.at(-2),'files',path.basename(p.at(-1)))});});};
(async()=>{const b=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox']});try{
 const c=await b.newContext();await setupFonts(c);
 await c.route('**/api/contact',r=>r.fulfill({status:503,json:{error:'unavailable'}}));
 const p=await c.newPage(),errors=[],bad=[];p.on('pageerror',e=>errors.push(e.message));p.on('response',r=>{if(r.url().startsWith(base)&&!r.url().includes('/api/contact')&&r.status()>=400)bad.push(r.url());});
 fs.mkdirSync(out,{recursive:true});assert.equal(paths.length,77);
 for(const width of [320,390,768,1440]){
  await p.setViewportSize({width,height:900});
  for(const route of paths){
   assert.equal((await p.goto(base+route)).status(),200,route);
   await p.evaluate(()=>document.fonts.ready);await p.waitForFunction(()=>document.documentElement.dataset.typographyReady==='true');
   assert.equal(await p.locator('html').getAttribute('lang'),htmlLang(routeLang(route)));
   assert.equal(await p.locator('h1').count(),1);assert(await p.title());
   assert.equal(await p.locator('link[rel=canonical]').getAttribute('href'),'https://adolfoingenieria.es'+route);
   assert.equal(await p.locator('head link[rel=alternate]').count(),8);
   const flags=await p.locator('header .language-switch a').evaluateAll(es=>es.map(e=>{const r=e.getBoundingClientRect(),img=e.querySelector('img'),i=img.getBoundingClientRect();return {x:r.x,y:r.y,right:r.right,bottom:r.bottom,w:i.width,h:i.height,loaded:img.complete&&img.naturalWidth>0};}));
   assert.equal(flags.length,7);assert(flags.every(f=>f.y===flags[0].y&&f.x>=0&&f.right<=width&&f.w===18&&f.h===12&&f.loaded),'Flags keep one row and original size: '+route+' '+width);
   const header=p.locator('header'),logo=await header.locator('.brand-logo').boundingBox();assert(logo.y>=flags[0].bottom,'Flag row stays above original logo');
   const menu=await header.locator('nav a').evaluateAll(es=>es.map(e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,right:r.right};}));
   assert.equal(menu.length,6);assert(menu.every(e=>Math.abs(e.y-menu[0].y)<1&&e.x>=-.5&&e.right<=width+.5),'Menu one line: '+route+' '+width);
   assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'No overflow: '+route+' '+width);
   assert((await p.locator('.whatsapp-float').getAttribute('href')).startsWith('https://wa.me/34638651175?text='));
   if(routeLang(route)==='fr'){
    assert.deepEqual(await header.locator('nav a').allTextContents(),['Accueil','Expertises','Services','À propos','Articles','Contact']);
    if(await p.locator('#contact-form').count()){await p.waitForFunction(()=>document.getElementById('contact-status').dataset.state==='error');assert.equal(await p.locator('#contact-status').innerText(),locales['The form is unavailable. Please contact us by phone or email.']);}
    if(['/fr/','/fr/contact/','/fr/articles/'].includes(route)||route.includes('/fr/articles/quand-')){
     await p.evaluate(()=>{document.activeElement?.blur();scrollTo(0,0)});const key=route==='/fr/'?'accueil':route==='/fr/contact/'?'contact':route==='/fr/articles/'?'articles':'article';
     await p.screenshot({path:`${out}/fr-${key}-${width}.jpg`,fullPage:true,type:'jpeg',quality:90});
    }
   }
  }
  console.log(`OK 77 pages, 7 languages, ${width}px; seven flags, single-line menus, SEO and no overflow`);
 }
 for(const width of [320,390,768,1440]){
  await p.setViewportSize({width,height:900});await p.goto(base+'/404.html');
  const flags=await p.locator('.language-switch a').evaluateAll(es=>es.map(e=>{const r=e.getBoundingClientRect();return {y:r.y,right:r.right};}));
  assert.equal(flags.length,7);assert(flags.every(e=>e.y===flags[0].y&&e.right<=width));
  assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'Shared 404 must also fit seven flags');
 }
 // Equivalent-language navigation works in both directions, including article detail, without JS.
 const nc=await b.newContext({javaScriptEnabled:false});await setupFonts(nc);const np=await nc.newPage();
 for(const route of paths.filter(r=>routeLang(r)==='fr')){
  await np.goto(base+route);
  const targets=await np.locator('header .language-switch a').evaluateAll(es=>es.map(e=>({lang:e.hreflang,path:e.getAttribute('href')})));
  for(const t of targets){await np.locator(`header .language-switch a[hreflang="${t.lang}"]`).click();await np.waitForURL(base+t.path);await np.locator('header .language-switch a[hreflang=fr]').click();await np.waitForURL(base+route);}
 }
 assert.deepEqual(errors,[]);assert.deepEqual(bad,[]);
 console.log('OK native seven-language round trips on all 11 French routes; no broken resources/JS errors.');
}finally{await b.close();}})().catch(e=>{console.error(e);process.exit(1)});
