import React from 'react';
import { Phone, Mail, MapPin, Globe } from 'lucide-react';
import { getProfileImageStyle } from '../../lib/imageStyle';

export default function PinkMaroonModernTemplate({ data }) {
  const { basics = {}, work = [], education = [], skills = [], projects = [], certifications = [], references = [], theme = {} } = data;

  // Custom styling mappings
  const serifFont = { fontFamily: "'Lora', serif" };
  const sansFont = { fontFamily: "'Montserrat', sans-serif" };

  // Dynamically separate languages out of skills if it is named "Languages" or "Language"
  const languageSkill = skills.find(s => s.name?.toLowerCase().includes('language'));
  const otherSkills = skills.filter(s => !s.name?.toLowerCase().includes('language'));

  return (
    <div 
      className="flex min-h-[1123px] w-full text-[10px] text-gray-700 select-none bg-[var(--backgroundColor)] relative overflow-hidden"
      style={sansFont}
    >
      
      {/* Left Column (Sidebar) - 38% width, absolute vertical block */}
      <div className="w-[38%] shrink-0 relative flex flex-col min-h-full">
        {/* Maroon background with diagonal clip path */}
        <div 
          className="absolute inset-0 bg-[#801f31] z-0"
          style={{ clipPath: 'polygon(0 0, 100% 160px, 100% 100%, 0 100%)' }}
        ></div>

        {/* Content Layer (on top of background) */}
        <div className="relative z-10 p-6 px-7 pt-10 text-white flex flex-col gap-6">
          {/* Profile Photo */}
          {basics.image ? (
            <div className="flex justify-center mb-1">
              <img 
                src={basics.image} 
                style={getProfileImageStyle(theme, { size: 112, shape: 'circle', borderWidth: 4, borderColor: '#ffffff' })}
                className="shadow-lg" 
                alt={basics.name} 
              />
            </div>
          ) : (
            <div 
              style={{ height: `${theme.profileImageSize !== undefined ? theme.profileImageSize : 112}px` }}
            ></div>
          )}

          {/* Name & Title */}
          <div className="text-center space-y-1.5 mt-2">
            <h1 
              className="text-2xl font-extrabold tracking-wide uppercase leading-tight"
              style={serifFont}
            >
              {basics.name || 'Your Name'}
            </h1>
            <h2 
              className="text-[9px] font-medium tracking-widest text-white/90 uppercase"
            >
              {basics.label || 'Professional Title'}
            </h2>
          </div>

          {/* Contact Details */}
          <div className="mt-2">
            <h3 
              className="text-[11px] font-bold uppercase tracking-wider text-white border-b border-white/20 pb-0.5 mb-2.5"
              style={serifFont}
            >
              Contact
            </h3>
            <ul className="space-y-2 text-[8.5px] text-white/90">
              {basics.phone && (
                <li className="flex items-center gap-2">
                  <Phone className="size-3 text-white shrink-0" />
                  <span>{basics.phone}</span>
                </li>
              )}
              {basics.email && (
                <li className="flex items-center gap-2 break-all">
                  <Mail className="size-3 text-white shrink-0" />
                  <span>{basics.email}</span>
                </li>
              )}
              {basics.location && (
                <li className="flex items-center gap-2">
                  <MapPin className="size-3 text-white shrink-0" />
                  <span>{basics.location}</span>
                </li>
              )}
              {basics.url && (
                <li className="flex items-center gap-2 break-all">
                  <Globe className="size-3 text-white shrink-0" />
                  <span>{basics.url}</span>
                </li>
              )}
            </ul>
          </div>

          {/* Skills Section */}
          {otherSkills.length > 0 && (
            <div>
              <h3 
                className="text-[11px] font-bold uppercase tracking-wider text-white border-b border-white/20 pb-0.5 mb-2.5"
                style={serifFont}
              >
                Skills
              </h3>
              <ul className="list-disc pl-4 space-y-1 text-[8.5px] text-white/95">
                {otherSkills.map((s, idx) => {
                  if (s.keywords && s.keywords.length > 0) {
                    return s.keywords.map((kw, kIdx) => (
                      <li key={`${idx}-${kIdx}`} className="leading-tight">
                        {kw}
                      </li>
                    ));
                  }
                  return (
                    <li key={idx} className="leading-tight">
                      {s.name}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {/* Language Section (Pulled from skills) */}
          {languageSkill && languageSkill.keywords && languageSkill.keywords.length > 0 && (
            <div>
              <h3 
                className="text-[11px] font-bold uppercase tracking-wider text-white border-b border-white/20 pb-0.5 mb-2.5"
                style={serifFont}
              >
                Language
              </h3>
              <ul className="list-disc pl-4 space-y-1 text-[8.5px] text-white/95">
                {languageSkill.keywords.map((lang, idx) => (
                  <li key={idx} className="leading-tight">
                    {lang}
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {/* Certifications (displayed in sidebar if there's no language or as additional list) */}
          {!languageSkill && certifications.length > 0 && (
            <div>
              <h3 
                className="text-[11px] font-bold uppercase tracking-wider text-white border-b border-white/20 pb-0.5 mb-2.5"
                style={serifFont}
              >
                Certifications
              </h3>
              <ul className="list-disc pl-4 space-y-1 text-[8.5px] text-white/95">
                {certifications.map((c, idx) => (
                  <li key={idx} className="leading-tight">
                    {c.name} ({c.issuer})
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Right Column (Main Body) - 62% width, soft cream/warm white background */}
      <div className="w-[62%] p-8 px-10 flex flex-col gap-5 select-none bg-[var(--backgroundColor)]">
        
        {/* About Me Section */}
        {basics.summary && (
          <div className="break-inside-avoid mt-2">
            <h3 
              className="text-xs font-bold uppercase tracking-wider text-[#801f31] border-b border-[#801f31]/30 pb-0.5 mb-2.5"
              style={serifFont}
            >
              About Me
            </h3>
            <p className="text-gray-650 leading-relaxed font-light text-[9.5px]">
              {basics.summary}
            </p>
          </div>
        )}

        {/* Work Experience Section */}
        {work.length > 0 && (
          <div>
            <h3 
              className="text-xs font-bold uppercase tracking-wider text-[#801f31] border-b border-[#801f31]/30 pb-0.5 mb-3"
              style={serifFont}
            >
              Work Experience
            </h3>
            <div className="space-y-3.5">
              {work.map((w, idx) => (
                <div key={w.id || idx} className="break-inside-avoid space-y-0.5">
                  <div className="flex justify-between items-baseline">
                    <span className="text-[10px] font-bold text-gray-900">{w.position}</span>
                    <span className="text-[8px] text-gray-400 font-semibold whitespace-nowrap">
                      {w.startDate} - {w.current ? 'Present' : w.endDate}
                    </span>
                  </div>
                  <div className="text-[8.5px] text-[#801f31] font-bold uppercase tracking-wide">{w.company}</div>
                  {w.summary && (
                    <p className="text-gray-550 text-[8.5px] leading-relaxed font-light mt-1">
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
            <h3 
              className="text-xs font-bold uppercase tracking-wider text-[#801f31] border-b border-[#801f31]/30 pb-0.5 mb-3"
              style={serifFont}
            >
              Education
            </h3>
            <div className="space-y-3.5">
              {education.map((edu, idx) => (
                <div key={edu.id || idx} className="break-inside-avoid space-y-0.5">
                  <div className="flex justify-between items-baseline">
                    <span className="text-[10px] font-bold text-gray-900">{edu.institution}</span>
                    <span className="text-[8px] text-gray-400 font-semibold whitespace-nowrap">
                      {edu.startDate} - {edu.endDate}
                    </span>
                  </div>
                  <div className="text-[8.5px] text-[#801f31] font-bold uppercase tracking-wide">
                    {edu.studyType} in {edu.area}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Projects / Key Accomplishments Section (if certifications are displayed in main body or user has projects) */}
        {projects.length > 0 && (
          <div>
            <h3 
              className="text-xs font-bold uppercase tracking-wider text-[#801f31] border-b border-[#801f31]/30 pb-0.5 mb-3"
              style={serifFont}
            >
              Projects
            </h3>
            <div className="space-y-3.5">
              {projects.map((p, idx) => (
                <div key={p.id || idx} className="break-inside-avoid space-y-0.5">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-gray-900">{p.name}</span>
                    {p.url && (
                      <a 
                        href={p.url} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="text-[8px] text-[#801f31] underline font-medium"
                      >
                        Link
                      </a>
                    )}
                  </div>
                  {p.description && (
                    <p className="text-gray-550 text-[8.5px] leading-relaxed font-light mt-0.5">
                      {p.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* References Section */}
        {references.length > 0 && (
          <div>
            <h3 
              className="text-xs font-bold uppercase tracking-wider text-[#801f31] border-b border-[#801f31]/30 pb-0.5 mb-3"
              style={serifFont}
            >
              References
            </h3>
            <div className="grid grid-cols-2 gap-6">
              {references.map((r, idx) => (
                <div key={r.id || idx} className="break-inside-avoid space-y-0.5 text-[8.5px]">
                  <h4 className="font-bold text-gray-900 text-[9.5px]">{r.name}</h4>
                  <div className="text-gray-650 font-medium leading-tight">{r.position} / {r.company}</div>
                  {(r.phone || r.email) && (
                    <div className="text-gray-500 space-y-0.5 mt-1 text-[8px]">
                      {r.phone && (
                        <div>
                          <span className="font-bold text-gray-700">Phone:</span> {r.phone}
                        </div>
                      )}
                      {r.email && (
                        <div>
                          <span className="font-bold text-gray-700">Email:</span> {r.email}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
