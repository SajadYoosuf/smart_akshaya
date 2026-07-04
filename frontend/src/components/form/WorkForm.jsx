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
    <div className="space-y-4">
      {work.map((w) => {
        const isExpanded = expandedId === w.id;
        return (
          <div key={w.id} className="border border-zinc-800 rounded bg-zinc-800/10">
            {/* Header bar of repeatable entry */}
            <div
              className="flex justify-between items-center p-3 cursor-pointer hover:bg-zinc-800/20"
              onClick={() => toggleExpand(w.id)}
            >
              <span className="text-xs font-semibold text-foreground truncate">
                {w.position || 'Untitled Position'} {w.company ? `at ${w.company}` : ''}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); handleRemove(w.id); }}
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
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] text-muted-foreground block mb-0.5">Company Name</label>
                    <input
                      type="text"
                      value={w.company}
                      onChange={(e) => handleEntryChange(w.id, 'company', e.target.value)}
                      className="w-full bg-[#2a2b2d] border border-zinc-800 rounded px-2.5 py-1 text-xs text-foreground focus:outline-none focus:border-zinc-700"
                      placeholder="Tech Corp"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-muted-foreground block mb-0.5">Job Title</label>
                    <input
                      type="text"
                      value={w.position}
                      onChange={(e) => handleEntryChange(w.id, 'position', e.target.value)}
                      className="w-full bg-[#2a2b2d] border border-zinc-800 rounded px-2.5 py-1 text-xs text-foreground focus:outline-none focus:border-zinc-700"
                      placeholder="Software Engineer"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] text-muted-foreground block mb-0.5">Start Date</label>
                    <input
                      type="month"
                      value={w.startDate}
                      onChange={(e) => handleEntryChange(w.id, 'startDate', e.target.value)}
                      className="w-full bg-[#2a2b2d] border border-zinc-800 rounded px-2.5 py-1 text-xs text-foreground focus:outline-none focus:border-zinc-700"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-muted-foreground block mb-0.5">End Date</label>
                    <input
                      type="month"
                      value={w.endDate}
                      disabled={w.current}
                      onChange={(e) => handleEntryChange(w.id, 'endDate', e.target.value)}
                      className="w-full bg-[#2a2b2d] border border-zinc-800 rounded px-2.5 py-1 text-xs text-foreground focus:outline-none focus:border-zinc-700 disabled:opacity-40"
                    />
                  </div>
                </div>

                <label className="flex items-center gap-2 text-[11px] text-muted-foreground cursor-pointer py-1">
                  <input
                    type="checkbox"
                    checked={w.current}
                    onChange={(e) => {
                      handleEntryChange(w.id, 'current', e.target.checked);
                      if (e.target.checked) handleEntryChange(w.id, 'endDate', '');
                    }}
                    className="rounded border-zinc-700 bg-zinc-800 text-sky-400 size-3.5 focus:ring-sky-400"
                  />
                  I currently work here
                </label>

                <div>
                  <label className="text-[11px] text-muted-foreground block mb-0.5">Role Description</label>
                  <textarea
                    value={w.summary}
                    onChange={(e) => handleEntryChange(w.id, 'summary', e.target.value)}
                    rows={3}
                    className="w-full bg-[#2a2b2d] border border-zinc-800 rounded px-2.5 py-1 text-xs text-foreground focus:outline-none focus:border-zinc-700 resize-y"
                    placeholder="Describe your responsibilities, technologies used, and key accomplishments..."
                  />
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
        Add Experience
      </button>
    </div>
  );
}
