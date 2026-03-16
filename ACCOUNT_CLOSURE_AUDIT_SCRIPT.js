/**
 * Google Apps Script for Account Closure Audit
 * 
 * Instructions:
 * 1. Open your Google Sheet "Account Closure Audit"
 * 2. Go to Extensions > Apps Script
 * 3. Paste this code and save
 * 4. Click "Deploy" > "New Deployment"
 * 5. Select "Web App"
 * 6. Set "Execute as" to "Me"
 * 7. Set "Who has access" to "Anyone"
 * 8. Copy the Web App URL and provide it to the assistant
 */

function doGet(e) {
  try {
    const action = e.parameter.action || 'getAccountClosureAudit';
    
    if (action === 'getAccountClosureAudit') {
      return getAccountClosureAudit();
    }
    
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: 'Invalid action' }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function getAccountClosureAudit() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("Summary");
  
  if (!sheet) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: 'Sheet "Summary" not found' }))
      .setMimeType(ContentService.MimeType.JSON);
  }
  
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'success', data: [] }))
      .setMimeType(ContentService.MimeType.JSON);
  }
  
  // Get data from A2 to I (last row)
  const data = sheet.getRange(2, 1, lastRow - 1, 9).getValues();
  
  const results = data.map(row => {
    return {
      accountNumber: row[0],
      collectorName: row[1],
      claimStatus: row[2],
      clientName: row[3],
      accountType: row[4],
      balance: row[5],
      age: row[6],
      auditResult: row[7],
      auditComments: row[8]
    };
  }).filter(item => item.accountNumber || item.collectorName); // Filter out empty rows
  
  return ContentService.createTextOutput(JSON.stringify({ status: 'success', data: results }))
    .setMimeType(ContentService.MimeType.JSON);
}
