// UI fixtures only: these tests do not call Turnstile/Resend or send real email.
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const base=process.env.TEST_BASE_URL || 'http://127.0.0.1:8877';
(async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
 try {
  const page=await browser.newPage({viewport:{width:320,height:900}});
  await page.route('https://fonts.googleapis.com/**',r=>r.abort());
  let scenario='accepted', submissions=[];
  await page.route('**/api/contact',async route=>{
   if(route.request().method()==='GET')return route.fulfill({json:{siteKey:'ui-fixture-key'}});
   submissions.push(route.request().postDataJSON());
   if(scenario==='network')return route.abort();
   if(scenario==='unavailable')return route.fulfill({status:503,json:{error:'unavailable'}});
   if(scenario==='verification')return route.fulfill({status:403,json:{error:'verification'}});
   if(scenario==='delivery')return route.fulfill({status:502,json:{error:'delivery'}});
   return route.fulfill({json:{accepted:true}});
  });
  await page.route('https://challenges.cloudflare.com/**',r=>r.fulfill({contentType:'application/javascript',body:`
    window.turnstile={render:(_target,options)=>{window.testOptions=options;options.callback('ui-fixture-token');return 'fixture';},reset:()=>{window.testReset=true;}};
    window.contactTurnstileReady();
  `}));
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  for(const path of ['/contacto/','/en/contact/','/de/kontakt/','/no/kontakt/','/ru/kontakty/','/','/en/','/de/','/no/','/ru/']){
   for(scenario of ['accepted','delivery','verification','unavailable','network']){
    await page.goto(base+path);
    await page.waitForFunction(()=>!document.querySelector('button[type=submit]').disabled);
    await page.locator('[name=nombre]').fill('Test User');
    await page.locator('[name=email]').fill('test@example.org');
    await page.locator('[name=servicio]').selectOption('energy');
    await page.locator('[name=mensaje]').fill('Consulta de prueba / test enquiry');
    await page.locator('[name=privacy]').check();
    await page.locator('button[type=submit]').click();
    await page.waitForFunction(()=>!document.getElementById('contact-form').hasAttribute('aria-busy'));
    const status=await page.locator('#contact-status').innerText();
    const lang=await page.locator('html').getAttribute('lang');
    const accepted={es:'aceptada por el servicio de correo',en:'accepted by the email service',de:'vom E-Mail-Dienst angenommen',nb:'godtatt av e-posttjenesten',ru:'Почтовый сервис принял'}[lang];
    if(scenario==='accepted'){
      assert(status.includes(accepted));
      assert.equal(await page.locator('[name=mensaje]').inputValue(),'');
    } else {
      assert.equal(await page.locator('#contact-status').getAttribute('data-state'),'error');
      assert((await page.locator('[name=mensaje]').inputValue()).includes('Consulta'));
      assert(!status.includes(accepted));
    }
    await page.evaluate(()=>window.testOptions.callback('next-ui-fixture-token'));
    assert.equal(await page.locator('#contact-status').innerText(),status,'Refreshing captcha must preserve the submission result');
    assert.equal(submissions.at(-1).language,lang);
    assert.equal(submissions.at(-1).token,'ui-fixture-token');
    assert.equal(submissions.at(-1).privacy,true);
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
    assert.equal(await page.evaluate(()=>localStorage.length+sessionStorage.length),0);
   }
  }
  // Expiration blocks the button and invalid fields/privacy do not submit.
  await page.goto(base+'/contacto/');
  await page.waitForFunction(()=>!document.querySelector('button[type=submit]').disabled);
  const before=submissions.length;
  await page.locator('button[type=submit]').click();
  assert.equal(submissions.length,before);
  await page.evaluate(()=>window.testOptions['expired-callback']());
  assert(await page.locator('button[type=submit]').isDisabled());
  assert.deepEqual(errors,[]);
  console.log('OK: five-language UI fixtures: provider acceptance, errors, unavailable service, network failure, required fields, captcha expiry, mobile layout and no persistent storage. No real emails sent.');
 } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
