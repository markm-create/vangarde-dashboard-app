/**
 * Google Apps Script for Third-Party Notice Logs
 * 
 * Instructions:
 * 1. Open your Google Sheet "Third-Party Notice Logs"
 * 2. Go to Extensions > Apps Script
 * 3. Paste this code and save
 * 4. Click "Deploy" > "New Deployment"
 * 5. Select type "Web App"
 * 6. Set "Execute as" to "Me"
 * 7. Set "Who has access" to "Anyone"
 * 8. Deploy and copy the Web App URL
 */

function doGet(e) {
  const sheetName = "Logs";
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(sheetName);
  
  if (!sheet) {
    return ContentService.createTextOutput(JSON.stringify({ error: "Sheet not found: " + sheetName }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  const data = sheet.getDataRange().getValues();
  const rows = data.slice(1); // skip headers

  // Column Mapping:
  // Date Sent: Column A (Index 0)
  // Account #: Column B (Index 1)
  // Client Name: Column D (Index 3)
  // Third Party Entity: Column F (Index 5)
  // Letter Type: Column H (Index 7)
  // Sent Via: Column I (Index 8)
  // Email Status: Column J (Index 9)
  // Response Update: Column K (Index 10)

  const results = rows.map(row => {
    return {
      dateSent: row[0],
      accountNumber: row[1],
      creditorName: row[3],
      businessName: row[5], // Mapped Third Party Entity here
      accountStatus: row[7], // Mapped Letter Type here
      debtorEmail: row[8], // Mapped Sent Via here
      campaignStatus: row[9], // Mapped Email Status here
      debtorResponse: row[10] || '-' // Mapped Response Update here
    };
  }).filter(item => item.accountNumber);

  return ContentService.createTextOutput(JSON.stringify(results))
    .setMimeType(ContentService.MimeType.JSON);
}
