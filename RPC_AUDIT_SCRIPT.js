/**
 * RPC Audit Logs - Google Apps Script
 *
 * Instructions:
 * 1. Open your Google Sheet
 * 2. Go to Extensions > Apps Script
 * 3. Paste this code and save (replace any existing code)
 * 4. Click "Deploy" > "New Deployment"
 * 5. Select "Web App"
 * 6. Set "Execute as" to "Me"
 * 7. Set "Who has access" to "Anyone"
 * 8. Click Deploy and copy the Web App URL (update it in the app if it changed)
 */

function doGet(e) {
  try {
    const action = e.parameter.action || 'getRpcAudits';
    
    if (action === 'getRpcAudits') {
      return getRpcAudits();
    }
    
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: 'Invalid action' }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function getRpcAudits() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  // Attempt to get a specific sheet if named "RPC Audit", otherwise get the first sheet
  let sheet = ss.getSheetByName("RPC Audit");
  if (!sheet) {
    sheet = ss.getSheets()[0];
  }
  
  if (!sheet) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: 'No sheets found' }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  const lastRow = sheet.getLastRow();
  if (lastRow < 2) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'success', data: [] }))
      .setMimeType(ContentService.MimeType.JSON);
  }
  
  const range = sheet.getRange(2, 1, lastRow - 1, 5);
  const data = range.getValues();
  const richTextValues = range.getRichTextValues();
  
  const results = data.map((row, i) => {
    // Column C is account number (index 2)
    const richText = richTextValues[i][2]; 
    const link = richText ? richText.getLinkUrl() : null;

    let callDate = '';
    if (row[0] instanceof Date) {
        callDate = Utilities.formatDate(row[0], Session.getScriptTimeZone(), "MM/dd/yyyy");
    } else {
        callDate = String(row[0] || '');
    }

    return {
      callDate: callDate,                                   // Column A
      agentName: String(row[1] || ''),                      // Column B
      accountNumber: String(row[2] || ''),                  // Column C
      logTracker: String(row[3] || ''),                     // Column D
      rpcNotes: String(row[4] || ''),                       // Column E
      accountUrl: link
    };
  }).filter(item => item.accountNumber || item.agentName);
  
  return ContentService.createTextOutput(JSON.stringify({ status: 'success', data: results }))
    .setMimeType(ContentService.MimeType.JSON);
}
