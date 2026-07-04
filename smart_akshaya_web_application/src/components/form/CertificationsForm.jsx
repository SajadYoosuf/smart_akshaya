import React, { useState } from 'react';
import { Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';

export default function CertificationsForm({ certifications = [], onChange }) {
  const [expandedId, setExpandedId] = useState(certifications[0]?.id || null);

  const handleEntryChange = (id, key, value) => {
    const updated = certifications.map(c => c.id === id ? { ...c, [key]: value } : c);
    onChange(updated);
  };

  const handleAdd = () => {
    const newEntry = {
      id: 'cert-' + Math.random().toString(36).substr(2, 9),
      name: '',
      issuer: '',
      date: ''
    };
    onChange([...certifications, newEntry]);
    setExpandedId(newEntry.id);
  };

  const handleRemove = (id) => {
    const filtered = certifications.filter(c => c.id !== id);
    onChange(filtered);
    if (expandedId === id) {
      setExpandedId(filtered[0]?.id || null);
    }
  };

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="rb-form-stack">
      {certifications.map((c) => {
        const isExpanded = expandedId === c.id;
        return (
          <div key={c.id} className="rb-card">
            <div className="rb-card-header" onClick={() => toggleExpand(c.id)}>
              <span className="rb-card-title">{c.name || 'Certificate Name'}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); handleRemove(c.id); }}
                  className="rb-icon-btn"
                >
                  <Trash2 size={14} />
                </button>
                {isExpanded ? <ChevronUp size={14} color="#94A3B8" /> : <ChevronDown size={14} color="#94A3B8" />}
              </div>
            </div>

            {isExpanded && (
              <div className="rb-card-body">
                <div>
                  <label className="rb-label-sm">Certificate Name</label>
                  <input
                    type="text"
                    value={c.name}
                    onChange={(e) => handleEntryChange(c.id, 'name', e.target.value)}
                    className="rb-input rb-input--sm"
                    placeholder="AWS Solutions Architect"
                  />
                </div>

                <div className="rb-form-grid-2">
                  <div>
                    <label className="rb-label-sm">Issuer</label>
                    <input
                      type="text"
                      value={c.issuer}
                      onChange={(e) => handleEntryChange(c.id, 'issuer', e.target.value)}
                      className="rb-input rb-input--sm"
                      placeholder="Amazon Web Services"
                    />
                  </div>
                  <div>
                    <label className="rb-label-sm">Date Earned</label>
                    <input
                      type="month"
                      value={c.date}
                      onChange={(e) => handleEntryChange(c.id, 'date', e.target.value)}
                      className="rb-input rb-input--sm"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}

      <button type="button" onClick={handleAdd} className="rb-add-btn">
        <Plus size={16} />
        Add Certification
      </button>
    </div>
  );
}
