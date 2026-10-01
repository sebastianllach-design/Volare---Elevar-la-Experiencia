function doPost(e) {
  const sheet = SpreadsheetApp
    .openById('1nfCAGkVw15bQpiQ_eKqIHnXYQdwedBISf4l1xpz-2DQ')
    .getSheetByName('Confirmaciones');

  const data = JSON.parse(e.postData.contents || '{}');

  sheet.appendRow([
    new Date(),
    data.nombre || '',
    data.empresa || '',
    data.email || '',
    data.telefono || '',
    data.rol || '',
    data.cantidad || '1',
    data.restricciones || '',
    data.observaciones || '',
    data.estado || 'Confirmada'
  ]);

  return ContentService
    .createTextOutput(JSON.stringify({ success: true }))
    .setMimeType(ContentService.MimeType.JSON);
}
