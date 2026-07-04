import React from 'react';
import { Phone, Mail, MapPin, Globe } from 'lucide-react';
import { getProfileImageStyle } from '../../lib/imageStyle';

export default function ProfessionalModernTemplate({ data }) {
  const { basics = {}, work = [], education = [], skills = [], projects = [], certifications = [], theme = {} } = data;
  
  return (
    <div className="min-h-[1123px] w-full text-[10px] text-gray-700 font-custom bg-[var(--backgroundColor)] select-none flex flex-col">
      {/* Dark Top Header */}
      <div className="bg-[var(--secondary)] text-white p-8 px-10 flex items-center gap-8 shrink-0">
        {basics.image && (
          <div className="relative shrink-0">
            <img 
              src={basics.image} 
              style={getProfileImageStyle(theme, { size: 96, shape: 'circle', borderWidth: 2, borderColor: 'rgba(255, 255, 255, 0.2)' })}
              className="shadow-md" 
              alt={basics.name} 
            />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h1 className="text-3xl font-extrabold tracking-wide uppercase truncate">
            {basics.name || 'Your Name'}
          </h1>
          <h2 className="text-xs font-medium tracking-widest text-white/80 mt-1 uppercase truncate">
            {basics.label || 'Professional Title'}
          </h2>
        </div>
      </div>

      {/* Two Columns Grid */}
      <div className="grid grid-cols-12 gap-8 p-10 flex-1">
        {/* Left Column (Sidebar) - 35% */}
        <div className="col-span-4 space-y-6">
          {/* Contact Section */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--primary)] border-b border-gray-200 pb-1 mb-3">
              Contact
            </h3>
            <ul className="space-y-2 text-[9px] text-gray-600">
              {basics.phone && (
                <li className="flex items-center gap-2">
                  <Phone className="size-3.5 text-[var(--primary)] shrink-0" />
                  <span>{basics.phone}</span>
                </li>
              )}
              {basics.email && (
                <li className="flex items-center gap-2 break-all">
                  <Mail className="size-3.5 text-[var(--primary)] shrink-0" />
                  <span>{basics.email}</span>
                </li>
              )}
              {basics.location && (
                <li className="flex items-center gap-2">
                  <MapPin className="size-3.5 text-[var(--primary)] shrink-0" />
                  <span>{basics.location}</span>
                </li>
              )}
              {basics.url && (
                <li className="flex items-center gap-2 break-all">
                  <Globe className="size-3.5 text-[var(--primary)] shrink-0" />
                  <span>{basics.url}</span>
                </li>
              )}
            </ul>
          </div>

          {/* Skills Section */}
          {skills.length > 0 && (
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--primary)] border-b border-gray-200 pb-1 mb-3">
                Skills
              </h3>
              <ul className="space-y-2.5">
                {skills.map((s, idx) => (
                  <li key={s.id || idx} className="break-inside-avoid">
                    <div className="flex items-start gap-1.5 font-semibold text-gray-800">
                      <span className="size-1 rounded-full bg-[var(--primary)] mt-1.5 shrink-0"></span>
                      <span>{s.name}</span>
                    </div>
                    {s.keywords && s.keywords.length > 0 && (
                      <div className="text-gray-500 pl-2.5 mt-0.5 leading-relaxed text-[8.5px]">
                        {s.keywords.join(', ')}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Certifications Section */}
          {certifications.length > 0 && (
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--primary)] border-b border-gray-200 pb-1 mb-3">
                Certifications
              </h3>
              <ul className="space-y-2.5">
                {certifications.map((c, idx) => (
                  <li key={c.id || idx} className="break-inside-avoid flex items-start gap-1.5 text-gray-700">
                    <span className="size-1 rounded-full bg-[var(--primary)] mt-1.5 shrink-0"></span>
                    <div className="min-w-0">
                      <div className="font-semibold text-gray-800 leading-tight truncate">{c.name}</div>
                      <div className="text-gray-500 text-[8.5px] mt-0.5">{c.issuer} {c.date && `| ${c.date}`}</div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Right Column (Main Body) - 65% */}
        <div className="col-span-8 space-y-6 pl-2">
          {/* About Me Section */}
          {basics.summary && (
            <div className="break-inside-avoid">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--primary)] border-b border-gray-200 pb-1 mb-2.5">
                About Me
              </h3>
              <p className="text-gray-600 leading-relaxed font-light text-[9.5px]">
                {basics.summary}
              </p>
            </div>
          )}

          {/* Experience Section */}
          {work.length > 0 && (
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--primary)] border-b border-gray-200 pb-1 mb-3.5">
                Experience
              </h3>
              
              {/* Timeline Container */}
              <div className="relative border-l border-gray-200 ml-1.5 pl-4 space-y-4">
                {work.map((w, idx) => (
                  <div key={w.id || idx} className="relative break-inside-avoid">
                    {/* Timeline Dot */}
                    <div className="absolute -left-[20.5px] top-[4px] size-2 rounded-full border border-white bg-[var(--primary)] shrink-0"></div>
                    
                    <div className="space-y-0.5">
                      <h4 className="text-[10.5px] font-bold text-gray-900 leading-tight">
                        {w.position}
                      </h4>
                      <div className="flex justify-between items-baseline text-[9px]">
                        <span className="italic text-gray-650 font-medium">{w.company}</span>
                        <span className="text-gray-400 font-medium whitespace-nowrap">
                          {w.startDate} - {w.current ? 'Present' : w.endDate}
                        </span>
                      </div>
                    </div>
                    {w.summary && (
                      <p className="text-gray-500 text-[8.5px] leading-relaxed font-light mt-1.5">
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
              <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--primary)] border-b border-gray-200 pb-1 mb-3.5">
                Education
              </h3>
              
              {/* Timeline Container */}
              <div className="relative border-l border-gray-200 ml-1.5 pl-4 space-y-4">
                {education.map((edu, idx) => (
                  <div key={edu.id || idx} className="relative break-inside-avoid">
                    {/* Timeline Dot */}
                    <div className="absolute -left-[20.5px] top-[4px] size-2 rounded-full border border-white bg-[var(--primary)] shrink-0"></div>
                    
                    <div className="space-y-0.5">
                      <h4 className="text-[10.5px] font-bold text-gray-900 leading-tight">
                        {edu.studyType} in {edu.area}
                      </h4>
                      <div className="flex justify-between items-baseline text-[9px]">
                        <span className="italic text-gray-650 font-medium">{edu.institution}</span>
                        <span className="text-gray-400 font-medium whitespace-nowrap">
                          {edu.startDate} - {edu.endDate}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Projects Section */}
          {projects.length > 0 && (
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--primary)] border-b border-gray-200 pb-1 mb-3.5">
                Projects
              </h3>
              
              {/* Timeline Container */}
              <div className="relative border-l border-gray-200 ml-1.5 pl-4 space-y-4">
                {projects.map((p, idx) => (
                  <div key={p.id || idx} className="relative break-inside-avoid">
                    {/* Timeline Dot */}
                    <div className="absolute -left-[20.5px] top-[4px] size-2 rounded-full border border-white bg-[var(--primary)] shrink-0"></div>
                    
                    <div className="space-y-0.5">
                      <div className="flex justify-between items-center text-[10.5px] font-bold text-gray-900 leading-tight">
                        <span>{p.name}</span>
                        {p.url && (
                          <a 
                            href={p.url} 
                            target="_blank" 
                            rel="noreferrer" 
                            className="text-[8px] text-[var(--primary)] underline font-medium whitespace-nowrap ml-2"
                          >
                            Link
                          </a>
                        )}
                      </div>
                    </div>
                    {p.description && (
                      <p className="text-gray-500 text-[8.5px] leading-relaxed font-light mt-1">
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
