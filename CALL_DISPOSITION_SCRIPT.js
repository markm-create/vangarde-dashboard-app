/**
 * Google Apps Script for Call Disposition Logs
 * 
 * Instructions:
 * 1. Open your Google Sheet "Call Disposition Logs"
 * 2. Go to Extensions > Apps Script
 * 3. Paste this code and save
 * 4. Click "Deploy" > "New Deployment"
 * 5. Select type "Web App"
 * 6. Set "Execute as" to "Me"
 * 7. Set "Who has access" to "Anyone"
 * 8. Deploy and copy the Web App URL
 */

function doGet(e) {
  const sheetName = "Call Dispo";
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(sheetName);
  
  if (!sheet) {
    return ContentService.createTextOutput(JSON.stringify({ error: "Sheet not found: " + sheetName }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const rows = data.slice(1);

  // Column Mapping based on user provided guide:
  // Date: Column A (Index 0)
  // Collector Name: Column E (Index 4)
  // Call Disposition Description: Column C (Index 2)
  // Call Disposition Count: Column D (Index 3)

  const results = rows.map(row => {
    return {
      date: row[0],
      description: row[2],
      count: parseInt(row[3]) || 0,
      collector: row[4]
    };
  }).filter(item => item.collector && item.description);

  return ContentService.createTextOutput(JSON.stringify(results))
    .setMimeType(ContentService.MimeType.JSON);
}
