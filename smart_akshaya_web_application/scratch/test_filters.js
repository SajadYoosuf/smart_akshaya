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

// Emulate SavedBillsScreen parsing & filtering
const SVC_STATUS = { NOT_STARTED: 'not_started', IN_PROGRESS: 'in_progress', COMPLETED: 'completed' };
const BILL_TYPES = { COMPLETED: 'completed', SERVICE_PENDING: 'service_pending', CREDIT_PENDING: 'credit_pending', PARTIAL_PAYMENT: 'partial_payment' };

const parseRow = (row, idx) => {
  const bookingIdRaw = (row[12] || '').toString().trim(); // col M
  const isNew = bookingIdRaw && /^\d+$/.test(bookingIdRaw);
  const bookingId = isNew ? bookingIdRaw : '';

  if (isNew) {
    return {
      rowIndex: idx + 2,
      date: row[0] || '',
      time: row[1] || '',
      staffName: row[2] || '',
      mobile: row[3] || '',
      customerName: row[4] || 'Walk-in',
      serviceName: row[5] || '',
      quantity: parseInt(row[6]) || 1,
      deptFee: parseFloat(row[7]) || 0,
      serviceCharge: parseFloat(row[8]) || 0,
      rowTotal: parseFloat(row[9]) || 0,
      walletType: row[10] || '',
      serviceStatus: (row[11] || SVC_STATUS.NOT_STARTED).toString().trim().toLowerCase(),
      bookingId,
      billType: (row[13] || BILL_TYPES.COMPLETED).toString().trim().toLowerCase(),
      bookingTotal: parseFloat(row[14]) || 0,
      amountPaid: parseFloat(row[15]) || 0,
      gpayAmount: parseFloat(row[16]) || 0,
      cashAmount: parseFloat(row[17]) || 0,
      balance: parseFloat(row[18]) || 0,
    };
  }

  const hasStoredMobile = /^\d{10}$/.test((row[3] || '').toString().trim());
  const offset = hasStoredMobile ? 1 : 0;
  const total = parseFloat(row[6 + offset]) || 0;
  const statusRaw = (row[12 + offset] || 'pending').toString().trim().toLowerCase();

  return {
    rowIndex: idx + 2,
    date: row[0] || '',
    time: row[1] || '',
    staffName: row[2] || '',
    mobile: hasStoredMobile ? row[3] : '',
    customerName: row[3 + offset] || 'Walk-in',
    serviceName: row[4 + offset] || '',
    services: row[4 + offset] || '',
    quantity: parseInt(row[5 + offset]) || 1,
    deptFee: 0,
    serviceCharge: total,
    rowTotal: total,
    walletType: row[15 + offset] || '',
    serviceStatus: statusRaw === 'pending' ? SVC_STATUS.NOT_STARTED : SVC_STATUS.COMPLETED,
    bookingId: '',
    billType: statusRaw === 'pending' ? BILL_TYPES.SERVICE_PENDING : BILL_TYPES.COMPLETED,
    bookingTotal: total,
    amountPaid: (parseFloat(row[9 + offset]) || 0) + (parseFloat(row[10 + offset]) || 0),
    gpayAmount: parseFloat(row[9 + offset]) || 0,
    cashAmount: parseFloat(row[10 + offset]) || 0,
    balance: parseFloat(row[11 + offset]) || 0,
  };
};

function groupByBooking(rows) {
  const bookings = new Map();
  for (const row of rows) {
    const key = row.bookingId && row.bookingId.trim()
      ? row.bookingId.trim()
      : `legacy_${row.rowIndex}`;
    const isLegacy = !row.bookingId || !row.bookingId.trim();

    if (!bookings.has(key)) {
      bookings.set(key, {
        bookingId: key,
        isLegacy,
        date: row.date,
        time: row.time,
        staffName: row.staffName,
        mobile: row.mobile,
        customerName: row.customerName,
        billType: row.billType,
        bookingTotal: row.bookingTotal,
        amountPaid: row.amountPaid,
        gpayAmount: row.gpayAmount,
        cashAmount: row.cashAmount,
        balance: row.balance,
        services: [],
      });
    }
    const b = bookings.get(key);
    b.services.push({
      rowIndex: row.rowIndex,
      serviceName: row.serviceName || row.services,
      serviceStatus: row.serviceStatus,
    });
  }
  return [...bookings.values()];
}

async function run() {
  try {
    const token = await getAccessToken();
    const range = `'Service Entries'!A:Z`;
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}`;

    https.get(url, {
      headers: { 'Authorization': `Bearer ${token}` }
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        const data = JSON.parse(body);
        const rawRows = data.values || [];
        const parsed = rawRows.slice(1).map((row, idx) => parseRow(row, idx));
        const grouped = groupByBooking(parsed);

        console.log("Total grouped bookings parsed:", grouped.length);

        console.log("\n=== GROUPED BOOKINGS DETAILS ===");
        grouped.forEach(b => {
          console.log(`Booking ID: ${b.bookingId} | Customer: ${b.customerName} | Staff: ${b.staffName} | billType: ${b.billType} | isLegacy: ${b.isLegacy}`);
        });

        // Filter for Saved Bills
        const pending = grouped.filter(b => {
          return b.billType === BILL_TYPES.SERVICE_PENDING || 
                 b.billType === 'service_pending' || 
                 b.billType === 'pending';
        });
        console.log("\nFiltered pending count (Saved Bills):", pending.length);
        pending.forEach(b => {
          console.log(`-> MATCH Saved Bills: Booking ID: ${b.bookingId} | Customer: ${b.customerName}`);
        });

        // Filter for Credit Details
        const credit = grouped.filter(b => {
          return b.billType === BILL_TYPES.CREDIT_PENDING ||
                 b.billType === BILL_TYPES.PARTIAL_PAYMENT ||
                 b.billType === 'credit_pending' ||
                 b.billType === 'partial_payment' ||
                 (b.isLegacy && b.balance < -0.01);
        });
        console.log("\nFiltered credit count (Credit Details):", credit.length);
        credit.forEach(b => {
          console.log(`-> MATCH Credit Details: Booking ID: ${b.bookingId} | Customer: ${b.customerName}`);
        });
      });
    });
  } catch (err) {
    console.error(err);
  }
}

run();
