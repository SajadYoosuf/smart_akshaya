import React, { useState } from 'react';
import { Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';

export default function ReferencesForm({ references = [], onChange }) {
  const [expandedId, setExpandedId] = useState(references[0]?.id || null);

  const handleEntryChange = (id, key, value) => {
    const updated = references.map(r => r.id === id ? { ...r, [key]: value } : r);
    onChange(updated);
  };

  const handleAdd = () => {
    const newEntry = {
      id: 'ref-' + Math.random().toString(36).substr(2, 9),
      name: '',
      company: '',
      position: '',
      phone: '',
      email: ''
    };
    onChange([...references, newEntry]);
    setExpandedId(newEntry.id);
  };

  const handleRemove = (id) => {
    const filtered = references.filter(r => r.id !== id);
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
      {references.map((r) => {
        const isExpanded = expandedId === r.id;
        return (
          <div key={r.id} className="rb-card">
            <div className="rb-card-header" onClick={() => toggleExpand(r.id)}>
              <span className="rb-card-title">{r.name || 'Reference Name'}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); handleRemove(r.id); }}
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
                  <label className="rb-label-sm">Reference Name</label>
                  <input
                    type="text"
                    value={r.name}
                    onChange={(e) => handleEntryChange(r.id, 'name', e.target.value)}
                    className="rb-input rb-input--sm"
                    placeholder="Harumi Kobayashi"
                  />
                </div>

                <div className="rb-form-grid-2">
                  <div>
                    <label className="rb-label-sm">Company</label>
                    <input
                      type="text"
                      value={r.company}
                      onChange={(e) => handleEntryChange(r.id, 'company', e.target.value)}
                      className="rb-input rb-input--sm"
                      placeholder="Salford & Co."
                    />
                  </div>
                  <div>
                    <label className="rb-label-sm">Position</label>
                    <input
                      type="text"
                      value={r.position}
                      onChange={(e) => handleEntryChange(r.id, 'position', e.target.value)}
                      className="rb-input rb-input--sm"
                      placeholder="CEO"
                    />
                  </div>
                </div>

                <div className="rb-form-grid-2">
                  <div>
                    <label className="rb-label-sm">Phone</label>
                    <input
                      type="text"
                      value={r.phone}
                      onChange={(e) => handleEntryChange(r.id, 'phone', e.target.value)}
                      className="rb-input rb-input--sm"
                      placeholder="123-456-7890"
                    />
                  </div>
                  <div>
                    <label className="rb-label-sm">Email</label>
                    <input
                      type="email"
                      value={r.email}
                      onChange={(e) => handleEntryChange(r.id, 'email', e.target.value)}
                      className="rb-input rb-input--sm"
                      placeholder="hello@reallygreatsite.com"
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
        Add Reference
      </button>
    </div>
  );
}
