export const SHEETS_CONFIG = {
  defaultSpreadsheetId: '1tWRoBfnDFZqezA_3C5LPOBZfN_E4XaLB4okZ8DrM20U',
  defaultDriveFolderId: '1K8ZEvuWoR3lFeoMQP0JL69r5SBl4sUol',
  staffSheetName: 'Staff Details',
  serviceSheetName: 'Serivce Management',
  customerSheetName: 'Customer Details',
  expenseSheetName: 'Expense Management',
  serviceEntrySheetName: 'Service Entries',
  savedBillsSheetName: 'Service Entries',
  walletSheetName: 'Wallets',
  attendanceSheetName: 'Attendance',
  permissionsSheetName: 'Permissions',
  announcementsSheetName: 'Announcements',
};

/** Bill routing types — stored in the bill_type column (col N) */
export const BILL_TYPES = {
  COMPLETED:       'completed',
  SERVICE_PENDING: 'service_pending',
  CREDIT_PENDING:  'credit_pending',
  PARTIAL_PAYMENT: 'partial_payment',
};

/** Per-service completion statuses — stored in service_status column (col L) */
export const SVC_STATUS = {
  NOT_STARTED: 'not_started',
  IN_PROGRESS:  'in_progress',
  COMPLETED:    'completed',
};

/**
 * Retrieves the spreadsheet ID from local storage, falling back to default.
 */
export function getSpreadsheetId() {
  return localStorage.getItem('google_spreadsheet_id') || SHEETS_CONFIG.defaultSpreadsheetId;
}

/**
 * Saves the spreadsheet ID to local storage.
 */
export function setSpreadsheetId(id) {
  localStorage.setItem('google_spreadsheet_id', id.trim());
}

/**
 * Retrieves the Google Drive folder ID for Application Forms.
 */
export function getDriveFolderId() {
  return localStorage.getItem('google_drive_folder_id') || SHEETS_CONFIG.defaultDriveFolderId;
}

/**
 * Saves the Google Drive folder ID for Application Forms.
 */
export function setDriveFolderId(id) {
  localStorage.setItem('google_drive_folder_id', id.trim());
}
