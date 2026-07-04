import React from 'react';
import { getProfileImageStyle } from '../../lib/imageStyle';

export default function ModernSidebarTemplate({ data }) {
  const { basics = {}, work = [], education = [], skills = [], projects = [], certifications = [], theme = {} } = data;
  return (
    <div className="flex min-h-[1100px] w-full text-xs font-sans">
      {/* Left Column Sidebar */}
      <div className="w-[32%] bg-[var(--secondary)] text-white p-6 flex flex-col gap-6 select-none">
        {basics.image && (
          <div className="flex justify-center mb-2">
            <img 
              src={basics.image} 
              style={getProfileImageStyle(theme, { size: 112, shape: 'circle', borderWidth: 2, borderColor: 'rgba(255, 255, 255, 0.2)' })}
              className="shadow-md" 
              alt="profile" 
            />
          </div>
        )}

        {/* Contact Section */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider border-b border-white/20 pb-1 mb-3 text-[var(--primary)]">Contact</h3>
          <ul className="space-y-2.5 text-[10px] text-white/90">
            {basics.email && <li className="break-all"><strong>Email:</strong><br/>{basics.email}</li>}
            {basics.phone && <li><strong>Phone:</strong><br/>{basics.phone}</li>}
            {basics.url && <li className="break-all"><strong>Web:</strong><br/>{basics.url}</li>}
            {basics.location && <li><strong>Location:</strong><br/>{basics.location}</li>}
          </ul>
        </div>

        {/* Skills Section */}
        {skills.length > 0 && (
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider border-b border-white/20 pb-1 mb-3 text-[var(--primary)]">Skills</h3>
            <div className="space-y-2">
              {skills.map((s, idx) => (
                <div key={s.id || idx} className="break-inside-avoid">
                  <div className="font-semibold text-white/95">{s.name}</div>
                  {s.keywords && s.keywords.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {s.keywords.map((kw, kIdx) => (
                        <span key={kIdx} className="bg-white/10 text-white/90 text-[9px] px-1.5 py-0.5 rounded">{kw}</span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Education Section */}
        {education.length > 0 && (
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider border-b border-white/20 pb-1 mb-3 text-[var(--primary)]">Education</h3>
            <div className="space-y-3.5 text-[10px]">
              {education.map((edu, idx) => (
                <div key={edu.id || idx} className="break-inside-avoid">
                  <div className="font-bold text-white">{edu.studyType} in {edu.area}</div>
                  <div className="text-white/85">{edu.institution}</div>
                  <div className="text-white/50 text-[9px] mt-0.5">{edu.startDate} - {edu.endDate}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Right Column Main Body */}
      <div className="w-[68%] bg-[var(--backgroundColor)] p-8 flex flex-col gap-6 select-none">
        {/* Header */}
        <div className="border-b border-gray-100 pb-4">
          <h1 className="text-3xl font-extrabold text-[var(--secondary)] tracking-tight uppercase">{basics.name || 'Your Name'}</h1>
          <h2 className="text-xs font-semibold text-[var(--primary)] mt-1 tracking-wide uppercase">{basics.label || 'Professional Title'}</h2>
        </div>

        {/* Summary */}
        {basics.summary && (
          <div className="page-break-avoid">
            <h3 className="text-[10px] font-bold uppercase tracking-wider text-[var(--secondary)] border-l-4 border-[var(--primary)] pl-2 mb-2">Professional Summary</h3>
            <p className="text-gray-600 leading-relaxed font-light">{basics.summary}</p>
          </div>
        )}

        {/* Experience */}
        {work.length > 0 && (
          <div>
            <h3 className="text-[10px] font-bold uppercase tracking-wider text-[var(--secondary)] border-l-4 border-[var(--primary)] pl-2 mb-3">Work History</h3>
            <div className="space-y-4">
              {work.map((w, idx) => (
                <div key={w.id || idx} className="page-break-avoid">
                  <div className="flex justify-between items-start font-bold text-gray-900">
                    <div>{w.position} <span className="font-normal text-gray-500">at</span> {w.company}</div>
                    <div className="text-[9px] text-gray-400 font-medium">{w.startDate} - {w.current ? 'Present' : w.endDate}</div>
                  </div>
                  {w.summary && <p className="text-gray-600 mt-1 leading-relaxed font-light">{w.summary}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Projects */}
        {projects.length > 0 && (
          <div>
            <h3 className="text-[10px] font-bold uppercase tracking-wider text-[var(--secondary)] border-l-4 border-[var(--primary)] pl-2 mb-3">Projects</h3>
            <div class="space-y-4">
              {projects.map((p, idx) => (
                <div key={p.id || idx} className="page-break-avoid">
                  <div className="flex justify-between items-center font-bold text-gray-900">
                    <span>{p.name}</span>
                    {p.url && <a href={p.url} target="_blank" rel="noreferrer" className="text-[9px] text-[var(--primary)] underline font-medium">Link</a>}
                  </div>
                  <p className="text-gray-600 mt-1 leading-relaxed font-light">{p.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Certifications */}
        {certifications.length > 0 && (
          <div>
            <h3 className="text-[10px] font-bold uppercase tracking-wider text-[var(--secondary)] border-l-4 border-[var(--primary)] pl-2 mb-3">Certifications</h3>
            <div className="grid grid-cols-2 gap-2">
              {certifications.map((c, idx) => (
                <div key={c.id || idx} className="page-break-avoid bg-gray-50 p-2 rounded border border-gray-100">
                  <div className="font-bold text-gray-900 leading-tight">{c.name}</div>
                  <div className="text-gray-500 text-[9px] mt-0.5">{c.issuer} | {c.date}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
