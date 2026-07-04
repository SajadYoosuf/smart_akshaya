import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Calendar, Tag, DollarSign, FileText, Search, X, Receipt } from 'lucide-react';
import { getRows, appendRow, updateRow } from '../services/googleSheetsService';
import { SHEETS_CONFIG } from '../config/sheetsConfig';

export default function ExpensesScreen() {
  const [expenses, setExpenses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  
  // Form State
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  
  // Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [editingRowIndex, setEditingRowIndex] = useState(-1);
  const [editingId, setEditingId] = useState('');

  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    setIsLoading(true);
    try {
      const rows = await getRows(SHEETS_CONFIG.expenseSheetName);
      if (rows && rows.length > 1) {
        const hasHeader = rows[0].length > 0 && rows[0][0].toString().trim().toLowerCase() === 'id';
        const startRowIndex = hasHeader ? 1 : 0;
        
        const parsedList = [];
        for (let i = startRowIndex; i < rows.length; i++) {
          const row = rows[i];
          if (!row || row.length === 0 || !row[0].toString().trim()) continue;
          
          parsedList.push({
            id: row[0] || '',
            date: row[1] || '',
            category: row[2] || '',
            amount: row[3] || '',
            description: row[4] || '',
            rowIndex: i + 1,
          });
        }
        setExpenses(parsedList.reverse());
      } else {
        setExpenses([]);
      }
    } catch (error) {
      console.error('Failed to fetch expenses:', error);
      alert('Failed to fetch expenses.');
    } finally {
      setIsLoading(false);
    }
  };

  const clearForm = () => {
    setDate(new Date().toISOString().split('T')[0]);
    setCategory('');
    setAmount('');
    setDescription('');
    setIsEditing(false);
    setEditingRowIndex(-1);
    setEditingId('');
    setShowModal(false);
  };

  const handleEdit = (expense) => {
    setIsEditing(true);
    setEditingRowIndex(expense.rowIndex);
    setEditingId(expense.id);
    setDate(expense.date);
    setCategory(expense.category);
    setAmount(expense.amount);
    setDescription(expense.description);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!date.trim() || !category.trim() || !amount.trim()) {
      alert('Please fill out Date, Category, and Amount.');
      return;
    }

    try {
      const newId = isEditing ? editingId : Date.now().toString();
      const rowData = [newId, date.trim(), category.trim(), amount.trim(), description.trim()];

      if (isEditing) {
        await updateRow(SHEETS_CONFIG.expenseSheetName, editingRowIndex, rowData);
      } else {
        await appendRow(SHEETS_CONFIG.expenseSheetName, rowData);
      }
      
      clearForm();
      fetchExpenses();
    } catch (error) {
      console.error('Error saving expense:', error);
      alert('Error saving expense.');
    }
  };

  const handleDelete = async (rowIndex) => {
    if (window.confirm('Are you sure you want to delete this expense?')) {
      try {
        await updateRow(SHEETS_CONFIG.expenseSheetName, rowIndex, ['', '', '', '', '']);
        if (isEditing && editingRowIndex === rowIndex) {
          clearForm();
        }
        fetchExpenses();
      } catch (error) {
        console.error('Error deleting expense:', error);
        alert('Error deleting expense.');
      }
    }
  };

  const filteredExpenses = expenses.filter(e => {
    const q = searchQuery.toLowerCase();
    return (e.category || '').toLowerCase().includes(q) ||
           (e.description || '').toLowerCase().includes(q) ||
           (e.date || '').toLowerCase().includes(q);
  });

  const totalExpenses = filteredExpenses.reduce((acc, curr) => {
    return acc + (parseFloat(curr.amount) || 0);
  }, 0);

  // Category Color Map
  const getCategoryColor = (cat) => {
    const c = cat.toLowerCase();
    if (c.includes('rent')) return { bg: '#FCE7F3', text: '#BE185D' };
    if (c.includes('office')) return { bg: '#E0E7FF', text: '#4338CA' };
    if (c.includes('salary') || c.includes('wage')) return { bg: '#DCFCE7', text: '#15803D' };
    if (c.includes('utility') || c.includes('bill')) return { bg: '#FEF3C7', text: '#B45309' };
    return { bg: '#F1F5F9', text: '#475569' };
  };

  return (
    <div style={{ padding: '32px 40px', maxWidth: '1400px', margin: '0 auto', position: 'relative', minHeight: 'calc(100vh - 70px)' }}>
      
      {/* Hero Header Section */}
      <div style={{ 
        background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)', 
        borderRadius: '20px', 
        padding: '32px 40px', 
        color: 'white', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        boxShadow: '0 10px 25px -5px rgba(124, 58, 237, 0.4)',
        marginBottom: '32px',
        flexWrap: 'wrap',
        gap: '24px'
      }}>
        <div>
          <div style={{ fontSize: '14px', fontWeight: '600', letterSpacing: '1px', opacity: 0.8, marginBottom: '8px' }}>
            TOTAL EXPENSES
          </div>
          <div style={{ fontSize: '48px', fontWeight: '800', letterSpacing: '-1px', display: 'flex', alignItems: 'baseline', gap: '4px' }}>
            <span style={{ fontSize: '32px', opacity: 0.8 }}>₹</span>
            {totalExpenses.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>
        
        <div style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)', padding: '16px 24px', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Receipt size={32} opacity={0.9} />
          <div>
            <div style={{ fontSize: '20px', fontWeight: '700' }}>{filteredExpenses.length}</div>
            <div style={{ fontSize: '12px', opacity: 0.8, fontWeight: '500' }}>RECORDS FOUND</div>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', gap: '16px', flexWrap: 'wrap' }}>
        <h2 style={{ margin: 0, fontSize: '20px', color: '#1E293B', fontWeight: '700' }}>Recent Transactions</h2>
        
        <div style={{ position: 'relative', flex: '1 1 300px', maxWidth: '400px' }}>
          <Search size={18} style={{ position: 'absolute', left: '16px', top: '12px', color: '#94A3B8' }} />
          <input 
            type="text"
            placeholder="Search by category, description, or date..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{ 
              width: '100%', height: '44px', padding: '0 40px 0 44px', 
              borderRadius: '22px', border: '1px solid #E2E8F0', outline: 'none', 
              fontSize: '14px', backgroundColor: 'white',
              boxShadow: '0 2px 4px rgba(0,0,0,0.02)', boxSizing: 'border-box'
            }}
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              style={{ position: 'absolute', right: '12px', top: '12px', background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8' }}
            >
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      {/* Modern Data Table */}
      <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #E2E8F0', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
        {isLoading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#64748B', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '32px', height: '32px', border: '3px solid #E2E8F0', borderTopColor: '#4F46E5', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
            <span>Loading records...</span>
          </div>
        ) : filteredExpenses.length === 0 ? (
          <div style={{ padding: '80px 20px', textAlign: 'center', color: '#94A3B8' }}>
            <Receipt size={64} style={{ opacity: 0.3, marginBottom: '16px' }} />
            <div style={{ fontSize: '18px', fontWeight: '600', color: '#64748B' }}>No expenses found</div>
            <div style={{ fontSize: '14px', marginTop: '4px' }}>Click the + button to add a new record.</div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '700px' }}>
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                  <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '700', color: '#64748B', letterSpacing: '0.5px' }}>DATE</th>
                  <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '700', color: '#64748B', letterSpacing: '0.5px' }}>CATEGORY</th>
                  <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '700', color: '#64748B', letterSpacing: '0.5px' }}>DESCRIPTION</th>
                  <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '700', color: '#64748B', letterSpacing: '0.5px', textAlign: 'right' }}>AMOUNT</th>
                  <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '700', color: '#64748B', letterSpacing: '0.5px', textAlign: 'right' }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {filteredExpenses.map((expense) => {
                  const colors = getCategoryColor(expense.category);
                  return (
                    <tr key={expense.rowIndex} style={{ borderBottom: '1px solid #F1F5F9', transition: 'background-color 0.15s' }} className="expense-row">
                      <td style={{ padding: '16px 24px', fontSize: '14px', color: '#334155', fontWeight: '500' }}>
                        {expense.date}
                      </td>
                      <td style={{ padding: '16px 24px' }}>
                        <span style={{ 
                          display: 'inline-flex', padding: '4px 10px', 
                          background: colors.bg, color: colors.text, 
                          borderRadius: '20px', fontSize: '13px', fontWeight: '600' 
                        }}>
                          {expense.category}
                        </span>
                      </td>
                      <td style={{ padding: '16px 24px', fontSize: '14px', color: '#64748B' }}>
                        {expense.description || '-'}
                      </td>
                      <td style={{ padding: '16px 24px', fontSize: '15px', fontWeight: '700', color: '#0F172A', textAlign: 'right' }}>
                        ₹{parseFloat(expense.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td style={{ padding: '16px 24px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                        <button 
                          onClick={() => handleEdit(expense)}
                          style={{ background: '#EFF6FF', border: 'none', cursor: 'pointer', color: '#3B82F6', marginRight: '8px', padding: '8px', borderRadius: '8px', transition: 'background 0.2s' }}
                          title="Edit"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          onClick={() => handleDelete(expense.rowIndex)}
                          style={{ background: '#FEF2F2', border: 'none', cursor: 'pointer', color: '#EF4444', padding: '8px', borderRadius: '8px', transition: 'background 0.2s' }}
                          title="Delete"
                        >
                          <Trash2 size={16} />
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

      {/* Floating Action Button (FAB) */}
      <button
        onClick={() => { clearForm(); setShowModal(true); }}
        style={{
          position: 'fixed',
          bottom: '40px',
          right: '40px',
          width: '64px',
          height: '64px',
          borderRadius: '32px',
          backgroundColor: '#4F46E5',
          color: 'white',
          border: 'none',
          boxShadow: '0 10px 25px rgba(79, 70, 229, 0.4)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'transform 0.2s, background-color 0.2s',
          zIndex: 100,
        }}
        onMouseEnter={e => {
          e.currentTarget.style.transform = 'scale(1.05) translateY(-2px)';
          e.currentTarget.style.backgroundColor = '#4338CA';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.transform = 'scale(1) translateY(0)';
          e.currentTarget.style.backgroundColor = '#4F46E5';
        }}
      >
        <Plus size={32} />
      </button>

      {/* Glassmorphic Modal */}
      {showModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, padding: '20px', animation: 'fadeIn 0.2s ease-out'
        }}>
          <div style={{
            background: 'white', borderRadius: '24px', width: '100%', maxWidth: '480px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', overflow: 'hidden',
            animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
          }}>
            <div style={{ padding: '24px 32px', borderBottom: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '700', color: '#1E293B' }}>
                {isEditing ? 'Edit Expense' : 'Add New Expense'}
              </h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: '4px' }}>
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label style={{ fontSize: '13px', fontWeight: '700', color: '#475569', marginBottom: '8px', display: 'block' }}>Date *</label>
                <div style={{ position: 'relative' }}>
                  <Calendar size={18} style={{ position: 'absolute', left: '16px', top: '14px', color: '#94A3B8' }} />
                  <input 
                    type="date" value={date} onChange={e => setDate(e.target.value)} required
                    style={{ width: '100%', height: '48px', padding: '0 16px 0 44px', borderRadius: '12px', border: '1px solid #E2E8F0', outline: 'none', fontSize: '15px', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '13px', fontWeight: '700', color: '#475569', marginBottom: '8px', display: 'block' }}>Category *</label>
                <div style={{ position: 'relative' }}>
                  <Tag size={18} style={{ position: 'absolute', left: '16px', top: '14px', color: '#94A3B8' }} />
                  <input 
                    type="text" value={category} onChange={e => setCategory(e.target.value)} required placeholder="e.g. Rent, Utilities, Salaries"
                    style={{ width: '100%', height: '48px', padding: '0 16px 0 44px', borderRadius: '12px', border: '1px solid #E2E8F0', outline: 'none', fontSize: '15px', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '13px', fontWeight: '700', color: '#475569', marginBottom: '8px', display: 'block' }}>Amount (₹) *</label>
                <div style={{ position: 'relative' }}>
                  <DollarSign size={18} style={{ position: 'absolute', left: '16px', top: '14px', color: '#94A3B8' }} />
                  <input 
                    type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} required placeholder="0.00"
                    style={{ width: '100%', height: '48px', padding: '0 16px 0 44px', borderRadius: '12px', border: '1px solid #E2E8F0', outline: 'none', fontSize: '15px', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '13px', fontWeight: '700', color: '#475569', marginBottom: '8px', display: 'block' }}>Description (Optional)</label>
                <div style={{ position: 'relative' }}>
                  <FileText size={18} style={{ position: 'absolute', left: '16px', top: '16px', color: '#94A3B8' }} />
                  <textarea 
                    value={description} onChange={e => setDescription(e.target.value)} placeholder="Add some details..."
                    style={{ width: '100%', minHeight: '100px', padding: '14px 16px 14px 44px', borderRadius: '12px', border: '1px solid #E2E8F0', outline: 'none', fontSize: '15px', boxSizing: 'border-box', resize: 'vertical' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '16px', marginTop: '12px' }}>
                <button type="button" onClick={() => setShowModal(false)}
                  style={{ flex: 1, height: '52px', background: '#F1F5F9', color: '#475569', border: 'none', borderRadius: '12px', fontWeight: '700', fontSize: '15px', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button type="submit"
                  style={{ flex: 2, height: '52px', background: '#4F46E5', color: 'white', border: 'none', borderRadius: '12px', fontWeight: '700', fontSize: '15px', cursor: 'pointer', boxShadow: '0 4px 12px rgba(79, 70, 229, 0.3)' }}
                >
                  {isEditing ? 'Save Changes' : 'Add Expense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Global styles for animation */}
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes spin { 100% { transform: rotate(360deg); } }
        .expense-row:hover { background-color: #F8FAFC !important; }
      `}</style>
    </div>
  );
}
