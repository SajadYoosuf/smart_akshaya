import { getRows } from '../src/services/googleSheetsService.js';
import { groupByBooking } from '../src/utils/billGrouper.js';
import { SHEETS_CONFIG, BILL_TYPES, SVC_STATUS } from '../src/config/sheetsConfig.js';
import dotenv from 'dotenv';
dotenv.config();

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

async function testLogic() {
  const rows = await getRows(SHEETS_CONFIG.serviceEntrySheetName);
  console.log(`Fetched ${rows.length} rows`);
  
  const parsed = rows.slice(1).map((row, idx) => parseRow(row, idx));
  const grouped = groupByBooking(parsed);
  console.log(`Grouped into ${grouped.length} bookings`);

  const pending = grouped.filter(b => {
    return b.billType === BILL_TYPES.SERVICE_PENDING || 
           b.billType === 'service_pending' || 
           b.billType === 'pending';
  });
  console.log(`Found ${pending.length} pending bills`);
  
  const creditBookings = grouped.filter(b => {
    return b.billType === BILL_TYPES.CREDIT_PENDING ||
           b.billType === BILL_TYPES.PARTIAL_PAYMENT ||
           b.billType === 'credit_pending' ||
           b.billType === 'partial_payment' ||
           (b.isLegacy && b.balance < -0.01);
  });
  console.log(`Found ${creditBookings.length} credit bills`);
  
  const currentStaff = 'sajad staff';
  const visiblePending = pending.filter(b => (b.staffName || '').trim().toLowerCase() === currentStaff.trim().toLowerCase());
  console.log(`Visible pending for ${currentStaff}: ${visiblePending.length}`);
  if (visiblePending.length > 0) {
      console.log('Sample pending:', visiblePending[0].bookingId, visiblePending[0].billType);
  }

  const visibleCredit = creditBookings.filter(b => (b.staffName || '').trim().toLowerCase() === currentStaff.trim().toLowerCase());
  console.log(`Visible credit for ${currentStaff}: ${visibleCredit.length}`);
}

testLogic().catch(console.error);
