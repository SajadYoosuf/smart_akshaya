import { getAccessToken } from './googleSheetsAuth';
import { getSpreadsheetId } from '../config/sheetsConfig';

/**
 * Reads all rows from a Google Sheet.
 * @param {string} sheetName - Name of the sheet (tab) to read from.
 * @returns {Promise<Array<Array<any>>>}
 */
export async function getRows(sheetName) {
  try {
    console.log(`[getRows] Initiating fetch for sheet: ${sheetName}`);
    const spreadsheetId = getSpreadsheetId();
    console.log(`[getRows] Spreadsheet ID: ${spreadsheetId}`);
    
    const token = await getAccessToken();
    console.log(`[getRows] Token acquired (length: ${token?.length})`);

    const range = `'${sheetName}'!A:Z`;
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}`;
    console.log(`[getRows] Request URL: ${url}`);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: 'no-store',
    });

    console.log(`[getRows] Response Status: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[getRows] Fetch failed! Status: ${response.status}, Error: ${errorText}`);
      throw new Error(`Error fetching sheet rows: ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    console.log(`[getRows] Success! Fetched ${data.values ? data.values.length : 0} rows from ${sheetName}`);
    return data.values || [];
  } catch (error) {
    console.error(`[getRows] Caught exception for sheet ${sheetName}:`, error);
    throw error;
  }
}

/**
 * Appends a row to a Google Sheet.
 * @param {string} sheetName - Name of the sheet (tab) to append to.
 * @param {Array<any>} row - The array of row cell values.
 */
export async function appendRow(sheetName, row) {
  const spreadsheetId = getSpreadsheetId();
  const token = await getAccessToken();
  const range = `'${sheetName}'!A1`;
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}:append?valueInputOption=USER_ENTERED`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      values: [row],
    }),
  });

  if (!response.ok) {
    throw new Error(`Error appending row: ${response.statusText}`);
  }

  return await response.json();
}

/**
 * Appends multiple rows to a Google Sheet.
 * @param {string} sheetName - Name of the sheet (tab) to append to.
 * @param {Array<Array<any>>} rows - The array of row cell values (2D array).
 */
export async function appendRows(sheetName, rows) {
  const spreadsheetId = getSpreadsheetId();
  const token = await getAccessToken();
  const range = `'${sheetName}'!A1`;
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}:append?valueInputOption=USER_ENTERED`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      values: rows,
    }),
  });

  if (!response.ok) {
    throw new Error(`Error appending rows: ${response.statusText}`);
  }

  return await response.json();
}

/**
 * Updates a specific row in a Google Sheet.
 * @param {string} sheetName - Name of the sheet (tab) to update.
 * @param {number} rowIndex - 1-indexed row number (e.g. 2 for first data row).
 * @param {Array<any>} row - The array of new cell values.
 */
export async function updateRow(sheetName, rowIndex, row) {
  const spreadsheetId = getSpreadsheetId();
  const token = await getAccessToken();
  const range = `'${sheetName}'!A${rowIndex}`;
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`;

  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      values: [row],
    }),
  });

  if (!response.ok) {
    throw new Error(`Error updating row: ${response.statusText}`);
  }

  return await response.json();
}

/**
 * Updates specific columns in a row by first reading the current row,
 * merging new values, then writing back.
 * @param {string} sheetName
 * @param {number} rowIndex - 1-indexed
 * @param {Object} columnUpdates - { 'column header name': newValue, ... }
 */
export async function updateRowColumns(sheetName, rowIndex, columnUpdates) {
  // Read header row to find column indexes
  const rows = await getRows(sheetName);
  if (!rows || rows.length < 1) throw new Error('Sheet is empty');
  const headers = rows[0].map((h) => h.trim().toLowerCase());

  // Get current data row (rowIndex is 1-based; rows array is 0-based)
  const currentRow = [...(rows[rowIndex - 1] || [])];

  // Apply updates
  Object.entries(columnUpdates).forEach(([key, val]) => {
    const idx = headers.indexOf(key.toLowerCase());
    if (idx !== -1) currentRow[idx] = String(val);
  });

  return updateRow(sheetName, rowIndex, currentRow);
}

/**
 * Clears the content of a row (sets values to empty strings).
 * @param {string} sheetName
 * @param {number} rowIndex - 1-indexed
 * @param {number} numColumns
 */
export async function clearRow(sheetName, rowIndex, numColumns) {
  const spreadsheetId = getSpreadsheetId();
  const token = await getAccessToken();
  
  const getColumnLetter = (colCount) => {
    let result = '';
    let count = colCount;
    while (count > 0) {
      let modulo = (count - 1) % 26;
      result = String.fromCharCode(65 + modulo) + result;
      count = Math.floor((count - modulo) / 26);
    }
    return result || 'A';
  };

  const endColumnLetter = getColumnLetter(numColumns);
  const range = `'${sheetName}'!A${rowIndex}:${endColumnLetter}${rowIndex}`;
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`;

  const emptyRow = Array(numColumns).fill('');

  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      values: [emptyRow],
    }),
  });

  if (!response.ok) {
    throw new Error(`Error clearing row: ${response.statusText}`);
  }

  return await response.json();
}

/**
 * Deletes a row from a Google Sheet.
 * @param {string} sheetName - Name of the sheet (tab) to delete from.
 * @param {number} rowIndex - The 1-indexed row number to delete.
 */
export async function deleteRow(sheetName, rowIndex) {
  const spreadsheetId = getSpreadsheetId();
  const token = await getAccessToken();

  // First, we need to get the sheet ID (gid) for the sheetName
  const sheetMetaUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`;
  const metaResponse = await fetch(sheetMetaUrl, {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!metaResponse.ok) {
    throw new Error(`Failed to fetch spreadsheet metadata: ${metaResponse.statusText}`);
  }

  const metaData = await metaResponse.json();
  const sheet = metaData.sheets.find(s => s.properties.title === sheetName);
  
  if (!sheet) {
    throw new Error(`Sheet ${sheetName} not found`);
  }

  const sheetId = sheet.properties.sheetId;

  // Use batchUpdate to delete the row
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      requests: [
        {
          deleteDimension: {
            range: {
              sheetId: sheetId,
              dimension: 'ROWS',
              startIndex: rowIndex - 1, // 0-indexed, inclusive
              endIndex: rowIndex        // 0-indexed, exclusive
            }
          }
        }
      ]
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`[deleteRow] failed: ${response.status} - ${errorText}`);
    throw new Error(`Error deleting row: ${response.statusText}. Details: ${errorText}`);
  }

  return await response.json();
}

/**
 * Logs a wallet transaction to the 'Wallet Transactions' sheet.
 * @param {string} walletName 
 * @param {string} type 
 * @param {number} amount 
 * @param {number} closingBalance 
 * @param {string} description 
 */
export async function logWalletTransaction(walletName, type, amount, closingBalance, description = '', staffName = '', billId = '') {
  try {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    const dateStr = `${day}-${month}-${year}`; // Format: DD-MM-YYYY
    const timeStr = now.toLocaleTimeString('en-IN', { hour12: true });

    const row = [
      dateStr,
      timeStr,
      walletName,
      type,
      amount.toFixed(2),
      closingBalance.toFixed(2),
      description,
      staffName,
      billId
    ];

    try {
      await appendRow('Transaction History', row);
    } catch (e) {
      await appendRow('Wallet Transactions', row);
    }
  } catch (err) {
    console.error('Failed to log wallet transaction. Make sure Transaction History or Wallet Transactions sheet exists.', err);
  }
}
