import React, { useState } from 'react';
import { Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';

export default function EducationForm({ education = [], onChange }) {
  const [expandedId, setExpandedId] = useState(education[0]?.id || null);

  const handleEntryChange = (id, key, value) => {
    const updated = education.map(e => e.id === id ? { ...e, [key]: value } : e);
    onChange(updated);
  };

  const handleAdd = () => {
    const newEntry = {
      id: 'edu-' + Math.random().toString(36).substr(2, 9),
      institution: '',
      studyType: '',
      area: '',
      startDate: '',
      endDate: ''
    };
    onChange([...education, newEntry]);
    setExpandedId(newEntry.id);
  };

  const handleRemove = (id) => {
    const filtered = education.filter(e => e.id !== id);
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
      {education.map((edu) => {
        const isExpanded = expandedId === edu.id;
        return (
          <div key={edu.id} className="rb-card">
            <div className="rb-card-header" onClick={() => toggleExpand(edu.id)}>
              <span className="rb-card-title">
                {edu.studyType || 'Degree'} {edu.area ? `in ${edu.area}` : ''} {edu.institution ? `@ ${edu.institution}` : ''}
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); handleRemove(edu.id); }}
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
                  <label className="rb-label-sm">Institution Name</label>
                  <input
                    type="text"
                    value={edu.institution}
                    onChange={(e) => handleEntryChange(edu.id, 'institution', e.target.value)}
                    className="rb-input rb-input--sm"
                    placeholder="Stanford University"
                  />
                </div>

                <div className="rb-form-grid-2">
                  <div>
                    <label className="rb-label-sm">Degree Type</label>
                    <input
                      type="text"
                      value={edu.studyType}
                      onChange={(e) => handleEntryChange(edu.id, 'studyType', e.target.value)}
                      className="rb-input rb-input--sm"
                      placeholder="B.S. or M.S."
                    />
                  </div>
                  <div>
                    <label className="rb-label-sm">Area of Study</label>
                    <input
                      type="text"
                      value={edu.area}
                      onChange={(e) => handleEntryChange(edu.id, 'area', e.target.value)}
                      className="rb-input rb-input--sm"
                      placeholder="Computer Science"
                    />
                  </div>
                </div>

                <div className="rb-form-grid-2">
                  <div>
                    <label className="rb-label-sm">Start Date</label>
                    <input
                      type="month"
                      value={edu.startDate}
                      onChange={(e) => handleEntryChange(edu.id, 'startDate', e.target.value)}
                      className="rb-input rb-input--sm"
                    />
                  </div>
                  <div>
                    <label className="rb-label-sm">End Date</label>
                    <input
                      type="month"
                      value={edu.endDate}
                      onChange={(e) => handleEntryChange(edu.id, 'endDate', e.target.value)}
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
        Add Education
      </button>
    </div>
  );
}
