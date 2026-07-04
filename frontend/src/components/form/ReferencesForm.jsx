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
    <div className="space-y-4">
      {references.map((r) => {
        const isExpanded = expandedId === r.id;
        return (
          <div key={r.id} className="border border-zinc-800 rounded bg-zinc-800/10">
            {/* Header bar of repeatable entry */}
            <div
              className="flex justify-between items-center p-3 cursor-pointer hover:bg-zinc-800/20"
              onClick={() => toggleExpand(r.id)}
            >
              <span className="text-xs font-semibold text-foreground truncate">
                {r.name || 'Reference Name'}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); handleRemove(r.id); }}
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
                  <label className="text-[11px] text-muted-foreground block mb-0.5">Reference Name</label>
                  <input
                    type="text"
                    value={r.name}
                    onChange={(e) => handleEntryChange(r.id, 'name', e.target.value)}
                    className="w-full bg-[#2a2b2d] border border-zinc-800 rounded px-2.5 py-1 text-xs text-foreground focus:outline-none focus:border-zinc-700"
                    placeholder="Harumi Kobayashi"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] text-muted-foreground block mb-0.5">Company</label>
                    <input
                      type="text"
                      value={r.company}
                      onChange={(e) => handleEntryChange(r.id, 'company', e.target.value)}
                      className="w-full bg-[#2a2b2d] border border-zinc-800 rounded px-2.5 py-1 text-xs text-foreground focus:outline-none focus:border-zinc-700"
                      placeholder="Salford & Co."
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-muted-foreground block mb-0.5">Position</label>
                    <input
                      type="text"
                      value={r.position}
                      onChange={(e) => handleEntryChange(r.id, 'position', e.target.value)}
                      className="w-full bg-[#2a2b2d] border border-zinc-800 rounded px-2.5 py-1 text-xs text-foreground focus:outline-none focus:border-zinc-700"
                      placeholder="CEO"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] text-muted-foreground block mb-0.5">Phone</label>
                    <input
                      type="text"
                      value={r.phone}
                      onChange={(e) => handleEntryChange(r.id, 'phone', e.target.value)}
                      className="w-full bg-[#2a2b2d] border border-zinc-800 rounded px-2.5 py-1 text-xs text-foreground focus:outline-none focus:border-zinc-700"
                      placeholder="123-456-7890"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-muted-foreground block mb-0.5">Email</label>
                    <input
                      type="email"
                      value={r.email}
                      onChange={(e) => handleEntryChange(r.id, 'email', e.target.value)}
                      className="w-full bg-[#2a2b2d] border border-zinc-800 rounded px-2.5 py-1 text-xs text-foreground focus:outline-none focus:border-zinc-700"
                      placeholder="hello@reallygreatsite.com"
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
        Add Reference
      </button>
    </div>
  );
}
