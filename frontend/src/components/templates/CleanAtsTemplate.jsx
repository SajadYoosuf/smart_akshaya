import React from 'react';
import { getProfileImageStyle } from '../../lib/imageStyle';

export default function CleanAtsTemplate({ data }) {
  const { basics = {}, work = [], education = [], skills = [], projects = [], certifications = [], theme = {} } = data;
  return (
    <div className="p-8 text-xs select-none">
      {/* Header */}
      <div className="border-b-2 border-[var(--primary)] pb-4 mb-5 flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-extrabold text-[var(--primary)] tracking-tight uppercase">{basics.name || 'Your Name'}</h1>
          <h2 className="text-base font-semibold text-[var(--secondary)] mt-1">{basics.label || 'Professional Title'}</h2>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-gray-550 mt-2 font-medium">
            {basics.email && <span>Email: {basics.email}</span>}
            {basics.phone && <span>Phone: {basics.phone}</span>}
            {basics.url && <span>Web: {basics.url}</span>}
            {basics.location && <span>Loc: {basics.location}</span>}
          </div>
        </div>
        {basics.image && (
          <img 
            src={basics.image} 
            style={getProfileImageStyle(theme, { size: 80, shape: 'rounded-square', borderWidth: 1, borderColor: '#e5e7eb' })}
            alt="profile" 
          />
        )}
      </div>

      {/* Summary */}
      {basics.summary && (
        <div className="mb-5 break-inside-avoid">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--primary)] border-b border-gray-200 pb-1 mb-2">Professional Summary</h3>
          <p className="text-gray-600 leading-relaxed">{basics.summary}</p>
        </div>
      )}

      {/* Work Experience */}
      {work.length > 0 && (
        <div className="mb-5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--primary)] border-b border-gray-200 pb-1 mb-3">Work Experience</h3>
          <div className="space-y-4">
            {work.map((w, idx) => (
              <div key={w.id || idx} className="break-inside-avoid">
                <div className="flex justify-between items-start font-semibold text-[11px] text-gray-900">
                  <div>
                    <span className="text-[var(--secondary)]">{w.position}</span> at <span>{w.company}</span>
                  </div>
                  <div className="text-gray-500 text-[10px]">
                    {w.startDate} - {w.current ? 'Present' : w.endDate}
                  </div>
                </div>
                {w.summary && <p className="text-gray-600 mt-1 leading-relaxed">{w.summary}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Education */}
      {education.length > 0 && (
        <div className="mb-5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--primary)] border-b border-gray-200 pb-1 mb-3">Education</h3>
          <div className="space-y-3">
            {education.map((edu, idx) => (
              <div key={edu.id || idx} className="break-inside-avoid flex justify-between items-start">
                <div>
                  <div className="font-bold text-gray-900">{edu.studyType} in {edu.area}</div>
                  <div className="text-gray-600">{edu.institution}</div>
                </div>
                <div className="text-gray-500 text-[10px] font-medium">
                  {edu.startDate} - {edu.endDate}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Skills */}
      {skills.length > 0 && (
        <div className="mb-5 break-inside-avoid">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--primary)] border-b border-gray-200 pb-1 mb-3">Skills</h3>
          <div className="flex flex-wrap gap-2">
            {skills.map((s, idx) => (
              <span key={s.id || idx} className="bg-gray-100 text-gray-800 text-[11px] px-2.5 py-1 rounded-md font-medium">
                {s.name}{s.keywords && s.keywords.length > 0 ? `: ${s.keywords.join(', ')}` : ''}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Projects */}
      {projects.length > 0 && (
        <div className="mb-5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--primary)] border-b border-gray-200 pb-1 mb-3">Key Projects</h3>
          <div className="space-y-4">
            {projects.map((p, idx) => (
              <div key={p.id || idx} className="break-inside-avoid">
                <div className="flex justify-between items-center font-bold text-gray-900">
                  <div>{p.name}</div>
                  {p.url && <a href={p.url} target="_blank" rel="noreferrer" className="text-[var(--primary)] text-[10px] underline font-medium">Link</a>}
                </div>
                <p className="text-gray-600 mt-1 leading-relaxed">{p.description}</p>
                {p.keywords && p.keywords.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {p.keywords.map((kw, kIdx) => (
                      <span key={kIdx} className="text-[9px] bg-gray-50 text-gray-500 px-1.5 py-0.5 rounded border border-gray-100">{kw}</span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Certifications */}
      {certifications.length > 0 && (
        <div className="mb-5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--primary)] border-b border-gray-200 pb-1 mb-3">Certifications</h3>
          <div className="grid grid-cols-2 gap-2">
            {certifications.map((c, idx) => (
              <div key={c.id || idx} className="break-inside-avoid border-l-2 border-[var(--primary)] pl-2.5 py-0.5">
                <div className="font-bold text-gray-900">{c.name}</div>
                <div className="text-gray-500 text-[10px]">{c.issuer} ({c.date})</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
