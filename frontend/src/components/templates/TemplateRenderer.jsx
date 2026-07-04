import React from 'react';
import CleanAtsTemplate from './CleanAtsTemplate';
import ModernSidebarTemplate from './ModernSidebarTemplate';
import PremiumCreativeTemplate from './PremiumCreativeTemplate';
import ProfessionalModernTemplate from './ProfessionalModernTemplate';
import PinkMaroonModernTemplate from './PinkMaroonModernTemplate';
import BlackMinimalistStructuralTemplate from './BlackMinimalistStructuralTemplate';
import ProfessionalModernCv1Template from './ProfessionalModernCv1Template';
import BlackYellowModernProfessionalTemplate from './BlackYellowModernProfessionalTemplate';
import ProfessionalModernUiuxDesignerTemplate from './ProfessionalModernUiuxDesignerTemplate';

export default function TemplateRenderer({ data, onChange }) {
  const { templateId = 'clean-ats', theme = {} } = data;

  const defaultBg = templateId === 'pink-maroon-modern' ? '#FAF4F0' : '#ffffff';
  const defaultTextColor = '#1f2937';

  const inlineStyles = {
    '--primary': theme.primaryColor || (templateId === 'pink-maroon-modern' ? '#801f31' : templateId === 'black-minimalist-structural' ? '#000000' : '#0f766e'),
    '--secondary': theme.secondaryColor || (templateId === 'pink-maroon-modern' ? '#801f31' : templateId === 'black-minimalist-structural' ? '#4b5563' : '#1e293b'),
    '--textColor': theme.textColor || defaultTextColor,
    '--backgroundColor': theme.backgroundColor || defaultBg,
    fontFamily: theme.fontFamily === 'Georgia' ? 'Georgia, serif' : theme.fontFamily === 'Monospace' ? 'monospace' : theme.fontFamily === 'Montserrat' ? "'Montserrat', sans-serif" : "'Inter', sans-serif",
  };

  const getTemplate = () => {
    switch (templateId) {
      case 'modern-sidebar':
        return <ModernSidebarTemplate data={data} />;
      case 'premium-creative':
        return <PremiumCreativeTemplate data={data} />;
      case 'professional-modern':
        return <ProfessionalModernTemplate data={data} />;
      case 'pink-maroon-modern':
        return <PinkMaroonModernTemplate data={data} />;
      case 'black-minimalist-structural':
        return <BlackMinimalistStructuralTemplate data={data} />;
      case 'professional-modern-cv-1':
        return <ProfessionalModernCv1Template data={data} />;
      case 'black-yellow-modern-professional':
        return <BlackYellowModernProfessionalTemplate data={data} />;
      case 'professional-modern-uiux-designer':
        return <ProfessionalModernUiuxDesignerTemplate data={data} />;
      case 'clean-ats':
      default:
        return <CleanAtsTemplate data={data} />;
    }
  };

  return (
    <div 
      style={{
        ...inlineStyles,
        backgroundColor: inlineStyles['--backgroundColor'],
        color: inlineStyles['--textColor']
      }} 
      className="w-full h-full select-none transition-all duration-300 a4-sheet-preview"
    >
      {getTemplate()}
    </div>
  );
}
// Trigger HMR update

