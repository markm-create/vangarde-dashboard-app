/**
 * Google Apps Script for Projection Dashboard
 * File: Projection Logs
 * Sheet Name: Projection
 */

function doGet(e) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName("Projection");
    
    if (!sheet) return createJsonResponse({ error: "Sheet 'Projection' not found" });

    const lastRow = sheet.getLastRow();
    if (lastRow < 3) return createJsonResponse([]); 

    // Read everything from Column B (2) to Column K (11). Total columns = 10
    const dataRange = sheet.getRange(3, 2, lastRow - 2, 10);
    const data = dataRange.getValues();
    
    const result = [];
    
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      // row[0] is Column B (Collector Name)
      // row[1] is Column C (Hidden)
      // row[2] is Column D (Week 1 Projected)
      // row[3] is Column E (Week 1 Collected)
      // row[4] is Column F (Week 2 Projected)
      // row[5] is Column G (Week 2 Collected)
      // row[6] is Column H (Week 3 Projected)
      // row[7] is Column I (Week 3 Collected)
      // row[8] is Column J (Week 4 Projected)
      // row[9] is Column K (Week 4 Collected)
      const name = row[0] ? row[0].toString().trim() : "";
      
      if (!name) continue; // Skip if name is empty

      result.push({
        id: "agent-" + i,
        name: name,
        weeks: {
          w1: { projection: Number(row[2]) || 0, collected: Number(row[3]) || 0 }, // Col D, E
          w2: { projection: Number(row[4]) || 0, collected: Number(row[5]) || 0 }, // Col F, G
          w3: { projection: Number(row[6]) || 0, collected: Number(row[7]) || 0 }, // Col H, I
          w4: { projection: Number(row[8]) || 0, collected: Number(row[9]) || 0 }  // Col J, K
        }
      });
    }

    return createJsonResponse(result);
  } catch (err) {
    return createJsonResponse({ error: err.toString() });
  }
}

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return createJsonResponse({ status: 'error', message: 'No payload provided' });
    }
    
    let requestData;
    try {
      requestData = JSON.parse(e.postData.contents);
    } catch (parseErr) {
      return createJsonResponse({ status: 'error', message: 'Invalid JSON payload' });
    }

    const action = requestData.action;
    const payload = requestData.payload;

    if (action === 'updateProjection') {
      const ss = SpreadsheetApp.getActiveSpreadsheet();
      const sheet = ss.getSheetByName("Projection");
      
      if (!sheet) return createJsonResponse({ status: 'error', message: "Sheet 'Projection' not found" });

      const lastRow = sheet.getLastRow();
      if (lastRow < 3) return createJsonResponse({ status: 'success', message: 'No data rows to update' });
      
      // Get all names from Column B
      const names = sheet.getRange(3, 2, lastRow - 2, 1).getValues().map(r => String(r[0]).trim().toLowerCase());

      if (Array.isArray(payload)) {
        payload.forEach(update => {
          const agentName = String(update.agentName).trim().toLowerCase();
          const rowIndex = names.indexOf(agentName);
          
          if (rowIndex !== -1) {
            const actualRow = rowIndex + 3; 
            const proj = update.projections || {};
            
            // Explicitly updates columns if they are provided in the payload
            if (proj.w1 !== undefined && proj.w1 !== null) sheet.getRange(actualRow, 4).setValue(proj.w1);  // Col D
            if (proj.w2 !== undefined && proj.w2 !== null) sheet.getRange(actualRow, 6).setValue(proj.w2);  // Col F
            if (proj.w3 !== undefined && proj.w3 !== null) sheet.getRange(actualRow, 8).setValue(proj.w3);  // Col H
            if (proj.w4 !== undefined && proj.w4 !== null) sheet.getRange(actualRow, 10).setValue(proj.w4); // Col J
          }
        });
      }

      return createJsonResponse({ status: 'success' });
    }

    return createJsonResponse({ status: 'error', message: 'Unknown action' });
  } catch (err) {
    return createJsonResponse({ status: 'error', message: err.toString() });
  }
}

function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function doOptions(e) {
  return ContentService.createTextOutput('')
    .setMimeType(ContentService.MimeType.TEXT);
}
