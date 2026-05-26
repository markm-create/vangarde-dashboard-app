function doGet(e) {
  return handleRequest(e);
}

function doPost(e) {
  return handleRequest(e);
}

function handleRequest(e) {
  try {
    const action = e.parameter.action || (e.postData ? JSON.parse(e.postData.contents).action : null);
    
    if (action === 'getPostdatesData') {
      return getPostdatesData();
    }
    
    // Default fallback if no action provided but we still want to return data
    if (!action) {
      return getPostdatesData();
    }
    
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: 'Invalid action' }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function getPostdatesData() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    
    const postDatedSheet = ss.getSheetByName('Post Dated') || ss.getSheetByName('Postdated');
    const processedSheet = ss.getSheetByName('Processed');
    const recoveredSheet = ss.getSheetByName('Recovered');
    
    if (!postDatedSheet || !processedSheet) {
      return ContentService.createTextOutput(JSON.stringify({ 
        status: 'error', 
        message: 'Could not find "Post Dated" or "Processed" sheet. Available tabs: ' + ss.getSheets().map(s => s.getName()).join(', ')
      })).setMimeType(ContentService.MimeType.JSON);
    }

    let summary = {};
    if (recoveredSheet) {
      summary = {
        totalSucceeded: parseFloat(recoveredSheet.getRange('H1').getValue()) || 0,
        totalDeclined: parseFloat(recoveredSheet.getRange('C1').getValue()) || 0,
        totalRecovered: parseFloat(recoveredSheet.getRange('M1').getValue()) || 0,
        totalSucceededAndRecovered: parseFloat(recoveredSheet.getRange('P12').getValue()) || 0,
        totalProcessed: parseFloat(recoveredSheet.getRange('P14').getValue()) || 0,
        todaySucceeded: parseFloat(recoveredSheet.getRange('P3').getValue()) || 0,
        todayDeclined: parseFloat(recoveredSheet.getRange('Q3').getValue()) || 0,
        totalRemaining: parseFloat(recoveredSheet.getRange('R7').getValue()) || 0,
        weeklyStart: parseFloat(recoveredSheet.getRange('P7').getValue()) || 0,
        monthlyStart: parseFloat(recoveredSheet.getRange('Q7').getValue()) || 0
      };
    }
    
    const scheduledData = [];
    const postRange = postDatedSheet.getDataRange();
    const postData = postRange.getValues();
    const postRichText = postRange.getRichTextValues();
    
    if (postData.length > 1) {
      const rows = postData.slice(1);
      const richRows = postRichText.slice(1);
      rows.forEach((row, i) => {
        const linkUrl = richRows[i][0] ? richRows[i][0].getLinkUrl() : null;
        scheduledData.push({
          accountId: String(row[0] || ''),          // Col A
          accountLink: linkUrl || null,             // Link from Col A
          dateTime: row[1] instanceof Date ? row[1].toISOString() : String(row[1] || ''), // Col B
          owner: String(row[11] || ''),            // Col L (Changed from Col D/row[3])
          clientShortName: String(row[4] || ''),   // Col E
          merchantName: String(row[5] || ''),      // Col F
          accountStatus: String(row[6] || ''),     // Col G
          amount: parseFloat(row[7]) || 0,         // Col H
          status: 'Scheduled'
        });
      });
    }

    const processedData = [];
    const procRange = processedSheet.getDataRange();
    const procData = procRange.getValues();
    const procRichText = procRange.getRichTextValues();
    
    if (procData.length > 1) {
      const rows = procData.slice(1);
      const richRows = procRichText.slice(1);
      rows.forEach((row, i) => {
        let linkUrl = richRows[i][8] ? richRows[i][8].getLinkUrl() : null;
        if (!linkUrl && row[8] && String(row[8]).startsWith('http')) {
          linkUrl = String(row[8]);
        }
        processedData.push({
          accountId: String(row[1] || ''),          // Col B
          accountLink: linkUrl || null,             // Link from Col I
          dateTime: row[0] instanceof Date ? row[0].toISOString() : String(row[0] || ''), // Col A
          owner: String(row[2] || ''),             // Col C
          clientShortName: String(row[3] || ''),   // Col D
          merchantName: String(row[4] || ''),      // Col E
          amount: parseFloat(row[6]) || 0,         // Col G
          status: String(row[7] || '')             // Col H
        });
      });
    }
    
    return ContentService.createTextOutput(JSON.stringify({ 
      status: 'success', 
      data: { 
        scheduled: scheduledData, 
        processed: processedData,
        summary: summary
      } 
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
