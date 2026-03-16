/**
 * VERSION 1.0 - CALL PERFORMANCE REPORT SCRIPT
 * Sheet: "Call Performance Report Log"
 */

function doGet(e) { return processRequest(e); }
function doPost(e) { return processRequest(e); }

function processRequest(e) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const tz = ss.getSpreadsheetTimeZone();
    
    // Try both names provided by the user
    let sheet = ss.getSheetByName("Call Performance") || ss.getSheetByName("Call Performance Report Log");
    
    // Fallback to first sheet if neither found
    if (!sheet) {
      sheet = ss.getSheets()[0];
    }

    const lastRow = sheet.getLastRow();
    if (lastRow < 2) {
      return ContentService.createTextOutput(JSON.stringify({data: [], message: "Sheet empty or only headers found"})).setMimeType(ContentService.MimeType.JSON);
    }

    // Helper to format time/duration from Google Sheets
    const fmtTime = (val) => {
      if (!val) return "0s";
      if (val instanceof Date) {
        const h = val.getHours();
        const m = val.getMinutes();
        const s = val.getSeconds();
        if (h > 0) return `${h}h ${m}m ${s}s`;
        if (m > 0) return `${m}m ${s}s`;
        return `${s}s`;
      }
      return val.toString();
    };

    // Read from Row 2 to be safe, we will filter out header rows in the map
    const vals = sheet.getRange(3, 2, lastRow - 2, 23).getValues();
    
    const data = vals.map((row, index) => {
      const name = (row[0] || "").toString().trim();
      
      // Filter out empty names, header-like strings, or "Total" rows
      if (!name || 
          name.toLowerCase().includes("total") || 
          name.toLowerCase().includes("collector") || 
          name.toLowerCase().includes("name") ||
          name.toLowerCase() === "outgoing" ||
          name.toLowerCase() === "received") {
        return null;
      }

      return {
        id: (index + 2).toString(), // Row number approx
        collectorName: name,
        prior: {
          outgoing: parseInt(row[2]) || 0,     // Col D
          received: parseInt(row[3]) || 0,     // Col E
          missed: parseInt(row[4]) || 0,       // Col F
          totalCalls: parseInt(row[5]) || 0,   // Col G
          completedCalls: parseInt(row[6]) || 0, // Col H
          avgCallTime: fmtTime(row[7]),        // Col I
          totalCallTime: fmtTime(row[8])       // Col J
        },
        wtd: {
          outgoing: parseInt(row[9]) || 0,     // Col K
          received: parseInt(row[10]) || 0,    // Col L
          missed: parseInt(row[11]) || 0,      // Col M
          totalCalls: parseInt(row[12]) || 0,  // Col N
          completedCalls: parseInt(row[13]) || 0, // Col O
          avgCallTime: fmtTime(row[14]),       // Col P
          totalCallTime: fmtTime(row[15])      // Col Q
        },
        mtd: {
          outgoing: parseInt(row[16]) || 0,    // Col R
          received: parseInt(row[17]) || 0,    // Col S
          missed: parseInt(row[18]) || 0,      // Col T
          totalCalls: parseInt(row[19]) || 0,  // Col U
          completedCalls: parseInt(row[20]) || 0, // Col V
          avgCallTime: fmtTime(row[21]),       // Col W
          totalCallTime: fmtTime(row[22])      // Col X
        }
      };
    }).filter(x => x);

    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      data: data,
      lastUpdated: new Date().toISOString(),
      sheetUsed: sheet.getName()
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({error: err.toString()})).setMimeType(ContentService.MimeType.JSON);
  }
}
