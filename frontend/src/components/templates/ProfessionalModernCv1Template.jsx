import React from 'react';
import { Phone, Mail, MapPin, Globe } from 'lucide-react';
import { getProfileImageStyle } from '../../lib/imageStyle';

export default function ProfessionalModernCv1Template({ data }) {
  const { basics = {}, work = [], education = [], skills = [], projects = [], certifications = [], references = [], theme = {} } = data;

  // Separation of languages from skills (as per existing pattern)
  const languageSkill = skills.find(s => s.name?.toLowerCase().includes('language'));
  const otherSkills = skills.filter(s => !s.name?.toLowerCase().includes('language'));

  // Get languages list from data.languages or languageSkill
  const getLanguagesList = () => {
    if (data.languages && data.languages.length > 0) {
      return data.languages.map(l => typeof l === 'string' ? l : `${l.language}${l.fluency ? ` (${l.fluency})` : ''}`);
    }
    if (languageSkill && languageSkill.keywords && languageSkill.keywords.length > 0) {
      return languageSkill.keywords;
    }
    return null;
  };

  const languages = getLanguagesList();

  return (
    <div className="flex min-h-[1123px] w-full text-xs font-sans bg-white text-gray-800 relative">
      {/* Left Sidebar Column (32% width) */}
      <div className="w-[32%] bg-[#E5E5E5] flex flex-col select-none shrink-0 relative pb-10">
        {/* Profile Image Section */}
        <div className="flex flex-col items-center pt-[30px] mb-8">
          {basics.image ? (
            <div className="relative z-20">
              <img 
                src={basics.image} 
                style={getProfileImageStyle(theme, { size: 140, shape: 'circle', borderWidth: 4, borderColor: '#ffffff' })}
                className="shadow-md object-cover" 
                alt="profile" 
              />
            </div>
          ) : (
            <div className="h-[140px] w-[140px] rounded-full border-4 border-white bg-gray-300 shadow-md relative z-20 flex items-center justify-center text-gray-500">
              Photo
            </div>
          )}
        </div>

        {/* Sidebar Sections */}
        <div className="px-6 flex flex-col gap-6 text-[10.5px]">
          {/* About Me Section */}
          {basics.summary && (
            <div>
              <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#1C1D21] mb-2.5">
                <span className="shrink-0">About Me</span>
                <span className="flex-1 h-[1px] bg-[#1C1D21] opacity-35"></span>
              </h3>
              <p className="leading-relaxed font-light text-[#333333]">
                {basics.summary}
              </p>
            </div>
          )}

          {/* Education Section */}
          {education.length > 0 && (
            <div>
              <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#1C1D21] mb-2.5">
                <span className="shrink-0">Education</span>
                <span className="flex-1 h-[1px] bg-[#1C1D21] opacity-35"></span>
              </h3>
              <div className="space-y-3.5">
                {education.map((edu, idx) => (
                  <div key={edu.id || idx} className="break-inside-avoid">
                    <div className="font-bold text-[#1C1D21] text-[10px] leading-snug">{edu.studyType || 'Degree'} in {edu.area || 'Field'}</div>
                    <div className="text-[#333333] font-medium mt-0.5">{edu.institution}</div>
                    <div className="text-gray-500 text-[9px] mt-0.5">{edu.startDate} - {edu.endDate}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Skills Section */}
          {otherSkills.length > 0 && (
            <div>
              <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#1C1D21] mb-2.5">
                <span className="shrink-0">Skills</span>
                <span className="flex-1 h-[1px] bg-[#1C1D21] opacity-35"></span>
              </h3>
              <div className="space-y-2.5">
                {otherSkills.map((s, idx) => (
                  <div key={s.id || idx} className="break-inside-avoid flex flex-col gap-1">
                    <div className="font-semibold text-[#1C1D21] text-[10px]">{s.name}</div>
                    {/* Progress Slider Bar */}
                    <div className="w-full bg-[#1C1D21]/15 h-1.5 rounded-full overflow-hidden">
                      <div 
                        className="bg-[#1C1D21] h-full" 
                        style={{ width: s.level ? `${s.level}%` : '80%' }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Languages Section */}
          {languages && languages.length > 0 && (
            <div>
              <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#1C1D21] mb-2.5">
                <span className="shrink-0">Language</span>
                <span className="flex-1 h-[1px] bg-[#1C1D21] opacity-35"></span>
              </h3>
              <ul className="list-disc pl-4 space-y-1 text-[#333333]">
                {languages.map((lang, idx) => (
                  <li key={idx} className="leading-tight font-medium">
                    {lang}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Right Content Column (68% width) */}
      <div className="w-[68%] flex flex-col select-none shrink-0 pb-10">
        {/* Top Dark Header Banner */}
        <div className="pt-[50px] mb-6">
          <div className="h-[130px] bg-[#1C1D21] text-white flex flex-col justify-center pl-16 pr-8 relative z-10 ml-[-120px] pl-[145px]">
            <h1 className="text-3xl font-black uppercase tracking-widest leading-none text-white">
              {basics.name || 'Your Name'}
            </h1>
            <h2 className="text-xs font-light tracking-widest uppercase text-gray-300 mt-2">
              {basics.label || 'Professional Title'}
            </h2>
          </div>
        </div>

        {/* Contact Grid Section */}
        <div className="px-8 mb-6">
          <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-[10px] text-gray-700 bg-gray-50/50 p-3 rounded-lg border border-gray-100">
            {basics.phone && (
              <div className="flex items-center gap-2">
                <Phone className="size-3 text-[#1C1D21] shrink-0" />
                <span>{basics.phone}</span>
              </div>
            )}
            {basics.url && (
              <div className="flex items-center gap-2">
                <Globe className="size-3 text-[#1C1D21] shrink-0" />
                <span className="break-all">{basics.url}</span>
              </div>
            )}
            {basics.email && (
              <div className="flex items-center gap-2">
                <Mail className="size-3 text-[#1C1D21] shrink-0" />
                <span className="break-all">{basics.email}</span>
              </div>
            )}
            {basics.location && (
              <div className="flex items-center gap-2">
                <MapPin className="size-3 text-[#1C1D21] shrink-0" />
                <span>{basics.location}</span>
              </div>
            )}
          </div>
        </div>

        {/* Main Work History / Experience */}
        <div className="px-8 flex-1 flex flex-col gap-6">
          {work.length > 0 && (
            <div>
              <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#1C1D21] mb-4">
                <span className="shrink-0">Experience</span>
                <span className="flex-1 h-[1px] bg-[#1C1D21] opacity-25"></span>
              </h3>
              <div className="relative border-l border-gray-300 pl-6 ml-2 space-y-6">
                {work.map((w, idx) => (
                  <div key={w.id || idx} className="page-break-avoid relative">
                    {/* Timeline hollow circle dot */}
                    <div className="absolute -left-[29.5px] top-1 w-2.5 h-2.5 rounded-full border-2 border-[#1C1D21] bg-white z-10"></div>
                    
                    <div className="flex justify-between items-start">
                      <div className="font-bold text-[#1C1D21] text-[11px] uppercase tracking-wide">
                        {w.position}
                      </div>
                      <div className="text-[10px] text-gray-500 font-semibold italic whitespace-nowrap">
                        {w.startDate} - {w.current ? 'Present' : w.endDate}
                      </div>
                    </div>
                    
                    <div className="text-[10px] text-gray-600 font-medium mt-0.5">
                      {w.company}
                    </div>
                    
                    {w.summary && (
                      <p className="text-gray-600 mt-2 leading-relaxed text-[10px] font-light">
                        {w.summary}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Certifications / Projects if visible and present */}
          {projects.length > 0 && (
            <div>
              <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#1C1D21] mb-3">
                <span className="shrink-0">Projects</span>
                <span className="flex-1 h-[1px] bg-[#1C1D21] opacity-25"></span>
              </h3>
              <div className="space-y-4">
                {projects.map((p, idx) => (
                  <div key={p.id || idx} className="page-break-avoid">
                    <div className="flex justify-between items-center font-bold text-[#1C1D21]">
                      <span>{p.name}</span>
                      {p.url && <a href={p.url} target="_blank" rel="noreferrer" className="text-[9px] text-gray-500 underline font-medium">Link</a>}
                    </div>
                    {p.description && <p className="text-gray-600 mt-1 leading-relaxed font-light">{p.description}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* References Section */}
          {references.length > 0 && (
            <div className="mt-auto pt-4">
              <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#1C1D21] mb-3.5">
                <span className="shrink-0">References</span>
                <span className="flex-1 h-[1px] bg-[#1C1D21] opacity-25"></span>
              </h3>
              <div className="grid grid-cols-2 gap-6 text-[10px]">
                {references.map((ref, idx) => (
                  <div key={ref.id || idx} className="page-break-avoid space-y-0.5">
                    <div className="font-bold text-[#1C1D21] text-[10.5px] uppercase">{ref.name}</div>
                    <div className="text-gray-500">{ref.position || 'Professional Reference'} | {ref.company || ''}</div>
                    {ref.phone && <div className="text-gray-600"><span className="font-semibold text-gray-700">Phone:</span> {ref.phone}</div>}
                    {ref.email && <div className="text-gray-600"><span className="font-semibold text-gray-700">Email:</span> {ref.email}</div>}
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
