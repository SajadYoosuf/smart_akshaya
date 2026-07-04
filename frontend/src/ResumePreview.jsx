import React from 'react';

export default function ResumePreview({ resumeData, template = 'modern', customTemplateConfig, pictureSettings }) {
  if (!resumeData) return null;

  const {
    basics, work, education, skills, projects,
    volunteer, awards, certificates, publications, languages, interests, references
  } = resumeData;

  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString; 
      return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
    } catch {
      return dateString;
    }
  };

  const isCustom = template === 'custom';
  const customStyles = customTemplateConfig?.styles || {};
  const customLayout = customTemplateConfig?.layout || { type: 'split' };

  const getTemplateClass = () => {
    if (isCustom) {
      return `template-custom layout-${customLayout.type || 'split'}`;
    }
    switch(template) {
      case 'professional': return 'template-professional';
      case 'executive': return 'template-executive';
      case 'academic': return 'template-academic';
      case 'custom-ai': return 'template-custom-ai';
      case 'blue-sidebar': return 'template-blue-sidebar';
      case 'chikorita': return 'template-chikorita';
      case 'olivia': return 'template-olivia';
      case 'modern':
      default: return 'template-modern';
    }
  };

  const inlineStyles = {
    '--custom-primary-color': customStyles.primaryColor || '#0f766e',
    '--custom-bg-color': customStyles.backgroundColor || '#ffffff',
    '--custom-text-color': customStyles.textColor || '#1f2937',
    '--custom-sidebar-bg': customStyles.sidebarBgColor || '#1e293b',
    '--custom-sidebar-text-color': customStyles.sidebarTextColor || '#ffffff',
    '--custom-body-font': customStyles.bodyFontFamily || "'Inter', sans-serif",
    '--custom-body-size': customStyles.bodyFontSize || '14px',
    '--custom-body-line-height': customStyles.bodyLineHeight || '1.5',
    '--custom-heading-font': customStyles.headingFontFamily || "'Inter', sans-serif",
    '--custom-heading-size': customStyles.headingFontSize || '2.2rem',
    '--custom-heading-line-height': customStyles.headingLineHeight || '1.2',
    '--custom-border-radius': customStyles.borderRadius || '6px',
    '--custom-sidebar-width': customStyles.sidebarWidth || '33%'
  };

  const renderProfilePicture = () => {
    if (!basics || !basics.image) return null;

    const imgStyle = {
      width: `${pictureSettings?.size || 90}px`,
      height: pictureSettings?.aspectRatio === '4:3' 
        ? `${(pictureSettings?.size || 90) * 0.75}px` 
        : pictureSettings?.aspectRatio === '16:9' 
        ? `${(pictureSettings?.size || 90) * 0.5625}px` 
        : `${pictureSettings?.size || 90}px`,
      borderRadius: pictureSettings?.borderRadius === 'circle' 
        ? '50%' 
        : pictureSettings?.borderRadius === 'rounded' 
        ? '8px' 
        : '0px',
      borderWidth: `${pictureSettings?.borderWidth || 0}px`,
      borderStyle: (pictureSettings?.borderWidth || 0) > 0 ? 'solid' : 'none',
      borderColor: pictureSettings?.borderColor || '#e2e8f0',
      boxShadow: (pictureSettings?.shadowWidth || 0) > 0 
        ? `0 ${pictureSettings.shadowWidth}px ${pictureSettings.shadowWidth * 2}px rgba(0,0,0,0.15)` 
        : 'none',
      transform: `rotate(${pictureSettings?.rotation || 0}deg)`,
      objectFit: 'cover',
      transition: 'all 0.2s',
      display: 'block',
      margin: '0 auto 15px auto'
    };

    return (
      <div className="resume-picture-wrapper">
        <img src={basics.image} alt="Profile" style={imgStyle} />
      </div>
    );
  };

  return (
    <div className={`resume-document ${getTemplateClass()}`} style={inlineStyles}>
      
      {/* SIDEBAR OR HEADER CONTENT */}
      <div className="resume-sidebar">
        {basics && (
          <div className="resume-header">
            {renderProfilePicture()}
            <h1 className="resume-name">{basics.name}</h1>
            <div className="resume-title">{basics.label}</div>
            
            <div className="resume-contact">
              {basics.email && <span>{basics.email}</span>}
              {basics.phone && <span>{basics.phone}</span>}
              {basics.url && <span>{basics.url}</span>}
              {basics.location && (
                <span>{basics.location.city}{basics.location.region ? `, ${basics.location.region}` : ''}</span>
              )}
            </div>
            
            {basics.summary && (
              <div className="resume-item-summary summary-section">
                <h2 className="resume-section-title">Profile</h2>
                {basics.summary}
              </div>
            )}
          </div>
        )}

        {skills && skills.length > 0 && (
          <div className="resume-section sidebar-section section-skills">
            <h2 className="resume-section-title">Skills</h2>
            <div className="resume-skills">
              {skills.map((skillGroup, index) => (
                <div className="skill-category" key={index}>
                  {skillGroup.name && <div className="skill-category-name">{skillGroup.name}</div>}
                  {skillGroup.keywords && skillGroup.keywords.length > 0 && (
                    <div className="skill-list">
                      {skillGroup.keywords.map((keyword, idx) => (
                        <span className="skill-badge" key={idx}>{keyword}</span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {(languages || interests) && (
          <div className="sidebar-extras">
            {languages && languages.length > 0 && (
              <div className="resume-section sidebar-section section-languages">
                <h2 className="resume-section-title">Languages</h2>
                <ul className="resume-item-highlights">
                  {languages.map((lang, index) => (
                    <li key={index}><strong>{lang.language}</strong> {lang.fluency ? `- ${lang.fluency}` : ''}</li>
                  ))}
                </ul>
              </div>
            )}
            {interests && interests.length > 0 && (
              <div className="resume-section sidebar-section section-interests">
                <h2 className="resume-section-title">Interests</h2>
                <div className="resume-interests">
                  {interests.map((interest, index) => (
                    <div className="skill-category" key={index}>
                      <div className="skill-category-name">{interest.name}</div>
                      {interest.keywords && <div className="skill-list">{interest.keywords.join(', ')}</div>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* MAIN CONTENT */}
      <div className="resume-main">
        {work && work.length > 0 && (
          <div className="resume-section section-experience">
            <h2 className="resume-section-title">Experience</h2>
            {work.map((job, index) => (
              <div className="resume-item" key={index}>
                <div className="resume-item-header">
                  <div>
                    <div className="resume-item-title">{job.position}</div>
                    <div className="resume-item-subtitle">{job.company}</div>
                  </div>
                  <div className="resume-item-date">
                    {formatDate(job.startDate)} - {job.endDate ? formatDate(job.endDate) : 'Present'}
                  </div>
                </div>
                {job.summary && <div className="resume-item-summary">{job.summary}</div>}
              </div>
            ))}
          </div>
        )}

        {education && education.length > 0 && (
          <div className="resume-section section-education">
            <h2 className="resume-section-title">Education</h2>
            {education.map((edu, index) => (
              <div className="resume-item" key={index}>
                <div className="resume-item-header">
                  <div>
                    <div className="resume-item-title">{edu.institution}</div>
                    <div className="resume-item-subtitle">{edu.studyType} in {edu.area}</div>
                  </div>
                  <div className="resume-item-date">
                    {formatDate(edu.startDate)} - {edu.endDate ? formatDate(edu.endDate) : 'Present'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {projects && projects.length > 0 && (
          <div className="resume-section section-projects">
            <h2 className="resume-section-title">Projects</h2>
            {projects.map((project, index) => (
              <div className="resume-item" key={index}>
                <div className="resume-item-header">
                  <div>
                    <div className="resume-item-title">{project.name}</div>
                  </div>
                  <div className="resume-item-date">
                    {formatDate(project.startDate)} - {project.endDate ? formatDate(project.endDate) : 'Present'}
                  </div>
                </div>
                {project.description && <div className="resume-item-summary">{project.description}</div>}
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
