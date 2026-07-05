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

    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(sheetName)}!A:Z`;
    console.log(`[getRows] Request URL: ${url}`);

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
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
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(sheetName)}!A1:append?valueInputOption=USER_ENTERED`;

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
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(sheetName)}!A1:append?valueInputOption=USER_ENTERED`;

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
  const range = `${sheetName}!A${rowIndex}`;
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
  const range = `${sheetName}!A${rowIndex}:${endColumnLetter}${rowIndex}`;
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

