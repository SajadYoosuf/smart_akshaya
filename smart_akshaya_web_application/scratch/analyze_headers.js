import { getRows } from '../src/services/googleSheetsService.js';
import { SHEETS_CONFIG } from '../src/config/sheetsConfig.js';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
  try {
    const rows = await getRows(SHEETS_CONFIG.serviceEntrySheetName);
    console.log("Total rows found:", rows.length);
    if (rows.length > 0) {
      console.log("Header row (Row 1):", JSON.stringify(rows[0]));
      console.log("\nRow 2 (First Data Row):", JSON.stringify(rows[1]));
      console.log("\nRow 3 (Second Data Row):", JSON.stringify(rows[2]));
      console.log("\nLast Data Row:", JSON.stringify(rows[rows.length - 1]));
    }
  } catch (err) {
    console.error(err);
  }
}

run();
