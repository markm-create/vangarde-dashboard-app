/**
 * Google Apps Script for Projection Dashboard
 * File: Projection Logs
 * Sheet Name: Projection
 */

function doGet(e) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName("Projection");
    
    if (!sheet) {
      return createJsonResponse({ error: "Sheet 'Projection' not found" });
    }

    const lastRow = sheet.getLastRow();
    if (lastRow < 3) {
      return createJsonResponse([]); // No data yet
    }

    // Get data starting from Row 3, Columns A through I (9 columns total)
    // A: Name, B/C: W1, D/E: W2, F/G: W3, H/I: W4
    const data = sheet.getRange(3, 1, lastRow - 2, 9).getValues();
    
    const result = data.map(row => {
      const name = row[0];
      if (!name || name.toString().trim() === "") return null; // Skip empty rows
      
      return {
        name: name.toString(),
        weeks: {
          w1: { projection: Number(row[1]) || 0, collected: Number(row[2]) || 0 },
          w2: { projection: Number(row[3]) || 0, collected: Number(row[4]) || 0 },
          w3: { projection: Number(row[5]) || 0, collected: Number(row[6]) || 0 },
          w4: { projection: Number(row[7]) || 0, collected: Number(row[8]) || 0 }
        }
      };
    }).filter(item => item !== null);

    return createJsonResponse(result);
  } catch (e) {
    return createJsonResponse({ error: e.toString() });
  }
}

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return createJsonResponse({ status: 'error', message: 'No payload provided' });
    }
    
    const requestData = JSON.parse(e.postData.contents);
    const action = requestData.action;
    const payload = requestData.payload;

    if (action === 'updateProjection') {
      const ss = SpreadsheetApp.getActiveSpreadsheet();
      const sheet = ss.getSheetByName("Projection");
      
      if (!sheet) {
        return createJsonResponse({ status: 'error', message: "Sheet 'Projection' not found" });
      }

      const lastRow = sheet.getLastRow();
      if (lastRow < 3) return createJsonResponse({ status: 'success' }); // Nothing to update
      
      const namesRange = sheet.getRange(3, 1, lastRow - 2, 1);
      const names = namesRange.getValues().map(row => String(row[0]).trim());

      // Loop through updates
      if (Array.isArray(payload)) {
        payload.forEach(update => {
          const agentName = String(update.agentName).trim();
          const rowIndex = names.findIndex(n => n.toLowerCase() === agentName.toLowerCase());
          
          if (rowIndex !== -1) {
            const actualRow = rowIndex + 3; // +3 because data starts at row 3
            const projections = update.projections || {};
            
            // Col B (2): W1 Proj
            if (projections.w1 !== undefined) sheet.getRange(actualRow, 2).setValue(projections.w1);
            // Col D (4): W2 Proj
            if (projections.w2 !== undefined) sheet.getRange(actualRow, 4).setValue(projections.w2);
            // Col F (6): W3 Proj
            if (projections.w3 !== undefined) sheet.getRange(actualRow, 6).setValue(projections.w3);
            // Col H (8): W4 Proj
            if (projections.w4 !== undefined) sheet.getRange(actualRow, 8).setValue(projections.w4);
          }
        });
      }

      return createJsonResponse({ status: 'success' });
    }

    return createJsonResponse({ status: 'error', message: 'Unknown action' });
  } catch (e) {
    return createJsonResponse({ status: 'error', message: e.toString() });
  }
}

function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
