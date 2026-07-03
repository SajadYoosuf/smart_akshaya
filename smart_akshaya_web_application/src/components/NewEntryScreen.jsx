import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { User, Grid, Receipt, Plus, Trash2, Search, Check, Calculator } from 'lucide-react';
import { getRows, appendRow } from '../services/googleSheetsService';
import { SHEETS_CONFIG } from '../config/sheetsConfig';

export default function NewEntryScreen({ userSession }) {
  const [staffName, setStaffName] = useState('Staff User');
  const [centreName, setCentreName] = useState('Smart Akshaya');
  
  // Data lists
  const [services, setServices] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [wallets, setWallets] = useState([]);
  
  // Form State - Customer
  const [mobileNumber, setMobileNumber] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [isSearchingCustomer, setIsSearchingCustomer] = useState(false);

  // Search dropdown state
  const [nameSuggestions, setNameSuggestions] = useState([]);
  const [showNameDropdown, setShowNameDropdown] = useState(false);
  const nameRef = useRef(null);
  
  const getEmptyBillItem = () => ({
    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
    serviceName: '',
    serviceCharge: '',
    walletCharge: '',
    walletType: '',
    quantity: '1',
    total: 0
  });

  // Bill State
  const [billItems, setBillItems] = useState([getEmptyBillItem()]);
  const [gpayAmount, setGpayAmount] = useState('');
  const [cashAmount, setCashAmount] = useState('');
  
  // Computed
  const walletChargeTotal = billItems.reduce((acc, item) => acc + ((parseFloat(item.walletCharge) || 0) * (parseInt(item.quantity) || 1)), 0);
  const serviceChargeTotal = billItems.reduce((acc, item) => acc + ((parseFloat(item.serviceCharge) || 0) * (parseInt(item.quantity) || 1)), 0);
  const billTotal = walletChargeTotal + serviceChargeTotal;
  const previousBalance = 0;
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

  const loadData = async () => {
    try {
      // Load Services
      const svcRows = await getRows(SHEETS_CONFIG.serviceSheetName);
      if (svcRows.length > 1) {
        const headers = svcRows[0].map(h => h.trim().toLowerCase());
        const svcNameIdx = headers.indexOf('service name');
        const deptFeeIdx = headers.indexOf('department fee');
        const svcChargeIdx = headers.indexOf('service charge');
        
        if (svcNameIdx !== -1) {
          const loadedServices = svcRows.slice(1).map(row => ({
            name: row[svcNameIdx] || '',
            departmentFee: parseFloat(row[deptFeeIdx] || 0),
            serviceCharge: parseFloat(row[svcChargeIdx] || 0)
          })).filter(s => s.name);
          setServices(loadedServices);
        }
      }

      // Load Wallets
      const walletRows = await getRows(SHEETS_CONFIG.walletSheetName);
      if (walletRows.length > 1) {
        const headers = walletRows[0].map(h => h.trim().toLowerCase());
        const nameIdx = headers.indexOf('wallet name') !== -1 ? headers.indexOf('wallet name') : 0;
        const loadedWallets = walletRows.slice(1).map(row => row[nameIdx]).filter(Boolean);
        setWallets(loadedWallets);
        if (loadedWallets.length > 0) setSelectedWallet(loadedWallets[0]);
      } else {
        const defaultWallets = ['E-Sevanam', 'Akshaya', 'Panchayat'];
        setWallets(defaultWallets);
        setSelectedWallet(defaultWallets[0]);
      }
    } catch (error) {
      console.error("Failed to load initial data:", error);
    }
  };

  const loadCustomers = async () => {
    if (customers.length > 0) return customers; // already loaded, return existing
    setIsSearchingCustomer(true);
    try {
      const custRows = await getRows(SHEETS_CONFIG.customerSheetName);
      if (custRows.length > 1) {
        const headers = custRows[0].map(h => h.trim().toLowerCase());
        const nameIdx = headers.indexOf('customer name') !== -1 ? headers.indexOf('customer name') : headers.indexOf('name');
        const phoneIdx = headers.indexOf('mobile number') !== -1 ? headers.indexOf('mobile number') : headers.indexOf('phone');
        
        if (nameIdx !== -1 && phoneIdx !== -1) {
          const loadedCustomers = custRows.slice(1).map(row => ({
            name: row[nameIdx] || '',
            phone: row[phoneIdx] || ''
          })).filter(c => c.name);
          setCustomers(loadedCustomers);
          setIsSearchingCustomer(false);
          return loadedCustomers; // return immediately for use in same render cycle
        }
      }
    } catch (error) {
      console.error("Failed to load customers:", error);
    }
    setIsSearchingCustomer(false);
    return [];
  };

  const handleCustomerSelect = (customer) => {
    setCustomerName(customer.name);
    setMobileNumber(customer.phone);
    setShowMobileDropdown(false);
    setShowNameDropdown(false);
    setMobileSuggestions([]);
    setNameSuggestions([]);
  };

  // Filter customers by mobile number input
  const handleMobileChange = async (value) => {
    const cleaned = value.replace(/\D/g, '').slice(0, 10);
    setMobileNumber(cleaned);
    if (cleaned.length === 0) {
      setMobileSuggestions([]);
      setShowMobileDropdown(false);
      return;
    }
    // Ensure customers are loaded
    if (customers.length === 0) await loadCustomers();
    const filtered = customers.filter(c => c.phone && c.phone.replace(/\D/g, '').includes(cleaned));
    setMobileSuggestions(filtered.slice(0, 8));
    setShowMobileDropdown(filtered.length > 0);
  };

  // Filter customers by name input
  const handleNameChange = async (value) => {
    setCustomerName(value);
    if (value.trim().length === 0) {
      setNameSuggestions([]);
      setShowNameDropdown(false);
      return;
    }
    // Use already-loaded customers, or load and get them back immediately
    const list = customers.length > 0 ? customers : await loadCustomers();
    const lower = value.toLowerCase();
    const filtered = list.filter(c => c.name && c.name.toLowerCase().includes(lower));
    setNameSuggestions(filtered.slice(0, 8));
    setShowNameDropdown(filtered.length > 0);
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (mobileRef.current && !mobileRef.current.contains(e.target)) {
        setShowMobileDropdown(false);
      }
      if (nameRef.current && !nameRef.current.contains(e.target)) {
        setShowNameDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleServiceSelect = (id, service) => {
    updateBillItem(id, 'serviceName', service.name);
    updateBillItem(id, 'serviceCharge', service.serviceCharge.toString());
    updateBillItem(id, 'walletCharge', service.departmentFee.toString());
  };

  const addEmptyBillItem = () => {
    setBillItems(prev => [...prev, getEmptyBillItem()]);
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
    setBillItems([getEmptyBillItem()]);
    setGpayAmount('');
    setCashAmount('');
  };

  const handleComplete = async () => {
    if (billItems.length === 0) {
      alert("No items in the bill!");
      return;
    }

    try {
      // Append each bill item as a new row to Service Entries
      // Columns (expected based on general Akshaya logic): Date, Time, Customer Name, Mobile, Service Name, Service Charge, Wallet Charge, Wallet Type, Quantity, Total, Staff, Status
      for (const item of billItems) {
        const row = [
          todayStr,
          new Date().toLocaleTimeString(),
          customerName,
          mobileNumber,
          item.serviceName,
          item.serviceCharge,
          item.walletCharge,
          item.walletType,
          item.quantity,
          item.total,
          staffName,
          'Completed'
        ];
        await appendRow(SHEETS_CONFIG.serviceEntrySheetName, row);
      }

      alert("Bill completed successfully!");
      clearForm();
    } catch (error) {
      console.error("Error saving bill:", error);
      alert("Failed to save bill. Please try again.");
    }
  };

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'F9') {
        e.preventDefault();
        handleComplete();
      } else if (e.key === 'F10') {
        e.preventDefault();
        clearForm();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [billItems, customerName, mobileNumber]);

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto', fontFamily: 'Inter, sans-serif' }}>
      {/* Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <h2 style={{ margin: '0 0 6px 0', fontSize: '18px', fontWeight: 'bold', color: '#1E293B' }}>
            Billing {centreName} — Staff: {staffName}
          </h2>
          <div style={{ 
            padding: '4px 10px', 
            background: '#EFF6FF', 
            borderRadius: '6px', 
            border: '1px solid #BFDBFE',
            display: 'inline-block',
            fontSize: '12px',
            fontWeight: '600',
            color: '#1E40AF'
          }}>
            Shortcuts: F9 Complete • F10 Clear
          </div>
        </div>
        <div style={{ 
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 16px',
          background: '#F0FDF4',
          border: '1px solid #86EFAC',
          borderRadius: '8px',
          fontSize: '14px',
          fontWeight: '700',
          color: '#166534'
        }}>
          📅 {new Date().toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })}
        </div>
      </div>

      {/* Customer Details Section */}
      <SectionCard title="CUSTOMER DETAILS" icon={<User size={18} />}>
        <div style={{ display: 'flex', gap: '20px' }}>
          
          {/* Mobile Number - simple input */}
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>MOBILE NUMBER</label>
            <div style={{ display: 'flex', position: 'relative' }}>
              <div style={{ 
                position: 'absolute', left: '12px', top: '10px',
                color: '#64748B', fontWeight: '500', fontSize: '14px' 
              }}>+91</div>
              <input
                type="tel"
                value={mobileNumber}
                onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                placeholder="Enter mobile number"
                style={{ ...inputStyle, paddingLeft: '44px' }}
              />
            </div>
          </div>
          
          {/* Name with search dropdown */}
          <div style={{ flex: 1 }} ref={nameRef}>
            <label style={labelStyle}>NAME</label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                value={customerName}
                onFocus={() => { loadCustomers(); if (customerName) handleNameChange(customerName); }}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="Search by name..."
                style={inputStyle}
                autoComplete="off"
              />
              {showNameDropdown && nameSuggestions.length > 0 && (
                <div style={dropdownStyle}>
                  {nameSuggestions.map((c, i) => (
                    <div
                      key={i}
                      onMouseDown={() => handleCustomerSelect(c)}
                      style={dropdownItemStyle}
                      onMouseEnter={e => e.currentTarget.style.background = '#EFF6FF'}
                      onMouseLeave={e => e.currentTarget.style.background = 'white'}
                    >
                      <div style={{ fontWeight: '600', color: '#1E293B', fontSize: '13px' }}>{c.name}</div>
                      <div style={{ fontSize: '12px', color: '#64748B' }}>📞 {c.phone}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </SectionCard>

      {/* Service Details Section */}
      <SectionCard title="SERVICE DETAILS" icon={<Grid size={18} />}>
        {billItems.map((item, index) => (
          <div key={item.id} style={{ display: 'flex', gap: '14px', alignItems: 'flex-end', marginBottom: '16px' }}>
            <div style={{ flex: 2 }}>
              {index === 0 && <label style={labelStyle}>SERVICES</label>}
              <input
                type="text"
                value={item.serviceName}
                onChange={(e) => {
                  updateBillItem(item.id, 'serviceName', e.target.value);
                  const match = services.find(s => s.name.toLowerCase() === e.target.value.toLowerCase());
                  if (match) handleServiceSelect(item.id, match);
                }}
                placeholder="Search service..."
                style={inputStyle}
                list="service-options"
              />
              {index === 0 && (
                <datalist id="service-options">
                  {services.map((s, i) => (
                    <option key={i} value={s.name} />
                  ))}
                </datalist>
              )}
            </div>
            
            <div style={{ flex: 1 }}>
              {index === 0 && <label style={labelStyle}>WALLET CHARGE</label>}
              <input
                type="number"
                value={item.walletCharge}
                onChange={(e) => updateBillItem(item.id, 'walletCharge', e.target.value)}
                placeholder="0"
                style={inputStyle}
              />
            </div>

            <div style={{ flex: 1 }}>
              {index === 0 && <label style={labelStyle}>Wallet</label>}
              <select
                value={item.walletType}
                onChange={(e) => updateBillItem(item.id, 'walletType', e.target.value)}
                style={inputStyle}
              >
                <option value="">- Select wallet -</option>
                {wallets.map((w, i) => (
                  <option key={i} value={w}>{w}</option>
                ))}
              </select>
            </div>

            <div style={{ flex: 1 }}>
              {index === 0 && <label style={labelStyle}>SERVICE CHARGE</label>}
              <input
                type="number"
                value={item.serviceCharge}
                onChange={(e) => updateBillItem(item.id, 'serviceCharge', e.target.value)}
                placeholder="0"
                style={inputStyle}
              />
            </div>

            <div style={{ flex: 1 }}>
              {index === 0 && <label style={labelStyle}>QUANTITY</label>}
              <input
                type="number"
                value={item.quantity}
                onChange={(e) => updateBillItem(item.id, 'quantity', e.target.value)}
                placeholder="1"
                style={inputStyle}
              />
            </div>

            <div>
              {index === 0 && <label style={{ ...labelStyle, visibility: 'hidden' }}>ACTION</label>}
              {index === billItems.length - 1 ? (
                <button
                  onClick={addEmptyBillItem}
                  style={{
                    width: '40px',
                    height: '40px',
                    background: '#10B981',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    fontSize: '18px'
                  }}
                >
                  <Plus size={18} />
                </button>
              ) : (
                <button
                  onClick={() => removeBillItem(item.id)}
                  style={{
                    width: '40px',
                    height: '40px',
                    background: '#EF4444',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    fontSize: '24px',
                    paddingBottom: '4px' // To align the minus visually
                  }}
                >
                  -
                </button>
              )}
            </div>
          </div>
        ))}

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
          <div style={{
            padding: '12px 24px',
            background: '#F1F5F9',
            borderRadius: '8px',
            fontWeight: 'bold',
            fontSize: '16px',
            color: '#0F172A',
            border: '1px solid #E2E8F0',
            display: 'flex',
            alignItems: 'center'
          }}>
            Total: ₹ {billTotal.toFixed(2)}
          </div>
        </div>
      </SectionCard>
      
      <div style={{ display: 'flex', gap: '24px', padding: '20px', background: '#F8FAFC', borderTop: '1px solid #E2E8F0' }}>
            
            {/* Left - Payment Details */}
            <div style={{ flex: 4, background: 'white', borderRadius: '12px', border: '1px solid #E2E8F0', padding: '20px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: '#1E293B', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Receipt size={16} color="#3B82F6" /> Payment & Summary
              </h3>
              
              <div style={{ display: 'flex', gap: '14px', marginBottom: '20px' }}>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>GPay/UPI Alt+G</label>
                  <input
                    type="number"
                    value={gpayAmount}
                    onChange={(e) => setGpayAmount(e.target.value)}
                    placeholder="0.00"
                    style={inputStyle}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Cash Alt+C</label>
                  <input
                    type="number"
                    value={cashAmount}
                    onChange={(e) => setCashAmount(e.target.value)}
                    placeholder="0.00"
                    style={inputStyle}
                  />
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: '14px', marginBottom: '24px' }}>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Total Paid</label>
                  <div style={{ ...inputStyle, display: 'flex', alignItems: 'center', background: '#FFF' }}>
                    ₹{totalPaid.toFixed(2)}
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Balance</label>
                  <div style={{ ...inputStyle, display: 'flex', alignItems: 'center', background: '#FFF', color: balanceColor, fontWeight: 'bold' }}>
                    ₹{balance.toFixed(2)}
                  </div>
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={() => {
                    if (balance < 0) {
                      setCashAmount((parseFloat(cashAmount || 0) + Math.abs(balance)).toFixed(2));
                    }
                  }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    background: '#8B5CF6', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '4px',
                    fontWeight: 'bold', fontSize: '12px', cursor: 'pointer'
                  }}
                >
                  <Check size={15} /> Settle Cash Balance
                </button>
                <button
                  onClick={() => alert("Calculator coming soon")}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    background: '#3B82F6', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '4px',
                    fontWeight: 'bold', fontSize: '12px', cursor: 'pointer'
                  }}
                >
                  <Calculator size={15} /> Calculator
                </button>
                <button
                  onClick={() => alert("Save functionality")}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    background: '#0D9488', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '4px',
                    fontWeight: 'bold', fontSize: '12px', cursor: 'pointer'
                  }}
                >
                  Save
                </button>
              </div>
            </div>

            {/* Right - Bill Summary */}
            <div style={{ flex: 3, display: 'flex', flexDirection: 'column' }}>
              <div style={{ flex: 1 }}>
                <div style={summaryRowStyle}><span style={{ textTransform: 'uppercase', fontSize: '11px', fontWeight: 'bold' }}>WALLET CHARGE</span> <span>₹{walletChargeTotal.toFixed(2)}</span></div>
                <div style={summaryRowStyle}><span>Service Charge</span> <span>₹{serviceChargeTotal.toFixed(2)}</span></div>
                <div style={{ ...summaryRowStyle, fontWeight: 'bold' }}>
                  <span>Bill Total</span> <span>₹{billTotal.toFixed(2)}</span>
                </div>
                <div style={summaryRowStyle}><span>Previous Balance</span> <span>₹{previousBalance.toFixed(2)}</span></div>
                <div style={summaryRowStyle}><span>Total Paid</span> <span>₹{totalPaid.toFixed(2)}</span></div>
                <div style={summaryRowStyle}><span>Balance</span> <span style={{ color: balanceColor, fontWeight: 'bold' }}>₹{balance.toFixed(2)}</span></div>
                
                <div style={{ paddingTop: '12px', marginTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#1E3A8A' }}>Total Amount</span>
                  <span style={{ fontSize: '24px', fontWeight: 'bold', color: '#1E3A8A' }}>₹{totalAmount.toFixed(2)}</span>
                </div>
              </div>
              
              {/* Bottom Actions row */}
              <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: '20px' }}>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <div>
                    <label style={{ fontSize: '10px', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>Paper Size</label>
                    <select style={{ ...inputStyle, width: '70px', height: '28px', padding: '0 8px', fontSize: '12px' }}>
                      <option>A4</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: '10px', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>QR Code</label>
                    <input type="checkbox" />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '6px' }}>
                  <button onClick={handleComplete} style={{ ...actionBtnStyle, background: '#10B981' }}>
                    <Check size={14} /> Complete F9
                  </button>
                  <button style={{ ...actionBtnStyle, background: '#3B82F6' }}>
                    Print
                  </button>
                  <button style={{ ...actionBtnStyle, background: '#3B82F6' }}>
                    PDF
                  </button>
                  <button style={{ ...actionBtnStyle, background: '#10B981' }}>
                    Whatsapp
                  </button>
                  <button onClick={clearForm} style={{ ...actionBtnStyle, background: '#EF4444' }}>
                    Clear
                  </button>
                </div>
              </div>
            </div>
          </div>

    </div>
  );
}

// Reusable UI Components & Styles
const SectionCard = ({ title, icon, children, noPaddingBody = false }) => (
  <div style={{ 
    background: 'white', 
    borderRadius: '12px', 
    border: '1px solid #E2E8F0',
    marginBottom: '24px',
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
    overflow: 'hidden'
  }}>
    <div style={{ 
      padding: '12px 20px', 
      background: '#F8FAFC', 
      borderBottom: '1px solid #E2E8F0',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      color: '#475569',
      fontWeight: 'bold',
      fontSize: '13px',
      letterSpacing: '0.05em'
    }}>
      {icon}
      {title}
    </div>
    <div style={{ padding: noPaddingBody ? '0' : '20px' }}>
      {children}
    </div>
  </div>
);

const labelStyle = {
  display: 'block',
  fontSize: '11px',
  fontWeight: 'bold',
  color: '#475569',
  marginBottom: '6px'
};

const inputStyle = {
  width: '100%',
  height: '40px',
  padding: '0 12px',
  borderRadius: '8px',
  border: '1px solid #CBD5E1',
  background: '#F8FAFC',
  fontSize: '14px',
  color: '#1E293B',
  outline: 'none',
  boxSizing: 'border-box'
};

const thStyle = {
  padding: '12px 20px',
  fontSize: '11px',
  fontWeight: 'bold',
  color: '#64748B',
  textTransform: 'uppercase',
  letterSpacing: '0.05em'
};

const tdStyle = {
  padding: '14px 20px',
  fontSize: '14px',
  color: '#334155'
};

const summaryRowStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  fontSize: '13px',
  marginBottom: '8px',
  color: '#334155'
};

const actionBtnStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '4px',
  color: 'white',
  border: 'none',
  padding: '6px 12px',
  borderRadius: '4px',
  fontWeight: 'bold',
  fontSize: '11px',
  cursor: 'pointer'
};

const dropdownStyle = {
  position: 'absolute',
  top: '100%',
  left: 0,
  right: 0,
  background: 'white',
  border: '1px solid #CBD5E1',
  borderRadius: '8px',
  boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
  zIndex: 1000,
  maxHeight: '220px',
  overflowY: 'auto',
  marginTop: '4px'
};

const dropdownItemStyle = {
  padding: '10px 14px',
  cursor: 'pointer',
  background: 'white',
  borderBottom: '1px solid #F1F5F9',
  transition: 'background 0.15s'
};
