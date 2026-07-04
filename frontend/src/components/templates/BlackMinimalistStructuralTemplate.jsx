import React from 'react';
import { getProfileImageStyle } from '../../lib/imageStyle';

export default function BlackMinimalistStructuralTemplate({ data }) {
  const { basics = {}, work = [], education = [], skills = [], projects = [], certifications = [], theme = {} } = data;

  return (
    <div className="p-10 text-xs select-none bg-white font-sans text-gray-800">
      {/* Name and Title Header */}
      <div className="mb-8 pb-5 border-b border-gray-200">
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 uppercase">
          {basics.name || 'Your Name'}
        </h1>
        <h2 className="text-sm font-semibold tracking-wider text-gray-500 uppercase mt-1">
          {basics.label || 'Professional Title'}
        </h2>
      </div>

      {/* Structural Grid Columns */}
      <div className="grid grid-cols-12 gap-8">
        {/* Left Sidebar Column (30% approx) */}
        <div className="col-span-4 space-y-6">
          {/* Profile Image */}
          {basics.image && (
            <div className="flex justify-start mb-4">
              <img 
                src={basics.image} 
                style={getProfileImageStyle(theme, { size: 100, shape: 'square', borderWidth: 1, borderColor: '#e5e7eb' })}
                alt="profile" 
                className="shadow-sm object-cover"
              />
            </div>
          )}

          {/* Contact Section */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900 border-b border-gray-200 pb-1.5 mb-3">
              Contact
            </h3>
            <div className="space-y-2.5 text-[10.5px] text-gray-700">
              {basics.phone && (
                <div className="flex items-center gap-2">
                  <svg className="w-3.5 h-3.5 text-gray-500 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.94.725l.548 2.2a1 1 0 01-.321.988l-1.305.98a10.582 10.582 0 004.872 4.872l.98-1.305a1 1 0 01.988-.321l2.2.548a1 1 0 01.725.94V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path>
                  </svg>
                  <span>{basics.phone}</span>
                </div>
              )}
              {basics.email && (
                <div className="flex items-center gap-2 break-all">
                  <svg className="w-3.5 h-3.5 text-gray-500 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                  </svg>
                  <span>{basics.email}</span>
                </div>
              )}
              {basics.location && (
                <div className="flex items-center gap-2">
                  <svg className="w-3.5 h-3.5 text-gray-500 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                  </svg>
                  <span>{basics.location}</span>
                </div>
              )}
              {basics.url && (
                <div className="flex items-center gap-2 break-all">
                  <svg className="w-3.5 h-3.5 text-gray-500 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"></path>
                  </svg>
                  <span>{basics.url}</span>
                </div>
              )}
            </div>
          </div>

          {/* Skills Section */}
          {skills.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900 border-b border-gray-200 pb-1.5 mb-3">
                Skills
              </h3>
              <div className="space-y-3">
                {skills.map((s, idx) => (
                  <div key={s.id || idx} className="break-inside-avoid space-y-0.5">
                    <div className="font-bold text-[10.5px] text-gray-900">
                      {s.name}
                    </div>
                    {s.keywords && s.keywords.length > 0 && (
                      <div className="text-gray-600 text-[10px] leading-relaxed">
                        {s.keywords.join(', ')}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Certifications Section */}
          {certifications.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900 border-b border-gray-200 pb-1.5 mb-3">
                Certifications
              </h3>
              <div className="space-y-3">
                {certifications.map((c, idx) => (
                  <div key={c.id || idx} className="break-inside-avoid text-[10px] space-y-0.5">
                    <div className="font-bold text-[10.5px] text-gray-900 leading-tight">
                      {c.name}
                    </div>
                    <div className="text-gray-500 text-[9.5px]">
                      {c.issuer} {c.date ? `| ${c.date}` : ''}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Main Column (70% approx) */}
        <div className="col-span-8 space-y-6">
          {/* About Me Section */}
          {basics.summary && (
            <div className="break-inside-avoid">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900 border-b border-gray-200 pb-1.5 mb-3">
                About Me
              </h3>
              <p className="text-gray-700 leading-relaxed text-[11px] font-normal">
                {basics.summary}
              </p>
            </div>
          )}

          {/* Experience Section */}
          {work.length > 0 && (
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900 border-b border-gray-200 pb-1.5 mb-3">
                Experience
              </h3>
              <div className="border-l border-gray-200 pl-4 space-y-4">
                {work.map((w, idx) => (
                  <div key={w.id || idx} className="break-inside-avoid space-y-1">
                    <div className="flex justify-between items-baseline">
                      <span className="font-bold text-[11px] text-gray-900 uppercase tracking-wide">
                        {w.position}
                      </span>
                      <span className="text-[10px] text-gray-400 font-semibold whitespace-nowrap">
                        {w.startDate} — {w.current ? 'Present' : w.endDate}
                      </span>
                    </div>
                    <div className="text-[10px] text-gray-600 font-medium italic">
                      {w.company}
                    </div>
                    {w.summary && (
                      <p className="text-gray-650 leading-relaxed text-[10.5px] font-normal">
                        {w.summary}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Education Section */}
          {education.length > 0 && (
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900 border-b border-gray-200 pb-1.5 mb-3">
                Education
              </h3>
              <div className="border-l border-gray-200 pl-4 space-y-4">
                {education.map((edu, idx) => (
                  <div key={edu.id || idx} className="break-inside-avoid space-y-1">
                    <div className="flex justify-between items-baseline">
                      <span className="font-bold text-[11px] text-gray-900 uppercase tracking-wide">
                        {edu.studyType} in {edu.area}
                      </span>
                      <span className="text-[10px] text-gray-400 font-semibold whitespace-nowrap">
                        {edu.startDate} — {edu.endDate}
                      </span>
                    </div>
                    <div className="text-[10px] text-gray-600 font-medium italic">
                      {edu.institution}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Projects Section */}
          {projects.length > 0 && (
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900 border-b border-gray-200 pb-1.5 mb-3">
                Projects
              </h3>
              <div className="border-l border-gray-200 pl-4 space-y-4">
                {projects.map((p, idx) => (
                  <div key={p.id || idx} className="break-inside-avoid space-y-1">
                    <div className="flex justify-between items-baseline">
                      <span className="font-bold text-[11px] text-gray-900 uppercase tracking-wide">
                        {p.name}
                      </span>
                      {p.url && (
                        <a
                          href={p.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[10px] text-gray-900 underline font-semibold"
                        >
                          Link
                        </a>
                      )}
                    </div>
                    {p.description && (
                      <p className="text-gray-650 leading-relaxed text-[10.5px] font-normal">
                        {p.description}
                      </p>
                    )}
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
