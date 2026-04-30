function doGet(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    if (!ss) {
      return ContentService.createTextOutput(JSON.stringify({ error: "Could not find active spreadsheet." })).setMimeType(ContentService.MimeType.JSON);
    }

    var sheet = ss.getSheetByName("NOP & LOR");
    if (!sheet) {
      return ContentService.createTextOutput(JSON.stringify({ error: "Could not find a tab named 'NOP & LOR'." })).setMimeType(ContentService.MimeType.JSON);
    }

    var data = sheet.getDataRange().getValues();
    if (data.length <= 1) {
      return ContentService.createTextOutput(JSON.stringify({ data: [] })).setMimeType(ContentService.MimeType.JSON);
    }

    var rows = data.slice(1); // skip header
    var formattedData = [];

    for (var i = 0; i < rows.length; i++) {
      var row = rows[i];
      // Column logic based on user's guide (0-indexed):
      // A (0) Date Sent
      // B (1) Account #
      // C (2) Business Name
      // D (3) Creditor
      // E (4) Account Status
      // G (6) Email
      // I (8) Campaign Status
      // J (9) Response

      var dateSentRaw = row[0];
      var dateSent = dateSentRaw;
      if (dateSentRaw instanceof Date) {
        dateSent = Utilities.formatDate(dateSentRaw, Session.getScriptTimeZone(), "yyyy-MM-dd");
      } else if (dateSentRaw) {
        dateSent = String(dateSentRaw);
      }

      var record = {
        id: (i + 1).toString(),
        dateSent: dateSent || "",
        accountNumber: row[1] || "",
        businessName: row[2] || "",
        creditor: row[3] || "",
        accountStatus: row[4] || "",
        email: row[6] || "",
        campaignStatus: row[8] || "",
        response: row[9] || ""
      };

      // Ensure we only add rows that have at least some basic data
      if (record.accountNumber || record.dateSent || record.businessName) {
        formattedData.push(record);
      }
    }

    return ContentService.createTextOutput(JSON.stringify({ data: formattedData })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ error: error.toString() })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  // Same handling for POST if frontend uses POST
  return doGet(e);
}
