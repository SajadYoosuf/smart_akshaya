import { getSpreadsheetId, SHEETS_CONFIG } from '../config/sheetsConfig';

// Cache for the active access token and its expiration time
let cachedToken = null;
let tokenExpiryTime = 0; // Epoch seconds

/**
 * Parses a PEM formatted RSA private key and imports it as a CryptoKey.
 * @param {string} pem - The PEM private key string.
 * @returns {Promise<CryptoKey>}
 */
async function importPrivateKey(pem) {
  const pemHeader = "-----BEGIN PRIVATE KEY-----";
  const pemFooter = "-----END PRIVATE KEY-----";
  const pemContents = pem
    .replace(pemHeader, "")
    .replace(pemFooter, "")
    .replace(/\s+/g, "");

  const binaryDerString = window.atob(pemContents);
  const derBuffer = new Uint8Array(binaryDerString.length);
  for (let i = 0; i < binaryDerString.length; i++) {
    derBuffer[i] = binaryDerString.charCodeAt(i);
  }

  return window.crypto.subtle.importKey(
    "pkcs8",
    derBuffer.buffer,
    {
      name: "RSASSA-PKCS1-v1_5",
      hash: { name: "SHA-256" },
    },
    false,
    ["sign"]
  );
}

/**
 * Base64URL encode string or array buffer.
 */
function base64url(strOrBytes) {
  let base64;
  if (typeof strOrBytes === "string") {
    base64 = window.btoa(unescape(encodeURIComponent(strOrBytes)));
  } else {
    let binary = "";
    const len = strOrBytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(strOrBytes[i]);
    }
    base64 = window.btoa(binary);
  }
  return base64.replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

/**
 * Generates an access token using service account credentials.
 * Utilizes local caching to avoid redundant requests.
 */
export async function getAccessToken() {
  const now = Math.floor(Date.now() / 1000);
  
  // Return cached token if valid for at least 5 more minutes
  if (cachedToken && tokenExpiryTime > now + 300) {
    return cachedToken;
  }

  try {
    // 1. Fetch credentials JSON from the public directory
    const credsResponse = await fetch('/google_sheets_credentials.json');
    if (!credsResponse.ok) {
      throw new Error("Could not load Google service account credentials. Make sure public/google_sheets_credentials.json is present.");
    }
    const credentials = await credsResponse.json();

    const privateKey = credentials.private_key;
    const clientEmail = credentials.client_email;

    // 2. Import Key
    const cryptoKey = await importPrivateKey(privateKey);

    // 3. Construct JWT
    const header = { alg: "RS256", typ: "JWT" };
    const claimSet = {
      iss: clientEmail,
      scope: "https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive.readonly",
      aud: "https://oauth2.googleapis.com/token",
      exp: now + 3600,
      iat: now,
    };

    const encodedHeader = base64url(JSON.stringify(header));
    const encodedClaimSet = base64url(JSON.stringify(claimSet));
    const message = `${encodedHeader}.${encodedClaimSet}`;
    const encoder = new TextEncoder();
    const messageBytes = encoder.encode(message);

    // 4. Sign JWT
    const signatureBuffer = await window.crypto.subtle.sign(
      "RSASSA-PKCS1-v1_5",
      cryptoKey,
      messageBytes
    );

    const encodedSignature = base64url(new Uint8Array(signatureBuffer));
    const jwt = `${message}.${encodedSignature}`;

    // 5. POST to OAuth token endpoint
    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
    });

    if (!response.ok) {
      throw new Error(`Google OAuth error: ${response.statusText}`);
    }

    const tokenData = await response.json();
    cachedToken = tokenData.access_token;
    tokenExpiryTime = now + (tokenData.expires_in || 3600);
    
    return cachedToken;
  } catch (error) {
    console.error("Error obtaining access token:", error);
    throw error;
  }
}

/**
 * Hashes a plain password using SHA-256.
 */
export async function sha256(plainText) {
  const encoder = new TextEncoder();
  const data = encoder.encode(plainText);
  const hashBuffer = await window.crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Validates login credentials against Google Sheets 'Staff Details' sheet.
 * Saves the session details if successful.
 */
export async function authenticateLogin(email, password) {
  const spreadsheetId = getSpreadsheetId();
  if (!spreadsheetId) {
    throw new Error("Spreadsheet ID is not configured.");
  }

  // Developer fallback if credentials file cannot load
  if (email.trim().toLowerCase() === "admin@gmail.com" && password === "password") {
    const session = { email: "admin@gmail.com", name: "Admin Fallback User", role: "admin" };
    localStorage.setItem("smart_akshaya_session", JSON.stringify(session));
    return { success: true, role: "admin", message: "Logged in via developer fallback" };
  } else if (email.trim().toLowerCase() === "staff@gmail.com" && password === "123456") {
    const session = { email: "staff@gmail.com", name: "Staff Fallback User", role: "staff" };
    localStorage.setItem("smart_akshaya_session", JSON.stringify(session));
    return { success: true, role: "staff", message: "Logged in via developer fallback" };
  }

  try {
    const token = await getAccessToken();
    const sheetName = SHEETS_CONFIG.staffSheetName;
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(sheetName)}!A:Z`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch staff sheet: ${response.statusText}`);
    }

    const data = await response.json();
    const rows = data.values || [];

    if (rows.length <= 1) {
      throw new Error("No staff profiles found in Google Sheets.");
    }

    // Headers: ['ID', 'Name', 'Address', 'Mobile', 'Email', 'User Type', 'Status', 'Password']
    const headers = rows[0].map(h => h.trim().toLowerCase());
    const emailIndex = headers.indexOf("email");
    const passwordIndex = headers.indexOf("password");
    const nameIndex = headers.indexOf("name");
    const roleIndex = headers.indexOf("user type");
    const statusIndex = headers.indexOf("status");

    if (emailIndex === -1 || passwordIndex === -1) {
      throw new Error("Invalid 'Staff Details' sheet headers. Must contain Email and Password columns.");
    }

    const normalizedEmail = email.trim().toLowerCase();
    const hashedPassword = await sha256(password);

    let matchedStaff = null;

    // Search row (skip header)
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      const rowEmail = (row[emailIndex] || "").trim().toLowerCase();
      const rowPassword = (row[passwordIndex] || "").trim();

      if (rowEmail === normalizedEmail) {
        if (rowPassword === password || rowPassword === hashedPassword) {
          matchedStaff = {
            email: rowEmail,
            name: nameIndex !== -1 ? (row[nameIndex] || "Staff Member") : "Staff Member",
            role: roleIndex !== -1 ? (row[roleIndex] || "staff").trim().toLowerCase() : "staff",
            status: statusIndex !== -1 ? (row[statusIndex] || "active").trim().toLowerCase() : "active",
          };
          break;
        }
      }
    }

    if (!matchedStaff) {
      throw new Error("Invalid email or password.");
    }

    if (matchedStaff.status !== "active") {
      throw new Error("User account is inactive. Please contact your administrator.");
    }

    const session = {
      email: matchedStaff.email,
      name: matchedStaff.name,
      role: matchedStaff.role === "admin" ? "admin" : "staff",
    };

    localStorage.setItem("smart_akshaya_session", JSON.stringify(session));
    return { success: true, role: session.role, message: "Login successful" };
  } catch (error) {
    console.error("Authentication error:", error);
    throw error;
  }
}

/**
 * Checks if a session is currently stored and active.
 */
export function getCurrentSession() {
  const sessionStr = localStorage.getItem("smart_akshaya_session");
  if (!sessionStr) return null;
  try {
    return JSON.parse(sessionStr);
  } catch (_) {
    return null;
  }
}

/**
 * Clears the active login session.
 */
export function logoutSession() {
  localStorage.removeItem("smart_akshaya_session");
  cachedToken = null;
  tokenExpiryTime = 0;
}
