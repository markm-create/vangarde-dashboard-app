function doGet(e) {
  // Use the active spreadsheet if the script is bound to the Google Sheet
  // Or replace with SpreadsheetApp.openById('YOUR_SHEET_ID').getSheetByName('Summary')
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Summary');
  
  if (!sheet) {
    return ContentService.createTextOutput(JSON.stringify({ error: "Sheet 'Summary' not found" }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  const data = sheet.getDataRange().getDisplayValues();
  // Assuming rows 1-3 are headers, data starts from row 4
  const rows = data.slice(3);
  
  const result = rows.map(row => {
    return {
      collectorName: row[1], // Column B (index 1)
      collection: {
        daily: {
          collected: row[3], // Column D (index 3)
          target: row[4], // Column E (index 4)
          variance: row[5] // Column F (index 5)
        },
        weekly: {
          collected: row[6], // Column G
          target: row[7], // Column H
          variance: row[8] // Column I
        },
        monthly: {
          collected: row[9], // Column J
          target: row[10], // Column K
          variance: row[11] // Column L
        },
        payments: {
          count: row[12], // Column M
          average: row[13] // Column N
        }
      },
      performance: {
        overview: {
          assigned: row[14], // Column O
          inactivated: row[15] // Column P
        },
        daily: {
          worked: row[16], // Column Q
          outbound: row[17], // Column R
          inbound: row[18], // Column S
          missed: row[19], // Column T
          duration: row[20] // Column U
        },
        weekly: {
          worked: row[21], // Column V
          outbound: row[22], // Column W
          inbound: row[23], // Column X
          missed: row[24], // Column Y
          duration: row[25] // Column Z
        },
        monthly: {
          worked: row[26], // Column AA
          outbound: row[27], // Column AB
          inbound: row[28], // Column AC
          missed: row[29], // Column AD
          duration: row[30] // Column AE
        }
      },
      postdates: {
        daily: {
          succeeded: row[31], // Column AF
          declined: row[32], // Column AG
          processed: row[33] // Column AH
        },
        weekly: {
          succeeded: row[34], // Column AI
          declined: row[35], // Column AJ
          recovered: row[36], // Column AK
          processed: row[37] // Column AL
        },
        monthly: {
          succeeded: row[38], // Column AM
          declined: row[39], // Column AN
          recovered: row[40], // Column AO
          processed: row[41] // Column AP
        },
        remaining: {
          monthly: row[42], // Column AQ
          nextWeek: row[43] // Column AR
        }
      }
    };
  }).filter(item => item.collectorName); // Filter out empty rows

  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}
