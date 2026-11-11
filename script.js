'use strict';
const language = document.documentElement.lang;
const text = (es, en) => language === 'es' ? es : en;
const year = document.getElementById('year');
if (year) year.textContent = new Date().getFullYear();
const form = document.getElementById('contact-form');
if (form) {
  const status = document.getElementById('contact-status');
  const button = form.querySelector('button[type=submit]');
  let token = '', widget, busy = false, hasSubmissionResult = false, requestId = crypto.randomUUID();
  const message = (value, error = false) => {
    status.textContent = value;
    status.dataset.state = error ? 'error' : 'info';
  };
  const unavailable = () => message(text(
    'El formulario no está disponible. Puede contactar por teléfono o correo.',
    'The form is unavailable. Please contact us by phone or email.'), true);
  const expire = () => {
    token = ''; button.disabled = true;
    if (!hasSubmissionResult) message(text('Complete de nuevo la verificación antispam.', 'Please complete the spam check again.'), true);
  };
  async function setup() {
    try {
      const response = await fetch('/api/contact', {cache:'no-store', signal:AbortSignal.timeout(10000)});
      if (!response.ok) throw Error('unavailable');
      const config = await response.json();
      if (!config.siteKey) throw Error('unavailable');
      window.contactTurnstileReady = () => {
        widget = window.turnstile.render('#contact-captcha', {
          sitekey:config.siteKey, action:'contact', language,
          callback: value => {
            token = value; button.disabled = busy;
            if (!busy && !hasSubmissionResult) message(text('Puede enviar su consulta.', 'You can send your enquiry.'));
          },
          'expired-callback':expire, 'error-callback':() => {expire(); return true;},
          'timeout-callback':expire,
        });
      };
      const script = document.createElement('script');
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?onload=contactTurnstileReady&render=explicit';
      script.async = true; script.defer = true; script.onerror = unavailable;
      document.head.appendChild(script);
    } catch {unavailable();}
  }
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (busy || !form.reportValidity()) return;
    if (!token) {expire(); return;}
    const data = new FormData(form);
    busy = true; hasSubmissionResult = true; button.disabled = true; form.setAttribute('aria-busy','true');
    message(text('Enviando consulta…', 'Sending enquiry…'));
    try {
      const response = await fetch('/api/contact', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body:JSON.stringify({nombre:data.get('nombre'),email:data.get('email'),servicio:data.get('servicio'),
          mensaje:data.get('mensaje'),privacy:data.get('privacy') === 'on',website:data.get('website'),
          language,token,requestId}), signal:AbortSignal.timeout(30000),
      });
      const result = await response.json();
      if (!response.ok || result.accepted !== true) {
        if (['invalid','spam'].includes(result.error)) {
          message(text('Revise los campos y la información de privacidad.', 'Check the fields and privacy acknowledgement.'), true);
        } else if (result.error === 'verification') {
          message(text('No se pudo validar la protección antispam. Inténtelo de nuevo.', 'The spam check could not be validated. Please try again.'), true);
        } else if (result.error === 'unavailable') unavailable();
        else throw Error('delivery');
        return;
      }
      message(text('Consulta aceptada por el servicio de correo. Gracias. Si necesita confirmar su recepción, puede llamar al 638 651 175.',
        'Your enquiry has been accepted by the email service. Thank you. To confirm receipt, you can call +34 638 651 175.'));
      form.reset(); requestId = crypto.randomUUID();
    } catch {
      // A timeout may occur after provider acceptance; don't claim that nothing was sent.
      message(text('No podemos confirmar el envío. Conserve su consulta y contacte por teléfono o vuelva a intentarlo.',
        'We cannot confirm submission. Keep your enquiry and contact us by phone or try again.'), true);
    } finally {
      busy = false; token = ''; button.disabled = true; form.removeAttribute('aria-busy');
      if (widget !== undefined && window.turnstile) window.turnstile.reset(widget);
    }
  });
  setup();
}
