/**
 * VERSION 1.0 - FLAGGED ACCOUNTS REPORT SCRIPT
 * Sheet: "4-Day"
 * Mapping:
 * - Col A: Account Number
 * - Col B: Debtor Full Name
 * - Col C: Client Full Name
 * - Col D: Current Claim Status
 * - Col L: Collector Name
 * - Col G: Balance Due
 * - Col H: Age
 * - Col F: Last Worked Date
 */

function doGet(e) { return processRequest(e); }
function doPost(e) { return processRequest(e); }

function processRequest(e) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName("4-Day");
    
    if (!sheet) {
      return ContentService.createTextOutput(JSON.stringify({error: "Sheet '4-Day' not found"})).setMimeType(ContentService.MimeType.JSON);
    }

    const lastRow = sheet.getLastRow();
    if (lastRow < 2) {
      return ContentService.createTextOutput(JSON.stringify({data: [], message: "No data found"})).setMimeType(ContentService.MimeType.JSON);
    }

    // Read from Row 2 (assuming Row 1 is headers)
    // Range: A2 to L (Column 1 to 12)
    const range = sheet.getRange(2, 1, lastRow - 1, 12);
    const vals = range.getValues();
    const richTextValues = range.getRichTextValues();
    
    const data = vals.map((row, index) => {
      const accNum = (row[0] || "").toString().trim();
      if (!accNum || accNum.toLowerCase().includes("account")) return null;

      const fmtDate = (val) => {
        if (!val) return "";
        if (val instanceof Date) {
          return Utilities.formatDate(val, ss.getSpreadsheetTimeZone(), "yyyy-MM-dd");
        }
        return val.toString();
      };

      // Extract link from Column A (index 0)
      const richText = richTextValues[index][0];
      const link = richText ? richText.getLinkUrl() : null;

      return {
        id: (index + 1).toString(),
        accountNumber: accNum,
        debtorName: (row[1] || "").toString(),
        clientName: (row[2] || "").toString(),
        status: (row[3] || "").toString(),
        agentName: (row[11] || "").toString(), // Col L
        balanceDue: parseFloat(row[6]) || 0,   // Col G
        accountAge: parseInt(row[7]) || 0,     // Col H
        lastWorkedDate: fmtDate(row[5]),        // Col F
        accountUrl: link
      };
    }).filter(x => x);

    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      data: data,
      lastUpdated: new Date().toISOString()
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({error: err.toString()})).setMimeType(ContentService.MimeType.JSON);
  }
}
