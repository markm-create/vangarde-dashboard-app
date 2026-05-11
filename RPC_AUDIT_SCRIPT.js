/**
 * RPC Audit Logs - Google Apps Script
 *
 * Exposes a GET endpoint.
 * Action: 'getRpcAudits'
 *
 * Make sure to deploy as a "Web App", run as "Me", and allow access to "Anyone".
 */

const SHEET_ID = 'YOUR_SPREADSHEET_ID_HERE'; // Replace with your Spreadsheet ID
const SHEET_NAME = 'Sheet1'; // Replace with the name of the sheet tab

function doGet(e) {
  if (e.parameter.action === 'getRpcAudits') {
    return handleGetRpcAudits();
  }
  
  return ContentService.createTextOutput(JSON.stringify({ 
    status: 'error', 
    message: 'Invalid action or missing parameter' 
  })).setMimeType(ContentService.MimeType.JSON);
}

function handleGetRpcAudits() {
  try {
    const ss = SpreadsheetApp.openById(SHEET_ID);
    const sheet = ss.getSheetByName(SHEET_NAME);
    
    if (!sheet) {
       return createJsonResponse({ status: 'error', message: 'Sheet not found' });
    }

    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) {
      return createJsonResponse({ status: 'success', data: [] });
    }

    const headers = data[0];
    const rows = data.slice(1);
    
    // Column Mapping based on request:
    // A: Date -> 'callDate'
    // B: Collector Name -> 'agentName'
    // C: Account Number -> 'accountNumber'
    // D: Log Tracker -> 'logTracker'
    // E: RPC Notes -> 'rpcNotes'

    const audits = rows.map(row => ({
      callDate: row[0] instanceof Date ? row[0].toISOString().split('T')[0] : String(row[0] || ''), // Column A
      agentName: row[1] ? String(row[1]) : '',                                                      // Column B
      accountNumber: row[2] ? String(row[2]) : '',                                                  // Column C
      logTracker: row[3] ? String(row[3]) : '',                                                     // Column D
      rpcNotes: row[4] ? String(row[4]) : '',                                                       // Column E
    }));

    return createJsonResponse({ status: 'success', data: audits });
    
  } catch (error) {
    return createJsonResponse({ status: 'error', message: error.toString() });
  }
}

function createJsonResponse(responseObject) {
  return ContentService.createTextOutput(JSON.stringify(responseObject))
    .setMimeType(ContentService.MimeType.JSON);
}
