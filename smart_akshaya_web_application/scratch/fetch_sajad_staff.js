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

async function run() {
  try {
    const token = await getAccessToken();
    const sheetName = 'Service Entries';
    const range = `'${sheetName}'!A:Z`;
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}`;

    https.get(url, {
      headers: { 'Authorization': `Bearer ${token}` }
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        const data = JSON.parse(body);
        const values = data.values || [];
        console.log(`\n=== ROWS LOGGED BY 'sajad staff' ===`);
        
        let matchCount = 0;
        values.forEach((row, idx) => {
          if (idx === 0) {
            console.log("Headers:", JSON.stringify(row));
            return;
          }
          const rowStaff = (row[2] || '').toString().trim().toLowerCase();
          if (rowStaff === 'sajad staff') {
            matchCount++;
            console.log(`Row ${idx + 1}:`, JSON.stringify(row));
          }
        });
        console.log(`\nTotal matched rows: ${matchCount}`);
      });
    });
  } catch (err) {
    console.error(err);
  }
}

run();
