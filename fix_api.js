import fs from 'fs';

let content = fs.readFileSync('services/sheetService.ts', 'utf-8');

// Replace GET without credentials
content = content.replace(/method:\s*'GET',?\n\s+cache:\s*'no-store'/g, "method: 'GET',\n        credentials: 'omit',\n        cache: 'no-store'");

// Replace GET in getCollectorPerformanceData
content = content.replace(/method:\s*'GET',\n\s+\/\/ Removing/g, "method: 'GET',\n        credentials: 'omit',\n        // Removing");

// Ensure all POSTs use text/plain
content = content.replace(/headers:\s*\{\s*'Content-Type':\s*'application\/x-www-form-urlencoded'\s*\}/g, "headers: { 'Content-Type': 'text/plain;charset=utf-8' }");
content = content.replace(/headers:\s*\{\s*'Content-Type':\s*'application\/json'\s*\}/g, "headers: { 'Content-Type': 'text/plain;charset=utf-8' }");

// Also add credentials: 'omit' to getOverduePaymentsData POST and getBillingAuditData
content = content.replace(/method:\s*'POST',/g, "method: 'POST',\n        credentials: 'omit',");

// This might double-add credentials: 'omit' if they already exist... so we clean up duplicates
content = content.replace(/credentials:\s*'omit',\s*credentials:\s*'omit',/g, "credentials: 'omit',");
content = content.replace(/(credentials:\s*'omit',\s*)+/g, "credentials: 'omit',\n        ");

fs.writeFileSync('services/sheetService.ts', content);
console.log('sheetService.ts updated successfully');
