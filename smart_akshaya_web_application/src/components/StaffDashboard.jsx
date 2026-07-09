import React, { useState, useEffect, useRef } from 'react';
import { User, Users, Search, Calendar as CalendarIcon, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Phone, Layers, FileText, CheckCircle, AlertTriangle, Clock } from 'lucide-react';
import { getRows } from '../services/googleSheetsService';
import { SHEETS_CONFIG } from '../config/sheetsConfig';

export default function StaffDashboard() {
  const [staffList, setStaffList] = useState([]);
  const [selectedStaff, setSelectedStaff] = useState('');

  const [billsData, setBillsData] = useState([]);
  const [savedBillsData, setSavedBillsData] = useState([]);
  const [attendanceData, setAttendanceData] = useState([]);

  const [activeTab, setActiveTab] = useState('billed'); // 'pending', 'billed', 'attendance'

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // States for Date Pickers inside each Card
  const [dailyDate, setDailyDate] = useState(new Date());
  const [monthlyMonth, setMonthlyMonth] = useState(new Date().getMonth());
  const [monthlyYear, setMonthlyYear] = useState(new Date().getFullYear());
  const [yearlyYear, setYearlyYear] = useState(new Date().getFullYear());

  // Tab Search & Date Range Filters
  const [tabStartDate, setTabStartDate] = useState('');
  const [tabEndDate, setTabEndDate] = useState('');
  const [tabStatus, setTabStatus] = useState('All');
  const [tabSearchQuery, setTabSearchQuery] = useState('');

  const [expandedBills, setExpandedBills] = useState({});

  const toggleExpand = (idx) => {
    setExpandedBills(prev => ({...prev, [idx]: !prev[idx]}));
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  useEffect(() => {
    if (selectedStaff) {
      fetchPerformanceData();
    }
  }, [selectedStaff]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownRef]);

  const fetchStaff = async () => {
    try {
      const rows = await getRows(SHEETS_CONFIG.staffSheetName);
      if (rows && rows.length > 1) {
        const list = [];
        for (let i = 1; i < rows.length; i++) {
          const row = rows[i];
          if (!row || !row[1]) continue;
          const userType = row.length > 5 ? row[5].toString().trim().toLowerCase() : 'staff';
          const nameLower = row[1].toString().trim().toLowerCase();

          // Exclude Admin from staff dashboard
          if (userType.includes('admin') || nameLower === 'admin' || nameLower.includes('admin')) {
            continue;
          }

          list.push({
            id: row[0],
            name: row[1],
            email: row.length > 4 ? row[4].toLowerCase() : '',
            basicSalary: row.length > 8 && row[8].toString().trim() !== '' ? parseFloat(row[8]) || 10000 : 10000
          });
        }
        setStaffList(list);
        if (list.length > 0) setSelectedStaff(list[0].name);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchPerformanceData = async () => {
    setIsLoading(true);
    setError('');
    try {
      const billsRows = await getRows(SHEETS_CONFIG.serviceEntrySheetName).catch(() => []);

      const staffInfo = staffList.find(s => s.name === selectedStaff);
      if (!staffInfo) return;

      const bData = [];
      const sData = [];
      if (billsRows && billsRows.length > 1) {
        for (let i = 1; i < billsRows.length; i++) {
          const row = billsRows[i];
          if (!row || row.length < 3) continue;
          const staffName = (row[2] || '').toLowerCase();
          const status = (row[12] || '').toLowerCase();

          if (staffName === staffInfo.name.toLowerCase()) {
            const dateStr = row[0] || '';
            let rowDate = null;
            if (dateStr.includes(' ')) {
              const [d, mStr, yStr] = dateStr.split(' ');
              const m = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].indexOf(mStr);
              const y = parseInt(yStr);
              rowDate = new Date(y, m, parseInt(d));
            } else if (dateStr.includes('/')) {
              const [d, m, y] = dateStr.split('/');
              rowDate = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
            } else if (dateStr.includes('-')) {
              const [d, m, y] = dateStr.split('-');
              rowDate = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
            }

            const billObj = {
              rowIndex: i + 1,
              date: dateStr,
              time: row[1] || '',
              rowDate,
              mobile: '', 
              customer: row[3] || 'Walk-in Customer',
              services: row[4] || '',
              qty: parseInt(row[5]) || 1,
              totalAmount: parseFloat(row[6]) || 0,
              deptFee: parseFloat(row[7]) || 0,
              walletCharge: parseFloat(row[8]) || 0,
              gpay: parseFloat(row[9]) || 0,
              cash: parseFloat(row[10]) || 0,
              balance: parseFloat(row[11]) || 0,
              status: row[12] || '',
              svcCharge: parseFloat(row[13]) || 0,
              commission: parseFloat(row[14]) || 0,
              wallet: row[15] || 'N/A',
              remark: row[16] || '--',
              billId: row[17] || '',
              isPriceEdited: (row[18] || '').toString().trim().toLowerCase() === 'yes'
            };

            if (status === 'completed') {
              bData.push(billObj);
            } else {
              sData.push(billObj);
            }
          }
        }
      }
      setBillsData(bData);
      setSavedBillsData(sData);

      // Fetch Attendance Data
      const attRows = await getRows(SHEETS_CONFIG.attendanceSheetName).catch(() => []);
      const aData = [];
      if (attRows && attRows.length > 1) {
        for (let i = 1; i < attRows.length; i++) {
          const row = attRows[i];
          if (!row || row.length < 2) continue;
          const staffName = (row[1] || '').toLowerCase();
          if (staffName === staffInfo.name.toLowerCase()) {
            aData.push({
              date: row[0] || '',
              status: (row[2] && row[2] !== '--') ? 'Present' : 'Absent',
              timeIn: row[2] || '--',
              timeOut: row[3] || '--',
              notes: row[5] || ''
            });
          }
        }
      }
      setAttendanceData(aData);

    } catch (err) {
      console.error(err);
      setError('Failed to load performance data');
    } finally {
      setIsLoading(false);
    }
  };

  const parseAttendanceDate = (dateStr) => {
    if (!dateStr) return null;
    const parts = dateStr.split(/[-/]/);
    if (parts.length === 3) {
      const d = parseInt(parts[0]);
      const m = parseInt(parts[1]) - 1;
      const y = parseInt(parts[2]);
      return new Date(y, m, d);
    }
    return null;
  };
  const calculateDuration = (timeIn, timeOut) => {
    if (!timeIn || !timeOut || timeIn === '--' || timeOut === '--') return '';
    try {
      const parseTime = (tStr) => {
        const cleaned = tStr.trim().toLowerCase();
        let parts = cleaned.split(' ');
        let time = parts[0];
        let modifier = parts[1];
        if (!time) return null;
        let [hours, minutes] = time.split(':');
        let hrs = parseInt(hours) || 0;
        let mins = parseInt(minutes) || 0;
        if (modifier === 'pm' && hrs < 12) hrs += 12;
        if (modifier === 'am' && hrs === 12) hrs = 0;
        return { hrs, mins };
      };

      const inT = parseTime(timeIn);
      const outT = parseTime(timeOut);
      if (!inT || !outT) return '';

      let diffMins = (outT.hrs * 60 + outT.mins) - (inT.hrs * 60 + inT.mins);
      if (diffMins < 0) return '';

      const h = Math.floor(diffMins / 60);
      const m = diffMins % 60;
      return `${h}h ${m}m`;
    } catch (e) {
      return '';
    }
  };
  // Date helper
  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const getSundaysInMonth = (year, month) => {
    let count = 0;
    const days = getDaysInMonth(year, month);
    for (let d = 1; d <= days; d++) {
      if (new Date(year, month, d).getDay() === 0) count++;
    }
    return count;
  };

  // Helper stats builder
  const buildStats = (filteredBills) => {
    const totalServices = filteredBills.length;
    const totalDeptFee = filteredBills.reduce((acc, b) => acc + b.deptFee, 0);
    const totalSvcCharge = filteredBills.reduce((acc, b) => acc + b.svcCharge, 0);
    const totalGpay = filteredBills.reduce((acc, b) => acc + b.gpay, 0);
    const totalCash = filteredBills.reduce((acc, b) => acc + b.cash, 0);
    const totalWalletCharge = filteredBills.reduce((acc, b) => acc + b.walletCharge, 0);
    return { totalServices, totalDeptFee, totalSvcCharge, totalWalletCharge, totalGpay, totalCash };
  };

  // Active Staff basic salary
  const staffInfo = staffList.find(s => s.name === selectedStaff);
  const basicSalary = staffInfo?.basicSalary || 10000;

  // Paycheck details calculator for a given Month / Year
  const calculateMonthlyPaycheck = (m, y) => {
    const monthlyBills = billsData.filter(b => b.rowDate && b.rowDate.getMonth() === m && b.rowDate.getFullYear() === y);
    const monthlyAtt = attendanceData.filter(att => {
      const d = parseAttendanceDate(att.date);
      return d && d.getMonth() === m && d.getFullYear() === y;
    });

    const stats = buildStats(monthlyBills);
    const actualPresentDays = monthlyAtt.filter(att =>
      (att.status || '').toLowerCase() === 'present' || att.timeIn !== '--'
    ).length;

    const totalDays = getDaysInMonth(y, m);
    const sundaysCount = getSundaysInMonth(y, m);
    const workingDays = totalDays - sundaysCount;

    const paidLeave = (actualPresentDays > 0 && actualPresentDays < workingDays) ? 1 : 0;
    const paidDays = actualPresentDays > 0
      ? Math.min(totalDays, actualPresentDays + sundaysCount + paidLeave)
      : 0;

    const bonus = Math.max(0, stats.totalSvcCharge - (basicSalary * 0.05));
    const finalSalary = (basicSalary / 30) * paidDays + bonus;

    return { paidDays, totalDays, bonus, finalSalary, stats, actualPresentDays };
  };

  // 1. Daily Card Performance Stats
  const dailyDateStr = dailyDate.toLocaleDateString('en-GB');
  const dailyBills = billsData.filter(b => b.rowDate && b.rowDate.toLocaleDateString('en-GB') === dailyDateStr);
  const dailyStats = buildStats(dailyBills);

  // 2. Monthly Card Performance Stats & Paycheck Details
  const monthlyPaycheck = calculateMonthlyPaycheck(monthlyMonth, monthlyYear);

  // 3. Yearly Card Performance Stats & Paycheck Summary (Looping 12 months of selected year)
  let yearlyPaidDays = 0;
  let yearlyTotalDays = 0;
  let yearlyBonus = 0;
  let yearlyFinalSalary = 0;
  let yearlyActualPresentDays = 0;
  for (let m = 0; m < 12; m++) {
    const monthPay = calculateMonthlyPaycheck(m, yearlyYear);
    yearlyPaidDays += monthPay.paidDays;
    yearlyTotalDays += monthPay.totalDays;
    yearlyBonus += monthPay.bonus;
    yearlyFinalSalary += monthPay.finalSalary;
    yearlyActualPresentDays += monthPay.actualPresentDays;
  }
  const yearlyBills = billsData.filter(b => b.rowDate && b.rowDate.getFullYear() === yearlyYear);
  const yearlyStats = buildStats(yearlyBills);

  const getLocalYYYYMMDD = (d) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const formatCurr = (val) => `₹${parseFloat(val).toFixed(2)}`;
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const todayFormatted = new Date().toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  // Tab Filtering Logic
  const getTabFilteredData = (rawList) => {
    return rawList.filter(item => {
      // 1. Date Range
      if (tabStartDate && item.rowDate) {
        const start = new Date(tabStartDate);
        start.setHours(0, 0, 0, 0);
        if (item.rowDate < start) return false;
      }
      if (tabEndDate && item.rowDate) {
        const end = new Date(tabEndDate);
        end.setHours(23, 59, 59, 999);
        if (item.rowDate > end) return false;
      }

      // 2. Status
      if (tabStatus !== 'All') {
        if (tabStatus === 'completed' && item.status !== 'completed') return false;
        if (tabStatus === 'pending' && item.status === 'completed') return false;
      }

      // 3. Search Query
      if (tabSearchQuery.trim()) {
        const q = tabSearchQuery.toLowerCase();
        const matchCustomer = (item.customer || '').toLowerCase().includes(q);
        const matchServices = (item.services || '').toLowerCase().includes(q);
        const matchBillId = `MPM25${String(item.rowDate?.getMonth() + 1).padStart(2, '0')}${String(item.rowDate?.getDate()).padStart(2, '0')}-${String(item.rowIndex).padStart(5, '0')}`.toLowerCase().includes(q);
        if (!matchCustomer && !matchServices && !matchBillId) return false;
      }

      return true;
    });
  };

  return (
    <div className="admin-page" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>

      {/* ── Brand Header & Staff Selector ── */}
      <div className="admin-hero admin-hero--staff" style={{ position: 'relative', zIndex: 40 }}>
        <div className="admin-hero-main">
          <div className="admin-hero-label">PERFORMANCE & SALARY</div>
          <div className="admin-hero-amount" style={{ fontSize: '32px' }}>Staff Dashboard</div>
          <div style={{ marginTop: '8px', fontSize: '14px', color: 'rgba(255,255,255,0.9)', fontWeight: '500' }}>
            {todayFormatted}
          </div>
        </div>

        <div className="admin-hero-meta-card" style={{ display: 'flex', flexDirection: 'column', gap: '8px', background: 'rgba(255,255,255,0.1)', padding: '16px', borderRadius: '12px' }}>
          <div style={{ fontSize: '12px', fontWeight: '700', letterSpacing: '0.5px' }}>VIEW STAFF</div>

          <div ref={dropdownRef} style={{ position: 'relative', width: '100%', minWidth: '240px' }}>
            <div
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              style={{
                background: '#ffffff',
                color: '#0F172A',
                padding: '12px 16px',
                borderRadius: '8px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                userSelect: 'none'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <User size={18} color="#64748B" />
                <span style={{ fontSize: '14px' }}>
                  {staffList.find(s => s.name === selectedStaff)?.name || 'Select Staff'}
                </span>
              </div>
              <ChevronDown
                size={18}
                color="#64748B"
                style={{ transform: isDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}
              />
            </div>

            {isDropdownOpen && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                marginTop: '8px',
                background: '#ffffff',
                borderRadius: '12px',
                boxShadow: '0 10px 25px -5px rgba(0,0,0,0.15), 0 8px 10px -6px rgba(0,0,0,0.1)',
                zIndex: 50,
                overflow: 'hidden'
              }}>
                {staffList.map((s, i) => (
                  <div
                    key={i}
                    onClick={() => { setSelectedStaff(s.name); setIsDropdownOpen(false); }}
                    style={{
                      padding: '12px 16px',
                      cursor: 'pointer',
                      color: selectedStaff === s.name ? '#3B82F6' : '#334155',
                      background: selectedStaff === s.name ? '#EFF6FF' : 'transparent',
                      fontWeight: selectedStaff === s.name ? '700' : '500',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      borderBottom: i < staffList.length - 1 ? '1px solid #F1F5F9' : 'none',
                      transition: 'background 0.2s',
                      fontSize: '14px'
                    }}
                    onMouseEnter={(e) => { if (selectedStaff !== s.name) e.currentTarget.style.background = '#F8FAFC'; }}
                    onMouseLeave={(e) => { if (selectedStaff !== s.name) e.currentTarget.style.background = 'transparent'; }}
                  >
                    <span>{s.name}</span>
                    <span style={{ fontSize: '12px', color: '#94A3B8', fontWeight: '500' }}>({s.id || `ID: ${i + 1}`})</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {error && <div className="admin-banner admin-banner--error"><span>{error}</span></div>}

      {isLoading ? (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '120px 24px',
          background: '#ffffff',
          borderRadius: '16px',
          boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
          marginTop: '24px',
          minHeight: '300px'
        }}>
          <style>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
          <div style={{
            width: '48px',
            height: '48px',
            border: '4px solid #F1F5F9',
            borderTop: '4px solid #3B82F6',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            marginBottom: '16px'
          }} />
          <span style={{ fontSize: '15px', color: '#64748B', fontWeight: '600' }}>Fetching performance & salary data...</span>
        </div>
      ) : (
        <>
          {/* ── 3 Performance Cards Row ── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px', marginBottom: '32px' }}>

            {/* DAILY PERFORMANCE CARD */}
            <div className="admin-data-card" style={{ padding: '24px', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: '-30px', right: '-30px', width: '120px', height: '120px', borderRadius: '50%', backgroundColor: '#EFF6FF' }}></div>
              <div style={{ position: 'absolute', top: '24px', right: '24px', width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#DBEAFE', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1 }}>
                <CalendarIcon size={16} color="#3B82F6" />
              </div>

              <h3 style={{ color: '#64748B', fontSize: '13px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 20px 0', position: 'relative', zIndex: 1 }}>
                Daily Performance
              </h3>

              {/* Arrows Row */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', marginBottom: '16px' }}>
                <button onClick={() => { const d = new Date(dailyDate); d.setDate(d.getDate() - 1); setDailyDate(d); }} style={{ width: '28px', height: '28px', borderRadius: '6px', backgroundColor: '#F1F5F9', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                  <ChevronLeft size={16} color="#64748B" />
                </button>
                <span style={{ fontSize: '13px', fontWeight: '700', color: '#334155', minWidth: '90px', textAlign: 'center' }}>
                  {dailyDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
                <button onClick={() => { const d = new Date(dailyDate); d.setDate(d.getDate() + 1); setDailyDate(d); }} style={{ width: '28px', height: '28px', borderRadius: '6px', backgroundColor: '#F1F5F9', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                  <ChevronRight size={16} color="#64748B" />
                </button>
              </div>

              {/* Date Picker Input */}
              <div style={{ marginBottom: '24px' }}>
                <input
                  type="date"
                  value={getLocalYYYYMMDD(dailyDate)}
                  onChange={(e) => {
                    if (!e.target.value) return;
                    const [y, m, d] = e.target.value.split('-');
                    setDailyDate(new Date(parseInt(y), parseInt(m) - 1, parseInt(d)));
                  }}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid #CBD5E1',
                    fontSize: '13px',
                    outline: 'none',
                    backgroundColor: '#ffffff'
                  }}
                />
              </div>

              {/* Stats Display */}
              <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                <div style={{ fontSize: '32px', fontWeight: '800', color: '#0F172A', lineHeight: '1' }}>{dailyStats.totalServices}</div>
                <div style={{ fontSize: '11px', color: '#64748B', fontWeight: '600', marginTop: '4px' }}>Total Services</div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                  <span style={{ color: '#64748B', fontWeight: '500' }}>Dept. Fee</span>
                  <span style={{ color: '#0F172A', fontWeight: '600' }}>{formatCurr(dailyStats.totalDeptFee)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                  <span style={{ color: '#64748B', fontWeight: '500' }}>Service Charge</span>
                  <span style={{ color: '#0F172A', fontWeight: '600' }}>{formatCurr(dailyStats.totalSvcCharge)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                  <span style={{ color: '#64748B', fontWeight: '500' }}>Other Charges</span>
                  <span style={{ color: '#F59E0B', fontWeight: '600' }}>{formatCurr(dailyStats.totalWalletCharge)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                  <span style={{ color: '#64748B', fontWeight: '500' }}>UPI/Bank</span>
                  <span style={{ color: '#0F172A', fontWeight: '600' }}>{formatCurr(dailyStats.totalGpay)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', paddingTop: '4px', borderTop: '1px dashed #F1F5F9' }}>
                  <span style={{ color: '#0F172A', fontWeight: '700' }}>Total Cash</span>
                  <span style={{ color: '#0F172A', fontWeight: '700' }}>{formatCurr(dailyStats.totalCash)}</span>
                </div>
              </div>
            </div>

            {/* MONTHLY PERFORMANCE & PAYCHECK CARD */}
            <div className="admin-data-card" style={{ padding: '24px', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: '-30px', right: '-30px', width: '120px', height: '120px', borderRadius: '50%', backgroundColor: '#F3E8FF' }}></div>
              <div style={{ position: 'absolute', top: '24px', right: '24px', width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#E9D5FF', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1 }}>
                <CalendarIcon size={16} color="#9333EA" />
              </div>

              <h3 style={{ color: '#64748B', fontSize: '13px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 20px 0', position: 'relative', zIndex: 1 }}>
                Monthly Performance
              </h3>

              {/* Arrows Row */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', marginBottom: '16px' }}>
                <button onClick={() => { setMonthlyMonth(prev => { if (prev === 0) { setMonthlyYear(y => y - 1); return 11; } return prev - 1; }); }} style={{ width: '28px', height: '28px', borderRadius: '6px', backgroundColor: '#F1F5F9', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                  <ChevronLeft size={16} color="#64748B" />
                </button>
                <span style={{ fontSize: '13px', fontWeight: '700', color: '#334155', minWidth: '90px', textAlign: 'center' }}>
                  {months[monthlyMonth].substring(0, 3)} {monthlyYear}
                </span>
                <button onClick={() => { setMonthlyMonth(prev => { if (prev === 11) { setMonthlyYear(y => y + 1); return 0; } return prev + 1; }); }} style={{ width: '28px', height: '28px', borderRadius: '6px', backgroundColor: '#F1F5F9', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                  <ChevronRight size={16} color="#64748B" />
                </button>
              </div>

              {/* Month / Year Inputs */}
              <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
                <select
                  value={monthlyMonth}
                  onChange={e => setMonthlyMonth(parseInt(e.target.value))}
                  style={{
                    flex: 1,
                    padding: '8px 10px',
                    borderRadius: '8px',
                    border: '1px solid #CBD5E1',
                    fontSize: '13px',
                    outline: 'none',
                    backgroundColor: '#ffffff'
                  }}
                >
                  {months.map((m, i) => <option key={i} value={i}>{m}</option>)}
                </select>
                <select
                  value={monthlyYear}
                  onChange={e => setMonthlyYear(parseInt(e.target.value))}
                  style={{
                    flex: 1,
                    padding: '8px 10px',
                    borderRadius: '8px',
                    border: '1px solid #CBD5E1',
                    fontSize: '13px',
                    outline: 'none',
                    backgroundColor: '#ffffff'
                  }}
                >
                  {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>

              {/* Stats Display */}
              <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                <div style={{ fontSize: '32px', fontWeight: '800', color: '#0F172A', lineHeight: '1' }}>{monthlyPaycheck.stats.totalServices}</div>
                <div style={{ fontSize: '11px', color: '#64748B', fontWeight: '600', marginTop: '4px' }}>Total Services</div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                  <span style={{ color: '#64748B', fontWeight: '500' }}>Dept. Fee</span>
                  <span style={{ color: '#0F172A', fontWeight: '600' }}>{formatCurr(monthlyPaycheck.stats.totalDeptFee)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                  <span style={{ color: '#64748B', fontWeight: '500' }}>Service Charge</span>
                  <span style={{ color: '#0F172A', fontWeight: '600' }}>{formatCurr(monthlyPaycheck.stats.totalSvcCharge)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                  <span style={{ color: '#64748B', fontWeight: '500' }}>Other Charges</span>
                  <span style={{ color: '#F59E0B', fontWeight: '600' }}>{formatCurr(monthlyPaycheck.stats.totalWalletCharge)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                  <span style={{ color: '#64748B', fontWeight: '500' }}>UPI/Bank</span>
                  <span style={{ color: '#0F172A', fontWeight: '600' }}>{formatCurr(monthlyPaycheck.stats.totalGpay)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', paddingTop: '4px', borderTop: '1px dashed #F1F5F9' }}>
                  <span style={{ color: '#0F172A', fontWeight: '700' }}>Total Cash</span>
                  <span style={{ color: '#0F172A', fontWeight: '700' }}>{formatCurr(monthlyPaycheck.stats.totalCash)}</span>
                </div>

                {/* Paycheck Inclusions */}
                <div style={{ marginTop: '8px', paddingTop: '10px', borderTop: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                    <span style={{ color: '#64748B', fontWeight: '500' }}>Basic Salary</span>
                    <span style={{ color: '#0F172A', fontWeight: '600' }}>{formatCurr(basicSalary)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                    <span style={{ color: '#64748B', fontWeight: '500' }}>Attendance / Total Days</span>
                    <span style={{ color: '#0F172A', fontWeight: '600' }}>{monthlyPaycheck.actualPresentDays} / {monthlyPaycheck.totalDays}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                    <span style={{ color: '#64748B', fontWeight: '500' }}>Bonus (Comm.)</span>
                    <span style={{ color: '#10B981', fontWeight: '600' }}>{formatCurr(monthlyPaycheck.bonus)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', fontWeight: '800', borderTop: '1px dashed #E2E8F0', paddingTop: '6px', marginTop: '2px' }}>
                    <span style={{ color: '#0F172A' }}>Final Salary</span>
                    <span style={{ color: '#10B981' }}>{formatCurr(monthlyPaycheck.finalSalary)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* YEARLY PERFORMANCE & PAYCHECK CARD */}
            <div className="admin-data-card" style={{ padding: '24px', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: '-30px', right: '-30px', width: '120px', height: '120px', borderRadius: '50%', backgroundColor: '#E0F2FE' }}></div>
              <div style={{ position: 'absolute', top: '24px', right: '24px', width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#BAE6FD', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1 }}>
                <CalendarIcon size={16} color="#0284C7" />
              </div>

              <h3 style={{ color: '#64748B', fontSize: '13px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 20px 0', position: 'relative', zIndex: 1 }}>
                Yearly Performance
              </h3>

              {/* Arrows Row */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', marginBottom: '16px' }}>
                <button onClick={() => setYearlyYear(prev => prev - 1)} style={{ width: '28px', height: '28px', borderRadius: '6px', backgroundColor: '#F1F5F9', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                  <ChevronLeft size={16} color="#64748B" />
                </button>
                <span style={{ fontSize: '13px', fontWeight: '700', color: '#334155', minWidth: '90px', textAlign: 'center' }}>
                  {yearlyYear}
                </span>
                <button onClick={() => setYearlyYear(prev => prev + 1)} style={{ width: '28px', height: '28px', borderRadius: '6px', backgroundColor: '#F1F5F9', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                  <ChevronRight size={16} color="#64748B" />
                </button>
              </div>

              {/* Year Input */}
              <div style={{ marginBottom: '24px' }}>
                <select
                  value={yearlyYear}
                  onChange={e => setYearlyYear(parseInt(e.target.value))}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid #CBD5E1',
                    fontSize: '13px',
                    outline: 'none',
                    backgroundColor: '#ffffff'
                  }}
                >
                  {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>

              {/* Stats Display */}
              <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                <div style={{ fontSize: '32px', fontWeight: '800', color: '#0F172A', lineHeight: '1' }}>{yearlyStats.totalServices}</div>
                <div style={{ fontSize: '11px', color: '#64748B', fontWeight: '600', marginTop: '4px' }}>Total Services</div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                  <span style={{ color: '#64748B', fontWeight: '500' }}>Dept. Fee</span>
                  <span style={{ color: '#0F172A', fontWeight: '600' }}>{formatCurr(yearlyStats.totalDeptFee)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                  <span style={{ color: '#64748B', fontWeight: '500' }}>Service Charge</span>
                  <span style={{ color: '#0F172A', fontWeight: '600' }}>{formatCurr(yearlyStats.totalSvcCharge)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                  <span style={{ color: '#64748B', fontWeight: '500' }}>Other Charges</span>
                  <span style={{ color: '#F59E0B', fontWeight: '600' }}>{formatCurr(yearlyStats.totalWalletCharge)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                  <span style={{ color: '#64748B', fontWeight: '500' }}>UPI/Bank</span>
                  <span style={{ color: '#0F172A', fontWeight: '600' }}>{formatCurr(yearlyStats.totalGpay)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', paddingTop: '4px', borderTop: '1px dashed #F1F5F9' }}>
                  <span style={{ color: '#0F172A', fontWeight: '700' }}>Total Cash</span>
                  <span style={{ color: '#0F172A', fontWeight: '700' }}>{formatCurr(yearlyStats.totalCash)}</span>
                </div>

                {/* Yearly Paycheck Inclusions */}
                <div style={{ marginTop: '8px', paddingTop: '10px', borderTop: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                    <span style={{ color: '#64748B', fontWeight: '500' }}>Basic Salary (Est.)</span>
                    <span style={{ color: '#0F172A', fontWeight: '600' }}>{formatCurr(basicSalary * 12)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                    <span style={{ color: '#64748B', fontWeight: '500' }}>Attendance / Total Days</span>
                    <span style={{ color: '#0F172A', fontWeight: '600' }}>{yearlyActualPresentDays} / {yearlyTotalDays}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                    <span style={{ color: '#64748B', fontWeight: '500' }}>Total Bonus (Comm.)</span>
                    <span style={{ color: '#10B981', fontWeight: '600' }}>{formatCurr(yearlyBonus)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', fontWeight: '800', borderTop: '1px dashed #E2E8F0', paddingTop: '6px', marginTop: '2px' }}>
                    <span style={{ color: '#0F172A' }}>Total Final Salary</span>
                    <span style={{ color: '#10B981' }}>{formatCurr(yearlyFinalSalary)}</span>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* ── Tabs Layout ── */}
          <div style={{ marginBottom: '24px', display: 'flex', gap: '12px', borderBottom: '2px solid #E2E8F0' }}>
            {[
              { id: 'pending', label: 'Pending Bills' },
              { id: 'billed', label: 'Billed Services' },
              { id: 'attendance', label: 'Attendance' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setTabStartDate('');
                  setTabEndDate('');
                  setTabStatus('All');
                  setTabSearchQuery('');
                }}
                style={{
                  padding: '12px 24px',
                  border: 'none',
                  background: 'transparent',
                  fontSize: '15px',
                  fontWeight: activeTab === tab.id ? '700' : '600',
                  color: activeTab === tab.id ? '#3B82F6' : '#64748B',
                  borderBottom: activeTab === tab.id ? '3px solid #3B82F6' : '3px solid transparent',
                  cursor: 'pointer',
                  marginBottom: '-2px',
                  transition: 'all 0.2s'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* ── Active Tab Display Panel ── */}
          <div className="admin-data-card" style={{ padding: '0', overflow: 'hidden' }}>

            {/* ── Tab 1 & 2: Pending and Completed Bills ── */}
            {(activeTab === 'pending' || activeTab === 'billed') && (
              <div style={{ padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#0F172A', margin: 0 }}>
                    {activeTab === 'pending' ? 'Pending Payment Bills' : 'Completed Billed Services'}
                  </h3>

                  {/* Local Sub-filters Panel */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
                    <input
                      type="date"
                      placeholder="Start Date"
                      value={tabStartDate}
                      onChange={e => setTabStartDate(e.target.value)}
                      style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13px' }}
                    />
                    <input
                      type="date"
                      placeholder="End Date"
                      value={tabEndDate}
                      onChange={e => setTabEndDate(e.target.value)}
                      style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13px' }}
                    />
                    {activeTab === 'billed' && (
                      <select
                        value={tabStatus}
                        onChange={e => setTabStatus(e.target.value)}
                        style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13px', backgroundColor: '#ffffff' }}
                      >
                        <option value="All">All Status</option>
                        <option value="completed">Completed</option>
                        <option value="pending">Pending</option>
                      </select>
                    )}
                    <div style={{ position: 'relative' }}>
                      <input
                        type="text"
                        placeholder="Search customer / service / ID..."
                        value={tabSearchQuery}
                        onChange={e => setTabSearchQuery(e.target.value)}
                        style={{ padding: '8px 12px 8px 32px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13px', width: '220px' }}
                      />
                      <Search size={14} color="#94A3B8" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
                    </div>
                  </div>
                </div>

                {/* List Data */}
                {(() => {
                  const rawList = activeTab === 'pending' ? savedBillsData : billsData;
                  const filteredList = getTabFilteredData(rawList);

                  if (filteredList.length === 0) {
                    return <div style={{ textAlign: 'center', padding: '40px', color: '#64748B' }}>No bills found for the selected filters.</div>;
                  }

                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      {filteredList.map((b, idx) => {
                        const billId = b.billId || `MPM25${String(b.rowDate?.getMonth() + 1).padStart(2, '0')}${String(b.rowDate?.getDate()).padStart(2, '0')}-${String(b.rowIndex).padStart(5, '0')}`;
                        const isExpanded = !!expandedBills[idx];
                        const isPending = b.status !== 'completed';
                        const statusColor = isPending ? { bg: '#FEF3C7', text: '#B45309', badge: 'pending' } : { bg: '#ECFDF5', text: '#10B981', badge: 'completed' };
                        const initial = b.customer ? b.customer.charAt(0).toUpperCase() : 'C';
                        const totalAmount = b.totalAmount || (b.deptFee + b.svcCharge + b.walletCharge);
                        const rowBg = b.isPriceEdited ? '#FEF2F2' : '#fff';
                        const textColorBase = b.isPriceEdited ? '#991B1B' : '#1E293B';
                        const textMutedBase = b.isPriceEdited ? '#DC2626' : '#64748B';

                        return (
                          <div key={idx} style={{ border: b.isPriceEdited ? '1px solid #FCA5A5' : '1px solid #E2E8F0', borderRadius: '12px', overflow: 'hidden', backgroundColor: rowBg, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                            {/* Card Header */}
                            <div 
                              onClick={() => toggleExpand(idx)}
                              style={{ padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', backgroundColor: rowBg }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: b.isPriceEdited ? '#EF4444' : '#3B82F6', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: 'bold' }}>
                                  {initial}
                                </div>
                                <div>
                                  <div style={{ fontSize: '16px', fontWeight: '700', color: textColorBase }}>{b.customer || 'Walk-in'}</div>
                                  <div style={{ fontSize: '12px', color: textMutedBase, display: 'flex', alignItems: 'center', gap: '12px', marginTop: '4px' }}>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Phone size={12}/> {b.mobile || '-'}</span>
                                    <span>Date: {b.date} {b.time ? `, ${b.time}` : ''}</span>
                                    <span style={{ backgroundColor: b.isPriceEdited ? '#FEE2E2' : '#F1F5F9', color: b.isPriceEdited ? '#991B1B' : '#475569', padding: '2px 8px', borderRadius: '4px', fontWeight: '600' }}>
                                      ID: {billId}
                                    </span>
                                    {b.isPriceEdited && (
                                      <span style={{ color: '#DC2626', fontWeight: '700' }}>Price Edited</span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                <span style={{ backgroundColor: b.isPriceEdited ? '#FEE2E2' : '#F1F5F9', color: b.isPriceEdited ? '#991B1B' : '#475569', fontSize: '12px', fontWeight: '700', padding: '4px 10px', borderRadius: '12px' }}>
                                  Qty: {b.qty}
                                </span>
                                <span style={{ color: b.isPriceEdited ? '#991B1B' : '#8B5CF6', fontWeight: '700', backgroundColor: b.isPriceEdited ? '#FECACA' : '#EDE9FE', padding: '4px 10px', borderRadius: '12px', fontSize: '12px' }}>
                                  {formatCurr(totalAmount)}
                                </span>
                                {isExpanded ? <ChevronUp size={20} color={textMutedBase} /> : <ChevronDown size={20} color={textMutedBase} />}
                              </div>
                            </div>

                            {/* Expanded Body */}
                            {isExpanded && (
                              <div style={{ padding: '0 24px 24px 24px', backgroundColor: b.isPriceEdited ? '#FEF2F2' : '#F8FAFC', borderTop: b.isPriceEdited ? '1px solid #FCA5A5' : '1px solid #F1F5F9' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '16px', textAlign: 'left' }}>
                                  <thead>
                                    <tr style={{ color: textMutedBase, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                      <th style={{ padding: '12px 8px', borderBottom: b.isPriceEdited ? '1px solid #FCA5A5' : '1px solid #E2E8F0' }}>Service</th>
                                      <th style={{ padding: '12px 8px', borderBottom: b.isPriceEdited ? '1px solid #FCA5A5' : '1px solid #E2E8F0' }}>Dept. Fee</th>
                                      <th style={{ padding: '12px 8px', borderBottom: b.isPriceEdited ? '1px solid #FCA5A5' : '1px solid #E2E8F0' }}>Svc Charge</th>
                                      <th style={{ padding: '12px 8px', borderBottom: b.isPriceEdited ? '1px solid #FCA5A5' : '1px solid #E2E8F0' }}>Other Charges</th>
                                      <th style={{ padding: '12px 8px', borderBottom: b.isPriceEdited ? '1px solid #FCA5A5' : '1px solid #E2E8F0', textAlign: 'center' }}>Qty</th>
                                      <th style={{ padding: '12px 8px', borderBottom: b.isPriceEdited ? '1px solid #FCA5A5' : '1px solid #E2E8F0' }}>Total</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    <tr>
                                      <td style={{ padding: '16px 8px', color: textColorBase, fontWeight: '500', fontSize: '14px', maxWidth: '300px' }}>
                                        {b.services}
                                      </td>
                                      <td style={{ padding: '16px 8px', color: textColorBase, fontWeight: '600', fontSize: '14px' }}>{formatCurr(b.deptFee)}</td>
                                      <td style={{ padding: '16px 8px', color: b.isPriceEdited ? '#DC2626' : textColorBase, fontWeight: '600', fontSize: '14px' }}>
                                        {formatCurr(b.svcCharge)}
                                      </td>
                                      <td style={{ padding: '16px 8px', color: b.isPriceEdited ? '#DC2626' : textColorBase, fontWeight: '600', fontSize: '14px' }}>{formatCurr(b.walletCharge)}</td>
                                      <td style={{ padding: '16px 8px', textAlign: 'center' }}>
                                        <span style={{ backgroundColor: b.isPriceEdited ? '#FEE2E2' : '#E0F2FE', color: b.isPriceEdited ? '#991B1B' : '#0284C7', padding: '4px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: '700' }}>x{b.qty}</span>
                                      </td>
                                      <td style={{ padding: '16px 8px', color: textColorBase, fontWeight: '600', fontSize: '14px' }}>{formatCurr(totalAmount)}</td>
                                    </tr>
                                  </tbody>
                                </table>

                                {/* Footer Actions */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', paddingTop: '16px', borderTop: b.isPriceEdited ? '1px dashed #FCA5A5' : '1px dashed #CBD5E1' }}>
                                  <div style={{ color: textMutedBase, fontSize: '14px' }}>
                                    Remark: <span style={{ color: textColorBase, fontWeight: '500' }}>{b.remark}</span>
                                  </div>
                                  <div style={{ color: textMutedBase, fontSize: '14px' }}>
                                    Grand Total: <span style={{ color: b.isPriceEdited ? '#991B1B' : '#0284C7', fontWeight: '700' }}>{formatCurr(totalAmount)}</span>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>
            )}

            {/* ── Tab 3: Attendance Monthly Calendar Grid ── */}
            {activeTab === 'attendance' && (
              <div style={{ padding: '24px' }}>

                {/* Header controls for Monthly calendar */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <select
                      value={monthlyMonth}
                      onChange={e => setMonthlyMonth(parseInt(e.target.value))}
                      style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '14px', backgroundColor: '#ffffff' }}
                    >
                      {months.map((m, i) => <option key={i} value={i}>{m}</option>)}
                    </select>
                    <select
                      value={monthlyYear}
                      onChange={e => setMonthlyYear(parseInt(e.target.value))}
                      style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '14px', backgroundColor: '#ffffff' }}
                    >
                      {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                  </div>

                  {/* Status color-coded legend */}
                  <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', fontSize: '12px', fontWeight: '600' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#ECFDF5', border: '1px solid #10B981' }} />
                      <span style={{ color: '#374151' }}>Present</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#FEF2F2', border: '1px solid #EF4444' }} />
                      <span style={{ color: '#374151' }}>Absent</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#FEF2F2', border: '1px solid #EF4444' }} />
                      <span style={{ color: '#374151' }}>Holiday</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0' }} />
                      <span style={{ color: '#374151' }}>Future</span>
                    </div>
                  </div>
                </div>

                {/* Calendar Grid */}
                {(() => {
                  const firstDayOfWeek = new Date(monthlyYear, monthlyMonth, 1).getDay();
                  const calendarDays = [];
                  const totalDays = getDaysInMonth(monthlyYear, monthlyMonth);

                  const prevMonthDays = new Date(monthlyYear, monthlyMonth, 0).getDate();
                  for (let i = firstDayOfWeek - 1; i >= 0; i--) {
                    calendarDays.push({ day: prevMonthDays - i, isCurrentMonth: false });
                  }

                  for (let d = 1; d <= totalDays; d++) {
                    calendarDays.push({ day: d, isCurrentMonth: true });
                  }

                  const totalCells = Math.ceil(calendarDays.length / 7) * 7;
                  const nextPadding = totalCells - calendarDays.length;
                  for (let i = 1; i <= nextPadding; i++) {
                    calendarDays.push({ day: i, isCurrentMonth: false });
                  }

                  const weekHeaders = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

                  return (
                    <div style={{ border: '1px solid #E2E8F0', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                        {weekHeaders.map(h => (
                          <div key={h} style={{ padding: '12px 8px', fontSize: '12px', fontWeight: '700', color: '#64748B', textAlign: 'center', letterSpacing: '0.5px' }}>{h}</div>
                        ))}
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', backgroundColor: '#ffffff' }}>
                        {calendarDays.map((cell, idx) => {
                          if (!cell.isCurrentMonth) {
                            return (
                              <div key={idx} style={{
                                minHeight: '100px',
                                padding: '12px',
                                borderBottom: '1px solid #E2E8F0',
                                borderRight: idx % 7 === 6 ? 'none' : '1px solid #E2E8F0',
                                backgroundColor: '#F8FAFC',
                                color: '#CBD5E1'
                              }}>
                                <span style={{ fontSize: '14px', fontWeight: '600' }}>{cell.day}</span>
                              </div>
                            );
                          }

                          const cellDate = new Date(monthlyYear, monthlyMonth, cell.day);
                          const today = new Date();
                          today.setHours(0, 0, 0, 0);
                          const isFuture = cellDate > today;

                          const attRec = attendanceData.find(att => {
                            const parsed = parseAttendanceDate(att.date);
                            return parsed && parsed.getDate() === cell.day && parsed.getMonth() === monthlyMonth && parsed.getFullYear() === monthlyYear;
                          });

                          const dailyBills = billsData.filter(b =>
                            b.rowDate && b.rowDate.getDate() === cell.day && b.rowDate.getMonth() === monthlyMonth && b.rowDate.getFullYear() === monthlyYear
                          );
                          const dailyDeptFee = dailyBills.reduce((acc, b) => acc + b.deptFee, 0);
                          const dailySvcCharge = dailyBills.reduce((acc, b) => acc + b.svcCharge, 0);
                          const dailySvcCount = dailyBills.length;

                          let bgColor = '#ffffff';
                          let borderColor = '#E2E8F0';
                          let textColor = '#1E293B';
                          let statusLabel = '';

                          if (attRec) {
                            bgColor = '#ECFDF5';
                            borderColor = '#10B981';
                            textColor = '#065F46';
                            statusLabel = 'Present';
                          } else if (cellDate.getDay() === 0) {
                            bgColor = '#FEF2F2';
                            borderColor = '#EF4444';
                            textColor = '#991B1B';
                            statusLabel = 'Holiday';
                          } else if (isFuture) {
                            bgColor = '#ffffff';
                            borderColor = '#E2E8F0';
                            textColor = '#94A3B8';
                            statusLabel = '';
                          } else {
                            bgColor = '#FEF2F2';
                            borderColor = '#EF4444';
                            textColor = '#991B1B';
                            statusLabel = 'Absent';
                          }

                          return (
                            <div key={idx} style={{
                              minHeight: '110px',
                              padding: '12px',
                              borderBottom: '1px solid #E2E8F0',
                              borderRight: idx % 7 === 6 ? 'none' : '1px solid #E2E8F0',
                              backgroundColor: bgColor,
                              display: 'flex',
                              flexDirection: 'column',
                              transition: 'all 0.15s'
                            }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: '15px', fontWeight: '700', color: textColor }}>{cell.day}</span>
                                {statusLabel && (
                                  <span style={{
                                    width: '8px',
                                    height: '8px',
                                    borderRadius: '50%',
                                    backgroundColor: statusLabel === 'Present' ? '#10B981' : (statusLabel === 'Holiday' ? '#EF4444' : '#EF4444')
                                  }} title={statusLabel} />
                                )}
                              </div>

                              {statusLabel === 'Present' && attRec && (
                                <div style={{ marginTop: '4px', fontSize: '11px', lineHeight: '1.2', display: 'flex', flexDirection: 'column', gap: '2px', fontWeight: '500', color: '#475569' }}>
                                  <div>In: <span style={{ fontWeight: '700', color: '#0F172A' }}>{attRec.timeIn}</span></div>
                                  <div>Out: <span style={{ fontWeight: '700', color: '#0F172A' }}>{attRec.timeOut}</span></div>
                                  {calculateDuration(attRec.timeIn, attRec.timeOut) && (
                                    <div style={{ color: '#2563EB', fontWeight: '700' }}>Tot: {calculateDuration(attRec.timeIn, attRec.timeOut)}</div>
                                  )}
                                </div>
                              )}

                              {dailySvcCount > 0 && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginTop: '6px', fontSize: '10px', fontWeight: '600', borderTop: '1px dashed rgba(0,0,0,0.05)', paddingTop: '4px' }}>
                                  <div style={{ color: '#475569' }}>Dept: <span style={{ color: '#0F172A' }}>₹{dailyDeptFee.toFixed(0)}</span></div>
                                  <div style={{ color: '#475569' }}>Svc: <span style={{ color: '#0F172A' }}>₹{dailySvcCharge.toFixed(0)}</span></div>
                                  <div style={{ color: '#3B82F6' }}>Svc#: {dailySvcCount}</div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>

        </>
      )}

    </div>
  );
}
