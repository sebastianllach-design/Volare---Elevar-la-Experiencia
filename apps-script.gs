const SPREADSHEET_ID = '1nfCAGkVw15bQpiQ_eKqIHnXYQdwedBISf4l1xpz-2DQ';
const SHEET_NAME = 'Confirmaciones';

function doGet() {
  return HtmlService
    .createHtmlOutput('<!doctype html><html><body style="font-family:Arial,sans-serif;padding:24px"><strong>VOLARE RSVP OK</strong><br>La conexión con el registro de confirmaciones está activa.</body></html>')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function doPost(e) {
  try {
    const lock = LockService.getScriptLock();
    lock.waitLock(10000);

    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAME);
    if (!sheet) throw new Error('No existe la hoja "' + SHEET_NAME + '".');

    const p = e && e.parameter ? e.parameter : {};

    sheet.appendRow([
      new Date(),
      p.nombre || '',
      p.empresa || '',
      p.email || '',
      p.telefono || '',
      p.rol || '',
      p.cantidad || '1',
      p.restricciones || '',
      p.observaciones || '',
      p.estado || 'Confirmada'
    ]);

    SpreadsheetApp.flush();
    lock.releaseLock();

    return HtmlService
      .createHtmlOutput('<!doctype html><html><body><script>window.parent.postMessage({source:"volare-rsvp",success:true},"*");</script></body></html>')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  } catch (err) {
    try { LockService.getScriptLock().releaseLock(); } catch (_) {}
    const message = String(err && err.message ? err.message : err).replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return HtmlService
      .createHtmlOutput('<!doctype html><html><body><script>window.parent.postMessage({source:"volare-rsvp",success:false,message:' + JSON.stringify(message) + '},"*");</script></body></html>')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  }
}
