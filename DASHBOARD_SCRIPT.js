/**
 * VERSION 25.2 - ROBUST HEROES & HIGHLIGHTS MAPPING + TOP 3 COLLECTORS
 * Mapping:
 * - Metrics: "Processed" sheet (Cols D, G, H)
 * - Collections: "Client" sheet (Cols C, E, F, I, M)
 * - Calls: "Calls" sheet (Cols A, C)
 * - Top 3: "Top 3" sheet (Cols B, L, M, N, O)
 */

function doGet(e) { return processRequest(e); }
function doPost(e) { return processRequest(e); }

function processRequest(e) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      homeData: getHomeDashboardData(ss),
      lastUpdated: new Date().toISOString(),
      v: "25.2"
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({error: err.toString()})).setMimeType(ContentService.MimeType.JSON);
  }
}

function getHomeDashboardData(ss) {
  const tz = ss.getSpreadsheetTimeZone();
  const now = new Date();
  
  const getFmtDate = (val) => {
    if (!val) return "";
    if (val instanceof Date) return Utilities.formatDate(val, tz, "yyyy-MM-dd");
    const d = new Date(val);
    return isNaN(d.getTime()) ? "" : Utilities.formatDate(d, tz, "yyyy-MM-dd");
  };

  const todayStr = getFmtDate(now);

  const getSheet = (name, idx) => ss.getSheetByName(name) || ss.getSheets()[idx];
  const agentSheet = getSheet("Agent", 0);
  const clientSheet = getSheet("Client", 1);
  const processedSheet = getSheet("Processed", 3);
  const callsSheet = getSheet("Calls", 4);
  const top3Sheet = getSheet("Top 3", 5);

  // 1. Collections & Heroes (From "Client")
  const checkCollections = [];
  const heroesMap = {};
  if (clientSheet) {
    const lastRow = clientSheet.getLastRow();
    if (lastRow >= 3) {
      const vals = clientSheet.getRange(3, 1, lastRow - 2, 13).getValues();
      
      // Find the most recent date in Client sheet that is BEFORE today
      let lastRecordedDate = "";
      vals.forEach(row => {
        const d = getFmtDate(row[5]);
        if (d && d < todayStr && d > lastRecordedDate) {
          lastRecordedDate = d;
        }
      });

      vals.forEach(row => {
        if (row[2] && row[4]) {
          const dateVal = row[5];
          const itemDateStr = getFmtDate(dateVal);
          const amount = parseFloat(row[8]) || 0;
          const collector = (row[12] || "").toString().trim();

          checkCollections.push({
            date: itemDateStr || Utilities.formatDate(new Date(), tz, "yyyy-MM-dd"),
            accountNumber: row[2].toString(),
            collector: collector || "Unknown",
            clientName: row[4].toString(),
            amount: amount
          });

          if (itemDateStr === lastRecordedDate && collector && collector !== "Unknown") {
            heroesMap[collector] = (heroesMap[collector] || 0) + amount;
          }
        }
      });
    }
  }

  // 2. Daily Metrics (From "Processed")
  let dailyMetrics = { successRate: 0, declinedRate: 0, processedPostdates: 0, processedCount: 0, newImports: 0, flaggedAccounts: 0, avgCallTime: "0m 0s", conversion: 0, overdueAmount: 0, overdueCount: 0 };
  
  if (processedSheet) {
    // UPDATED: Use specific cells for key metrics as requested by user
    try {
      const successRateVal = processedSheet.getRange("M4").getValue();
      const declineRateVal = processedSheet.getRange("N4").getValue();
      const processedPostdatesVal = processedSheet.getRange("O3").getValue();
      const processedCountVal = processedSheet.getRange("O4").getValue();

      // Track if we found data in the specific cells to avoid fallback later
      dailyMetrics.customSuccessUsed = (successRateVal !== "" && successRateVal !== null);
      dailyMetrics.customDeclineUsed = (declineRateVal !== "" && declineRateVal !== null);
      dailyMetrics.customProcessedUsed = (processedPostdatesVal !== "" && processedPostdatesVal !== null);
      dailyMetrics.customCountUsed = (processedCountVal !== "" && processedCountVal !== null);

      if (dailyMetrics.customSuccessUsed) {
        dailyMetrics.successRate = (parseFloat(successRateVal) || 0) * (successRateVal <= 1 && successRateVal > 0 ? 100 : 1);
      }
      if (dailyMetrics.customDeclineUsed) {
        dailyMetrics.declinedRate = (parseFloat(declineRateVal) || 0) * (declineRateVal <= 1 && declineRateVal > 0 ? 100 : 1);
      }
      if (dailyMetrics.customProcessedUsed) {
        dailyMetrics.processedPostdates = parseFloat(processedPostdatesVal) || 0;
      }
      if (dailyMetrics.customCountUsed) {
        dailyMetrics.processedCount = parseInt(processedCountVal) || 0;
      }
      
      dailyMetrics.conversion = dailyMetrics.successRate;
    } catch (e) {
      console.error("Error fetching specific metric cells:", e);
    }

    const vals = processedSheet.getRange("A3:K3000").getValues();
    
    let targetDate = todayStr;
    let hasToday = vals.some(r => getFmtDate(r[3]) === todayStr);
    if (!hasToday) {
      let latest = "";
      vals.forEach(r => { const d = getFmtDate(r[3]); if (d > latest) latest = d; });
      if (latest) targetDate = latest;
    }

    let succeeded = 0, declined = 0, total = 0, succeededAmount = 0;
    vals.forEach(row => {
      const itemDateStr = getFmtDate(row[3]);
      const amount = parseFloat(row[6]) || 0;
      const status = (row[7] || "").toString().toLowerCase();

      if (itemDateStr === targetDate) {
        total++;
        if (status.includes("fail") || status.includes("declined")) declined++;
        else if (status.includes("succ") || status.includes("paid") || status.includes("success")) {
          succeeded++;
          succeededAmount += amount;
        }
      }
      
      // Calculate Overdue (Past date + Failed/Declined)
      if (itemDateStr && itemDateStr < todayStr && (status.includes("fail") || status.includes("declined"))) {
        dailyMetrics.overdueCount++;
        dailyMetrics.overdueAmount += amount;
      }

      if (status.includes("new")) dailyMetrics.newImports++;
    });

    // Only update processedCount and conversion if not already set or as fallback
    if (total > 0) {
      if (!dailyMetrics.customCountUsed) dailyMetrics.processedCount = succeeded;
      // Fallback ONLY if the specific cells were empty
      if (!dailyMetrics.customSuccessUsed) dailyMetrics.successRate = (succeeded / total) * 100;
      if (!dailyMetrics.customDeclineUsed) dailyMetrics.declinedRate = (declined / total) * 100;
      if (!dailyMetrics.customProcessedUsed) dailyMetrics.processedPostdates = succeededAmount;
      dailyMetrics.conversion = dailyMetrics.successRate;
    }
  }

  // 3. Call Performance & Flags
  if (callsSheet) {
    const vals = callsSheet.getRange("A3:C500").getValues();
    let totalSeconds = 0, count = 0;
    vals.forEach(row => {
      if (row[2]) {
        const dur = row[2].toString();
        if (dur.includes(":")) {
          const parts = dur.split(":");
          totalSeconds += (parseInt(parts[0]) * 60) + parseInt(parts[1]);
          count++;
        }
      }
    });
    if (count > 0) {
      const avg = Math.round(totalSeconds / count);
      dailyMetrics.avgCallTime = `${Math.floor(avg / 60)}m ${avg % 60}s`;
    }
  }

  if (agentSheet) {
    const vals = agentSheet.getRange("A3:J100").getValues();
    vals.forEach(row => {
      if (row.some(cell => cell.toString().toLowerCase().includes("flagged"))) dailyMetrics.flaggedAccounts++;
    });
  }

  // 4. Finalize Heroes & Highlights
  const yesterdayHeroes = Object.keys(heroesMap)
    .map(name => ({ name, amount: heroesMap[name], avatar: name.charAt(0) }))
    .filter(h => h.amount >= 500)
    .sort((a, b) => b.amount - a.amount);

  const totalYesterday = Object.values(heroesMap).reduce((a, b) => a + b, 0);
  const collectionHighlights = Object.keys(heroesMap)
    .map((name, i) => ({
      label: name,
      amount: heroesMap[name],
      value: totalYesterday > 0 ? Math.round((heroesMap[name] / totalYesterday) * 100) : 0,
      color: ["#4f46e5", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"][i % 6]
    }))
    .filter(h => h.amount > 0)
    .sort((a, b) => b.amount - a.amount);

  // 5. Top 3 Collectors (From "Top 3")
  let topCollectors = [];
  if (top3Sheet) {
    const lastRow = top3Sheet.getLastRow();
    if (lastRow >= 3) {
      const vals = top3Sheet.getRange(3, 1, lastRow - 2, 15).getValues();
      topCollectors = vals.map((row) => {
        const name = (row[1] || "").toString().trim(); // Col B
        if (!name || name.toLowerCase().includes("name")) return null;
        
        return {
          name: name,
          accounts: parseFloat(row[11]) || 0, // Col L (Work)
          worked: parseFloat(row[12]) || 0,   // Col M (RPC)
          rpc: parseFloat(row[13]) || 0,      // Col N (Calls)
          collected: parseFloat(row[14]) || 0, // Col O (Collected)
          initial: name.charAt(0),
          color: "bg-indigo-600"
        };
      })
      .filter(x => x)
      .sort((a, b) => b.collected - a.collected) // Sort by amount (High to Low)
      .slice(0, 3) // Take top 3
      .map((collector, index) => ({ ...collector, rank: index + 1 })); // Assign ranks
    }
  }

  return {
    checkCollections: checkCollections.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 1000),
    dailyMetrics,
    yesterdayHeroes,
    collectionHighlights,
    topCollectors
  };
}
