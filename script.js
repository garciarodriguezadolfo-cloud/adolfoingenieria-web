'use strict';
const language = document.documentElement.lang;
const text = (es, en) => language === 'es' ? es : en;
const year = document.getElementById('year');
if (year) year.textContent = new Date().getFullYear();
const form = document.getElementById('contact-form');
if (form) {
  const status = document.getElementById('contact-status');
  const draft = document.getElementById('enquiry-draft');
  form.addEventListener('submit', event => {
    event.preventDefault();
    const data = new FormData(form);
    // Keep the draft on this device. Sending requires an explicit action in the user’s email app.
    draft.value = `${text('Consulta para', 'Enquiry for')} Manuel Adolfo García Rodríguez\n\n${text('Nombre', 'Name')}: ${data.get('nombre')}\n${text('Correo de respuesta', 'Reply email')}: ${data.get('email') || '—'}\n${text('Servicio', 'Service')}: ${data.get('servicio')}\n\n${data.get('mensaje')}`;
    const subject = text('Consulta profesional: ', 'Professional enquiry: ') + data.get('servicio');
    document.getElementById('open-email').href = `mailto:${form.dataset.recipient}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(draft.value)}`;
    document.getElementById('draft-output').hidden = false;
    status.textContent = text('Borrador preparado en su dispositivo. No se ha enviado ningún mensaje.', 'Draft prepared on your device. No message has been sent.');
    draft.focus();
  });
  document.getElementById('copy-draft').addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(draft.value);
      status.textContent = text('Borrador copiado. No se ha enviado.', 'Draft copied. It has not been sent.');
    } catch {
      draft.focus();
      draft.select();
      status.textContent = text('Copie el texto seleccionado con el comando de copiar de su dispositivo. No se ha enviado.', 'Copy the selected text using your device’s copy command. It has not been sent.');
    }
  });
}
