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
    <div className="space-y-4">
      {education.map((edu) => {
        const isExpanded = expandedId === edu.id;
        return (
          <div key={edu.id} className="border border-zinc-800 rounded bg-zinc-800/10">
            {/* Header bar of repeatable entry */}
            <div
              className="flex justify-between items-center p-3 cursor-pointer hover:bg-zinc-800/20"
              onClick={() => toggleExpand(edu.id)}
            >
              <span className="text-xs font-semibold text-foreground truncate">
                {edu.studyType || 'Degree'} {edu.area ? `in ${edu.area}` : ''} {edu.institution ? `@ ${edu.institution}` : ''}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); handleRemove(edu.id); }}
                  className="p-1 hover:text-rose-400 text-muted-foreground transition-colors bg-transparent border-0 cursor-pointer"
                >
                  <Trash2 className="size-3.5" />
                </button>
                {isExpanded ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
              </div>
            </div>

            {/* Inner Content fields */}
            {isExpanded && (
              <div className="p-3 border-t border-zinc-800 space-y-3 bg-[#2a2b2d]/10">
                <div>
                  <label className="text-[11px] text-muted-foreground block mb-0.5">Institution Name</label>
                  <input
                    type="text"
                    value={edu.institution}
                    onChange={(e) => handleEntryChange(edu.id, 'institution', e.target.value)}
                    className="w-full bg-[#2a2b2d] border border-zinc-800 rounded px-2.5 py-1 text-xs text-foreground focus:outline-none focus:border-zinc-700"
                    placeholder="Stanford University"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] text-muted-foreground block mb-0.5">Degree Type</label>
                    <input
                      type="text"
                      value={edu.studyType}
                      onChange={(e) => handleEntryChange(edu.id, 'studyType', e.target.value)}
                      className="w-full bg-[#2a2b2d] border border-zinc-800 rounded px-2.5 py-1 text-xs text-foreground focus:outline-none focus:border-zinc-700"
                      placeholder="B.S. or M.S."
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-muted-foreground block mb-0.5">Area of Study</label>
                    <input
                      type="text"
                      value={edu.area}
                      onChange={(e) => handleEntryChange(edu.id, 'area', e.target.value)}
                      className="w-full bg-[#2a2b2d] border border-zinc-800 rounded px-2.5 py-1 text-xs text-foreground focus:outline-none focus:border-zinc-700"
                      placeholder="Computer Science"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] text-muted-foreground block mb-0.5">Start Date</label>
                    <input
                      type="month"
                      value={edu.startDate}
                      onChange={(e) => handleEntryChange(edu.id, 'startDate', e.target.value)}
                      className="w-full bg-[#2a2b2d] border border-zinc-800 rounded px-2.5 py-1 text-xs text-foreground focus:outline-none focus:border-zinc-700"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-muted-foreground block mb-0.5">End Date</label>
                    <input
                      type="month"
                      value={edu.endDate}
                      onChange={(e) => handleEntryChange(edu.id, 'endDate', e.target.value)}
                      className="w-full bg-[#2a2b2d] border border-zinc-800 rounded px-2.5 py-1 text-xs text-foreground focus:outline-none focus:border-zinc-700"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}

      <button
        type="button"
        onClick={handleAdd}
        className="w-full border border-dashed border-zinc-800 rounded py-2 flex items-center justify-center gap-1.5 text-xs text-muted-foreground hover:text-foreground hover:border-zinc-700 transition-colors bg-transparent cursor-pointer"
      >
        <Plus className="size-4" />
        Add Education
      </button>
    </div>
  );
}
