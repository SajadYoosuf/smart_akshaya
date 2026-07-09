import fs from 'fs';
import https from 'https';
import crypto from 'crypto';

// Load credentials
const creds = JSON.parse(fs.readFileSync('public/google_sheets_credentials.json', 'utf8'));
const spreadsheetId = '1tWRoBfnDFZqezA_3C5LPOBZfN_E4XaLB4okZ8DrM20U';

function base64url(strOrBuffer) {
  const base64 = typeof strOrBuffer === 'string'
    ? Buffer.from(strOrBuffer).toString('base64')
    : strOrBuffer.toString('base64');
  return base64.replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

async function getAccessToken() {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const claimSet = {
    iss: creds.client_email,
    scope: "https://www.googleapis.com/auth/spreadsheets",
    aud: "https://oauth2.googleapis.com/token",
    exp: now + 3600,
    iat: now,
  };

  const encodedHeader = base64url(JSON.stringify(header));
  const encodedClaimSet = base64url(JSON.stringify(claimSet));
  const message = `${encodedHeader}.${encodedClaimSet}`;

  const signer = crypto.createSign('RSA-SHA256');
  signer.update(message);
  const signature = signer.sign(creds.private_key);
  const encodedSignature = base64url(signature);
  const jwt = `${message}.${encodedSignature}`;

  return new Promise((resolve, reject) => {
    const postData = `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`;
    const req = https.request('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postData)
      }
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          resolve(JSON.parse(body).access_token);
        } else {
          reject(new Error(`OAuth failed: ${res.statusCode} ${body}`));
        }
      });
    });
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

// 20-column header list for reference
const headers = [
  'Date', 'Time', 'Staff Name', 'Mobile', 'Customer Name', 'Service Name', 'Quantity',
  'Dept Fee', 'Service Charge', 'Row Total', 'Wallet Type', 'Service Status', 'Booking ID',
  'Bill Type', 'Booking Total', 'Amount Paid', 'GPay Amount', 'Cash Amount', 'Balance', 'Remarks'
];

async function run() {
  try {
    const token = await getAccessToken();
    const sheetName = 'Service Entries';
    const range = `'${sheetName}'!A:Z`;
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}`;

    // 1. Fetch all rows
    https.get(url, {
      headers: { 'Authorization': `Bearer ${token}` }
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', async () => {
        if (res.statusCode !== 200) {
          console.error("Fetch failed:", res.statusCode, body);
          return;
        }
        const data = JSON.parse(body);
        const rawRows = data.values || [];
        if (rawRows.length <= 1) {
          console.log("No data rows to clean up.");
          return;
        }

        const dataRows = rawRows.slice(1);
        const cleanedRows = [];
        const seenRows = new Set();

        for (const row of dataRows) {
          // Check for empty/irrelevant rows
          if (!row[0] && !row[1] && !row[2] && !row[3] && !row[4]) {
            console.log("Skipping empty / corrupted row:", JSON.stringify(row));
            continue;
          }

          const bookingIdRaw = (row[12] || '').toString().trim();
          const isNew = bookingIdRaw && /^\d{13}$/.test(bookingIdRaw);

          let date = row[0] || '';
          let time = row[1] || '';
          let staffName = row[2] || '';
          let mobile = '';
          let customerName = '';
          let serviceName = '';
          let qty = 1;
          let deptFee = 0;
          let serviceCharge = 0;
          let rowTotal = 0;
          let walletType = '';
          let serviceStatus = 'completed';
          let bookingId = '';
          let billType = 'completed';
          let bookingTotal = 0;
          let amountPaid = 0;
          let gpay = 0;
          let cash = 0;
          let balance = 0;
          let remarks = '';

          if (isNew) {
            // New format row: align directly
            mobile = row[3] || '';
            customerName = row[4] || '';
            serviceName = row[5] || '';
            qty = parseInt(row[6]) || 1;
            deptFee = parseFloat(row[7]) || 0;
            serviceCharge = parseFloat(row[8]) || 0;
            rowTotal = parseFloat(row[9]) || 0;
            walletType = row[10] || '';
            serviceStatus = (row[11] || 'completed').toString().trim().toLowerCase();
            bookingId = bookingIdRaw;
            billType = (row[13] || 'completed').toString().trim().toLowerCase();
            bookingTotal = parseFloat(row[14]) || 0;
            amountPaid = parseFloat(row[15]) || 0;
            gpay = parseFloat(row[16]) || 0;
            cash = parseFloat(row[17]) || 0;
            balance = parseFloat(row[18]) || 0;
            remarks = row[19] || '';
          } else {
            // Legacy row: detect if mobile exists at index 3
            const hasMobile = /^\d{10}$/.test((row[3] || '').toString().trim());
            const offset = hasMobile ? 1 : 0;

            mobile = hasMobile ? row[3].trim() : '';
            customerName = row[3 + offset] || 'Walk-in Customer';
            serviceName = row[4 + offset] || '—';
            qty = parseInt(row[5 + offset]) || 1;
            rowTotal = parseFloat(row[6 + offset]) || 0;
            deptFee = parseFloat(row[7 + offset]) || 0;
            gpay = parseFloat(row[9 + offset]) || 0;
            cash = parseFloat(row[10 + offset]) || 0;
            balance = parseFloat(row[11 + offset]) || 0;
            const statusRaw = (row[12 + offset] || 'completed').toString().trim().toLowerCase();
            billType = statusRaw === 'pending' ? 'service_pending' : 'completed';
            serviceStatus = statusRaw === 'pending' ? 'not_started' : 'completed';
            serviceCharge = parseFloat(row[13 + offset]) || 0;
            walletType = row[15 + offset] || '';
            remarks = row[16 + offset] || '';
            bookingTotal = rowTotal;
            amountPaid = gpay + cash;
          }

          // Generate a deduplication key
          const dedupKey = `${date}|${time}|${staffName}|${customerName}|${serviceName}|${rowTotal}`;
          if (seenRows.has(dedupKey)) {
            console.log("Removing duplicate row:", dedupKey);
            continue;
          }
          seenRows.add(dedupKey);

          // Build a neat 20-column aligned row
          const alignedRow = [
            date, time, staffName, mobile, customerName, serviceName, qty,
            deptFee, serviceCharge, rowTotal, walletType, serviceStatus, bookingId,
            billType, bookingTotal, amountPaid, gpay, cash, balance, remarks
          ];
          cleanedRows.push(alignedRow);
        }

        console.log(`Writing back ${cleanedRows.length} cleaned rows...`);

        // First clear the sheet, then write cleaned data
        await clearSheetData();
        await writeDataRows(cleanedRows);
        console.log("Database cleanup & alignment successful!");
      });
    }).on('error', console.error);
  } catch (err) {
    console.error(err);
  }
}

// Clear all rows from row 2 onwards
async function clearSheetData() {
  const token = await getAccessToken();
  const range = `'Service Entries'!A2:Z100`;
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}:clear`;
  return new Promise((resolve, reject) => {
    const req = https.request(url, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    }, (res) => {
      res.on('end', resolve);
      res.resume();
    });
    req.on('error', reject);
    req.end();
  });
}

// Write the aligned data rows back
async function writeDataRows(rows) {
  const token = await getAccessToken();
  const range = `'Service Entries'!A2`;
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`;
  const bodyData = JSON.stringify({ values: rows });
  return new Promise((resolve, reject) => {
    const req = https.request(url, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(bodyData)
      }
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          resolve();
        } else {
          reject(new Error(`Failed to write rows: ${res.statusCode} ${body}`));
        }
      });
    });
    req.on('error', reject);
    req.write(bodyData);
    req.end();
  });
}

run();
