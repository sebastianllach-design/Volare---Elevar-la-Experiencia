const SPREADSHEET_ID = '1nfCAGkVw15bQpiQ_eKqIHnXYQdwedBISf4l1xpz-2DQ';
const SHEET_NAME = 'Confirmaciones';
const RSVP_CLOSE_AT = '2026-10-22T18:00:00-03:00';
const RSVP_CLOSE_MS = Date.parse(RSVP_CLOSE_AT);
const RSVP_WHATSAPP = 'https://wa.me/5491162109458';
const RSVP_CLOSED_MESSAGE = 'Inscripci\u00f3n cerrada. Para sumarte al evento contactate por whatsapp al +5491162109458';

function registrationClosed_() {
  return Date.now() >= RSVP_CLOSE_MS;
}

function rsvpResponse_(data) {
  const json = JSON.stringify(data).replace(/</g, '\\u003c').replace(/>/g, '\\u003e');
  return HtmlService
    .createHtmlOutput('<!doctype html><html><body><script>window.parent.postMessage(' + json + ',"*");</script></body></html>')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function closedResponse_() {
  return rsvpResponse_({
    source: 'volare-rsvp', success: false, code: 'REGISTRATION_CLOSED',
    registrationClosed: true, message: RSVP_CLOSED_MESSAGE,
    whatsappUrl: RSVP_WHATSAPP, closesAt: RSVP_CLOSE_AT
  });
}

function doGet() {
  const content = registrationClosed_()
    ? '<strong>Inscripci\u00f3n cerrada.</strong><p>Para sumarte al evento contactate por whatsapp al <a href="' + RSVP_WHATSAPP + '" target="_blank" rel="noopener noreferrer">+5491162109458</a></p>'
    : '<strong>VOLARE RSVP OK</strong><br>La conexi\u00f3n con el registro de confirmaciones est\u00e1 activa.';
  return HtmlService
    .createHtmlOutput('<!doctype html><html lang="es"><head><meta charset="utf-8"></head><body style="font-family:Arial,sans-serif;padding:24px">' + content + '</body></html>')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function doPost(e) {
  // El servidor decide con su propio reloj: no confia en fechas enviadas por el navegador.
  if (registrationClosed_()) return closedResponse_();
  let lock = null;
  let locked = false;
  try {
    lock = LockService.getScriptLock();
    lock.waitLock(10000);
    locked = true;
    // Revalidar tras una eventual espera por otro registro.
    if (registrationClosed_()) return closedResponse_();
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAME);
    if (!sheet) throw new Error('No existe la hoja "' + SHEET_NAME + '".');
    const p = e && e.parameter ? e.parameter : {};
    // Ultima comprobacion inmediatamente antes de escribir la fila.
    if (registrationClosed_()) return closedResponse_();
    // Mantiene exactamente el orden de las diez columnas y no altera registros anteriores.
    sheet.appendRow([
      new Date(), p.nombre || '', p.empresa || '', p.email || '',
      p.telefono || '', p.rol || '', p.cantidad || '1',
      p.restricciones || '', p.observaciones || '', p.estado || 'Confirmada'
    ]);
    SpreadsheetApp.flush();
    return rsvpResponse_({ source: 'volare-rsvp', success: true });
  } catch (err) {
    return rsvpResponse_({
      source: 'volare-rsvp', success: false,
      message: String(err && err.message ? err.message : err)
    });
  } finally {
    if (locked && lock) {
      try { lock.releaseLock(); } catch (_) {}
    }
  }
}
