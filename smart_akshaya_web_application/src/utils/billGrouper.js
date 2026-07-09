/**
 * billGrouper.js
 * Groups flat service-entry rows (one row per service) by booking_id.
 * Legacy rows (written before the redesign, no booking_id) are each
 * treated as their own single-service booking.
 */

/**
 * @typedef {Object} ServiceLine
 * @property {number} rowIndex      - 1-based sheet row index
 * @property {string} serviceName
 * @property {number|string} quantity
 * @property {number} deptFee
 * @property {number} serviceCharge
 * @property {number} rowTotal
 * @property {string} walletType
 * @property {string} serviceStatus  - not_started | in_progress | completed
 */

/**
 * @typedef {Object} Booking
 * @property {string}        bookingId
 * @property {boolean}       isLegacy
 * @property {string}        date
 * @property {string}        time
 * @property {string}        staffName
 * @property {string}        mobile
 * @property {string}        customerName
 * @property {string}        billType     - completed | service_pending | credit_pending | partial_payment
 * @property {number}        bookingTotal
 * @property {number}        amountPaid
 * @property {number}        gpayAmount
 * @property {number}        cashAmount
 * @property {number}        balance
 * @property {ServiceLine[]} services
 * @property {number[]}      rowIndices
 */

/**
 * Parses a flat array of raw sheet rows into a structured array of Bookings.
 * Each raw row must already be a parsed object (not a raw 2-D array).
 *
 * @param {Object[]} rows - Parsed row objects from the sheet
 * @returns {Booking[]}
 */
export function groupByBooking(rows) {
  /** @type {Map<string, Booking>} */
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
        date: row.date || '',
        time: row.time || '',
        staffName: row.staffName || '',
        mobile: row.mobile || '',
        customerName: row.customerName || 'Walk-in',
        billType: row.billType || (row.status === 'pending' ? 'service_pending' : 'completed'),
        bookingTotal: row.bookingTotal ?? row.totalAmount ?? 0,
        amountPaid: row.amountPaid ?? 0,
        gpayAmount: row.gpayAmount ?? row.gpayUpi ?? 0,
        cashAmount: row.cashAmount ?? row.cash ?? 0,
        balance: row.balance ?? 0,
        services: [],
        rowIndices: [],
      });
    }

    const booking = bookings.get(key);

    // For legacy rows, the comma-separated services string becomes one synthetic line
    if (isLegacy) {
      booking.services.push({
        rowIndex: row.rowIndex,
        serviceName: row.services || row.serviceName || '—',
        quantity: row.quantity ?? 1,
        deptFee: row.walletCharge ?? row.deptFee ?? 0,
        serviceCharge: row.serviceCharge ?? 0,
        rowTotal: row.totalAmount ?? row.rowTotal ?? 0,
        walletType: row.wallet || row.walletType || '',
        serviceStatus: row.serviceStatus || 'completed', // Legacy = assume done
      });
    } else {
      booking.services.push({
        rowIndex: row.rowIndex,
        serviceName: row.serviceName || row.services || '—',
        quantity: row.quantity ?? 1,
        deptFee: row.deptFee ?? 0,
        serviceCharge: row.serviceCharge ?? 0,
        rowTotal: row.rowTotal ?? 0,
        walletType: row.walletType || '',
        serviceStatus: row.serviceStatus || 'not_started',
      });
    }

    booking.rowIndices.push(row.rowIndex);
  }

  return [...bookings.values()];
}

/**
 * Determines the bill_type given service statuses and payment.
 *
 * @param {string[]} serviceStatuses - array of status strings per service
 * @param {number}   amountPaid
 * @param {number}   bookingTotal
 * @returns {string} bill_type
 */
export function determineBillType(serviceStatuses, amountPaid, bookingTotal) {
  const allDone = serviceStatuses.length > 0 &&
    serviceStatuses.every(s => s === 'completed');
  const balance = amountPaid - bookingTotal;

  // If any service is not completed, it always goes to Saved Bills first
  if (!allDone) {
    return 'service_pending';
  }

  // If all services are completed but payment is not fully collected, it goes to Credit Details
  if (balance < -0.01) {
    return amountPaid <= 0.01 ? 'credit_pending' : 'partial_payment';
  }

  // Fully completed and paid goes to Service Reports
  return 'completed';
}
