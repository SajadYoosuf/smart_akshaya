import fs from 'fs';
import https from 'https';
import crypto from 'crypto';
import { groupByBooking } from '../src/utils/billGrouper.js';

// --- Direct Fetch Logic ---
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
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Content-Length': Buffer.byteLength(postData) }
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) resolve(JSON.parse(body).access_token);
        else reject(new Error(`OAuth failed: ${res.statusCode} ${body}`));
      });
    });
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function fetchRange(token, range) {
  return new Promise((resolve, reject) => {
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}`;
    https.get(url, { headers: { 'Authorization': `Bearer ${token}` } }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        if (res.statusCode !== 200) { reject(new Error(`Fetch failed: ${res.statusCode} ${body}`)); return; }
        resolve(JSON.parse(body).values || []);
      });
    }).on('error', reject);
  });
}

// --- App Logic ---
const parseRow = (row, idx) => {
  const bookingIdRaw = (row[12] || '').toString().trim(); // col M
  const isNew = bookingIdRaw && /^\d{13}$/.test(bookingIdRaw);
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
      serviceStatus: (row[11] || 'not_started').toString().trim().toLowerCase(),
      bookingId,
      billType: (row[13] || 'completed').toString().trim().toLowerCase(),
      bookingTotal: parseFloat(row[14]) || 0,
      amountPaid: parseFloat(row[15]) || 0,
      gpayAmount: parseFloat(row[16]) || 0,
      cashAmount: parseFloat(row[17]) || 0,
      balance: parseFloat(row[18]) || 0,
    };
  }

  // Legacy row
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
    serviceName: row[4 + offset] || '',  // comma-separated for legacy
    services: row[4 + offset] || '',
    quantity: parseInt(row[5 + offset]) || 1,
    deptFee: 0,
    serviceCharge: total,
    rowTotal: total,
    walletType: row[15 + offset] || '',
    serviceStatus: statusRaw === 'pending' ? 'not_started' : 'completed',
    bookingId: '',
    billType: statusRaw === 'pending' ? 'service_pending' : 'completed',
    bookingTotal: total,
    amountPaid: (parseFloat(row[9 + offset]) || 0) + (parseFloat(row[10 + offset]) || 0),
    gpayAmount: parseFloat(row[9 + offset]) || 0,
    cashAmount: parseFloat(row[10 + offset]) || 0,
    balance: parseFloat(row[11 + offset]) || 0,
  };
};

async function run() {
  const token = await getAccessToken();
  const rows = await fetchRange(token, "'Service Entries'!A:T");
  
  const parsed = rows.slice(1).map((row, idx) => parseRow(row, idx));
  const grouped = groupByBooking(parsed);

  const pending = grouped.filter(b => {
    return b.billType === 'service_pending' || 
           b.billType === 'pending';
  });
  
  const creditBookings = grouped.filter(b => {
    return b.billType === 'credit_pending' ||
           b.billType === 'partial_payment' ||
           (b.isLegacy && b.balance < -0.01);
  });
  
  const currentStaff = 'sajad staff';
  const visiblePending = pending.filter(b => (b.staffName || '').trim().toLowerCase() === currentStaff.trim().toLowerCase());
  
  console.log(`\n=== PENDING BILLS FOR ${currentStaff} ===`);
  console.log(`Count: ${visiblePending.length}`);
  visiblePending.forEach(b => console.log(`Booking ID: ${b.bookingId}, Customer: ${b.customerName}`));

  const visibleCredit = creditBookings.filter(b => (b.staffName || '').trim().toLowerCase() === currentStaff.trim().toLowerCase());
  console.log(`\n=== CREDIT BILLS FOR ${currentStaff} ===`);
  console.log(`Count: ${visibleCredit.length}`);
  visibleCredit.forEach(b => console.log(`Booking ID: ${b.bookingId}, Customer: ${b.customerName}`));
}

run().catch(console.error);
