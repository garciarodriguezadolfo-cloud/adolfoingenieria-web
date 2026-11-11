const TO = 'garciarodriguezadolfo@gmail.com';
const SERVICES = {
  expert: 'Peritajes técnicos', accidents: 'Investigación y reconstrucción de accidentes',
  energy: 'Certificados energéticos', occupancy: 'Segunda ocupación',
  opening: 'Aperturas y cambios de titularidad', other: 'Otra consulta técnica',
};
const MAX_BYTES = 16384;
const emailValid = value => typeof value === 'string' && value.length <= 250 && /^[^\s<>@,;\r\n]+@[^\s<>@,;\r\n]+\.[^\s<>@,;\r\n]+$/.test(value);
const ready = env => env.CONTACT_ENABLED === 'true' &&
  ['RESEND_API_KEY', 'TURNSTILE_SECRET_KEY', 'TURNSTILE_SITE_KEY'].every(k => typeof env[k] === 'string' && env[k].trim()) && emailValid(env.CONTACT_FROM);
const json = (status, data) => Response.json(data, {status, headers: {
  'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff',
}});

async function readJSON(request) {
  if (Number(request.headers.get('Content-Length')) > MAX_BYTES) throw Error('large');
  const reader = request.body?.getReader();
  if (!reader) throw Error('invalid');
  const chunks = []; let size = 0;
  while (true) {
    const {done, value} = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > MAX_BYTES) {await reader.cancel(); throw Error('large');}
    chunks.push(value);
  }
  const all = new Uint8Array(size); let offset = 0;
  for (const chunk of chunks) {all.set(chunk, offset); offset += chunk.byteLength;}
  return JSON.parse(new TextDecoder().decode(all));
}

export async function onRequest({request, env}) {
  const url = new URL(request.url);
  if (request.method === 'GET') return ready(env)
    ? json(200, {siteKey: env.TURNSTILE_SITE_KEY})
    : json(503, {error: 'unavailable'});
  if (request.method !== 'POST') return new Response(null, {status:405, headers:{Allow:'GET, POST', 'Cache-Control':'no-store'}});
  // No CORS: only a page on the same origin can submit from a browser.
  if (request.headers.get('Origin') !== url.origin) return json(403, {error:'origin'});
  if (!ready(env)) return json(503, {error:'unavailable'});
  if (request.headers.get('Content-Type')?.split(';')[0].trim() !== 'application/json') return json(415, {error:'invalid'});
  let data;
  try {data = await readJSON(request);} catch (e) {return json(e.message === 'large' ? 413 : 400, {error:'invalid'});}
  if (!data || typeof data !== 'object' || Array.isArray(data)) return json(400, {error:'invalid'});
  const {nombre, email, servicio, mensaje, privacy, website, token, requestId, language} = data;
  if (website) return json(400, {error:'spam'});
  if (typeof nombre !== 'string' || nombre.trim().length < 2 || nombre.length > 150 || /[\r\n\x00-\x1f]/.test(nombre) ||
      !emailValid(email) || typeof servicio !== 'string' || !Object.hasOwn(SERVICES, servicio) ||
      typeof mensaje !== 'string' || mensaje.trim().length < 10 || mensaje.length > 5000 || /[\x00]/.test(mensaje) ||
      privacy !== true || !['es','en'].includes(language) ||
      typeof requestId !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(requestId) ||
      typeof token !== 'string' || !token || token.length > 2048) return json(400, {error:'invalid'});
  try {
    // Verify tokens in the server. IP is deliberately not forwarded in the payload.
    const verification = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method:'POST', body:new URLSearchParams({secret:env.TURNSTILE_SECRET_KEY,response:token}),
      signal:AbortSignal.timeout(10000),
    });
    if (!verification.ok) return json(503, {error:'verification'});
    const result = await verification.json();
    if (result.success !== true || result.hostname !== url.hostname || result.action !== 'contact') return json(403, {error:'verification'});
  } catch {return json(503, {error:'verification'});}

  const text = `Consulta web / Website enquiry\nIdioma / Language: ${language}\nNombre / Name: ${nombre.trim()}\nCorreo / Email: ${email}\nServicio / Service: ${SERVICES[servicio]}\n\n${mensaje.trim()}`;
  // Stable per submission and contents; a retry after an uncertain response won't duplicate the email.
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  const hash = [...new Uint8Array(digest)].map(b => b.toString(16).padStart(2,'0')).join('');
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method:'POST', headers:{'Authorization':`Bearer ${env.RESEND_API_KEY}`, 'Content-Type':'application/json',
        'Idempotency-Key':`contact/${requestId}/${hash}`},
      body:JSON.stringify({from:env.CONTACT_FROM,to:[TO],reply_to:email,
        subject:`Consulta web: ${SERVICES[servicio]}`,text}),
      signal:AbortSignal.timeout(10000),
    });
    if (!response.ok) return json(502, {error:'delivery'});
    const receipt = await response.json();
    if (typeof receipt.id !== 'string' || !receipt.id) return json(502, {error:'delivery'});
    // Provider acceptance is not a guarantee of inbox delivery. Do not return personal data or provider errors.
    return json(200, {accepted:true});
  } catch {return json(502, {error:'delivery'});}
}
