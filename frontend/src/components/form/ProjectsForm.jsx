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
    <div className="space-y-4">
      {projects.map((p) => {
        const isExpanded = expandedId === p.id;
        const keywordsValue = p.keywords ? p.keywords.join(', ') : '';

        return (
          <div key={p.id} className="border border-zinc-800 rounded bg-zinc-800/10">
            {/* Header bar of repeatable entry */}
            <div
              className="flex justify-between items-center p-3 cursor-pointer hover:bg-zinc-800/20"
              onClick={() => toggleExpand(p.id)}
            >
              <span className="text-xs font-semibold text-foreground truncate">
                {p.name || 'Project Name'}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); handleRemove(p.id); }}
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
                    <label className="text-[11px] text-muted-foreground block mb-0.5">Project Name</label>
                    <input
                      type="text"
                      value={p.name}
                      onChange={(e) => handleEntryChange(p.id, 'name', e.target.value)}
                      className="w-full bg-[#2a2b2d] border border-zinc-800 rounded px-2.5 py-1 text-xs text-foreground focus:outline-none focus:border-zinc-700"
                      placeholder="My Portfolio"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-muted-foreground block mb-0.5">Project URL</label>
                    <input
                      type="text"
                      value={p.url}
                      onChange={(e) => handleEntryChange(p.id, 'url', e.target.value)}
                      className="w-full bg-[#2a2b2d] border border-zinc-800 rounded px-2.5 py-1 text-xs text-foreground focus:outline-none focus:border-zinc-700"
                      placeholder="https://github.com/project"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] text-muted-foreground block mb-0.5">Technologies Used (Comma-separated)</label>
                  <input
                    type="text"
                    value={keywordsValue}
                    onChange={(e) => {
                      const arr = e.target.value.split(',').map(k => k.trim());
                      handleEntryChange(p.id, 'keywords', arr);
                    }}
                    className="w-full bg-[#2a2b2d] border border-zinc-800 rounded px-2.5 py-1 text-xs text-foreground focus:outline-none focus:border-zinc-700"
                    placeholder="React, AWS, Node.js"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-muted-foreground block mb-0.5">Description</label>
                  <textarea
                    value={p.description}
                    onChange={(e) => handleEntryChange(p.id, 'description', e.target.value)}
                    rows={3}
                    className="w-full bg-[#2a2b2d] border border-zinc-800 rounded px-2.5 py-1 text-xs text-foreground focus:outline-none focus:border-zinc-700 resize-y"
                    placeholder="Describe what you built, achievements, and technology details..."
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
        Add Project
      </button>
    </div>
  );
}
