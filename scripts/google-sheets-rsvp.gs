const RSVP_SPREADSHEET_ID = '1tcnGTkyuvA5zlsnrRZtG73vTOcjJaNOf7raW-tOMexY';
const RSVP_SHEET_NAME = 'RSVPs';
const RSVP_HEADERS = ['Submitted at', 'Response', 'Name', 'Phone', 'Comfort notes'];
const RSVP_RESPONSES = [
  'Yes, I would love to!',
  'We will miss being there, sending love',
];

function setupRsvpSheet() {
  const spreadsheet = SpreadsheetApp.openById(RSVP_SPREADSHEET_ID);
  let sheet = spreadsheet.getSheetByName(RSVP_SHEET_NAME);
  if (!sheet) {
    sheet = spreadsheet.insertSheet(RSVP_SHEET_NAME);
  }
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(RSVP_HEADERS);
    sheet.setFrozenRows(1);
  }
  console.log('RSVP sheet ready: ' + spreadsheet.getUrl() + ' (' + RSVP_SHEET_NAME + ')');
}

function testRsvpWrite() {
  const spreadsheet = SpreadsheetApp.openById(RSVP_SPREADSHEET_ID);
  let sheet = spreadsheet.getSheetByName(RSVP_SHEET_NAME);
  if (!sheet) {
    sheet = spreadsheet.insertSheet(RSVP_SHEET_NAME);
  }
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(RSVP_HEADERS);
    sheet.setFrozenRows(1);
  }

  const row = sheet.getLastRow() + 1;
  sheet.getRange(row, 1, 1, RSVP_HEADERS.length).setValues([[
    new Date(),
    'TEST - delete this row',
    'Apps Script connection test',
    '',
    'Delete this test row after verifying the connection.',
  ]]);
  SpreadsheetApp.flush();
  console.log('Test row written to ' + spreadsheet.getUrl() + ' / ' + RSVP_SHEET_NAME + ' at row ' + row);
}

function asPlainText(value) {
  return /^[=+\-@]/.test(value) ? "'" + value : value;
}

function doPost(event) {
  const lock = LockService.getScriptLock();
  try {
    if (!event || !event.postData || !event.postData.contents) {
      throw new Error('Missing RSVP submission data.');
    }

    const submission = JSON.parse(event.postData.contents);
    const response = String(submission.response || '').trim();
    const name = String(submission.name || '').trim();
    const phone = String(submission.phone || '').trim();
    const notes = String(submission.notes || '').trim();

    if (!RSVP_RESPONSES.includes(response) || !name || !phone) {
      throw new Error('A valid response, name, and phone number are required.');
    }
    if (name.length > 100 || phone.length > 40 || notes.length > 1000) {
      throw new Error('One or more RSVP fields exceed the allowed length.');
    }

    lock.waitLock(10000);
    const spreadsheet = SpreadsheetApp.openById(RSVP_SPREADSHEET_ID);
    let sheet = spreadsheet.getSheetByName(RSVP_SHEET_NAME);
    if (!sheet) {
      sheet = spreadsheet.insertSheet(RSVP_SHEET_NAME);
    }
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(RSVP_HEADERS);
      sheet.setFrozenRows(1);
    }
    sheet.appendRow([
      new Date(),
      response,
      asPlainText(name),
      asPlainText(phone),
      asPlainText(notes),
    ]);
    SpreadsheetApp.flush();
    console.log('RSVP saved to ' + spreadsheet.getUrl() + ' / ' + RSVP_SHEET_NAME);

    return ContentService
      .createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    console.error(error);
    throw error;
  } finally {
    if (lock.hasLock()) {
      lock.releaseLock();
    }
  }
}
