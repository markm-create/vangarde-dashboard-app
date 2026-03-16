function doGet(e) {
  const SPREADSHEET_NAME = "Mirror Log"; // User can change this if needed
  const SHEET_NAME = "Mirror"; // User can change this if needed
  
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
    const mirrorData = [];
    
    for (let i = 2; i < data.length; i++) {
      const row = data[i];
      const username = row[0]; // Column A
      const name = row[1]; // Column B
      
      if (!name) continue;
      
      const stats = {
        username: username,
        name: name,
        baseAssigned: row[3] || 0, // Column D
        '10:00 AM': {
          worked: row[4] || 0, // Column E
          outbound: row[5] || 0, // Column F
          inbound: row[6] || 0, // Column G
          missed: row[7] || 0, // Column H
          duration: row[8] || "0h 0m", // Column I
          collected: row[9] || 0 // Column J
        },
        '12:00 PM': {
          worked: row[10] || 0, // Column K
          outbound: row[11] || 0, // Column L
          inbound: row[12] || 0, // Column M
          missed: row[13] || 0, // Column N
          duration: row[14] || "0h 0m", // Column O
          collected: row[15] || 0 // Column P
        },
        '4:00 PM': {
          assigned: row[16] || 0, // Column Q
          worked: row[17] || 0, // Column R
          outbound: row[18] || 0, // Column S
          inbound: row[19] || 0, // Column T
          missed: row[20] || 0, // Column U
          duration: row[21] || "0h 0m", // Column V
          collected: row[22] || 0 // Column W
        }
      };
      
      mirrorData.push(stats);
    }
    
    return ContentService.createTextOutput(JSON.stringify({
      data: mirrorData,
      lastUpdated: new Date().toISOString()
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
