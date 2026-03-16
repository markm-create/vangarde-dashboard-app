function doGet(e) {
  return handleRequest(e);
}

function doPost(e) {
  return handleRequest(e);
}

function handleRequest(e) {
  const action = e.parameter.action || (e.postData ? JSON.parse(e.postData.contents).action : null);
  
  if (action === 'getImports') {
    return getImports();
  }
  
  return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: 'Invalid action' }))
    .setMimeType(ContentService.MimeType.JSON);
}

function getImports() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('New Imports');
  
  if (!sheet) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: 'Sheet "New Imports" not found' }))
      .setMimeType(ContentService.MimeType.JSON);
  }
  
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'success', data: [] }))
      .setMimeType(ContentService.MimeType.JSON);
  }
  
  const headers = data[0];
  const rows = data.slice(1);
  
  const imports = rows.map((row, index) => {
    // Column A: Client Claim # (index 0)
    // Column B: Account # (index 1)
    // Column C: Date Imported (index 2)
    // Column D: Business Name (index 3)
    // Column E: Client Name (index 4)
    // Column H: Balance (index 7)
    
    return {
      id: (index + 1).toString(),
      clientClaimNumber: row[0] || '',
      accountNumber: row[1] || '',
      dateImported: row[2] instanceof Date ? Utilities.formatDate(row[2], Session.getScriptTimeZone(), "yyyy-MM-dd") : row[2] || '',
      businessName: row[3] || '',
      clientName: row[4] || '',
      balance: parseFloat(row[7]) || 0
    };
  });
  
  return ContentService.createTextOutput(JSON.stringify({ status: 'success', data: imports }))
    .setMimeType(ContentService.MimeType.JSON);
}
