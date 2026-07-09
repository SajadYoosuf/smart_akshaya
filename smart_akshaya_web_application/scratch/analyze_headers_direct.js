import fs from 'fs';
import https from 'https';
import crypto from 'crypto';

// 1. Load credentials
const creds = JSON.parse(fs.readFileSync('public/google_sheets_credentials.json', 'utf8'));
const spreadsheetId = '1tWRoBfnDFZqezA_3C5LPOBZfN_E4XaLB4okZ8DrM20U';

// Base64url helper
function base64url(strOrBuffer) {
  const base64 = typeof strOrBuffer === 'string'
    ? Buffer.from(strOrBuffer).toString('base64')
    : strOrBuffer.toString('base64');
  return base64.replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

// Generate JWT and get access token
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
    console.log("Token obtained successfully.");
    const sheetName = 'Service Entries';
    const range = `'${sheetName}'!A:Z`;
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}`;

    https.get(url, {
      headers: { 'Authorization': `Bearer ${token}` }
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        if (res.statusCode !== 200) {
          console.error("Fetch failed:", res.statusCode, body);
          return;
        }
        const data = JSON.parse(body);
        const values = data.values || [];
        console.log("Total rows in Sheet:", values.length);
        if (values.length > 0) {
          console.log("\n=== HEADERS ===");
          console.log(values[0]);

          console.log("\n=== FIRST DATA ROW (Row 2) ===");
          console.log(values[1]);

          console.log("\n=== SECOND DATA ROW (Row 3) ===");
          console.log(values[2]);

          console.log("\n=== LAST DATA ROW ===");
          console.log(values[values.length - 1]);
        }
      });
    }).on('error', console.error);
  } catch (err) {
    console.error(err);
  }
}

run();
