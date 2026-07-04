import React, { useState } from 'react';
import { Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';

export default function ProjectsForm({ projects = [], onChange }) {
  const [expandedId, setExpandedId] = useState(projects[0]?.id || null);

  const handleEntryChange = (id, key, value) => {
    const updated = projects.map(p => p.id === id ? { ...p, [key]: value } : p);
    onChange(updated);
  };

  const handleAdd = () => {
    const newEntry = {
      id: 'project-' + Math.random().toString(36).substr(2, 9),
      name: '',
      description: '',
      url: '',
      keywords: []
    };
    onChange([...projects, newEntry]);
    setExpandedId(newEntry.id);
  };

  const handleRemove = (id) => {
    const filtered = projects.filter(p => p.id !== id);
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
      {projects.map((p) => {
        const isExpanded = expandedId === p.id;
        const keywordsValue = p.keywords ? p.keywords.join(', ') : '';

        return (
          <div key={p.id} className="rb-card">
            <div className="rb-card-header" onClick={() => toggleExpand(p.id)}>
              <span className="rb-card-title">{p.name || 'Project Name'}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); handleRemove(p.id); }}
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
                    <label className="rb-label-sm">Project Name</label>
                    <input
                      type="text"
                      value={p.name}
                      onChange={(e) => handleEntryChange(p.id, 'name', e.target.value)}
                      className="rb-input rb-input--sm"
                      placeholder="My Portfolio"
                    />
                  </div>
                  <div>
                    <label className="rb-label-sm">Project URL</label>
                    <input
                      type="text"
                      value={p.url}
                      onChange={(e) => handleEntryChange(p.id, 'url', e.target.value)}
                      className="rb-input rb-input--sm"
                      placeholder="https://github.com/project"
                    />
                  </div>
                </div>

                <div>
                  <label className="rb-label-sm">Technologies Used (comma-separated)</label>
                  <input
                    type="text"
                    value={keywordsValue}
                    onChange={(e) => {
                      const arr = e.target.value.split(',').map(k => k.trim());
                      handleEntryChange(p.id, 'keywords', arr);
                    }}
                    className="rb-input rb-input--sm"
                    placeholder="React, AWS, Node.js"
                  />
                </div>

                <div>
                  <label className="rb-label-sm">Description</label>
                  <textarea
                    value={p.description}
                    onChange={(e) => handleEntryChange(p.id, 'description', e.target.value)}
                    rows={3}
                    className="rb-textarea"
                    placeholder="Describe what you built, achievements, and technology details..."
                  />
                </div>
              </div>
            )}
          </div>
        );
      })}

      <button type="button" onClick={handleAdd} className="rb-add-btn">
        <Plus size={16} />
        Add Project
      </button>
    </div>
  );
}
