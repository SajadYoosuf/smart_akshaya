import React from 'react';
import { getProfileImageStyle } from '../../lib/imageStyle';

export default function PremiumCreativeTemplate({ data }) {
  const { basics = {}, work = [], education = [], skills = [], projects = [], certifications = [], theme = {} } = data;
  return (
    <div className="text-[11px] font-sans bg-[var(--backgroundColor)]">
      {/* Creative Header Banner */}
      <div className="bg-[var(--primary)] text-white p-8 relative rounded-t-sm flex justify-between items-center gap-4 select-none">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-widest text-white">{basics.name || 'Your Name'}</h1>
          <h2 className="text-xs font-semibold tracking-wider text-white/95 mt-1.5 uppercase">{basics.label || 'Professional Title'}</h2>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-[9px] text-white/80 mt-3 font-medium">
            {basics.email && <span>✉ {basics.email}</span>}
            {basics.phone && <span>☎ {basics.phone}</span>}
            {basics.url && <span>🌐 {basics.url}</span>}
            {basics.location && <span>📍 {basics.location}</span>}
          </div>
        </div>
        {basics.image && (
          <img 
            src={basics.image} 
            style={getProfileImageStyle(theme, { size: 96, shape: 'rounded-square', borderWidth: 4, borderColor: 'rgba(255, 255, 255, 0.2)' })}
            className="shadow-lg" 
            alt="profile" 
          />
        )}
      </div>

      {/* Main Columns Grid */}
      <div className="grid grid-cols-12 gap-6 p-8 select-none">
        {/* Left Main Column (65%) */}
        <div className="col-span-8 space-y-6">
          {/* Summary */}
          {basics.summary && (
            <div className="page-break-avoid">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--primary)] border-b-2 border-[var(--primary)]/20 pb-1 mb-2">My Profile</h3>
              <p className="text-gray-600 leading-relaxed font-light">{basics.summary}</p>
            </div>
          )}

          {/* Experience */}
          {work.length > 0 && (
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--primary)] border-b-2 border-[var(--primary)]/20 pb-1 mb-3">Professional Experience</h3>
              <div className="space-y-4">
                {work.map((w, idx) => (
                  <div key={w.id || idx} className="page-break-avoid">
                    <div className="flex justify-between items-center font-bold text-gray-900">
                      <span>{w.position}</span>
                      <span className="text-[9px] text-[var(--primary)] bg-[var(--primary)]/5 px-2 py-0.5 rounded">{w.startDate} - {w.current ? 'Present' : w.endDate}</span>
                    </div>
                    <div className="text-[10px] text-gray-500 font-medium">{w.company}</div>
                    {w.summary && <p className="text-gray-600 mt-1 leading-relaxed font-light">{w.summary}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Projects */}
          {projects.length > 0 && (
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--primary)] border-b-2 border-[var(--primary)]/20 pb-1 mb-3">Key Projects</h3>
              <div className="space-y-4">
                {projects.map((p, idx) => (
                  <div key={p.id || idx} className="page-break-avoid border-l-2 border-[var(--primary)] pl-3">
                    <div className="font-bold text-gray-900">{p.name}</div>
                    <p className="text-gray-600 mt-0.5 font-light">{p.description}</p>
                    {p.url && <a href={p.url} target="_blank" rel="noreferrer" className="text-[9px] text-[var(--primary)] underline font-medium mt-1 inline-block">View live project</a>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Sidebar Column (35%) */}
        <div className="col-span-4 space-y-6">
          {/* Skills */}
          {skills.length > 0 && (
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--primary)] border-b-2 border-[var(--primary)]/20 pb-1 mb-3">Skills</h3>
              <div className="space-y-2">
                {skills.map((s, idx) => (
                  <div key={s.id || idx} className="page-break-avoid">
                    <div className="font-bold text-gray-800">{s.name}</div>
                    <div className="text-gray-500 text-[9px] mt-0.5">{s.keywords ? s.keywords.join(', ') : ''}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Education */}
          {education.length > 0 && (
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--primary)] border-b-2 border-[var(--primary)]/20 pb-1 mb-3">Education</h3>
              <div className="space-y-3.5">
                {education.map((edu, idx) => (
                  <div key={edu.id || idx} className="page-break-avoid">
                    <div className="font-bold text-gray-800">{edu.studyType} in {edu.area}</div>
                    <div className="text-gray-600 text-[10px]">{edu.institution}</div>
                    <div className="text-[9px] text-gray-400 mt-0.5">{edu.startDate} - {edu.endDate}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Certifications */}
          {certifications.length > 0 && (
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--primary)] border-b-2 border-[var(--primary)]/20 pb-1 mb-3">Certificates</h3>
              <div className="space-y-3">
                {certifications.map((c, idx) => (
                  <div key={c.id || idx} className="page-break-avoid bg-gray-50 p-2 rounded">
                    <div className="font-bold text-gray-800 text-[10px] leading-tight">{c.name}</div>
                    <div className="text-gray-500 text-[9px] mt-0.5">{c.issuer} | {c.date}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
