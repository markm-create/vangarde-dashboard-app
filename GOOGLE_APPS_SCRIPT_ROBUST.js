/**
 * PROJECTIONS & POSTDATES MANAGEMENT SCRIPT
 * For "Input Database" Spreadsheet
 */

const CONFIG = {
  PROJECTIONS_SHEET: "Projections",
  SCHEDULED_SHEET: "Scheduled",
  PROCESSED_SHEET: "Processed",
  HEADER_ROWS: 1, // Default for most sheets
  PROJECTIONS_HEADER_ROWS: 2 // Specific for Projections
};

function doGet(e) {
  const action = e.parameter.action || 'getProjections';
  
  if (action === 'getProjections') {
    return handleGetProjections();
  }
  
  return response({ status: 'error', message: 'Invalid GET action: ' + action });
}

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const action = data.action;
    const payload = data.payload || data;

    if (action === 'updateProjection') {
      return handleUpdateProjection(payload);
    }
    
    if (action === 'getProjections') {
      return handleGetProjections();
    }
    
    if (action === 'updatePostdate') {
      return handleUpdatePostdate(payload);
    }

    return response({ status: 'error', message: 'Invalid POST action: ' + action });
  } catch (error) {
    return response({ status: 'error', message: error.toString() });
  }
}

/**
 * PROJECTIONS LOGIC
 */
function handleGetProjections() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(CONFIG.PROJECTIONS_SHEET);
  if (!sheet) return response({ status: 'error', message: 'Sheet not found: ' + CONFIG.PROJECTIONS_SHEET });

  const values = sheet.getDataRange().getValues();
  if (values.length <= CONFIG.PROJECTIONS_HEADER_ROWS) {
    return response([]);
  }

  const data = values.slice(CONFIG.PROJECTIONS_HEADER_ROWS).map((row, index) => {
    // Column B (Index 1): Agent/Collector Name
    const name = row[1] ? row[1].toString().trim() : '';
    if (!name) return null;

    // Week 1: D=Proj(3), E=Coll(4)
    // Week 2: F=Proj(5), G=Coll(6)
    // Week 3: H=Proj(7), I=Coll(8)
    // Week 4: J=Proj(9), K=Coll(10)
    
    const w1 = { projection: Number(row[3]) || 0, collected: Number(row[4]) || 0, reached: 0 };
    const w2 = { projection: Number(row[5]) || 0, collected: Number(row[6]) || 0, reached: 0 };
    const w3 = { projection: Number(row[7]) || 0, collected: Number(row[8]) || 0, reached: 0 };
    const w4 = { projection: Number(row[9]) || 0, collected: Number(row[10]) || 0, reached: 0 };
    
    w1.reached = w1.projection > 0 ? (w1.collected / w1.projection) * 100 : 0;
    w2.reached = w2.projection > 0 ? (w2.collected / w2.projection) * 100 : 0;
    w3.reached = w3.projection > 0 ? (w3.collected / w3.projection) * 100 : 0;
    w4.reached = w4.projection > 0 ? (w4.collected / w4.projection) * 100 : 0;

    const totalProjection = w1.projection + w2.projection + w3.projection + w4.projection;
    const totalCollected = w1.collected + w2.collected + w3.collected + w4.collected;
    const totalReached = totalProjection > 0 ? (totalCollected / totalProjection) * 100 : 0;

    return {
      id: name,
      name: name,
      weeks: { w1, w2, w3, w4 },
      totalProjection,
      totalCollected,
      totalReached
    };
  }).filter(item => item !== null);

  return response(data);
}

function handleUpdateProjection(payload) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(CONFIG.PROJECTIONS_SHEET);
  if (!sheet) throw new Error('Sheet not found: ' + CONFIG.PROJECTIONS_SHEET);

  const values = sheet.getDataRange().getValues();

  // Support bulk updates if payload is an array
  const updates = Array.isArray(payload) ? payload : [payload];

  for (const update of updates) {
    const agentName = (update.agentName || update.name || '').toString().trim();
    const projections = update.projections;

    if (!agentName) continue;

    let rowToUpdate = -1;
    for (let i = CONFIG.PROJECTIONS_HEADER_ROWS; i < values.length; i++) {
      if (values[i][1] && values[i][1].toString().trim() === agentName) {
        rowToUpdate = i + 1;
        break;
      }
    }

    if (rowToUpdate !== -1) {
      if (projections.w1 !== undefined) sheet.getRange(rowToUpdate, 4).setValue(projections.w1);
      if (projections.w2 !== undefined) sheet.getRange(rowToUpdate, 6).setValue(projections.w2);
      if (projections.w3 !== undefined) sheet.getRange(rowToUpdate, 8).setValue(projections.w3);
      if (projections.w4 !== undefined) sheet.getRange(rowToUpdate, 10).setValue(projections.w4);
    }
  }

  return response({ status: 'success', message: 'Projections updated' });
}

/**
 * POSTDATES LOGIC
 */
function handleUpdatePostdate(payload) {
  const type = payload.type; 
  const sheetName = type === 'scheduled' ? CONFIG.SCHEDULED_SHEET : CONFIG.PROCESSED_SHEET;
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(sheetName);
  
  if (!sheet) throw new Error('Sheet not found: ' + sheetName);

  const values = sheet.getDataRange().getValues();
  const accountId = (payload.accountId || '').toString().trim();
  const dateTime = (payload.dateTime || '').toString().trim();

  if (!accountId) throw new Error('Account ID is required');

  let rowToUpdate = -1;
  // Match by accountId and dateTime
  for (let i = CONFIG.HEADER_ROWS; i < values.length; i++) {
    const rowAcc = values[i][0] ? values[i][0].toString().trim() : '';
    const rowDate = values[i][2] ? values[i][2].toString().trim() : '';
    
    if (rowAcc === accountId && rowDate === dateTime) {
      rowToUpdate = i + 1;
      break;
    }
  }

  // Fallback to searching only by Account ID if not found
  if (rowToUpdate === -1) {
    for (let i = CONFIG.HEADER_ROWS; i < values.length; i++) {
      const rowAcc = values[i][0] ? values[i][0].toString().trim() : '';
      if (rowAcc === accountId) {
        rowToUpdate = i + 1;
        break;
      }
    }
  }

  if (rowToUpdate === -1) throw new Error('Record not found for Account: ' + accountId);

  // Update logic: C=DateTime(3), D=Amount(4), E=Status(5)
  sheet.getRange(rowToUpdate, 3).setValue(payload.dateTime);
  sheet.getRange(rowToUpdate, 4).setValue(payload.amount);
  sheet.getRange(rowToUpdate, 5).setValue(payload.status);
  
  if (type === 'scheduled' && payload.ppaAuditStatus) {
    sheet.getRange(rowToUpdate, 6).setValue(payload.ppaAuditStatus);
  }

  return response({ status: 'success', message: 'Postdate updated for ' + accountId });
}

/**
 * HELPER: JSON Response
 */
function response(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
