import React, { useState, useEffect } from 'react';
import { RefreshCw, Search, User, Mail, Phone, MapPin, FileText, X } from 'lucide-react';
import { getRows } from '../services/googleSheetsService';
import { SHEETS_CONFIG } from '../config/sheetsConfig';

export default function CustomerDetails() {
  const [customers, setCustomers] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedCust, setSelectedCust] = useState(null);

  useEffect(() => {
    fetchCustomers();
  }, []);

  useEffect(() => {
    if (search.trim() === '') {
      setFiltered(customers);
    } else {
      const q = search.toLowerCase();
      setFiltered(customers.filter(c => 
        (c.name || '').toLowerCase().includes(q) ||
        (c.mobile || '').toLowerCase().includes(q) ||
        (c.email || '').toLowerCase().includes(q) ||
        (c.address || '').toLowerCase().includes(q)
      ));
    }
  }, [search, customers]);

  const fetchCustomers = async () => {
    setIsLoading(true);
    setError('');
    try {
      const rows = await getRows(SHEETS_CONFIG.customerSheetName);
      if (rows && rows.length > 0) {
        const list = [];
        for (let i = 1; i < rows.length; i++) {
          const row = rows[i];
          if (!row || row.length === 0 || (row[1] || '').toString().trim() === '') continue;
          
          list.push({
            rowIndex: i + 1,
            id: row[0] || '',
            name: row[1] || '',
            mobile: row[2] || '',
            email: row[3] || '',
            address: row[4] || '',
            remarks: row[5] || '',
            totalPaid: parseFloat(row[6]) || 0.0,
            gpayUpi: parseFloat(row[7]) || 0.0,
            cash: parseFloat(row[8]) || 0.0,
            balance: parseFloat(row[9]) || 0.0,
          });
        }
        setCustomers(list);
        setFiltered(list);
      } else {
        setCustomers([]);
        setFiltered([]);
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to load customer details.');
    } finally {
      setIsLoading(false);
    }
  };

  const openDetails = (c) => {
    setSelectedCust(c);
  };

  const closeDetails = () => {
    setSelectedCust(null);
  };

  return (
    <div className="admin-page">
      <div className="admin-hero admin-hero--customers">
        <div className="admin-hero-top">
          <div>
            <h2 className="admin-hero-title">Customer Details</h2>
            <p className="admin-hero-desc">Manage customer profiles and track financial balances</p>
          </div>
          
          <div className="admin-hero-actions">
            <div className="admin-search admin-search--hero">
              <Search size={18} className="admin-search-icon" />
              <input
                type="text"
                placeholder="Search customers..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="admin-search-input admin-search-input--hero"
              />
            </div>
            <button
              type="button"
              onClick={fetchCustomers}
              className="admin-tool-btn admin-tool-btn--hero-refresh"
              title="Refresh Customers"
            >
              <RefreshCw size={20} className={isLoading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="admin-banner admin-banner--error">
          <span>{error}</span>
        </div>
      )}

      <div className="admin-data-card admin-data-card--rounded">
        <div className="admin-data-card-header">
          <h2 className="admin-data-card-title">Customer Roster</h2>
          <div className="admin-count-badge">
            {filtered.length} customers
          </div>
        </div>
        {isLoading && customers.length === 0 ? (
          <div className="admin-loading">
            <div className="admin-spinner admin-spinner--teal" />
            <span>Loading customers...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="admin-empty">
            <User size={64} style={{ opacity: 0.3 }} />
            <div style={{ fontSize: '18px', fontWeight: '600', color: '#64748B' }}>No customers found</div>
            <div style={{ fontSize: '14px' }}>Make sure entries are saved!</div>
          </div>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table admin-table--wide">
              <thead>
                <tr>
                  <th>Customer Name</th>
                  <th>Mobile</th>
                  <th className="hide-mobile">Email</th>
                  <th className="hide-mobile">Address</th>
                  <th>Total Paid</th>
                  <th>Balance</th>
                  <th className="text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => {
                  const isNegative = c.balance < 0;
                  return (
                    <tr key={c.rowIndex}>
                      <td>
                        <div className="admin-cell-name">
                          <div className="admin-avatar admin-avatar--green">
                            {c.name ? c.name.charAt(0).toUpperCase() : 'C'}
                          </div>
                          <span className="admin-cell-name-text">{c.name || 'Unknown'}</span>
                        </div>
                      </td>
                      <td>{c.mobile || '-'}</td>
                      <td className="hide-mobile">{c.email || '-'}</td>
                      <td className="hide-mobile">{c.address || '-'}</td>
                      <td style={{ fontWeight: '600' }}>₹{c.totalPaid.toFixed(2)}</td>
                      <td>
                        <span className={`admin-badge ${isNegative ? 'admin-badge--negative' : 'admin-badge--positive'}`}>
                          ₹{c.balance.toFixed(2)}
                        </span>
                      </td>
                      <td className="text-center">
                        <button
                          type="button"
                          onClick={() => openDetails(c)}
                          className="admin-action-btn"
                        >
                          View Details
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

      {selectedCust && (
        <div className="admin-modal-overlay" onClick={closeDetails} role="presentation">
          <div className="admin-modal" onClick={e => e.stopPropagation()} role="dialog" aria-modal="true">
            <div className="admin-modal-header">
              <div className="admin-modal-header-main">
                <div className="admin-modal-icon">
                  <User size={24} color="#10B981" />
                </div>
                <div>
                  <h3 className="admin-modal-title">Customer Profile</h3>
                  <p className="admin-modal-subtitle">Detailed overview and financial summary</p>
                </div>
              </div>
              <button type="button" onClick={closeDetails} className="admin-modal-close" aria-label="Close">
                <X size={20} />
              </button>
            </div>

            <div className="admin-modal-body">
              <div className="admin-profile-card">
                <h4 className="admin-profile-name">{selectedCust.name}</h4>
                <div className="admin-detail-list">
                  <div className="admin-detail-item">
                    <Phone size={16} color="#64748B" style={{ marginTop: '2px', flexShrink: 0 }} />
                    <div>
                      <div className="admin-detail-label">Mobile Number</div>
                      <div className="admin-detail-value">{selectedCust.mobile || 'Not provided'}</div>
                    </div>
                  </div>
                  
                  <div className="admin-detail-item">
                    <Mail size={16} color="#64748B" style={{ marginTop: '2px', flexShrink: 0 }} />
                    <div>
                      <div className="admin-detail-label">Email Address</div>
                      <div className="admin-detail-value">{selectedCust.email || 'Not provided'}</div>
                    </div>
                  </div>

                  <div className="admin-detail-item">
                    <MapPin size={16} color="#64748B" style={{ marginTop: '2px', flexShrink: 0 }} />
                    <div>
                      <div className="admin-detail-label">Address</div>
                      <div className="admin-detail-value">{selectedCust.address || 'Not provided'}</div>
                    </div>
                  </div>
                  
                  <div className="admin-detail-item">
                    <FileText size={16} color="#64748B" style={{ marginTop: '2px', flexShrink: 0 }} />
                    <div>
                      <div className="admin-detail-label">Remarks</div>
                      <div className="admin-detail-remarks">{selectedCust.remarks || 'No remarks available'}</div>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h5 className="admin-section-label">Financial Summary</h5>
                <div className="admin-summary-grid">
                  <div className="admin-summary-card">
                    <span className="admin-summary-card-label">Total Paid</span>
                    <span className="admin-summary-card-value">₹{selectedCust.totalPaid.toFixed(2)}</span>
                  </div>
                  <div className="admin-summary-card">
                    <span className="admin-summary-card-label">GPay/UPI</span>
                    <span className="admin-summary-card-value">₹{selectedCust.gpayUpi.toFixed(2)}</span>
                  </div>
                  <div className="admin-summary-card">
                    <span className="admin-summary-card-label">Cash</span>
                    <span className="admin-summary-card-value">₹{selectedCust.cash.toFixed(2)}</span>
                  </div>
                  <div className={`admin-summary-card ${selectedCust.balance < 0 ? 'admin-summary-card--negative' : 'admin-summary-card--positive'}`}>
                    <span className="admin-summary-card-label">Balance</span>
                    <span className="admin-summary-card-value">₹{selectedCust.balance.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="admin-modal-footer">
              <button type="button" onClick={closeDetails} className="btn btn-primary" style={{ width: '100%', height: '48px', fontSize: '15px' }}>
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
