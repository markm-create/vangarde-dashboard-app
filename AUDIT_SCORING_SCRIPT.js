/**
 * Google Apps Script for Audit Scoring Integration
 * 
 * Instructions:
 * 1. Open your Google Sheet.
 * 2. Go to Extensions > Apps Script.
 * 3. Replace the code with this script.
 * 4. Click "Deploy" > "New Deployment".
 * 5. Select "Web App".
 * 6. Set "Execute as" to "Me".
 * 7. Set "Who has access" to "Anyone".
 * 8. Copy the Web App URL and paste it into constants.ts as AUDIT_SCORING_SCRIPT_URL.
 */

function doGet(e) {
  const action = e.parameter.action;
  const collectorName = e.parameter.collectorName;
  
  if (action === 'getAuditScores') {
    return getAuditScores(collectorName);
  }
  
  return ContentService.createTextOutput(JSON.stringify({ 
    status: 'error', 
    message: 'Invalid action' 
  })).setMimeType(ContentService.MimeType.JSON);
}

function getAuditScores(collectorName) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const accountSheet = ss.getSheetByName("Account Audit");
  const callSheet = ss.getSheetByName("Call Audit");
  
  const accountData = findCollectorScores(accountSheet, collectorName);
  const callData = findCollectorScores(callSheet, collectorName);
  
  if (!accountData && !callData) {
    return ContentService.createTextOutput(JSON.stringify({ 
      status: 'error', 
      message: `Collector "${collectorName}" not found in Audit sheets.` 
    })).setMimeType(ContentService.MimeType.JSON);
  }

  const result = {
    status: 'success',
    data: {
      accountAudit: accountData || { week1: 0, week2: 0, week3: 0, week4: 0, overall: 0 },
      callAudit: callData || { week1: 0, week2: 0, week3: 0, week4: 0, overall: 0 }
    }
  };
  
  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

function findCollectorScores(sheet, collectorName) {
  if (!sheet) return null;
  
  const data = sheet.getDataRange().getValues();
  const searchName = String(collectorName || '').trim().toLowerCase();
  
  for (let i = 1; i < data.length; i++) {
    const rowName = String(data[i][0] || '').trim().toLowerCase();
    if (rowName === searchName) {
      return {
        week1: parseFloat(data[i][1]) || 0,
        week2: parseFloat(data[i][2]) || 0,
        week3: parseFloat(data[i][3]) || 0,
        week4: parseFloat(data[i][4]) || 0,
        overall: parseFloat(data[i][5]) || 0
      };
    }
  }
  return null;
}
