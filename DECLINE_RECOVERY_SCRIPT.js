/**
 * VERSION 1.0 - DECLINE RECOVERY AUDIT SCRIPT
 * 
 * Instructions:
 * 1. Open your Google Sheet.
 * 2. Go to Extensions > Apps Script.
 * 3. Replace the existing code with this code.
 * 4. Click Deploy > Manage Deployments > Edit (pencil icon) > New version > Deploy.
 * 5. The Web App URL remains the same.
 */

function doGet(e) { return processRequest(e); }
function doPost(e) { return processRequest(e); }

function processRequest(e) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    
    // Try to find the correct sheet
    let sheet = ss.getSheetByName("Decline Recovery") || ss.getSheetByName("Database") || ss.getSheets()[0];
    
    const lastRow = sheet.getLastRow();
    let records = [];
    
    // Read entire rows except row 1 (headers)
    if (lastRow > 1) {
      const lastColumn = sheet.getLastColumn();
      // Start at row 2, column 1, read (lastRow - 1) rows, and all columns
      const dataRange = sheet.getRange(2, 1, lastRow - 1, lastColumn);
      const values = dataRange.getValues();
      
      records = values.map(row => {
        let tDate = "";
        if (row[0]) {
          tDate = row[0] instanceof Date ? Utilities.formatDate(row[0], ss.getSpreadsheetTimeZone(), "MMM dd, yyyy h:mm a") : row[0].toString();
        }
        let rDate = "";
        if (row[5]) {
          rDate = row[5] instanceof Date ? Utilities.formatDate(row[5], ss.getSpreadsheetTimeZone(), "MMM dd, yyyy") : row[5].toString();
        }

        return {
          transactionDate: tDate,
          accountNumber: row[1] ? row[1].toString() : "",
          collectorName: row[2] ? row[2].toString() : "",
          amount: parseFloat(row[3]) || 0,
          status: row[4] ? row[4].toString().trim() : "",
          recoveryDate: rDate,
          auditComments: row[6] ? row[6].toString() : ""
        };
      }).filter(r => r.accountNumber || r.collectorName || r.amount > 0);
    }

    // Calculate summary dynamically based on the records
    const summary = {
      declinedPostdates: { amount: 0, count: 0 },
      recovered: { amount: 0, count: 0 },
      unrecoverable: { amount: 0, count: 0 },
      remaining: { amount: 0, count: 0 },
      rescheduled: { amount: 0, count: 0 },
      ongoing: { amount: 0, count: 0 },
      needFollowUp: { amount: 0, count: 0 },
      brokenPromise: { amount: 0, count: 0 }
    };

    records.forEach(r => {
      summary.declinedPostdates.count++;
      summary.declinedPostdates.amount += r.amount;

      const status = (r.status || "").toLowerCase();
      
      if (status === "recovered") {
        summary.recovered.count++;
        summary.recovered.amount += r.amount;
      } else if (status === "unrecoverable" || status === "cancelled ppa") {
        summary.unrecoverable.count++;
        summary.unrecoverable.amount += r.amount;
      } else {
        summary.remaining.count++;
        summary.remaining.amount += r.amount;
        
        if (status === "rescheduled") {
          summary.rescheduled.count++;
          summary.rescheduled.amount += r.amount;
        } else if (status === "ongoing recovery" || status === "ongoing") {
          summary.ongoing.count++;
          summary.ongoing.amount += r.amount;
        } else if (status === "need follow-up" || status === "no follow-up") {
          summary.needFollowUp.count++;
          summary.needFollowUp.amount += r.amount;
        } else if (status === "broken promise") {
          summary.brokenPromise.count++;
          summary.brokenPromise.amount += r.amount;
        }
      }
    });

    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      data: {
        summary: summary,
        records: records
      }
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}
