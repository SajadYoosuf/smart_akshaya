import { getRows } from '../src/services/googleSheetsService.js';
import { SHEETS_CONFIG } from '../src/config/sheetsConfig.js';
import { getAccessToken } from '../src/services/googleSheetsAuth.js';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
  try {
    const rows = await getRows(SHEETS_CONFIG.serviceEntrySheetName);
    console.log("Total rows:", rows.length);
    console.log("Last 5 rows:");
    const lastRows = rows.slice(-5);
    lastRows.forEach((row, i) => {
      console.log(`Row ${rows.length - 5 + i + 1}:`, JSON.stringify(row));
    });
  } catch (err) {
    console.error(err);
  }
}

run();
