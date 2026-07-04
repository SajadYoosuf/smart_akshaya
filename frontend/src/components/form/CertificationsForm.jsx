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
    <div className="space-y-4">
      {certifications.map((c) => {
        const isExpanded = expandedId === c.id;
        return (
          <div key={c.id} className="border border-zinc-800 rounded bg-zinc-800/10">
            {/* Header bar of repeatable entry */}
            <div
              className="flex justify-between items-center p-3 cursor-pointer hover:bg-zinc-800/20"
              onClick={() => toggleExpand(c.id)}
            >
              <span className="text-xs font-semibold text-foreground truncate">
                {c.name || 'Certificate Name'}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); handleRemove(c.id); }}
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
                  <label className="text-[11px] text-muted-foreground block mb-0.5">Certificate Name</label>
                  <input
                    type="text"
                    value={c.name}
                    onChange={(e) => handleEntryChange(c.id, 'name', e.target.value)}
                    className="w-full bg-[#2a2b2d] border border-zinc-800 rounded px-2.5 py-1 text-xs text-foreground focus:outline-none focus:border-zinc-700"
                    placeholder="AWS Solutions Architect"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] text-muted-foreground block mb-0.5">Issuer</label>
                    <input
                      type="text"
                      value={c.issuer}
                      onChange={(e) => handleEntryChange(c.id, 'issuer', e.target.value)}
                      className="w-full bg-[#2a2b2d] border border-zinc-800 rounded px-2.5 py-1 text-xs text-foreground focus:outline-none focus:border-zinc-700"
                      placeholder="Amazon Web Services"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-muted-foreground block mb-0.5">Date Earned</label>
                    <input
                      type="month"
                      value={c.date}
                      onChange={(e) => handleEntryChange(c.id, 'date', e.target.value)}
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
        Add Certification
      </button>
    </div>
  );
}
