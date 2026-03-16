/**
 * Google Apps Script for Individual Collector Dashboard
 * 
 * Instructions:
 * 1. Open your Google Sheet "Individual Collector Dashboard_Logs"
 * 2. Go to Extensions > Apps Script
 * 3. Paste this code and save
 * 4. Click "Deploy" > "New Deployment"
 * 5. Select "Web App"
 * 6. Set "Execute as" to "Me"
 * 7. Set "Who has access" to "Anyone"
 * 8. Copy the Web App URL and provide it to the assistant
 */

function doGet() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName("Summary");
    
    if (!sheet) {
      return ContentService.createTextOutput(JSON.stringify({ error: "Sheet 'Summary' not found" }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // Assuming data starts from Row 3
    const lastRow = sheet.getLastRow();
    if (lastRow < 3) {
      return ContentService.createTextOutput(JSON.stringify([]))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // Row 2 is the header with dates
    const dateHeaders = sheet.getRange(2, 1, 1, 71).getValues()[0];
    
    // Row 3 onwards is data
    const data = sheet.getRange(3, 1, lastRow - 2, 71).getValues();
    
    const results = data.slice(0).map(row => {
      // Heuristic to find the name: Check Column B, then Column A
      let name = row[1];
      if (!name || name instanceof Date || typeof name === 'number') {
        name = row[0];
      }
      
      if (!name || typeof name !== 'string' || name.trim() === '') return null;

      const monthlyCycle = [];
      // AU (index 46) to BS (index 70)
      for (let j = 46; j <= 70; j++) {
        let dateVal = dateHeaders[j];
        
        // Try to parse date if it's a string
        if (typeof dateVal === 'string' && dateVal.trim() !== '') {
          const parsed = new Date(dateVal);
          if (!isNaN(parsed.getTime())) {
            dateVal = parsed;
          }
        }

        if (dateVal instanceof Date && !isNaN(dateVal.getTime())) {
          monthlyCycle.push({
            day: dateVal.getDate(),
            month: dateVal.getMonth() + 1,
            val: row[j] || 0
          });
        } else if (dateVal) {
          // Fallback for non-date headers that still have content
          monthlyCycle.push({
            day: dateVal.toString(),
            val: row[j] || 0
          });
        }
      }

      // Sort monthly cycle by date if possible
      monthlyCycle.sort((a, b) => {
        if (typeof a.day === 'number' && typeof b.day === 'number') {
          return a.day - b.day;
        }
        return 0;
      });

      return {
        name: name.toString().trim(),
        kpis: {
          prior: { collected: row[3] || 0, target: row[4] || 0 }, // D, E
          wtd: { collected: row[5] || 0, target: row[6] || 0 },   // F, G
          mtd: { collected: row[7] || 0, target: row[8] || 0 }    // H, I
        },
        accounts: {
          assigned: row[26] || 0,   // AA
          inactivated: row[27] || 0 // AB
        },
        postdates: {
          succeeded: row[28] || 0, // AC
          declined: row[29] || 0,  // AD
          recovered: row[30] || 0, // AE
          remaining: row[31] || 0, // AF
          succeededTrans: row[32] || 0, // AG
          declinedTrans: row[33] || 0,  // AH
          recoveredTrans: row[34] || 0, // AI
          remainingTrans: row[35] || 0  // AJ
        },
        weeklyCycle: {
          current: { wed: row[36] || 0, thu: row[37] || 0, fri: row[38] || 0, mon: row[39] || 0, tue: row[40] || 0 },
          prior: { wed: row[41] || 0, thu: row[42] || 0, fri: row[43] || 0, mon: row[44] || 0, tue: row[45] || 0 }
        },
        monthlyCycle: monthlyCycle,
        performance: {
          daily: { worked: row[11] || 0, rpc: row[12] || 0, completed: row[13] || 0, inbound: row[14] || 0, outbound: row[15] || 0 },
          weekly: { worked: row[16] || 0, rpc: row[17] || 0, completed: row[18] || 0, inbound: row[19] || 0, outbound: row[20] || 0 },
          monthly: { worked: row[21] || 0, rpc: row[22] || 0, completed: row[23] || 0, inbound: row[24] || 0, outbound: row[25] || 0 }
        }
      };
    }).filter(item => item !== null && item.name); // Filter out nulls and empty names

    return ContentService.createTextOutput(JSON.stringify(results))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (e) {
    return ContentService.createTextOutput(JSON.stringify({ error: e.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
