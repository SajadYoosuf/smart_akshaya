import React, { useState, useEffect, useRef } from 'react';
import { User, Grid, Receipt, Plus, Trash2, Check, Calculator, RefreshCw, DollarSign, Printer, Send, X, Calendar, Phone, CreditCard, Banknote, CheckCircle, Clock, Circle, Loader, CheckSquare } from 'lucide-react';
import { getRows, appendRow, appendRows, updateRow, updateRowColumns, clearRow } from '../services/googleSheetsService';
import { SHEETS_CONFIG, BILL_TYPES, SVC_STATUS } from '../config/sheetsConfig';
import { determineBillType } from '../utils/billGrouper';
import { generateInvoicePdf } from '../utils/pdfGenerator';

export default function NewEntryScreen({ userSession, editBillData, setEditBillData }) {
  const [staffName, setStaffName] = useState('Staff User');
  const [centreName, setCentreName] = useState('Smart Akshaya');

  // Data lists
  const [services, setServices] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [wallets, setWallets] = useState([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Form State - Customer
  const [mobileNumber, setMobileNumber] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(true);

  // Search dropdown state
  const [nameSuggestions, setNameSuggestions] = useState([]);
  const [showNameDropdown, setShowNameDropdown] = useState(false);
  const [customerSelectedIndex, setCustomerSelectedIndex] = useState(-1);
  const nameRef = useRef(null);

  // Service dropdown state
  const [serviceSuggestions, setServiceSuggestions] = useState([]);
  const [showServiceDropdown, setShowServiceDropdown] = useState(false);
  const [serviceSelectedIndex, setServiceSelectedIndex] = useState(-1);
  const serviceRef = useRef(null);

  // Add Service Form State
  const [selectedService, setSelectedService] = useState('');
  const [walletCharge, setWalletCharge] = useState('');
  const [selectedWallet, setSelectedWallet] = useState('');
  const [serviceCharge, setServiceCharge] = useState('');
  const [quantity, setQuantity] = useState('1');

  // Bill Items Table State
  const [billItems, setBillItems] = useState([]);
  const [gpayAmount, setGpayAmount] = useState('');
  const [cashAmount, setCashAmount] = useState('');

  // Calculator State
  const [showCalculator, setShowCalculator] = useState(false);
  const [calcPaid, setCalcPaid] = useState('');
  const [editingRowIndex, setEditingRowIndex] = useState(null);
  const [editingBookingId, setEditingBookingId] = useState(null);

  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState('');

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 5000);
  };

  // Refs for focusing on shortcut
  const gpayRef = useRef(null);
  const cashRef = useRef(null);
  const serviceInputRef = useRef(null);
  const nameDropdownRef = useRef(null);
  const serviceDropdownRef = useRef(null);

  // Computed values
  const walletChargeTotal = billItems.reduce((acc, item) => acc + ((parseFloat(item.walletCharge) || 0) * (parseInt(item.quantity) || 1)), 0);
  const serviceChargeTotal = billItems.reduce((acc, item) => acc + ((parseFloat(item.serviceCharge) || 0) * (parseInt(item.quantity) || 1)), 0);
  const billTotal = walletChargeTotal + serviceChargeTotal;

  const selectedCustomerObj = customers.find(
    c => (c.name && customerName && c.name.toLowerCase() === customerName.toLowerCase()) ||
      (c.phone && mobileNumber && c.phone === mobileNumber)
  );
  const previousBalance = selectedCustomerObj && selectedCustomerObj.balance < 0 ? Math.abs(selectedCustomerObj.balance) : 0;
  const totalAmount = billTotal + previousBalance;

  const totalPaid = (parseFloat(gpayAmount) || 0) + (parseFloat(cashAmount) || 0);
  const balance = totalPaid - totalAmount;
  const balanceColor = balance < 0 ? '#EF4444' : '#10B981';

  const todayStr = new Date().toISOString().split('T')[0];

  useEffect(() => {
    if (userSession?.name) {
      setStaffName(userSession.name);
    }
    loadData();
  }, [userSession]);

  // Scroll active item into view for customer dropdown
  useEffect(() => {
    if (showNameDropdown && nameDropdownRef.current && customerSelectedIndex >= 0) {
      const container = nameDropdownRef.current;
      const activeEl = container.children[customerSelectedIndex];
      if (activeEl) {
        const containerTop = container.scrollTop;
        const containerBottom = containerTop + container.clientHeight;
        const elemTop = activeEl.offsetTop;
        const elemBottom = elemTop + activeEl.offsetHeight;

        if (elemTop < containerTop) {
          container.scrollTop = elemTop;
        } else if (elemBottom > containerBottom) {
          container.scrollTop = elemBottom - container.clientHeight;
        }
      }
    }
  }, [customerSelectedIndex, showNameDropdown]);

  // Scroll active item into view for service dropdown
  useEffect(() => {
    if (showServiceDropdown && serviceDropdownRef.current && serviceSelectedIndex >= 0) {
      const container = serviceDropdownRef.current;
      const activeEl = container.children[serviceSelectedIndex];
      if (activeEl) {
        const containerTop = container.scrollTop;
        const containerBottom = containerTop + container.clientHeight;
        const elemTop = activeEl.offsetTop;
        const elemBottom = elemTop + activeEl.offsetHeight;

        if (elemTop < containerTop) {
          container.scrollTop = elemTop;
        } else if (elemBottom > containerBottom) {
          container.scrollTop = elemBottom - container.clientHeight;
        }
      }
    }
  }, [serviceSelectedIndex, showServiceDropdown]);

  useEffect(() => {
    if (editBillData) {
      if (editBillData.bookingId && !editBillData.isLegacy) {
        setEditingBookingId(editBillData.bookingId);
        setEditingRowIndex(null);
        setMobileNumber(editBillData.mobile || '');
        setCustomerName(editBillData.customerName || '');
        setGpayAmount(editBillData.gpayAmount ? String(editBillData.gpayAmount) : '');
        setCashAmount(editBillData.cashAmount ? String(editBillData.cashAmount) : '');

        const parsedItems = editBillData.services.map((svc, i) => ({
          id: `edit-${i}-${Date.now()}`,
          serviceName: svc.serviceName,
          walletCharge: svc.deptFee ? String(svc.deptFee) : '0',
          walletType: svc.walletType || '',
          serviceCharge: svc.serviceCharge ? String(svc.serviceCharge) : '0',
          quantity: svc.quantity ? String(svc.quantity) : '1',
          total: svc.rowTotal,
          serviceStatus: svc.serviceStatus || SVC_STATUS.NOT_STARTED,
        }));
        setBillItems(parsedItems);
      } else {
        // Legacy/single row edit
        setEditingBookingId(null);
        setEditingRowIndex(editBillData.rowIndex);
        setMobileNumber(editBillData.mobile || '');
        setCustomerName(editBillData.customerName || '');
        setGpayAmount(editBillData.gpayUpi ? String(editBillData.gpayUpi) : '');
        setCashAmount(editBillData.cash ? String(editBillData.cash) : '');

        const parsedItems = [];
        if (editBillData.services) {
          const parts = editBillData.services.split(', ');
          parts.forEach((part, i) => {
            const xIdx = part.indexOf('x ');
            if (xIdx !== -1) {
              const qtyStr = part.substring(0, xIdx);
              const nameStr = part.substring(xIdx + 2);
              const qty = parseInt(qtyStr) || 1;

              const sMatch = services.find(s => s.name === nameStr);
              const deptFee = sMatch ? sMatch.departmentFee : 0;
              const sCharge = parts.length === 1 && qty > 0 ? (editBillData.totalAmount / qty) : (sMatch ? sMatch.serviceCharge : 0);

              parsedItems.push({
                id: `edit-${i}-${Date.now()}`,
                serviceName: nameStr,
                departmentFee: deptFee,
                serviceCharge: sCharge,
                walletCharge: 0,
                walletType: '',
                quantity: qty,
                total: (deptFee + sCharge) * qty,
                serviceStatus: SVC_STATUS.COMPLETED
              });
            }
          });
        }
        setBillItems(parsedItems);
      }
      setEditBillData(null);
    }
  }, [editBillData, services, setEditBillData, wallets]);

  const loadData = async () => {
    setIsRefreshing(true);
    try {
      // Load Services
      const svcRows = await getRows(SHEETS_CONFIG.serviceSheetName);
      if (svcRows.length > 1) {
        const headers = svcRows[0];
        const clean = h => (h || '').toString().toLowerCase().replace(/[^a-z0-9]/g, '');
        const normalizedHeaders = headers.map(clean);

        const getIdx = (keys, defaultVal) => {
          for (const key of keys) {
            const idx = normalizedHeaders.indexOf(key);
            if (idx !== -1) return idx;
          }
          return defaultVal;
        };

        const svcNameIdx = getIdx(['servicename', 'name', 'service'], 0);
        const deptFeeIdx = getIdx(['departmentfee', 'deptfee'], 2);
        const svcChargeIdx = getIdx(['servicecharge', 'srvcharge'], 3);
        const walletIdx = getIdx(['defaultwallet', 'wallet'], 7);

        const loadedServices = svcRows.slice(1).map(row => ({
          name: row[svcNameIdx] || '',
          departmentFee: parseFloat(row[deptFeeIdx] || 0),
          serviceCharge: parseFloat(row[svcChargeIdx] || 0),
          defaultWallet: walletIdx !== -1 ? (row[walletIdx] || '').toString().trim() : ''
        })).filter(s => s.name);
        setServices(loadedServices);
      }

      // Load Wallets
      const walletRows = await getRows(SHEETS_CONFIG.walletSheetName);
      if (walletRows.length > 1) {
        const headers = walletRows[0].map(h => (h || '').toString().trim().toLowerCase());
        const nameIdx = headers.indexOf('wallet name') !== -1 ? headers.indexOf('wallet name') : 0;
        const balIdx = headers.indexOf('current balance');
        const loadedWallets = walletRows.slice(1)
          .map(row => ({
            name: row[nameIdx],
            balance: balIdx !== -1 ? (parseFloat(row[balIdx]) || 0) : null
          }))
          .filter(w => w.name && w.name.toLowerCase() !== 'cash');
        setWallets(loadedWallets);
        setSelectedWallet('');
      } else {
        const defaultWallets = ['BANK', 'Edistrict', 'CSC', 'UPI', 'UTI'].map(name => ({ name, balance: null }));
        setWallets(defaultWallets);
        setSelectedWallet('');
      }

      // Load Customers eagerly for name autocomplete
      await loadCustomers();
    } catch (error) {
      console.error("Failed to load initial data:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const loadCustomers = async () => {
    if (customers.length > 0) return customers;
    setIsLoadingCustomers(true);
    try {
      const custRows = await getRows(SHEETS_CONFIG.customerSheetName);
      if (custRows.length > 1) {
        const headers = custRows[0].map(h => h.trim().toLowerCase());
        const nameIdx = headers.indexOf('name') !== -1 ? headers.indexOf('name') : headers.indexOf('customer name');
        const phoneIdx = headers.indexOf('mobile') !== -1 ? headers.indexOf('mobile') : headers.indexOf('mobile number');
        const balanceIdx = headers.indexOf('balance');

        const loadedCustomers = custRows.slice(1).map((row, idx) => ({
          name: row[nameIdx] || '',
          phone: row[phoneIdx] || '',
          balance: balanceIdx !== -1 ? (parseFloat(row[balanceIdx]) || 0) : 0,
          rowIndex: idx + 2
        })).filter(c => c.name);
        setCustomers(loadedCustomers);
        setIsLoadingCustomers(false);
        return loadedCustomers;
      }
    } catch (error) {
      console.error("Failed to load customers:", error);
    }
    setIsLoadingCustomers(false);
    return [];
  };

  const handleCustomerSelect = (customer) => {
    setCustomerName(customer.name);
    setMobileNumber(customer.phone);
    setShowNameDropdown(false);
    setNameSuggestions([]);
    setCustomerSelectedIndex(-1);
  };

  const handleNameChange = async (value) => {
    setCustomerName(value);
    setCustomerSelectedIndex(0);
    if (value.trim().length === 0) {
      setNameSuggestions([]);
      setShowNameDropdown(false);
      return;
    }
    const list = customers.length > 0 ? customers : await loadCustomers();
    const lower = value.toLowerCase();
    const filtered = list.filter(c => c.name && c.name.toLowerCase().includes(lower));
    setNameSuggestions(filtered.slice(0, 8));
    setShowNameDropdown(filtered.length > 0);
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (nameRef.current && !nameRef.current.contains(e.target)) {
        setShowNameDropdown(false);
      }
      if (serviceRef.current && !serviceRef.current.contains(e.target)) {
        setShowServiceDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleServiceChange = (value) => {
    setSelectedService(value);
    setServiceSelectedIndex(0);
    if (value.trim().length === 0) {
      setServiceSuggestions([]);
      setShowServiceDropdown(false);
      return;
    }
    const lower = value.toLowerCase();
    const filtered = services.filter(s => s.name && s.name.toLowerCase().includes(lower));
    setServiceSuggestions(filtered);
    setShowServiceDropdown(filtered.length > 0);
  };

  const handleServiceSelect = (serviceName) => {
    setSelectedService(serviceName);
    const match = services.find(s => s.name.toLowerCase() === serviceName.toLowerCase());
    if (match) {
      setWalletCharge(match.departmentFee.toString());
      setServiceCharge(match.serviceCharge.toString());
      if (match.defaultWallet) {
        setSelectedWallet(match.defaultWallet);
      }
    }
    setShowServiceDropdown(false);
    setServiceSelectedIndex(-1);
  };

  const handleCustomerKeyDown = (e) => {
    if (!showNameDropdown || nameSuggestions.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setCustomerSelectedIndex(prev => (prev < nameSuggestions.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setCustomerSelectedIndex(prev => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === 'Enter') {
      if (customerSelectedIndex >= 0 && customerSelectedIndex < nameSuggestions.length) {
        e.preventDefault();
        handleCustomerSelect(nameSuggestions[customerSelectedIndex]);
      }
    }
  };

  const handleServiceKeyDown = (e) => {
    if (!showServiceDropdown || serviceSuggestions.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setServiceSelectedIndex(prev => (prev < serviceSuggestions.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setServiceSelectedIndex(prev => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === 'Enter') {
      if (serviceSelectedIndex >= 0 && serviceSelectedIndex < serviceSuggestions.length) {
        e.preventDefault();
        handleServiceSelect(serviceSuggestions[serviceSelectedIndex].name);
      }
    }
  };

  const handleAddService = () => {
    if (!selectedService.trim()) {
      alert("Please select a service first.");
      return;
    }
    
    if (parseFloat(walletCharge) > 0 && !selectedWallet) {
      alert("Please select a wallet type.");
      return;
    }

    const newItem = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      serviceName: selectedService,
      walletCharge: walletCharge || '0',
      walletType: selectedWallet || '',
      serviceCharge: serviceCharge || '0',
      quantity: quantity || '1',
      total: ((parseFloat(serviceCharge) || 0) + (parseFloat(walletCharge) || 0)) * (parseInt(quantity) || 1),
      serviceStatus: SVC_STATUS.NOT_STARTED,
    };

    setBillItems(prev => [...prev, newItem]);

    // Reset Form
    setSelectedService('');
    setWalletCharge('');
    setServiceCharge('');
    setQuantity('1');
  };

  const removeBillItem = (id) => {
    setBillItems(prev => prev.filter(item => item.id !== id));
  };

  const updateBillItem = (id, field, value) => {
    setBillItems(prev => prev.map(item => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: value };
        updatedItem.total = ((parseFloat(updatedItem.serviceCharge) || 0) + (parseFloat(updatedItem.walletCharge) || 0)) * (parseInt(updatedItem.quantity) || 1);
        return updatedItem;
      }
      return item;
    }));
  };

  const clearForm = () => {
    setMobileNumber('');
    setCustomerName('');
    setBillItems([]);
    setGpayAmount('');
    setCashAmount('');
    setSelectedService('');
    setWalletCharge('');
    setServiceCharge('');
    setQuantity('1');
    setEditingRowIndex(null);
    setEditingBookingId(null);
    
    // Auto focus the service input after clearing the form
    setTimeout(() => {
      serviceInputRef.current?.focus();
    }, 50);
  };

  // Check if credit warning should be shown
  const creditWarningNeeded = balance < 0 && (!customerName.trim() || !mobileNumber.trim());

  const updateWalletBalances = async (items, gpayAmt, cashAmt) => {
    try {
      const rows = await getRows(SHEETS_CONFIG.walletSheetName);
      if (!rows || rows.length <= 1) return;

      const headers = rows[0].map(h => (h || '').toString().trim().toLowerCase());
      const nameIdx = headers.indexOf('wallet name');
      const balanceIdx = headers.indexOf('current balance');
      if (nameIdx === -1 || balanceIdx === -1) return;

      const deltas = {};
      items.forEach(item => {
        const wName = item.walletType || 'Cash';
        const fee = (parseFloat(item.walletCharge) || 0) * (parseInt(item.quantity) || 1);
        if (fee > 0) {
          deltas[wName] = (deltas[wName] || 0) - fee;
        }
      });

      if (parseFloat(gpayAmt) > 0) {
        deltas['UPI'] = (deltas['UPI'] || 0) + parseFloat(gpayAmt);
      }
      if (parseFloat(cashAmt) > 0) {
        deltas['Cash'] = (deltas['Cash'] || 0) + parseFloat(cashAmt);
      }

      const now = new Date();
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const updatedStr = `${String(now.getDate()).padStart(2, '0')} ${months[now.getMonth()]} ${now.getFullYear()}, ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (row.length > nameIdx) {
          const wName = (row[nameIdx] || '').toString().trim();
          if (deltas.hasOwnProperty(wName)) {
            let currentVal = 0;
            if (row.length > balanceIdx) {
              currentVal = parseFloat(row[balanceIdx]) || 0;
            }
            const newVal = currentVal + deltas[wName];
            await updateRowColumns(SHEETS_CONFIG.walletSheetName, i + 1, {
              'current balance': newVal.toFixed(2),
              'last updated': updatedStr
            });
          }
        }
      }
    } catch (error) {
      console.error('Error updating wallet balances:', error);
    }
  };

  // ── Cycle service status: not_started → in_progress → completed → not_started
  const cycleServiceStatus = (id) => {
    const cycle = {
      [SVC_STATUS.NOT_STARTED]: SVC_STATUS.IN_PROGRESS,
      [SVC_STATUS.IN_PROGRESS]: SVC_STATUS.COMPLETED,
      [SVC_STATUS.COMPLETED]:   SVC_STATUS.NOT_STARTED,
    };
    setBillItems(prev => prev.map(item =>
      item.id === id ? { ...item, serviceStatus: cycle[item.serviceStatus] || SVC_STATUS.NOT_STARTED } : item
    ));
  };

  // ── Shared save helper — writes one row per service with same booking_id ──
  const saveBooking = async ({ forceAllCompleted = false } = {}) => {
    if (isSaving) return;
    if (billItems.length === 0) {
      alert('No items in the bill!');
      return;
    }
    if (creditWarningNeeded) {
      alert('Please enter Customer Name and Mobile Number for credit / pending bills.');
      return;
    }

    setIsSaving(true);
    try {
      const bookingId = editingBookingId || Date.now().toString();
      const now = new Date();
      const timeStr = now.toLocaleTimeString();
      const gpay = parseFloat(gpayAmount) || 0;
      const cash = parseFloat(cashAmount) || 0;
      const amountPaid = gpay + cash;
      const bal = amountPaid - totalAmount;

      const statuses = forceAllCompleted
        ? billItems.map(() => SVC_STATUS.COMPLETED)
        : billItems.map(item => item.serviceStatus || SVC_STATUS.NOT_STARTED);

      const billType = determineBillType(statuses, amountPaid, totalAmount);

      const rows = billItems.map((item, idx) => [
        todayStr,                                          // A
        timeStr,                                           // B
        staffName,                                         // C
        mobileNumber || '',                                // D
        customerName || 'Walk-in Customer',                // E
        item.serviceName,                                  // F
        item.quantity || 1,                                // G
        parseFloat(item.walletCharge) || 0,                // H dept_fee
        parseFloat(item.serviceCharge) || 0,               // I service_charge
        parseFloat(item.total) || 0,                       // J row_total
        item.walletType || '',                             // K
        statuses[idx],                                     // L service_status
        bookingId,                                         // M booking_id
        billType,                                          // N bill_type
        totalAmount,                                       // O booking_total
        amountPaid,                                        // P amount_paid
        gpay,                                              // Q gpay_amount
        cash,                                              // R cash_amount
        bal,                                               // S balance
        '',                                                // T remarks
      ]);

      if (editingBookingId) {
        // Fetch current rows to get latest indices matching this booking ID
        const allRows = await getRows(SHEETS_CONFIG.serviceEntrySheetName);
        const matchingRows = [];
        if (allRows && allRows.length > 0) {
          for (let i = 1; i < allRows.length; i++) {
            const rowBookingId = (allRows[i][12] || '').toString().trim();
            if (rowBookingId === bookingId) {
              matchingRows.push({ rowIndex: i + 1 });
            }
          }
        }

        // Update existing rows, append extra ones, or clear excess rows
        const maxLen = Math.max(rows.length, matchingRows.length);
        for (let i = 0; i < maxLen; i++) {
          if (i < rows.length && i < matchingRows.length) {
            await updateRow(SHEETS_CONFIG.serviceEntrySheetName, matchingRows[i].rowIndex, rows[i]);
          } else if (i < rows.length) {
            await appendRow(SHEETS_CONFIG.serviceEntrySheetName, rows[i]);
          } else {
            // Write empty row
            await clearRow(SHEETS_CONFIG.serviceEntrySheetName, matchingRows[i].rowIndex, 20);
          }
        }
      } else if (editingRowIndex !== null) {
        // Legacy single row edit
        await updateRow(SHEETS_CONFIG.serviceEntrySheetName, editingRowIndex, rows[0]);
      } else {
        // Write all service rows in one API call
        await appendRows(SHEETS_CONFIG.serviceEntrySheetName, rows);
      }

      // Update customer ledger
      const enteredMobile = (mobileNumber || '').trim();
      const enteredName = (customerName || '').trim().toLowerCase();
      let existingCustomer = null;
      if (enteredMobile || enteredName) {
        existingCustomer = customers.find(c =>
          (enteredMobile && c.phone === enteredMobile) ||
          (enteredName && c.name.toLowerCase() === enteredName)
        );
      }
      const accTotalPaid = (existingCustomer ? parseFloat(existingCustomer.totalPaid || 0) : 0) + amountPaid;
      const accGpay = (existingCustomer ? parseFloat(existingCustomer.gpayUpi || 0) : 0) + gpay;
      const accCash = (existingCustomer ? parseFloat(existingCustomer.cash || 0) : 0) + cash;
      const customerRow = [
        existingCustomer ? existingCustomer.id : bookingId,
        customerName || 'Walk-in Customer',
        mobileNumber || '',
        '', '', 'Auto-added via Service Entry',
        accTotalPaid, accGpay, accCash, bal,
      ];
      if (existingCustomer && existingCustomer.rowIndex > 0) {
        await updateRow(SHEETS_CONFIG.customerSheetName, existingCustomer.rowIndex, customerRow);
      } else {
        await appendRow(SHEETS_CONFIG.customerSheetName, customerRow);
      }

      if (billType === BILL_TYPES.COMPLETED || billType === BILL_TYPES.SERVICE_PENDING) {
        await updateWalletBalances(billItems, gpayAmount, cashAmount);
      }

      const shortId = bookingId.slice(-6);
      const destLabel = {
        [BILL_TYPES.COMPLETED]:       '✅ Service Reports',
        [BILL_TYPES.SERVICE_PENDING]: '📋 Saved Bills (services pending)',
        [BILL_TYPES.CREDIT_PENDING]:  '💳 Credit Details (payment pending)',
        [BILL_TYPES.PARTIAL_PAYMENT]: '💳 Credit Details (partial payment)',
      }[billType] || 'Service Reports';

      showToast(`Bill #${shortId} saved → ${destLabel}`);
      clearForm();
    } catch (error) {
      console.error('Error saving bill:', error);
      alert('Failed to save bill. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // F9 — Complete Bill (Enforces all services completed)
  const handleComplete = () => {
    const allDone = billItems.length > 0 && billItems.every(i => i.serviceStatus === SVC_STATUS.COMPLETED);
    if (!allDone) {
      alert("Cannot complete the bill. Please mark all services as 'Completed' first, or press 'Save' (F8) to save this as a pending bill.");
      return;
    }
    saveBooking({ forceAllCompleted: false });
  };

  // F8 — Save Bill (allows saving service-pending bills)
  const handleSavePending = () => saveBooking({ forceAllCompleted: false });

  // Keyboard Shortcuts (F7 - F10, Alt combinations)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'F9') {
        e.preventDefault();
        handleComplete();
      } else if (e.key === 'F8') {
        e.preventDefault();
        handleSavePending();
      } else if (e.key === 'F7') {
        e.preventDefault();
        if (balance < 0) {
          setCashAmount((parseFloat(cashAmount || 0) + Math.abs(balance)).toFixed(2));
        }
      } else if (e.key === 'F10') {
        e.preventDefault();
        clearForm();
      } else if (e.altKey && e.key.toLowerCase() === 'w') {
        e.preventDefault();
        const formattedText = `Smart Akshaya - Total Amount: ₹${totalAmount.toFixed(2)}`;
        window.open(`https://wa.me/91${mobileNumber}?text=${encodeURIComponent(formattedText)}`, '_blank');
      } else if (e.altKey && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        setShowCalculator(!showCalculator);
      } else if (e.altKey && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        handlePrintPdf();
      } else if (e.altKey && e.key.toLowerCase() === 'g') {
        e.preventDefault();
        gpayRef.current?.focus();
      } else if (e.altKey && e.key.toLowerCase() === 'c') {
        e.preventDefault();
        cashRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [billItems, customerName, mobileNumber, gpayAmount, cashAmount, selectedService, walletCharge, serviceCharge, quantity, selectedWallet, balance, totalAmount, showCalculator]);

  const handlePrintPdf = async () => {
    try {
      const entryData = {
        customerName,
        mobileNumber,
        staffName,
        billItems,
        totalAmount
      };
      const pdfUrl = await generateInvoicePdf(entryData);
      window.open(pdfUrl, '_blank');
    } catch (e) {
      console.error(e);
      alert(`Failed to generate PDF: ${e.message}\nMake sure invoice_template.pdf is present in the public folder and accessible.`);
    }
  };

  return (
    <div className="entry-page">

      {/* Success Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: '24px', right: '24px',
          background: '#ECFDF5', border: '1px solid #10B981', color: '#065F46',
          padding: '16px 24px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '12px',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
          zIndex: 9999, fontWeight: '700', fontSize: '15px', animation: 'slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
        }}>
          <CheckCircle size={22} color="#10B981" />
          {toast}
        </div>
      )}

      {/* Loading Overlay */}
      {isSaving && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          zIndex: 9998, color: 'white'
        }}>
          <div style={{ width: '48px', height: '48px', border: '4px solid rgba(255,255,255,0.2)', borderTopColor: '#10B981', borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: '16px' }} />
          <div style={{ fontSize: '18px', fontWeight: '600' }}>Processing Bill...</div>
        </div>
      )}

      {/* Hero Header Section */}
      <div className="entry-hero">
        <div className="entry-hero-main">
          <div className="entry-hero-label">
            BILLING DASHBOARD
            {isRefreshing && <RefreshCw size={14} className="animate-spin" />}
          </div>
          <div className="entry-hero-amount">
            <span className="entry-hero-currency">₹</span>
            {totalAmount.toFixed(2)}
          </div>
        </div>

        <div className="entry-hero-meta">
          <div className="entry-hero-meta-card">
            <Calendar size={24} opacity={0.9} />
            <div>
              <div className="entry-hero-meta-label">DATE</div>
              <div className="entry-hero-meta-value">{new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
            </div>
          </div>
          <div className="entry-hero-meta-card">
            <User size={24} opacity={0.9} />
            <div>
              <div className="entry-hero-meta-label">STAFF</div>
              <div className="entry-hero-meta-value">{staffName}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Stack Layout */}
      <div className="entry-stack">

        {/* Customer Details Card */}
        <div className="entry-card glass-panel glow-card" style={{ overflow: 'visible', zIndex: 10 }}>
          <h3 className="card-title entry-card-title">
            <User size={18} style={{ color: 'var(--primary)' }} />
            Customer Details
          </h3>

          <div className="entry-form-grid-2">
            <div>
              <label className="form-label">MOBILE NUMBER</label>
              <div style={{ display: 'flex', position: 'relative' }}>
                <Phone size={16} style={{ position: 'absolute', left: '16px', top: '14px', color: '#94A3B8' }} />
                <input
                  type="tel"
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  placeholder="Enter mobile number"
                  className="form-input"
                  style={{ paddingLeft: '44px' }}
                />
              </div>
            </div>

            <div ref={nameRef}>
              <label className="form-label">CUSTOMER NAME</label>
              <div style={{ position: 'relative' }}>
                <User size={16} style={{ position: 'absolute', left: '16px', top: '14px', color: '#94A3B8' }} />
                {isLoadingCustomers && (
                  <div style={{ position: 'absolute', right: '16px', top: '14px' }}>
                    <RefreshCw size={16} className="animate-spin text-slate-400" />
                  </div>
                )}
                  <input
                  type="text"
                  value={customerName}
                  onChange={(e) => handleNameChange(e.target.value)}
                  onKeyDown={handleCustomerKeyDown}
                  placeholder="Search customer..."
                  className="form-input"
                  style={{ paddingLeft: '44px' }}
                  autoComplete="off"
                />
                {showNameDropdown && nameSuggestions.length > 0 && (
                  <div ref={nameDropdownRef} style={dropdownStyle}>
                    {nameSuggestions.map((c, i) => (
                      <div
                        key={i}
                        onMouseDown={() => handleCustomerSelect(c)}
                        style={{
                          ...dropdownItemStyle,
                          background: i === customerSelectedIndex ? '#EFF6FF' : 'white',
                          borderLeft: i === customerSelectedIndex ? '4px solid #3B82F6' : '4px solid transparent',
                          paddingLeft: i === customerSelectedIndex ? '10px' : '14px'
                        }}
                        onMouseEnter={() => setCustomerSelectedIndex(i)}
                      >
                        <div style={{ fontWeight: '600', color: i === customerSelectedIndex ? '#1E3A8A' : '#1E293B', fontSize: '13px' }}>{c.name}</div>
                        <div style={{ fontSize: '12px', color: i === customerSelectedIndex ? '#3B82F6' : '#64748B' }}>📞 {c.phone}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Add Service Card */}
        <div className="entry-card glass-panel glow-card" style={{ overflow: 'visible', zIndex: 9 }}>
          <h3 className="card-title entry-card-title">
            <Grid size={18} style={{ color: 'var(--primary)' }} />
            Add Service
          </h3>

          <div className="entry-service-form">
            <div className="entry-service-field entry-service-field--wide" ref={serviceRef}>
              <label className="form-label">SERVICES</label>
              <div style={{ position: 'relative' }}>
                <input
                  ref={serviceInputRef}
                  type="text"
                  value={selectedService}
                  onChange={(e) => handleServiceChange(e.target.value)}
                  onKeyDown={handleServiceKeyDown}
                  onFocus={(e) => {
                    if (selectedService) handleServiceChange(selectedService);
                    else {
                      setServiceSuggestions(services);
                      setShowServiceDropdown(true);
                      setServiceSelectedIndex(0);
                    }
                  }}
                  placeholder="Search service..."
                  className="form-input"
                  autoComplete="off"
                />
                {showServiceDropdown && serviceSuggestions.length > 0 && (
                  <div ref={serviceDropdownRef} style={dropdownStyle}>
                    {serviceSuggestions.map((s, i) => (
                      <div
                        key={i}
                        onMouseDown={() => handleServiceSelect(s.name)}
                        style={{
                          ...dropdownItemStyle,
                          background: i === serviceSelectedIndex ? '#EFF6FF' : 'white',
                          borderLeft: i === serviceSelectedIndex ? '4px solid #3B82F6' : '4px solid transparent',
                          paddingLeft: i === serviceSelectedIndex ? '10px' : '14px'
                        }}
                        onMouseEnter={() => setServiceSelectedIndex(i)}
                      >
                        <div style={{ fontWeight: '600', color: i === serviceSelectedIndex ? '#1E3A8A' : '#1E293B', fontSize: '13px' }}>{s.name}</div>
                        <div style={{ fontSize: '12px', color: i === serviceSelectedIndex ? '#3B82F6' : '#64748B' }}>Srv: ₹{s.serviceCharge} | Dept: ₹{s.departmentFee}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="entry-service-field">
              <label className="form-label">WALLET CHG.</label>
              <input type="number" value={walletCharge} onChange={(e) => setWalletCharge(e.target.value)} placeholder="0" className="form-input" />
            </div>

            <div className="entry-service-field">
              <label className="form-label">WALLET</label>
              <select value={selectedWallet} onChange={(e) => setSelectedWallet(e.target.value)} className="form-input">
                <option value="">Select Wallet</option>
                {wallets.map((w, i) => (
                  <option key={i} value={w.name}>
                    {w.name} {w.balance !== null ? `(₹${w.balance.toLocaleString('en-IN')})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="entry-service-field">
              <label className="form-label">SRV. CHG.</label>
              <input type="number" value={serviceCharge} onChange={(e) => setServiceCharge(e.target.value)} placeholder="0" className="form-input" />
            </div>

            <div className="entry-service-field entry-service-field--qty">
              <label className="form-label">QTY</label>
              <input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="1" className="form-input" />
            </div>

            <div className="entry-service-field entry-service-field--add">
              <button type="button" onClick={handleAddService} className="btn btn-primary entry-add-btn">
                <Plus size={16} /> Add
              </button>
            </div>
          </div>
        </div>

        {/* Bill Items List Table */}
        <div className="entry-card entry-card--flush glass-panel glow-card">
          <div className="entry-bill-header">
            <h3 className="card-title entry-card-title entry-card-title--flush">
              <Receipt size={18} style={{ color: 'var(--primary)' }} />
              Bill Items
            </h3>
          </div>

          {billItems.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#94A3B8' }}>
              <Receipt size={40} style={{ opacity: 0.3, margin: '0 auto 16px' }} />
              <div style={{ fontSize: '15px', fontWeight: '500' }}>No items added to bill yet</div>
            </div>
          ) : (
            <div className="entry-bill-table-wrap">
              <table className="entry-bill-table">
                <thead>
                  <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                    <th style={{ ...thStyle, width: '4%' }}>#</th>
                    <th style={{ ...thStyle, width: '28%' }}>Service Name</th>
                    <th style={{ ...thStyle, width: '15%' }}>Status</th>
                    <th style={{ ...thStyle, width: '11%' }}>Wallet Charge</th>
                    <th style={{ ...thStyle, width: '15%' }}>Wallet</th>
                    <th style={{ ...thStyle, width: '11%' }}>Service Charge</th>
                    <th style={{ ...thStyle, width: '6%' }}>Qty</th>
                    <th style={{ ...thStyle, width: '6%', textAlign: 'right' }}>Total</th>
                    <th style={{ ...thStyle, width: '4%', textAlign: 'center' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {billItems.map((item, index) => {
                    const svcSt = item.serviceStatus || SVC_STATUS.NOT_STARTED;
                    const svcCfg = {
                      [SVC_STATUS.NOT_STARTED]: { label: 'Not Started', bg: '#F1F5F9', color: '#64748B', Icon: Circle },
                      [SVC_STATUS.IN_PROGRESS]: { label: 'In Progress', bg: '#FEF3C7', color: '#B45309', Icon: Loader },
                      [SVC_STATUS.COMPLETED]:   { label: 'Completed',   bg: '#ECFDF5', color: '#059669', Icon: CheckSquare },
                    }[svcSt] || { label: svcSt, bg: '#F1F5F9', color: '#64748B', Icon: Circle };
                    return (
                      <tr key={item.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                        <td style={tdStyle}>{index + 1}</td>
                        <td style={{ ...tdStyle, fontWeight: '600', color: '#1E293B' }}>{item.serviceName}</td>
                        <td style={tdStyle}>
                          <select
                            value={item.serviceStatus || SVC_STATUS.NOT_STARTED}
                            onChange={(e) => updateBillItem(item.id, 'serviceStatus', e.target.value)}
                            style={{ ...tableInputStyle, fontWeight: '700', color: '#334155' }}
                          >
                            <option value={SVC_STATUS.NOT_STARTED}>Not Started</option>
                            <option value={SVC_STATUS.IN_PROGRESS}>In Progress</option>
                            <option value={SVC_STATUS.COMPLETED}>Completed</option>
                          </select>
                        </td>
                        <td style={tdStyle}>
                          <input type="number" value={item.walletCharge} onChange={(e) => updateBillItem(item.id, 'walletCharge', e.target.value)} style={tableInputStyle} />
                        </td>
                        <td style={tdStyle}>
                          <select value={item.walletType || ''} onChange={(e) => updateBillItem(item.id, 'walletType', e.target.value)} style={tableInputStyle}>
                            <option value="">Select Wallet</option>
                            {wallets.map((w, i) => (
                              <option key={i} value={w.name}>
                                {w.name} {w.balance !== null ? `(₹${w.balance.toLocaleString('en-IN')})` : ''}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td style={tdStyle}>
                          <input type="number" value={item.serviceCharge} onChange={(e) => updateBillItem(item.id, 'serviceCharge', e.target.value)} style={tableInputStyle} />
                        </td>
                        <td style={tdStyle}>
                          <input type="number" value={item.quantity} onChange={(e) => updateBillItem(item.id, 'quantity', e.target.value)} style={tableInputStyle} />
                        </td>
                        <td style={{ ...tdStyle, fontWeight: 'bold', color: '#10B981', textAlign: 'right' }}>
                          ₹{(parseFloat(item.total) || 0).toFixed(2)}
                        </td>
                        <td style={{ ...tdStyle, textAlign: 'center' }}>
                          <button onClick={() => removeBillItem(item.id)} style={{ border: 'none', background: '#FEF2F2', color: '#EF4444', padding: '6px', borderRadius: '6px', cursor: 'pointer' }}>
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Payment & Summary Panel */}
      <div className="entry-payment-section">
        <div className="entry-card glass-panel glow-card">
          <h3 className="card-title entry-card-title">
            <DollarSign size={18} style={{ color: 'var(--primary)' }} />
            Payment & Summary
          </h3>

          <div className="entry-payment-grid">
            {/* Left Side: Inputs */}
            <div className="entry-payment-inputs">
              <div className="entry-form-grid-2 entry-form-grid-2--tight">
                <div>
                  <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                    GPAY/UPI <span style={shortcutBadgeStyle}>Alt+G</span>
                  </label>
                  <div style={{ position: 'relative' }}>
                    <CreditCard size={16} style={{ position: 'absolute', left: '16px', top: '14px', color: '#94A3B8' }} />
                    <input ref={gpayRef} type="number" value={gpayAmount} onChange={(e) => setGpayAmount(e.target.value)} placeholder="0.00" className="form-input" style={{ paddingLeft: '44px' }} />
                  </div>
                </div>
                <div>
                  <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                    CASH <span style={shortcutBadgeStyle}>Alt+C</span>
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Banknote size={16} style={{ position: 'absolute', left: '16px', top: '14px', color: '#94A3B8' }} />
                    <input ref={cashRef} type="number" value={cashAmount} onChange={(e) => setCashAmount(e.target.value)} placeholder="0.00" className="form-input" style={{ paddingLeft: '44px' }} />
                  </div>
                </div>
              </div>


              <div className="entry-form-grid-2 entry-form-grid-2--tight entry-form-grid-2--mb">
                <div>
                  <label className="form-label">TOTAL PAID</label>
                  <div className="form-input" style={{ background: '#F8FAFC', display: 'flex', alignItems: 'center', fontWeight: 'bold' }}>
                    ₹{totalPaid.toFixed(2)}
                  </div>
                </div>
                <div>
                  <label className="form-label">BALANCE</label>
                  <div className="form-input" style={{ background: '#F8FAFC', display: 'flex', alignItems: 'center', fontWeight: 'bold', color: balanceColor }}>
                    ₹{balance.toFixed(2)}
                  </div>
                </div>
              </div>

              {/* Left Side Actions */}
              <div className="entry-payment-actions">
                <button type="button" onClick={() => { if (balance < 0) { setCashAmount((parseFloat(cashAmount || 0) + Math.abs(balance)).toFixed(2)); } }} className="entry-action-btn entry-action-btn--green" title="F7">
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Banknote size={16} /> Settle Cash Balance</span> <span style={{ ...shortcutBadgeStyle, background: 'rgba(255,255,255,0.2)', color: 'white', borderColor: 'rgba(255,255,255,0.3)' }}>F7</span>
                </button>
                <button type="button" onClick={() => { setCalcPaid(''); setShowCalculator(true); }} className="entry-action-btn entry-action-btn--blue" title="Alt+B">
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Calculator size={16} /> Calc</span> <span style={{ ...shortcutBadgeStyle, background: 'rgba(255,255,255,0.2)', color: 'white', borderColor: 'rgba(255,255,255,0.3)' }}>Alt+B</span>
                </button>
                <button type="button" onClick={handleSavePending} disabled={creditWarningNeeded} className="entry-action-btn entry-action-btn--amber" title="F8">
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Clock size={16} /> Save </span> <span style={{ ...shortcutBadgeStyle, background: 'rgba(255,255,255,0.2)', color: 'white', borderColor: 'rgba(255,255,255,0.3)' }}>F8</span>
                </button>
              </div>
            </div>

            {/* Right Side: Summary */}
            <div className="entry-summary-box">
              <div className="entry-summary-panel">
                <div style={summaryRowStyle}>
                  <span style={{ color: '#64748B' }}>Wallet Charge</span>
                  <span style={{ fontWeight: '600' }}>₹{walletChargeTotal.toFixed(2)}</span>
                </div>
                <div style={summaryRowStyle}>
                  <span style={{ color: '#64748B' }}>Service Charge</span>
                  <span style={{ fontWeight: '600' }}>₹{serviceChargeTotal.toFixed(2)}</span>
                </div>
                <div style={{ ...summaryRowStyle, fontWeight: '700', borderTop: '1px dashed #CBD5E1', paddingTop: '8px', marginTop: '4px' }}>
                  <span>Bill Total</span>
                  <span>₹{billTotal.toFixed(2)}</span>
                </div>
                <div style={summaryRowStyle}>
                  <span style={{ color: '#64748B' }}>Previous Balance</span>
                  <span>₹{previousBalance.toFixed(2)}</span>
                </div>
                <div style={{ ...summaryRowStyle, fontWeight: '800', fontSize: '18px', borderTop: '1px solid #E2E8F0', paddingTop: '12px', marginTop: '8px', color: '#1E3A8A' }}>
                  <span>Total Amount</span>
                  <span>₹{totalAmount.toFixed(2)}</span>
                </div>
                <div style={{ ...summaryRowStyle, fontWeight: '600' }}>
                  <span style={{ color: '#64748B' }}>Total Paid</span>
                  <span>₹{totalPaid.toFixed(2)}</span>
                </div>
                <div style={{ ...summaryRowStyle, fontWeight: '800', fontSize: '16px', color: balanceColor }}>
                  <span>Balance</span>
                  <span>₹{balance.toFixed(2)}</span>
                </div>
              </div>

              {/* Credit Warning Banner */}
              {creditWarningNeeded && (
                <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '8px', padding: '12px 16px', marginBottom: '20px', display: 'flex', alignItems: 'flex-start', gap: '12px', color: '#991B1B' }}>
                  <span style={{ fontSize: '16px' }}>⚠️</span>
                  <span style={{ fontWeight: '600', fontSize: '13px' }}>Please enter Customer Name and Mobile Number for credit entries.</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Action Bar */}
        <div className="entry-card entry-bottom-actions glass-panel glow-card">
          <button type="button" onClick={clearForm} className="entry-bottom-btn entry-bottom-btn--danger" title="F10">
            <Trash2 size={16} /> Clear Form <span style={{ ...shortcutBadgeStyle, borderColor: '#FECACA', color: '#EF4444', background: 'white' }}>F10</span>
          </button>
          <button type="button" onClick={handlePrintPdf} className="entry-bottom-btn entry-bottom-btn--print" title="Alt+P">
            <Printer size={16} /> Print <span style={{ ...shortcutBadgeStyle, borderColor: '#BFDBFE', color: '#3B82F6', background: 'white' }}>Alt+P</span>
          </button>
          <button type="button" onClick={() => { const formattedText = `Smart Akshaya - Total Amount: ₹${totalAmount.toFixed(2)}`; window.open(`https://wa.me/91${mobileNumber}?text=${encodeURIComponent(formattedText)}`, '_blank'); }} className="entry-bottom-btn entry-bottom-btn--share" title="Alt+W">
            <Send size={16} /> Share <span style={{ ...shortcutBadgeStyle, borderColor: '#A7F3D0', color: '#10B981', background: 'white' }}>Alt+W</span>
          </button>
          <button type="button" onClick={handleComplete} disabled={creditWarningNeeded} className="entry-bottom-btn entry-bottom-btn--complete" title="F9">
            <CheckCircle size={20} /> Complete Bill <span style={{ ...shortcutBadgeStyle, background: 'rgba(255,255,255,0.2)', color: 'white', borderColor: 'rgba(255,255,255,0.3)', fontSize: '12px', padding: '4px 8px' }}>F9</span>
          </button>
        </div>

      </div>

      {/* Floating Calculator Modal */}
      {showCalculator && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000 }}>
          <div className="glass-panel" style={{ width: '320px', padding: '24px', animation: 'slideUp 0.3s ease-out' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold', color: '#1E293B', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Calculator size={18} style={{ color: 'var(--primary)' }} /> Balance Calculator
              </h4>
              <button onClick={() => setShowCalculator(false)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#94A3B8' }}><X size={18} /></button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label className="form-label">Total charges</label>
                <div className="form-input" style={{ background: '#F8FAFC', display: 'flex', alignItems: 'center', fontWeight: 'bold' }}>₹{totalAmount.toFixed(2)}</div>
              </div>
              <div>
                <label className="form-label">Customer paid</label>
                <input type="number" value={calcPaid} onChange={(e) => setCalcPaid(e.target.value)} placeholder="0.00" className="form-input" autoFocus />
              </div>
              <div>
                <label className="form-label">Balance amount</label>
                <div className="form-input" style={{ background: '#F8FAFC', display: 'flex', alignItems: 'center', fontWeight: 'bold', color: (parseFloat(calcPaid) || 0) - totalAmount >= 0 ? '#10B981' : '#EF4444' }}>
                  ₹{((parseFloat(calcPaid) || 0) - totalAmount).toFixed(2)}
                </div>
              </div>
              <button onClick={() => setShowCalculator(false)} className="btn btn-outline" style={{ marginTop: '8px' }}>Close</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}

// Reusable Styles
const thStyle = { padding: '12px 16px', fontSize: '11px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px' };
const tdStyle = { padding: '12px 16px', fontSize: '14px', color: '#334155', verticalAlign: 'middle' };
const tableInputStyle = { width: '100%', height: '32px', padding: '0 8px', borderRadius: '6px', border: '1px solid #CBD5E1', background: '#FFF', fontSize: '13px', color: '#1E293B', outline: 'none', boxSizing: 'border-box' };
const summaryRowStyle = { display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '8px', color: '#334155' };
const shortcutBadgeStyle = { background: '#F1F5F9', border: '1px solid #E2E8F0', padding: '2px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: '700', color: '#64748B' };

const dropdownStyle = { position: 'absolute', top: '100%', left: 0, right: 0, background: 'white', border: '1px solid #CBD5E1', borderRadius: '8px', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', zIndex: 1000, maxHeight: '220px', overflowY: 'auto', marginTop: '4px' };
const dropdownItemStyle = { padding: '10px 14px', cursor: 'pointer', background: 'white', borderBottom: '1px solid #F1F5F9', transition: 'background 0.15s' };
