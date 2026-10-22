/* Volare: cierre automatico de la inscripcion publica.
 * Fecha absoluta: jueves 22/10/2026, 18:00 Argentina = 21:00 UTC.
 * No modifica las confirmaciones existentes ni las columnas de Google Sheets.
 */
(function (root) {
  'use strict';

  const policy = Object.freeze({
    closesAt: '2026-10-22T18:00:00-03:00',
    phone: '+5491162109458',
    whatsappUrl: 'https://wa.me/5491162109458',
    title: 'Inscripción cerrada.',
    message: 'Para sumarte al evento contactate por whatsapp al '
  });
  const deadline = Date.parse(policy.closesAt);
  function isClosedAt(timestamp) {
    return !Number.isFinite(timestamp) || timestamp >= deadline;
  }
  // Permite verificar la politica sin navegador ni envios al formulario real.
  if (typeof module === 'object' && module.exports) {
    module.exports = { policy: policy, deadline: deadline, isClosedAt: isClosedAt };
  }
  if (!root || !root.document) return;

  function start() {
    const doc = root.document;
    const form = doc.getElementById('rsvpForm');
    const formWrap = doc.getElementById('formWrap');
    const modal = doc.getElementById('modal');
    const modalCard = modal && modal.querySelector('.modal-card');
    const section = doc.querySelector('.rsvp');
    const sectionShell = section && section.querySelector('.shell');
    if (!form || !formWrap || !modalCard || !sectionShell) return;
    if (doc.getElementById('volareRegistrationClosed')) return;

    let closed = false;
    let deadlineTimer = null;
    let clockRequest = null;
    let serverClock = null;
    const mono = function () {
      return root.performance && root.performance.now ? root.performance.now() : Date.now();
    };

    // La zona horaria del visitante no cambia el instante de cierre.
    // Cuando esta disponible, la cabecera Date del mismo sitio corrige el reloj local.
    function now() {
      if (!serverClock) return Date.now();
      const elapsed = Math.max(0, mono() - serverClock.monotonic, Date.now() - serverClock.local);
      return serverClock.time + elapsed;
    }

    const style = doc.createElement('style');
    style.id = 'volareRegistrationClosedStyles';
    style.textContent = '\n' +
      '.volare-closed-message[hidden]{display:none!important}\n' +
      '.volare-closed-message{width:100%;max-width:700px;margin:26px auto 0;padding:28px 24px;border:1px solid rgba(199,165,96,.55);border-radius:20px;background:rgba(255,253,249,.72);color:#13213e;text-align:center;box-sizing:border-box}\n' +
      '.volare-closed-message h3{font-size:clamp(30px,5vw,42px);line-height:1.12;margin:0 0 15px;color:#0c1933}\n' +
      '.volare-closed-message p{font-family:Arial,Helvetica,sans-serif;font-size:17px;line-height:1.65;margin:0;color:#514b44}\n' +
      '.volare-closed-message a{display:inline-block;max-width:100%;padding:5px 2px;color:#13213e;font-weight:700;text-decoration:underline;text-decoration-color:#b28b3e;text-underline-offset:4px;overflow-wrap:anywhere}\n' +
      '.volare-closed-message a:focus-visible{outline:3px solid #b28b3e;outline-offset:5px;border-radius:4px}\n' +
      '.modal-card .volare-closed-message{margin:22px auto 0;padding:26px 16px;background:transparent;border:0;box-shadow:none}\n' +
      '.rsvp-is-closed #formWrap,.rsvp-is-closed #success,.rsvp-is-closed .rsvp .shell>p,.rsvp-is-closed .rsvp .shell>button[data-rsvp]{display:none!important}\n' +
      '@media(max-width:620px){.volare-closed-message{padding:24px 18px}.volare-closed-message p{font-size:16px}.modal-card .volare-closed-message h3{font-size:32px}}';
    doc.head.appendChild(style);

    function makeMessage(id, headingId) {
      const box = doc.createElement('div');
      box.id = id;
      box.className = 'volare-closed-message';
      box.hidden = true;
      box.setAttribute('role', 'status');
      box.setAttribute('aria-live', 'polite');
      const heading = doc.createElement('h3');
      heading.id = headingId;
      heading.textContent = policy.title;
      const paragraph = doc.createElement('p');
      paragraph.appendChild(doc.createTextNode(policy.message));
      const link = doc.createElement('a');
      link.href = policy.whatsappUrl;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.textContent = policy.phone;
      link.setAttribute('aria-label', 'Abrir conversación de WhatsApp con ' + policy.phone);
      paragraph.appendChild(link);
      box.appendChild(heading);
      box.appendChild(paragraph);
      return box;
    }

    const sectionMessage = makeMessage('volareRegistrationClosed', 'volareRegistrationClosedTitle');
    const modalMessage = makeMessage('volareRegistrationClosedModal', 'volareRegistrationClosedModalTitle');
    sectionShell.appendChild(sectionMessage);
    modalCard.appendChild(modalMessage);
    if (!section.id) section.id = 'inscripcion';

    function closeRegistration() {
      if (closed) return;
      closed = true;
      root.clearTimeout(deadlineTimer);
      const active = doc.activeElement;
      const wasInForm = active && formWrap.contains(active);
      doc.documentElement.classList.add('rsvp-is-closed');
      formWrap.setAttribute('aria-hidden', 'true');
      // Ni un formulario abierto anteriormente conserva un destino de envio valido.
      form.removeAttribute('action');
      Array.from(form.elements).forEach(function (control) { control.disabled = true; });
      sectionMessage.hidden = false;
      modalMessage.hidden = false;
      sectionShell.classList.add('visible');
      modalCard.setAttribute('aria-labelledby', 'volareRegistrationClosedModalTitle');
      doc.querySelectorAll('[data-rsvp]').forEach(function (button) {
        const longLabel = button.querySelector('.cta-long');
        const shortLabel = button.querySelector('.cta-short');
        if (longLabel && shortLabel) {
          longLabel.textContent = 'Inscripción cerrada';
          shortLabel.textContent = 'Cerrada';
        } else {
          button.textContent = 'Inscripción cerrada';
        }
        button.setAttribute('aria-label', 'Inscripción cerrada. Ver contacto por WhatsApp');
      });
      if (wasInForm && modal.classList.contains('open')) {
        modalMessage.querySelector('a').focus();
      }
    }

    function refresh() {
      if (closed || isClosedAt(now())) {
        closeRegistration();
        return true;
      }
      root.clearTimeout(deadlineTimer);
      // Un temporizador sobre el limite y una verificacion periodica cubren pestanas abiertas.
      deadlineTimer = root.setTimeout(refresh, Math.min(60000, Math.max(1, deadline - now())));
      return false;
    }

    function showClosedDialog() {
      modal.classList.add('open');
      modal.setAttribute('aria-hidden', 'false');
      doc.body.style.overflow = 'hidden';
      modalMessage.querySelector('a').focus();
    }

    // Captura antes del listener original: tambien bloquea Enter y requestSubmit().
    doc.addEventListener('submit', function (event) {
      if (event.target === form && refresh()) {
        event.preventDefault();
        event.stopImmediatePropagation();
        showClosedDialog();
      }
    }, true);
    doc.addEventListener('click', function (event) {
      const target = event.target && event.target.closest ? event.target.closest('[data-rsvp]') : null;
      if (target && refresh()) {
        event.preventDefault();
        event.stopImmediatePropagation();
        showClosedDialog();
      }
    }, true);

    function syncClock() {
      if (closed || clockRequest || !root.fetch || !/^https?:$/.test(root.location.protocol)) return;
      const controller = root.AbortController ? new root.AbortController() : null;
      const timeout = controller ? root.setTimeout(function () { controller.abort(); }, 5000) : null;
      const startTime = mono();
      const url = new URL(root.location.href);
      url.hash = '';
      url.search = '?volare_clock=' + Date.now();
      const options = { method: 'HEAD', cache: 'no-store', credentials: 'same-origin' };
      if (controller) options.signal = controller.signal;
      clockRequest = root.fetch(url.href, options)
        .then(function (response) {
          if (!response.ok) return;
          const date = Date.parse(response.headers.get('Date') || '');
          if (!Number.isFinite(date)) return;
          const finish = mono();
          serverClock = { time: date + 500 + (finish - startTime) / 2, monotonic: finish, local: Date.now() };
        })
        .catch(function () { /* El reloj local mantiene el cierre si no hay conexion. */ })
        .finally(function () {
          if (timeout !== null) root.clearTimeout(timeout);
          clockRequest = null;
          refresh();
        });
    }

    function resume() { refresh(); syncClock(); }
    root.addEventListener('pageshow', resume);
    root.addEventListener('focus', resume);
    doc.addEventListener('visibilitychange', function () {
      if (!doc.hidden) resume();
    });
    root.setInterval(function () { if (!closed && !doc.hidden) syncClock(); }, 60000);
    refresh();
    syncClock();
  }

  if (root.document.readyState === 'loading') {
    root.document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
})(typeof window !== 'undefined' ? window : null);
