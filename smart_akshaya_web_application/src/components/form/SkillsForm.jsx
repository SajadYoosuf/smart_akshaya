import React, { useState } from 'react';
import { Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';

export default function SkillsForm({ skills = [], onChange }) {
  const [expandedId, setExpandedId] = useState(skills[0]?.id || null);

  const handleEntryChange = (id, key, value) => {
    const updated = skills.map(s => s.id === id ? { ...s, [key]: value } : s);
    onChange(updated);
  };

  const handleAdd = () => {
    const newEntry = {
      id: 'skill-' + Math.random().toString(36).substr(2, 9),
      name: '',
      keywords: []
    };
    onChange([...skills, newEntry]);
    setExpandedId(newEntry.id);
  };

  const handleRemove = (id) => {
    const filtered = skills.filter(s => s.id !== id);
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
      {skills.map((s) => {
        const isExpanded = expandedId === s.id;
        const keywordsValue = s.keywords ? s.keywords.join(', ') : '';

        return (
          <div key={s.id} className="rb-card">
            <div className="rb-card-header" onClick={() => toggleExpand(s.id)}>
              <span className="rb-card-title">{s.name || 'Skill Category'}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); handleRemove(s.id); }}
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
                  <label className="rb-label-sm">Category Name</label>
                  <input
                    type="text"
                    value={s.name}
                    onChange={(e) => handleEntryChange(s.id, 'name', e.target.value)}
                    className="rb-input rb-input--sm"
                    placeholder="Languages, Frameworks, etc."
                  />
                </div>

                <div>
                  <label className="rb-label-sm">Keywords (comma-separated)</label>
                  <input
                    type="text"
                    value={keywordsValue}
                    onChange={(e) => {
                      const arr = e.target.value.split(',').map(k => k.trim());
                      handleEntryChange(s.id, 'keywords', arr);
                    }}
                    className="rb-input rb-input--sm"
                    placeholder="JavaScript, Python, Go"
                  />
                </div>
              </div>
            )}
          </div>
        );
      })}

      <button type="button" onClick={handleAdd} className="rb-add-btn">
        <Plus size={16} />
        Add Skill Category
      </button>
    </div>
  );
}
