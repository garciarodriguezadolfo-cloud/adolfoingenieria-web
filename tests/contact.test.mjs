// Unit tests use isolated upstream fixtures. No real emails are sent by this suite.
import test from 'node:test';
import assert from 'node:assert/strict';
import {onRequest} from '../functions/api/contact.js';
const env = {CONTACT_ENABLED:'true', CONTACT_FROM:'contacto@example.org', RESEND_API_KEY:'unit-private-key',
  TURNSTILE_SECRET_KEY:'unit-private-secret', TURNSTILE_SITE_KEY:'unit-public-key'};
const body = {nombre:'Test Person',email:'test@example.org',servicio:'energy',mensaje:'Consulta de prueba técnica',
  privacy:true,website:'',token:'unit-token',requestId:'c49909da-0590-45c8-a765-1c45a0120ea6',language:'es'};
const makeRequest = (data=body, headers={}) => new Request('https://adolfoingenieria.es/api/contact', {
  method:'POST',headers:{Origin:'https://adolfoingenieria.es','Content-Type':'application/json',...headers}, body:JSON.stringify(data)});
const call = (request=makeRequest(), bindings=env) => onRequest({request,env:bindings});
const verify = {success:true,hostname:'adolfoingenieria.es',action:'contact'};

function upstream(t, verification=verify, delivery={id:'unit-provider-id'}, status=200) {
  const calls=[];
  t.mock.method(globalThis,'fetch',async (url, options) => {
    calls.push({url,options});
    if (url.includes('siteverify')) return Response.json(verification);
    assert.equal(url,'https://api.resend.com/emails');
    return Response.json(delivery,{status});
  });
  return calls;
}

test('public configuration is minimal and disabled until explicitly enabled', async t=>{
  const calls=upstream(t);
  const get=()=>new Request('https://adolfoingenieria.es/api/contact');
  assert.deepEqual(await (await call(get())).json(),{siteKey:'unit-public-key'});
  for(const missing of Object.keys(env)){
    const incomplete={...env};delete incomplete[missing];
    assert.equal((await call(get(),incomplete)).status,503,missing);
    assert.equal((await call(makeRequest(),incomplete)).status,503,missing);
  }
  assert.equal((await call(get(),{...env,CONTACT_ENABLED:'false'})).status,503);
  assert.equal(calls.length,0);
});
test('rejects invalid requests before any upstream request',async t=>{
  const calls=upstream(t);
  for(const change of [{nombre:'x'}, {email:'bad\r\n@example.org'}, {servicio:'__proto__'}, {servicio:{toString:0}},
    {mensaje:'short'}, {mensaje:'x'.repeat(5001)}, {privacy:false}, {website:'spam'}, {token:''}, {requestId:'bad'}, {language:'xx'}]){
    assert.equal((await call(makeRequest({...body,...change}))).status,400,JSON.stringify(change));
  }
  assert.equal((await call(makeRequest(body,{Origin:'https://attacker.invalid'}))).status,403);
  assert.equal((await call(makeRequest(body,{'Content-Type':'text/plain'}))).status,415);
  assert.equal((await call(makeRequest({...body,mensaje:'x'.repeat(20000)}))).status,413);
  assert.equal((await call(makeRequest(body,{'Content-Length':'20000'}))).status,413);
  const invalidJSON = new Request('https://adolfoingenieria.es/api/contact',{method:'POST',headers:{Origin:'https://adolfoingenieria.es','Content-Type':'application/json'},body:'{'});
  assert.equal((await call(invalidJSON)).status,400);
  assert.equal((await call(new Request('https://adolfoingenieria.es/api/contact',{method:'DELETE'}))).status,405);
  assert.equal(calls.length,0);
});
test('requires verified hostname and action, not just a client token',async t=>{
  for(const verification of [{...verify,success:false},{...verify,hostname:'attacker.invalid'},{...verify,action:'other'}]){
    const calls=upstream(t,verification);
    assert.equal((await call()).status,403);assert.equal(calls.length,1);
    t.mock.restoreAll();
  }
});
test('fixed recipient, verified sender, reply-to and plain text; accepts only provider receipt', async t=>{
  const calls=upstream(t);
  const response=await call(makeRequest({...body,to:'attacker@invalid.test',mensaje:'<script>test</script>'}));
  assert.equal(response.status,200);
  assert.deepEqual(await response.json(),{accepted:true});
  assert.equal(response.headers.get('Cache-Control'),'no-store');
  const payload=JSON.parse(calls[1].options.body);
  assert.deepEqual(payload.to,['garciarodriguezadolfo@gmail.com']);
  assert.equal(payload.from,env.CONTACT_FROM);assert.equal(payload.reply_to,body.email);
  assert(payload.text.includes('<script>test</script>'));assert.equal(payload.html,undefined);
  assert(!calls[0].options.body.has('remoteip'));
  assert.equal(calls[1].options.headers.Authorization,'Bearer unit-private-key');
});
test('retries have stable idempotency keys and changed content gets a different key',async t=>{
  const calls=upstream(t);
  await call();await call();await call(makeRequest({...body,mensaje:'Different enquiry text'}));
  assert.equal(calls[1].options.headers['Idempotency-Key'],calls[3].options.headers['Idempotency-Key']);
  assert.notEqual(calls[3].options.headers['Idempotency-Key'],calls[5].options.headers['Idempotency-Key']);
});
test('upstream rejection, missing receipt and network errors never return accepted',async t=>{
  for(const [payload,status] of [[{message:'private provider error'},429],[{},200]]){
    upstream(t,verify,payload,status);
    const r=await call();assert.equal(r.status,502);assert.deepEqual(await r.json(),{error:'delivery'});
    t.mock.restoreAll();
  }
  t.mock.method(globalThis,'fetch',async ()=>{throw Error('private transport error');});
  assert.deepEqual(await (await call()).json(),{error:'verification'});
  t.mock.restoreAll();
  t.mock.method(globalThis,'fetch',async url=>{
    if(url.includes('siteverify'))return Response.json(verify);
    throw Error('timeout after possible provider acceptance');
  });
  const r=await call();assert.equal(r.status,502);assert.deepEqual(await r.json(),{error:'delivery'});
});

test('all five page languages pass validation and preserve the fixed recipient', async t=>{
  const calls=upstream(t);
  for(const language of ['es','en','de','nb','ru']){
    assert.equal((await call(makeRequest({...body,language}))).status,200,language);
    const payload=JSON.parse(calls.at(-1).options.body);
    assert.deepEqual(payload.to,['garciarodriguezadolfo@gmail.com']);
    assert(payload.text.includes(`Idioma / Language: ${language}`));
  }
});
