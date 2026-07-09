import fs from 'fs';
import https from 'https';
import crypto from 'crypto';

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

async function run() {
  const token = await getAccessToken();
  console.log("✅ Token OK");

  const values = await fetchRange(token, "'Service Entries'!A:T");
  console.log(`\nTotal rows (including header): ${values.length}`);
  
  if (values.length === 0) { console.log("Sheet is empty!"); return; }
  
  const headers = values[0];
  console.log("\n=== HEADERS ===");
  headers.forEach((h, i) => console.log(`  Col ${String.fromCharCode(65+i)} [${i}]: ${h}`));

  console.log("\n=== ALL DATA ROWS with key columns ===");
  console.log("Row | Date       | Staff       | Customer      | Service       | col_L (svc_status) | col_M (booking_id) | col_N (bill_type) | col_S (balance)");
  console.log("-".repeat(140));
  
  for (let i = 1; i < values.length; i++) {
    const row = values[i];
    const date = (row[0] || '').padEnd(12);
    const staff = (row[2] || '').padEnd(12);
    const customer = (row[4] || '').padEnd(14);
    const service = (row[5] || '').padEnd(14);
    const svcStatus = (row[11] || '').padEnd(18);
    const bookingId = (row[12] || '').padEnd(18);
    const billType = (row[13] || '').padEnd(18);
    const balance = (row[18] || '');
    console.log(`${String(i+1).padEnd(4)}| ${date}| ${staff}| ${customer}| ${service}| ${svcStatus}| ${bookingId}| ${billType}| ${balance}`);
  }

  // Summary
  const billTypeCounts = {};
  for (let i = 1; i < values.length; i++) {
    const bt = values[i][13] || '(empty)';
    billTypeCounts[bt] = (billTypeCounts[bt] || 0) + 1;
  }
  console.log("\n=== BILL TYPE SUMMARY ===");
  Object.entries(billTypeCounts).forEach(([k, v]) => console.log(`  "${k}": ${v} rows`));
  
  const svcStatusCounts = {};
  for (let i = 1; i < values.length; i++) {
    const ss = values[i][11] || '(empty)';
    svcStatusCounts[ss] = (svcStatusCounts[ss] || 0) + 1;
  }
  console.log("\n=== SERVICE STATUS SUMMARY ===");
  Object.entries(svcStatusCounts).forEach(([k, v]) => console.log(`  "${k}": ${v} rows`));
}

run().catch(console.error);
