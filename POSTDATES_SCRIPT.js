function doGet(e) {
  return handleRequest(e);
}

function doPost(e) {
  return handleRequest(e);
}

function handleRequest(e) {
  try {
    const action = e.parameter.action || (e.postData ? JSON.parse(e.postData.contents).action : null);
    
    if (action === 'getPostdatesData') {
      return getPostdatesData();
    }
    
    // Default fallback if no action provided but we still want to return data
    if (!action) {
      return getPostdatesData();
    }
    
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: 'Invalid action' }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function getPostdatesData() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('Postdates');
    // If exact name is not found, try to find sheets with similar names
    if (!sheet) {
      return ContentService.createTextOutput(JSON.stringify({ 
        status: 'error', 
        message: 'Could not find tab named "Postdates". Available tabs: ' + ss.getSheets().map(s => s.getName()).join(', ')
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    const data = sheet.getDataRange().getValues();
    
    if (data.length <= 1) {
      return ContentService.createTextOutput(JSON.stringify({ status: 'success', data: { scheduled: [], processed: [] } }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    const rows = data.slice(1);
    const scheduled = [];
    const processed = [];
    
    rows.forEach(row => {
      // Common standard column mapping (adjust if actual mapping differs)
      // A (0) Date
      // B (1) Account #
      // C (2) Amount
      // D (3) Owner
      // E (4) Status
      
      const record = {
        accountId: String(row[1] || ''),
        dateTime: row[0] instanceof Date ? row[0].toISOString() : String(row[0] || ''),
        amount: parseFloat(row[2]) || 0,
        owner: String(row[3] || ''),
        status: String(row[4] || '')
      };
      
      if (record.status && record.status.toLowerCase().includes('process')) {
        processed.push(record);
      } else {
        scheduled.push(record);
      }
    });
    
    return ContentService.createTextOutput(JSON.stringify({ status: 'success', data: { scheduled, processed } }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
