function doGet(e) {
  const SPREADSHEET_NAME = "Collector Main Log";
  const SHEET_NAME = "Performance";
  
  try {
    const files = DriveApp.getFilesByName(SPREADSHEET_NAME);
    if (!files.hasNext()) {
      return ContentService.createTextOutput(JSON.stringify({ error: "Spreadsheet not found: " + SPREADSHEET_NAME }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    const ss = SpreadsheetApp.open(files.next());
    const sheet = ss.getSheetByName(SHEET_NAME);
    
    if (!sheet) {
      return ContentService.createTextOutput(JSON.stringify({ error: "Sheet not found: " + SHEET_NAME }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    const data = sheet.getDataRange().getValues();
    // Assuming row 1 is header
    const collectors = [];
    
    for (let i = 2; i < data.length; i++) {
      const row = data[i];
      const name = row[1]; // Column B
      
      if (!name) continue;
      
      collectors.push({
        name: name,
        // Prior Performance (Column D-G)
        prior_worked: row[3] || 0,
        prior_rpc: row[4] || 0,
        prior_calls: row[5] || 0,
        prior_collected: row[6] || 0,
        // Week Performance (Column H-K)
        wtd_worked: row[7] || 0,
        wtd_rpc: row[8] || 0,
        wtd_calls: row[9] || 0,
        wtd_collected: row[10] || 0,
        // Month Performance (Column L-O)
        mtd_worked: row[11] || 0,
        mtd_rpc: row[12] || 0,
        mtd_calls: row[13] || 0,
        mtd_collected: row[14] || 0
      });
    }
    
    return ContentService.createTextOutput(JSON.stringify({
      data: collectors,
      lastUpdated: new Date().toISOString()
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
