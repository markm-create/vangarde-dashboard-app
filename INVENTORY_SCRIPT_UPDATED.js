/**
 * UPDATED INVENTORY SCRIPT
 * 
 * This script includes logic to extract hyperlinks from Column B (Case Number).
 * 
 * Instructions:
 * 1. Open your Google Sheet.
 * 2. Go to Extensions > Apps Script.
 * 3. Replace your existing inventory script with this code.
 * 4. Click "Deploy" > "New Deployment".
 * 5. Select "Web App".
 * 6. Set "Execute as" to "Me".
 * 7. Set "Who has access" to "Anyone".
 * 8. Copy the Web App URL and update INVENTORY_SCRIPT_URL in constants.ts if it changed.
 */

function doGet(e) {
  const action = e.parameter.action;
  const sheetName = e.parameter.sheetName || "Inventory"; // Default to Inventory
  
  if (action === 'getInventory') {
    return getInventory(sheetName);
  } else if (action === 'getInventoryMetrics') {
    return getInventoryMetrics();
  } else if (action === 'getMetricAccounts') {
    return getMetricAccounts(sheetName);
  }
  
  return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: 'Invalid action' }))
    .setMimeType(ContentService.MimeType.JSON);
}

function getInventory(sheetName) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(sheetName) || ss.getSheets()[0];
    
    if (!sheet) {
      return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: 'Sheet not found' }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    const lastRow = sheet.getLastRow();
    if (lastRow < 2) {
      return ContentService.createTextOutput(JSON.stringify({ status: 'success', data: [] }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    const range = sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn());
    const values = range.getValues();
    const richTextValues = range.getRichTextValues();
    
    const data = values.map((row, i) => {
      // Extract link from Column B (index 1)
      const richText = richTextValues[i][1];
      const link = richText ? richText.getLinkUrl() : null;
      
      return {
        internalCaseId: row[0],
        caseNumber: row[1],
        accountStatus: row[2],
        balance: parseFloat(row[3]) || 0,
        accountAge: parseInt(row[4]) || 0,
        businessName: row[5],
        clientName: row[6],
        collectorName: row[10], // Assuming Column K is Collector Name
        accountUrl: link
      };
    }).filter(item => item.caseNumber);
    
    return ContentService.createTextOutput(JSON.stringify({ status: 'success', data: data }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function getMetricAccounts(sheetName) {
  // This is similar to getInventory but might be used for specific filtered views
  return getInventory(sheetName);
}

function getInventoryMetrics() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName("Inventory Metrics") || ss.getSheetByName("Summary");
    
    if (!sheet) {
      return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: 'Metrics sheet not found' }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    const data = sheet.getDataRange().getValues();
    // Process metrics as needed...
    // This is a placeholder as the exact structure depends on the user's sheet
    
    return ContentService.createTextOutput(JSON.stringify({ status: 'success', data: data }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
