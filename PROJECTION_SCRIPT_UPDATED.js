/**
 * Google Apps Script for Projection Dashboard
 * File: Projection Logs
 * Sheet Name: Projection
 */

function doGet(e) {
  return handleRequest(e);
}

function doPost(e) {
  return handleRequest(e);
}

function handleRequest(e) {
  try {
    const isPost = e.postData && e.postData.contents;
    let action = 'getProjections';
    let payload = null;

    if (isPost) {
      const data = JSON.parse(e.postData.contents);
      action = data.action || 'getProjections';
      payload = data.payload;
    } else if (e.parameter.action) {
      action = e.parameter.action;
    }

    if (action === 'getProjections') {
      return getProjections();
    } else if (action === 'updateProjection') {
      return updateProjection(payload);
    }

    return createJsonResponse(getProjectionsData()); // default fallback
  } catch (error) {
    return createJsonResponse({ status: 'error', message: error.toString() });
  }
}

function getProjections() {
  try {
    const data = getProjectionsData();
    return createJsonResponse({ status: 'success', data: data });
  } catch (e) {
    return createJsonResponse({ status: 'error', message: e.toString() });
  }
}

function getProjectionsData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("Projection");
  
  if (!sheet) {
    throw new Error("Sheet 'Projection' not found");
  }

  const lastRow = sheet.getLastRow();
  if (lastRow < 3) {
    return []; // No data yet
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

  return result;
}

function updateProjection(updates) {
  try {
    if (!updates || !Array.isArray(updates)) {
      throw new Error("Invalid payload: expected an array of updates");
    }

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName("Projection");
    
    if (!sheet) {
      throw new Error("Sheet 'Projection' not found");
    }

    const lastRow = sheet.getLastRow();
    if (lastRow < 3) return createJsonResponse({ status: 'success' }); // Nothing to update
    
    const namesRange = sheet.getRange(3, 1, lastRow - 2, 1);
    const names = namesRange.getValues().map(row => String(row[0]).trim());

    // Loop through updates
    updates.forEach(update => {
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

    return createJsonResponse({ status: 'success' });
  } catch (e) {
    return createJsonResponse({ status: 'error', message: e.toString() });
  }
}

function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
