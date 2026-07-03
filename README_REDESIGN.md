# Smart Akshaya — Project Specification & README

> **Version:** Redesign v2.0  
> **Platforms:** Web (React + Vite) · Desktop (Flutter Windows)  
> **Backend/Database:** Google Sheets (via Service Account API)

---

## Project Overview

**Smart Akshaya** is a dual-platform management system for Kerala Akshaya E-Centres. It enables staff to record service entries, manage customer bills, track wallet balances, handle expenses, and access government application forms — both online and offline.

The system is split into two applications that **share the same Google Sheets database**:

| App | Tech | Primary Users | Path |
|-----|------|---------------|------|
| Web App | React + Vite | Admin, online tools, browser-based graphics | `smart_akshaya_web_application/` |
| Desktop App | Flutter (Windows) | On-counter staff, offline billing, local operations | `smart_akshaya_windows_application/` |

---

## Architecture: Offline-First + Google Sheets Sync

Refer to `ruler.md` in the Windows app for the full CRUD sync specification.

```
┌─────────────────────────────────────────────────────────────────┐
│                        Smart Akshaya                            │
├──────────────────────────┬──────────────────────────────────────┤
│   WEB APP (React/Vite)   │   DESKTOP APP (Flutter Windows)      │
│                          │                                       │
│ - Authentication (OAuth) │ - Authentication (local cache)        │
│ - Dashboard + quick tiles│ - Dashboard + quick tiles             │
│ - Wallet Management      │ - Wallet Management (Sheets sync)     │
│ - PSC Photo & Sig Creator│ - New Entry / Billing (offline-first) │
│ - Resume Generator       │ - Service Reports                     │
│ - Crop & Resize Tools    │ - Expenses Management                 │
│ - Quick Document Finder  │ - Staff Management                    │
│ - New Entry (Billing)    │ - Quick Document Finder               │
│                          │ → Opens web tools via url_launcher    │
└──────────────┬───────────┴────────────────┬──────────────────────┘
               │           Google Sheets     │
               └─────── (Shared Database) ───┘
                         ┌──────────────┐
                         │ Staff Details│
                         │ Services     │
                         │ Service Rpts │
                         │ Expenses     │
                         │ Saved Bills  │
                         │ Wallets      │ ← New
                         └──────────────┘
```

---

## Sidebar Navigation Structure (Post-Redesign)

### Web App Sidebar
```
MAIN
  └── Dashboard

SERVICES
  └── Services
        ├── New Entry
        └── Saved Bills

  Wallets Balance          ← NEW
  Quick Document Finder    ← NEW

FINANCE
  ├── Reports
  │     └── Service Reports
  └── Expenses

SYSTEM (Admin only)
  └── Sheet Config
```

### Desktop App Sidebar
```
MAIN
  └── Dashboard

SERVICES
  └── Services
        ├── New Entry
        └── Saved Bills

  Wallets Balance          ← NEW
  Quick Document Finder    ← NEW (promoted from widget to screen)

FINANCE
  ├── Reports
  │     └── Service Reports
  └── Expenses

SYSTEM (Admin only)
  └── Settings
        ├── Services (Master)
        └── Staff Management
```

> **Note:** "Tools" section is **removed from the sidebar** on both platforms.  
> Photo tools, PSC, Biodata, etc. are accessible via Dashboard quick tiles only.  
> On Desktop, graphic processing tools launch the Web App in a browser window.

---

## Dashboard: Quick Launch Tiles (Post-Redesign)

Both platforms show the same 8-tile grid on the dashboard (matching `akshaya_redesign_ui_first.jpeg`):

| # | Tile | Web Action | Desktop Action |
|---|------|------------|----------------|
| 1 | **Crop & Resize Photo & Sign** | Navigate to `resizer` view | Open `localhost:5173/resizer` in browser |
| 2 | **Passport Size Photo Creator** | Navigate to `psc-photo` view | Open `localhost:5173/psc-photo` in browser |
| 3 | **PSC Photo Creator** | Navigate to `psc-photo` view | Open `localhost:5173/psc-photo` in browser |
| 4 | **Create Biodata** | Navigate to `biodata` view | Open `localhost:5173/biodata` in browser |
| 5 | **Create Nameslip** | Navigate to `nameslip` view | Open `localhost:5173/nameslip` in browser |
| 6 | **SSLC Percentage Calculation** | Navigate to `sslc-calc` view | Open `localhost:5173/sslc` in browser |
| 7 | **Application Forms** | Navigate to `document-finder` view | Navigate to `ApplicationFormsScreen` |
| 8 | *(TBD — 8th tile)* | TBD | TBD |

> **Design Reference:** `akshaya_redesign_ui_first.jpeg`

---

## Feature: Wallet Management

### Overview
A dedicated screen to manage financial wallets (Cash, BANK, Edistrict, CSC, UPI, UTI, etc.). Each wallet tracks an opening balance and a live current balance, updated as service entries are saved.

### Design Reference
`wallet_management_ui.jpeg`

### Screens / Components
- **Web:** `WalletManagement.jsx` (new)
- **Desktop:** `wallet_screen.dart` (new)

### Google Sheets Tab
Sheet name: `"Wallets"`  
Columns: `ID | Wallet Name | Opening Balance | Current Balance | Last Updated | Status`

### Key Functionality
| Feature | Description |
|---------|-------------|
| Add Wallet | Create a new wallet with name and opening balance |
| Add Funds (per row) | Manually credit/debit a specific wallet |
| Transfer | Move funds from one wallet to another (both balances updated) |
| History | View chronological transaction log for all wallets |
| Delete | Soft-delete a wallet (confirm before action) |
| Status badge | "Updated" when synced with Google Sheets |
| Search | Filter wallets by name |

### Dashboard Integration
- **"Wallets Balance"** sidebar item → opens Wallet Management screen
- **"Total Wallet Charge"** stat card on dashboard → shows sum of all wallet current balances

> **⚠️ Wallet types list to be provided by user before implementation**

---

## Feature: PSC Photo & Signature Creator (Web Only)

### Overview
A tool for creating PSC-standard passport photos and signature images with applicant name and date watermark.

### Design Reference
`psc_photo ui.jpeg`

### Component
- **Web:** `PscPhotoCreator.jsx` (new)

### Tabs
1. **PSC Photo** — Upload photo, enter name + date with font size controls, preview overlay, download
2. **PSC Signature** — Same flow for signature image

### Preview
Left pane shows live preview: image with `NAME` and `DD-MM-YYYY` rendered at bottom with configurable font size.

---

## Feature: Quick Document Finder

### Overview
A searchable directory of government/Akshaya application forms. Shows the same content as the existing `ApplicationFormsScreen`.

### Components
- **Web:** `QuickDocumentFinder.jsx` (new component, registered as `document-finder` view)
- **Desktop:** Existing `QuickDocumentFinder` widget + `ApplicationFormsScreen` at index 4

### Navigation
- Dashboard "Application Forms" tile → navigates to this screen
- Sidebar "Quick Document Finder" item → same destination

---

## Feature: New Entry / Service Billing Screen (Redesign)

### Design References
- `akshaya_redesign_ui_second.jpeg` — Service details with wallet dropdown
- `akshaya_redesign_ui_sxith_service_new_entry.jpeg` — Full billing screen layout
- `akshaya_redesign_ui_third.jpeg` — Payment summary + balance calculator popup

### Layout Sections

#### 1. Header
```
Billing [Centre Name] — Staff: [Staff Name] — Create and manage customer bills.
Shortcuts: F9 Complete • F10 Clear • F11 Print • F12 PDF • F8 WhatsApp   [Date]
```

#### 2. Customer Details
| Field | Notes |
|-------|-------|
| Mobile Number | Primary lookup field |
| Name | Secondary field |
| Enable Name Search | Toggle checkbox |
Only these two fields — no address or other fields.

#### 3. Add Service
| Field | Notes |
|-------|-------|
| Services | Dropdown (from master services list) |
| Wallet Charge | Number input (auto-populated from service config) |
| Wallet | Dropdown (from Wallets sheet) |
| Service Charge | Number input |
| Quantity | Number input (default 1) |
| Total | Auto-calculated |
| + Add button | Adds to Bill Items table |

#### 4. Bill Items (renamed from "Service List")
Inline-editable table:

| # | Service | Wallet Charge | Wallet | Service Charge | Qty | Total | Delete |
|---|---------|--------------|--------|----------------|-----|-------|--------|
| 1 | Passport 1150 | 900.00 | BANK | 250.00 | 1 | ₹1,150.00 | ✕ |

Each cell is editable. Delete removes row.

#### 5. Payment & Summary

**Left — Payment inputs:**
- GPay/UPI amount input (Alt+G shortcut on desktop)
- Cash amount input (Alt+C shortcut on desktop)
- Total Paid (auto-sum)
- Balance (auto-calculated = Total Amount − Total Paid; shown in **red** if negative)
- Buttons: **Settle Cash Balance** | **Calculator** | **Save**

**Right — Bill Summary:**
```
Wallet Charge              ₹X,XXX.00
Service Charge             ₹XXX.00
─────────────────────────────────────
Bill Total                 ₹X,XXX.00
Previous Balance           ₹0.00
Total Paid                 ₹0.00
Balance                    ₹-X,XXX.00  ← red
─────────────────────────────────────
Total Amount               ₹X,XXX.00
```

**Action buttons (bottom right):**
`✓ Complete F9` | `🖨 Print` | `📄 PDF` | `💬 WhatsApp` | `🗑 Clear`

#### 6. Balance Calculator Popup
Triggered by "Calculator" button (not sidebar). Small floating popup:
```
┌─────────────────────────┐
│ Balance Calculator   ✕  │
│                         │
│ Total charges           │
│ [     250     ]         │
│ Customer paid           │
│ [     500     ]         │
│ Balance amount          │
│ [     250     ]         │
│                         │
│          [Close]        │
└─────────────────────────┘
```

### Credit / Walk-in Customer Logic

| Condition | Outcome |
|-----------|---------|
| Payment covers total + customer data provided | Save bill, link to customer |
| Payment covers total + **no customer data** | Save as **"Walk-in Customer"** |
| Negative balance + **customer data provided** | Save as credit, red balance, show credit notification modal |
| Negative balance + **no customer data** | **Block save** — require mobile/name entry first |
| "Settle Cash Balance" clicked | Mark balance as settled, cash = total amount |

**Credit Notification UI:** A central modal/banner showing:  
*"Customer [Name] (mobile: [number]) has an outstanding credit of ₹[amount] on this bill."*

### Print & PDF Actions

| Button | Action |
|--------|--------|
| **Print** | Opens printable invoice — format per `Invoice MPM2500626-01760_print.pdf` |
| **PDF** | Downloads PDF — different format/filename (to be specified by user) |
| **WhatsApp** | Opens WhatsApp with bill summary text |
| **Complete F9** | Marks bill as complete, saves, and clears form |
| **Clear F10** | Resets entire form (confirmation required) |

> **Note:** A4/A5 paper size selector is removed from the UI. Print format is fixed by invoice template.

---

## Web App Routing (`App.jsx`) — Post-Redesign

```javascript
'dashboard'       → DashboardOverview       // MODIFY
'new-entry'       → NewEntryScreen          // NEW or MODIFY
'saved-bills'     → SavedBillsScreen        // future
'wallet'          → WalletManagement        // NEW
'document-finder' → QuickDocumentFinder     // NEW
'psc-photo'       → PscPhotoCreator         // NEW
'resizer'         → PhotoResizer            // EXISTING
'passport'        → PassportPhotoGenerator  // EXISTING
'resume'          → ResumeGenerator         // EXISTING
'settings'        → SheetSettings           // EXISTING (admin only)
'biodata'         → BiodataScreen           // FUTURE
```

---

## Desktop App: Web Tool URL Linking

The desktop app does **not** implement graphics tools directly. It launches the web app in the user's default browser.

### Configuration (`lib/config/web_config.dart`) [NEW FILE]
```dart
const String kWebBaseUrl = 'http://localhost:5173';
```

### Usage Example
```dart
import 'package:url_launcher/url_launcher.dart';

Future<void> launchWebTool(String route) async {
  final uri = Uri.parse('$kWebBaseUrl/$route');
  if (await canLaunchUrl(uri)) {
    await launchUrl(uri, mode: LaunchMode.externalApplication);
  }
}
```

---

## Deferred / Pending Items (Awaiting User Input)

| Feature | Status | Notes |
|---------|--------|-------|
| Biodata creator | ⏳ Pending | Full spec to be attached by user |
| Nameslip creator | ⏳ Pending | Spec to be provided |
| SSLC % Calculator | ⏳ Pending | Spec to be provided |
| Wallet types list | ⏳ Pending | Complete wallet names to be provided |
| PDF invoice format | ⏳ Pending | Second PDF template to be provided |
| 8th dashboard tile | ⏳ Pending | User to confirm |
| Total Wallet Charge logic | ⏳ Pending | Confirm: sum of wallet balances vs. sum of wallet charges in entries |

---

## File Change Summary

### Web App (`smart_akshaya_web_application/src/`)

| File | Status | Change |
|------|--------|--------|
| `components/Sidebar.jsx` | MODIFY | Remove tools items, add Wallet/DocFinder |
| `components/DashboardOverview.jsx` | MODIFY | 4 stat cards + 8-tile quick launch grid |
| `components/WalletManagement.jsx` | NEW | Wallet management screen |
| `components/PscPhotoCreator.jsx` | NEW | PSC Photo & Signature Creator |
| `components/QuickDocumentFinder.jsx` | NEW | Application forms finder |
| `App.jsx` | MODIFY | Register new routes |

### Desktop App (`smart_akshaya_windows_application/lib/`)

| File | Status | Change |
|------|--------|--------|
| `main_navigation_screen.dart` | MODIFY | Add Wallet (idx 11), DocFinder (idx 12), remove Tools section |
| `dashboard_screen.dart` | MODIFY | 8-tile grid with web URL linking |
| `new_entry_screen.dart` | MODIFY | Wallet dropdown, Bill Items, payment redesign, credit logic |
| `wallet_screen.dart` | NEW | Wallet management screen |
| `config/web_config.dart` | NEW | Web base URL constant |
