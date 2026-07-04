import React, { useState } from 'react';
import { Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';

export default function WorkForm({ work = [], onChange }) {
  const [expandedId, setExpandedId] = useState(work[0]?.id || null);

  const handleEntryChange = (id, key, value) => {
    const updated = work.map(w => w.id === id ? { ...w, [key]: value } : w);
    onChange(updated);
  };

  const handleAdd = () => {
    const newEntry = {
      id: 'w-' + Math.random().toString(36).substr(2, 9),
      company: '',
      position: '',
      startDate: '',
      endDate: '',
      current: false,
      summary: ''
    };
    onChange([...work, newEntry]);
    setExpandedId(newEntry.id);
  };

  const handleRemove = (id) => {
    const filtered = work.filter(w => w.id !== id);
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
      {work.map((w) => {
        const isExpanded = expandedId === w.id;
        return (
          <div key={w.id} className="rb-card">
            <div
              className="rb-card-header"
              onClick={() => toggleExpand(w.id)}
            >
              <span className="rb-card-title">
                {w.position || 'Untitled Position'} {w.company ? `at ${w.company}` : ''}
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); handleRemove(w.id); }}
                  className="rb-icon-btn"
                >
                  <Trash2 size={14} />
                </button>
                {isExpanded ? <ChevronUp size={14} color="#94A3B8" /> : <ChevronDown size={14} color="#94A3B8" />}
              </div>
            </div>

            {isExpanded && (
              <div className="rb-card-body">
                <div className="rb-form-grid-2">
                  <div>
                    <label className="rb-label-sm">Company Name</label>
                    <input
                      type="text"
                      value={w.company}
                      onChange={(e) => handleEntryChange(w.id, 'company', e.target.value)}
                      className="rb-input rb-input--sm"
                      placeholder="Tech Corp"
                    />
                  </div>
                  <div>
                    <label className="rb-label-sm">Job Title</label>
                    <input
                      type="text"
                      value={w.position}
                      onChange={(e) => handleEntryChange(w.id, 'position', e.target.value)}
                      className="rb-input rb-input--sm"
                      placeholder="Software Engineer"
                    />
                  </div>
                </div>

                <div className="rb-form-grid-2">
                  <div>
                    <label className="rb-label-sm">Start Date</label>
                    <input
                      type="month"
                      value={w.startDate}
                      onChange={(e) => handleEntryChange(w.id, 'startDate', e.target.value)}
                      className="rb-input rb-input--sm"
                    />
                  </div>
                  <div>
                    <label className="rb-label-sm">End Date</label>
                    <input
                      type="month"
                      value={w.endDate}
                      disabled={w.current}
                      onChange={(e) => handleEntryChange(w.id, 'endDate', e.target.value)}
                      className="rb-input rb-input--sm"
                    />
                  </div>
                </div>

                <label className="rb-checkbox-label">
                  <input
                    type="checkbox"
                    checked={w.current}
                    onChange={(e) => {
                      handleEntryChange(w.id, 'current', e.target.checked);
                      if (e.target.checked) handleEntryChange(w.id, 'endDate', '');
                    }}
                  />
                  I currently work here
                </label>

                <div>
                  <label className="rb-label-sm">Role Description</label>
                  <textarea
                    value={w.summary}
                    onChange={(e) => handleEntryChange(w.id, 'summary', e.target.value)}
                    rows={3}
                    className="rb-textarea"
                    placeholder="Describe your responsibilities, technologies used, and key accomplishments..."
                  />
                </div>
              </div>
            )}
          </div>
        );
      })}

      <button type="button" onClick={handleAdd} className="rb-add-btn">
        <Plus size={16} />
        Add Experience
      </button>
    </div>
  );
}
