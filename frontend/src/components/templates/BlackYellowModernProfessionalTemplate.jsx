import React from 'react';
import { Phone, Mail, MapPin, Globe, User, Briefcase, GraduationCap } from 'lucide-react';
import { getProfileImageStyle } from '../../lib/imageStyle';

export default function BlackYellowModernProfessionalTemplate({ data }) {
  const { basics = {}, work = [], education = [], skills = [], projects = [], certifications = [], references = [], theme = {} } = data;

  // Separation of languages from skills (as per existing pattern)
  const languageSkill = skills.find(s => s.name?.toLowerCase().includes('language'));
  const otherSkills = skills.filter(s => !s.name?.toLowerCase().includes('language'));

  // Get languages list
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
      <div className="w-[32%] bg-[#333333] text-white flex flex-col select-none shrink-0 relative pb-10 overflow-hidden">
        {/* Top Yellow Geometric Accent */}
        <div 
          className="absolute top-0 left-0 right-0 h-[180px] bg-[#FFB800] z-0" 
          style={{ clipPath: 'polygon(0 0, 100% 0, 100% 40px, 0 160px)' }}
        ></div>

        {/* Profile Image Section */}
        <div className="flex flex-col items-center pt-[40px] mb-8 relative z-10">
          {basics.image ? (
            <div className="relative">
              <img 
                src={basics.image} 
                style={getProfileImageStyle(theme, { size: 130, shape: 'circle', borderWidth: 4, borderColor: '#ffffff' })}
                className="shadow-lg object-cover" 
                alt="profile" 
              />
            </div>
          ) : (
            <div className="h-[130px] w-[130px] rounded-full border-4 border-white bg-gray-600 shadow-lg flex items-center justify-center text-gray-300">
              Photo
            </div>
          )}
        </div>

        {/* Sidebar Content (Contact, Skills, Languages, Reference) */}
        <div className="px-6 flex flex-col gap-6 text-[10.5px] relative z-10">
          {/* Contact Section */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-white">Contact</h3>
            <div className="h-[2px] bg-[#FFB800] mt-1 mb-3.5 w-full"></div>
            <div className="space-y-3">
              {basics.phone && (
                <div className="flex items-center gap-2.5">
                  <Phone className="size-3.5 text-[#FFB800] shrink-0" />
                  <span>{basics.phone}</span>
                </div>
              )}
              {basics.email && (
                <div className="flex items-center gap-2.5 break-all">
                  <Mail className="size-3.5 text-[#FFB800] shrink-0" />
                  <span>{basics.email}</span>
                </div>
              )}
              {basics.location && (
                <div className="flex items-center gap-2.5">
                  <MapPin className="size-3.5 text-[#FFB800] shrink-0" />
                  <span>{basics.location}</span>
                </div>
              )}
              {basics.url && (
                <div className="flex items-center gap-2.5 break-all">
                  <Globe className="size-3.5 text-[#FFB800] shrink-0" />
                  <span>{basics.url}</span>
                </div>
              )}
            </div>
          </div>

          {/* Skills Section */}
          {otherSkills.length > 0 && (
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-white">Skills</h3>
              <div className="h-[2px] bg-[#FFB800] mt-1 mb-3.5 w-full"></div>
              <ul className="space-y-2">
                {otherSkills.map((s, idx) => (
                  <li key={s.id || idx} className="break-inside-avoid">
                    <div className="font-semibold text-white/95">{s.name}</div>
                    {s.keywords && s.keywords.length > 0 && (
                      <div className="text-white/60 text-[9.5px] mt-0.5 leading-relaxed">
                        {s.keywords.join(', ')}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Languages Section */}
          {languages && languages.length > 0 && (
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-white">Languages</h3>
              <div className="h-[2px] bg-[#FFB800] mt-1 mb-3.5 w-full"></div>
              <ul className="list-disc pl-4 space-y-1.5 text-white/90">
                {languages.map((lang, idx) => (
                  <li key={idx} className="leading-tight font-medium">
                    {lang}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Reference Section (Single reference inside sidebar) */}
          {references.length > 0 && (
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-white">Reference</h3>
              <div className="h-[2px] bg-[#FFB800] mt-1 mb-3.5 w-full"></div>
              <div className="space-y-2.5 text-white/90">
                {references.slice(0, 1).map((ref, idx) => (
                  <div key={ref.id || idx} className="space-y-0.5">
                    <div className="font-bold text-white uppercase text-[10px]">{ref.name}</div>
                    <div className="text-white/70 text-[9px]">{ref.position} | {ref.company}</div>
                    {ref.phone && <div>Phone: {ref.phone}</div>}
                    {ref.email && <div className="break-all">Email: {ref.email}</div>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right Content Column (68% width) */}
      <div className="w-[68%] flex flex-col select-none shrink-0 relative pb-10 pl-[55px] pr-8 overflow-hidden">
        {/* Right Top Geometric Accent (Grey / Yellow Diagonal Stripes) */}
        <div className="absolute top-0 right-0 w-[200px] h-[150px] z-0 overflow-hidden pointer-events-none">
          <div 
            className="absolute top-0 right-0 w-[180px] h-[120px] bg-gray-200" 
            style={{ clipPath: 'polygon(100% 0, 100% 100%, 0 0)' }}
          ></div>
          <div 
            className="absolute top-0 right-[40px] w-[20px] h-[100px] bg-[#FFB800]" 
            style={{ clipPath: 'polygon(100% 0, 100% 100%, 0 0)' }}
          ></div>
          <div className="absolute top-3 right-3 text-[5px] font-mono text-gray-400 leading-none tracking-widest opacity-40">
            ••••••••••••••<br/>••••••••••••••<br/>••••••••••••••
          </div>
        </div>

        {/* Header (Name & Title) */}
        <div className="pt-14 mb-8 relative z-10">
          <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 uppercase leading-none">
            {basics.name || 'Your Name'}
          </h1>
          <h2 className="text-sm font-semibold tracking-widest text-[#FFB800] uppercase mt-2.5">
            {basics.label || 'Professional Title'}
          </h2>
        </div>

        {/* Timeline Vertical Linking Line */}
        <div className="absolute left-[24px] top-[140px] bottom-10 w-[2px] bg-[#FFB800] z-0"></div>

        {/* Main Body (Profile, Work Experience, Education) */}
        <div className="flex-1 flex flex-col gap-6 relative z-10">
          {/* Profile Section */}
          {basics.summary && (
            <div className="relative">
              {/* Timeline Icon */}
              <div className="absolute -left-[42px] top-0.5 size-7 rounded-full bg-[#FFB800] flex items-center justify-center text-white shadow z-10">
                <User className="size-3.5 fill-white text-transparent" />
              </div>
              
              <h3 className="text-sm font-bold uppercase tracking-wider text-gray-900">
                Profile
              </h3>
              <div className="h-[1px] bg-gray-200 mt-1 mb-3 w-full"></div>
              <p className="leading-relaxed text-gray-600 font-light text-[10px]">
                {basics.summary}
              </p>
            </div>
          )}

          {/* Work Experience Section */}
          {work.length > 0 && (
            <div className="relative">
              {/* Timeline Icon */}
              <div className="absolute -left-[42px] top-0.5 size-7 rounded-full bg-[#FFB800] flex items-center justify-center text-white shadow z-10">
                <Briefcase className="size-3.5 text-white" />
              </div>

              <h3 className="text-sm font-bold uppercase tracking-wider text-gray-900">
                Work Experience
              </h3>
              <div className="h-[1px] bg-gray-200 mt-1 mb-4 w-full"></div>
              
              <div className="space-y-4">
                {work.map((w, idx) => (
                  <div key={w.id || idx} className="page-break-avoid relative pl-3">
                    {/* Small yellow hollow circle on timeline */}
                    <div className="absolute -left-[35px] top-1.5 size-2 rounded-full border-2 border-[#FFB800] bg-white z-10"></div>
                    
                    <div className="flex justify-between items-start">
                      <div className="font-bold text-gray-900 text-[10.5px]">
                        {w.company}
                      </div>
                      <div className="text-[10px] text-gray-500 font-medium whitespace-nowrap">
                        {w.startDate} - {w.current ? 'Present' : w.endDate}
                      </div>
                    </div>
                    
                    <div className="text-[9.5px] text-gray-500 italic mt-0.5">
                      {w.position}
                    </div>
                    
                    {w.summary && (
                      <p className="text-gray-600 mt-1.5 leading-relaxed text-[9.5px] font-light">
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
            <div className="relative">
              {/* Timeline Icon */}
              <div className="absolute -left-[42px] top-0.5 size-7 rounded-full bg-[#FFB800] flex items-center justify-center text-white shadow z-10">
                <GraduationCap className="size-3.5 text-white" />
              </div>

              <h3 className="text-sm font-bold uppercase tracking-wider text-gray-900">
                Education
              </h3>
              <div className="h-[1px] bg-gray-200 mt-1 mb-4 w-full"></div>
              
              <div className="space-y-4">
                {education.map((edu, idx) => (
                  <div key={edu.id || idx} className="page-break-avoid relative pl-3">
                    {/* Small yellow hollow circle on timeline */}
                    <div className="absolute -left-[35px] top-1.5 size-2 rounded-full border-2 border-[#FFB800] bg-white z-10"></div>
                    
                    <div className="flex justify-between items-start">
                      <div className="font-bold text-gray-900 text-[10.5px]">
                        {edu.studyType || 'Degree'} in {edu.area || 'Field'}
                      </div>
                      <div className="text-[10px] text-gray-500 font-medium whitespace-nowrap">
                        {edu.startDate} - {edu.endDate}
                      </div>
                    </div>
                    
                    <div className="text-[9.5px] text-gray-500 mt-0.5">
                      {edu.institution}
                    </div>
                    {edu.score && (
                      <div className="text-[9px] text-gray-400 mt-0.5">
                        GPA: {edu.score}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* References block (if more references are available, displays here) */}
          {references.length > 1 && (
            <div className="relative mt-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900 mb-2">
                Additional References
              </h3>
              <div className="grid grid-cols-2 gap-4 text-[9.5px]">
                {references.slice(1).map((ref, idx) => (
                  <div key={ref.id || idx} className="page-break-avoid space-y-0.5 border border-gray-100 p-2.5 rounded">
                    <div className="font-bold text-gray-900">{ref.name}</div>
                    <div className="text-gray-500">{ref.position} | {ref.company}</div>
                    {ref.phone && <div>Phone: {ref.phone}</div>}
                    {ref.email && <div className="break-all text-[#FFB800]">Email: {ref.email}</div>}
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
