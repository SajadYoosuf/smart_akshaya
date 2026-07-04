import React from 'react';
import { Phone, Mail, MapPin, Globe } from 'lucide-react';
import { getProfileImageStyle } from '../../lib/imageStyle';

export default function ProfessionalModernUiuxDesignerTemplate({ data }) {
  const { basics = {}, work = [], education = [], skills = [], projects = [], certifications = [], references = [], theme = {} } = data;

  // Separation of languages from skills
  const languageSkill = skills.find(s => s.name?.toLowerCase().includes('language'));
  const otherSkills = skills.filter(s => !s.name?.toLowerCase().includes('language'));

  // Parse languages with dot proficiencies
  const getLanguagesWithDots = () => {
    let rawLangs = [];
    if (data.languages && data.languages.length > 0) {
      rawLangs = data.languages.map(l => typeof l === 'string' ? { name: l, fluency: '' } : { name: l.language, fluency: l.fluency });
    } else if (languageSkill && languageSkill.keywords && languageSkill.keywords.length > 0) {
      rawLangs = languageSkill.keywords.map(kw => {
        const parts = kw.split(/[\(\)]/);
        return { name: parts[0].trim(), fluency: parts[1] ? parts[1].trim() : '' };
      });
    } else {
      return null;
    }

    // Map fluency levels to 1-5 dot counts
    return rawLangs.map((lang, idx) => {
      let dots = 4; // default
      const fluency = lang.fluency.toLowerCase();
      if (fluency.includes('native') || fluency.includes('bilingual') || fluency.includes('c2') || fluency.includes('fluent')) {
        dots = 5;
      } else if (fluency.includes('advanced') || fluency.includes('c1') || fluency.includes('excellent') || fluency.includes('professional')) {
        dots = 4;
      } else if (fluency.includes('intermediate') || fluency.includes('b2') || fluency.includes('conversational')) {
        dots = 3;
      } else if (fluency.includes('basic') || fluency.includes('a2') || fluency.includes('beginner') || fluency.includes('elementary')) {
        dots = 2;
      } else {
        // assign decreasing dots based on order of languages if no fluency is specified
        if (idx === 0) dots = 5;
        else if (idx === 1) dots = 4;
        else if (idx === 2) dots = 3;
        else dots = 4;
      }
      return { name: lang.name, dots };
    });
  };

  const languagesList = getLanguagesWithDots();

  return (
    <div className="flex min-h-[1123px] w-full text-xs font-sans bg-white text-gray-800 relative">
      {/* Left Sidebar Column (32% width) */}
      <div className="w-[32%] bg-[#EAEFF5] flex flex-col select-none shrink-0 relative pb-10">
        {/* Profile Image Section */}
        <div className="flex flex-col items-center pt-8 mb-6">
          {basics.image ? (
            <div className="relative">
              <img 
                src={basics.image} 
                style={getProfileImageStyle(theme, { size: 140, shape: 'circle', borderWidth: 0, borderColor: '#ffffff' })}
                className="shadow-sm object-cover" 
                alt="profile" 
              />
            </div>
          ) : (
            <div className="h-[140px] w-[140px] rounded-full bg-gray-300 shadow-sm flex items-center justify-center text-gray-500">
              Photo
            </div>
          )}
        </div>

        {/* Sidebar Sections */}
        <div className="px-6 flex flex-col gap-6 text-[10px]">
          {/* Contact Section */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900">Contact</h3>
            <div className="h-[1px] bg-black mt-1 mb-2.5 w-full"></div>
            <div className="space-y-2">
              {basics.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="size-3 text-gray-650 shrink-0" />
                  <span>{basics.phone}</span>
                </div>
              )}
              {basics.email && (
                <div className="flex items-center gap-2 break-all">
                  <Mail className="size-3 text-gray-650 shrink-0" />
                  <span>{basics.email}</span>
                </div>
              )}
              {basics.location && (
                <div className="flex items-center gap-2">
                  <MapPin className="size-3 text-gray-650 shrink-0" />
                  <span>{basics.location}</span>
                </div>
              )}
              {basics.url && (
                <div className="flex items-center gap-2 break-all">
                  <Globe className="size-3 text-gray-650 shrink-0" />
                  <span>{basics.url}</span>
                </div>
              )}
            </div>
          </div>

          {/* Education Section */}
          {education.length > 0 && (
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900">Education</h3>
              <div className="h-[1px] bg-black mt-1 mb-2.5 w-full"></div>
              <div className="space-y-3">
                {education.map((edu, idx) => (
                  <div key={edu.id || idx} className="break-inside-avoid">
                    <div className="text-[9.5px] text-gray-500 font-semibold">{edu.startDate} - {edu.endDate}</div>
                    <div className="font-bold text-gray-900 uppercase text-[9.5px] mt-0.5">{edu.institution}</div>
                    <ul className="list-disc pl-4 mt-0.5 text-gray-600">
                      <li>{edu.studyType || 'Degree'} in {edu.area || 'Field'}</li>
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Skills Section */}
          {otherSkills.length > 0 && (
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900">Skills</h3>
              <div className="h-[1px] bg-black mt-1 mb-2.5 w-full"></div>
              <ul className="list-disc pl-4 space-y-1 text-gray-700">
                {otherSkills.map((s, idx) => (
                  <li key={s.id || idx} className="break-inside-avoid">
                    <span className="font-medium text-gray-800">{s.name}</span>
                    {s.keywords && s.keywords.length > 0 && (
                      <span className="text-gray-500 font-light text-[9.5px]"> ({s.keywords.join(', ')})</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Languages Section */}
          {languagesList && languagesList.length > 0 && (
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900">Languages</h3>
              <div className="h-[1px] bg-black mt-1 mb-2.5 w-full"></div>
              <div className="space-y-1.5 text-gray-700">
                {languagesList.map((lang, idx) => (
                  <div key={idx} className="flex justify-between items-center">
                    <span className="font-medium">{lang.name}</span>
                    <div className="flex gap-1">
                      {[...Array(5)].map((_, i) => (
                        <span 
                          key={i} 
                          className={`w-2 h-2 rounded-full border border-[#1F2E3E] ${i < lang.dots ? 'bg-[#1F2E3E]' : 'bg-transparent'}`}
                        ></span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right Content Column (68% width) */}
      <div className="w-[68%] flex flex-col select-none shrink-0 pb-10">
        {/* Top Dark Header Banner with border-gap name box */}
        <div className="bg-[#1F2E3D] text-white p-10 flex flex-col items-center justify-center select-none min-h-[170px]">
          <div className="border border-white px-10 py-6 text-center relative max-w-[90%] min-w-[70%]">
            <h1 className="text-2xl font-bold uppercase tracking-widest text-white leading-tight">
              {basics.name || 'Your Name'}
            </h1>
            <span className="absolute bottom-[-8px] left-1/2 -translate-x-1/2 bg-[#1F2E3D] px-4 text-[9px] tracking-widest uppercase font-semibold text-gray-200">
              {basics.label || 'UI/UX DESIGNER'}
            </span>
          </div>
        </div>

        {/* Main Body */}
        <div className="px-8 mt-6 flex-1 flex flex-col gap-6">
          {/* Profile Section */}
          {basics.summary && (
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900">Profile</h3>
              <div className="h-[1px] bg-black mt-1 mb-2.5 w-full"></div>
              <p className="leading-relaxed text-gray-600 font-light text-[10px]">
                {basics.summary}
              </p>
            </div>
          )}

          {/* Work Experience Section */}
          {work.length > 0 && (
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900">Work Experience</h3>
              <div className="h-[1px] bg-black mt-1 mb-3.5 w-full"></div>
              
              <div className="relative border-l border-gray-300 pl-6 ml-2 space-y-6">
                {work.map((w, idx) => (
                  <div key={w.id || idx} className="page-break-avoid relative">
                    {/* Square bullet on timeline */}
                    <div className="absolute -left-[28.5px] top-1 w-2 h-2 border border-gray-600 bg-white z-10"></div>
                    
                    <div className="flex justify-between items-start">
                      <div className="font-bold text-gray-900 text-[10.5px]">
                        {w.company}
                      </div>
                      <div className="text-[9.5px] text-gray-500 font-medium whitespace-nowrap">
                        {w.startDate} - {w.current ? 'Present' : w.endDate}
                      </div>
                    </div>
                    
                    <div className="text-[10px] text-gray-650 font-medium mt-0.5">
                      {w.position}
                    </div>
                    
                    {w.summary && (
                      <p className="text-gray-650 mt-1.5 leading-relaxed text-[9.5px] font-light">
                        {w.summary}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* References Section */}
          {references.length > 0 && (
            <div className="mt-auto pt-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900">Reference</h3>
              <div className="h-[1px] bg-black mt-1 mb-3.5 w-full"></div>
              
              <div className="grid grid-cols-2 gap-6 text-[10px]">
                {references.map((ref, idx) => (
                  <div key={ref.id || idx} className="page-break-avoid space-y-0.5">
                    <div className="font-bold text-gray-900 text-[10.5px] uppercase">{ref.name}</div>
                    <div className="text-gray-500">{ref.position || 'Professional Reference'} | {ref.company || ''}</div>
                    {ref.phone && <div className="text-gray-650">Phone: {ref.phone}</div>}
                    {ref.email && <div className="text-gray-650">Email: {ref.email}</div>}
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
