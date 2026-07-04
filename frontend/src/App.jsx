import { useState, useEffect } from "react";
import { Download, Loader2, RotateCcw, Sparkles, FileText, ChevronLeft, ChevronRight, Layout, Palette, User, Briefcase, GraduationCap, Code, Compass, Award, Users, ZoomIn, ZoomOut, Maximize } from "lucide-react";
import { toast, Toaster } from "sonner";
import { cn } from "@/lib/utils";

import {
  exportPdf,
  getApiBase,
} from "@/lib/resume-api";
import { Button } from "@/components/ui/button";

import BasicsForm from "./components/form/BasicsForm";
import WorkForm from "./components/form/WorkForm";
import EducationForm from "./components/form/EducationForm";
import SkillsForm from "./components/form/SkillsForm";
import ProjectsForm from "./components/form/ProjectsForm";
import CertificationsForm from "./components/form/CertificationsForm";
import ReferencesForm from "./components/form/ReferencesForm";
import StyleCustomizer from "./components/form/StyleCustomizer";
import TemplateRenderer from "./components/templates/TemplateRenderer";
import { SAMPLE_RESUME } from "./lib/sampleData";

const TABS = [
  { id: 'templates', label: 'Templates', icon: Layout },
  { id: 'style', label: 'Style', icon: Palette },
  { id: 'basics', label: 'Basics', icon: User },
  { id: 'work', label: 'Experience', icon: Briefcase },
  { id: 'education', label: 'Education', icon: GraduationCap },
  { id: 'skills', label: 'Skills', icon: Code },
  { id: 'projects', label: 'Projects', icon: Compass },
  { id: 'certifications', label: 'Certifications', icon: Award },
  { id: 'references', label: 'References', icon: Users }
];

function App() {
  const [resumeData, setResumeData] = useState(() => {
    const saved = localStorage.getItem('resume_builder_data');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Autosave parse error:', e);
      }
    }
    return SAMPLE_RESUME;
  });

  const [activeTab, setActiveTab] = useState('templates');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [zoom, setZoom] = useState(0.85);

  const zoomIn = () => setZoom(prev => Math.min(prev + 0.05, 1.5));
  const zoomOut = () => setZoom(prev => Math.max(prev - 0.05, 0.5));
  const resetZoom = () => setZoom(0.85);

  // Autosave to localStorage on changes
  useEffect(() => {
    localStorage.setItem('resume_builder_data', JSON.stringify(resumeData));
  }, [resumeData]);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const blob = await exportPdf(resumeData);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${resumeData.basics.name?.replace(/\s+/g, '_') || 'resume'}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success("PDF exported successfully!");
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Export failed");
    } finally {
      setIsExporting(false);
    }
  };

  const handleReset = () => {
    if (window.confirm("Are you sure you want to clear all data and start over?")) {
      const freshData = {
        templateId: 'clean-ats',
        theme: {
          primaryColor: '#0f766e',
          secondaryColor: '#1e293b',
          textColor: '#1f2937',
          backgroundColor: '#ffffff',
          fontFamily: 'Inter',
          fontSize: 'medium',
          spacing: 'normal',
          profileImageSize: 96,
          profileImageShape: 'circle',
          profileImageBorderWidth: 2,
          profileImageBorderColor: '#ffffff',
          sectionVisibility: {
            summary: true,
            work: true,
            education: true,
            skills: true,
            projects: true,
            certifications: true,
            references: true
          }
        },
        basics: {
          name: '',
          label: '',
          email: '',
          phone: '',
          url: '',
          location: '',
          summary: '',
          image: ''
        },
        work: [],
        education: [],
        skills: [],
        projects: [],
        certifications: [],
        references: []
      };
      setResumeData(freshData);
      toast.success("Data cleared.");
    }
  };

  const handleLoadSample = () => {
    if (window.confirm("Do you want to fill the form with sample data? This will overwrite your current progress.")) {
      setResumeData(SAMPLE_RESUME);
      toast.success("Sample data loaded.");
    }
  };

  const renderFormContent = () => {
    switch (activeTab) {
      case 'templates':
        return (
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4">Choose a Template</h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { id: 'clean-ats', name: 'Clean ATS', desc: 'Minimalist layout optimized for ATS parsing engines.' },
                { id: 'modern-sidebar', name: 'Modern Sidebar', desc: 'Sleek two-column template with a highlighted sidebar section.' },
                { id: 'premium-creative', name: 'Premium Creative', desc: 'Bold banner header with structured layout split columns.' },
                { id: 'professional-modern', name: 'Professional Modern', desc: 'Classic centered header layout with balanced split columns.' },
                { id: 'pink-maroon-modern', name: 'Pink & Maroon Modern', desc: 'Elegant layout with soft rose pink accents and rich maroon typography.' },
                { id: 'black-minimalist-structural', name: 'Black Minimalist Structural', desc: 'A clean, high-contrast grid layout tailored for structural engineers, technical leads, and architects.' },
                { id: 'professional-modern-cv-1', name: 'Professional Modern CV Resume (1)', desc: 'Elegant light gray sidebar layout with overlapping dark charcoal header block.' },
                { id: 'black-yellow-modern-professional', name: 'Black Yellow Modern Professional Resume', desc: 'Premium dark sidebar with yellow geometric accents and linking vertical timeline.' },
                { id: 'professional-modern-uiux-designer', name: 'Professional Modern UIUX Designer Resume', desc: 'Slate-navy header box enclosing name with border gap, cool gray sidebar, and custom language dot ratings.' }
              ].map(tpl => (
                <div
                  key={tpl.id}
                  onClick={() => setResumeData(prev => ({ ...prev, templateId: tpl.id }))}
                  className={cn(
                    "border rounded-xl p-2 cursor-pointer text-left transition-all hover:bg-zinc-850 flex flex-col justify-between h-full",
                    resumeData.templateId === tpl.id ? "border-sky-500 bg-sky-500/5 ring-1 ring-sky-500/20" : "border-zinc-800 bg-[#2a2b2d]/10"
                  )}
                >
                  <div className="w-full aspect-[1/1.4] bg-zinc-900 rounded-lg overflow-hidden border border-zinc-800/80 mb-2 flex items-center justify-center">
                    <img 
                      src={`/templates/${tpl.id}.png`} 
                      alt={tpl.name} 
                      className="w-full h-full object-cover object-top hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-foreground leading-tight line-clamp-1">{tpl.name}</div>
                    <div className="text-[8px] text-muted-foreground leading-snug line-clamp-2 mt-0.5">{tpl.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      case 'style':
        return (
          <StyleCustomizer
            theme={resumeData.theme}
            onChange={(theme) => setResumeData(prev => ({ ...prev, theme }))}
          />
        );
      case 'basics':
        return (
          <BasicsForm
            basics={resumeData.basics}
            theme={resumeData.theme}
            onChange={(basics) => setResumeData(prev => ({ ...prev, basics }))}
            onThemeChange={(theme) => setResumeData(prev => ({ ...prev, theme }))}
          />
        );
      case 'work':
        return (
          <WorkForm
            work={resumeData.work}
            onChange={(work) => setResumeData(prev => ({ ...prev, work }))}
          />
        );
      case 'education':
        return (
          <EducationForm
            education={resumeData.education}
            onChange={(education) => setResumeData(prev => ({ ...prev, education }))}
          />
        );
      case 'skills':
        return (
          <SkillsForm
            skills={resumeData.skills}
            onChange={(skills) => setResumeData(prev => ({ ...prev, skills }))}
          />
        );
      case 'projects':
        return (
          <ProjectsForm
            projects={resumeData.projects}
            onChange={(projects) => setResumeData(prev => ({ ...prev, projects }))}
          />
        );
      case 'certifications':
        return (
          <CertificationsForm
            certifications={resumeData.certifications}
            onChange={(certifications) => setResumeData(prev => ({ ...prev, certifications }))}
          />
        );
      case 'references':
        return (
          <ReferencesForm
            references={resumeData.references}
            onChange={(references) => setResumeData(prev => ({ ...prev, references }))}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="surface-grid min-h-screen flex flex-col bg-[#131415] text-[#e8eaed]">
      <Toaster position="top-right" theme="dark" richColors />
      
      {/* Top Bar */}
      <header className="sticky top-0 z-10 border-b border-zinc-800 bg-[#18191b] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex size-9 items-center justify-center rounded-xl bg-[#2a2b2d] text-sky-400">
            <FileText className="size-5" />
          </div>
          <div className="leading-tight">
            <p className="font-display text-base font-semibold text-foreground">Resume Studio</p>
            <p className="text-xs text-muted-foreground">Premium Builder Dashboard</p>
          </div>
        </div>

        {/* Centered Zoom controls */}
        <div className="bg-[#2a2b2d]/60 border border-zinc-800/80 px-2.5 py-1 rounded-xl flex items-center gap-2.5 select-none">
          <button
            onClick={zoomOut}
            className="p-1 hover:bg-zinc-850 text-muted-foreground hover:text-foreground rounded transition-colors cursor-pointer"
            title="Zoom Out"
          >
            <ZoomOut className="size-4" />
          </button>
          <span className="text-xs font-mono font-bold text-muted-foreground w-12 text-center">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={zoomIn}
            className="p-1 hover:bg-zinc-850 text-muted-foreground hover:text-foreground rounded transition-colors cursor-pointer"
            title="Zoom In"
          >
            <ZoomIn className="size-4" />
          </button>
          <div className="w-px h-4 bg-zinc-800 mx-1"></div>
          <button
            onClick={resetZoom}
            className="p-1 hover:bg-zinc-850 text-sky-400 hover:text-sky-300 rounded transition-colors cursor-pointer"
            title="Fit to Screen (85%)"
          >
            <Maximize className="size-3.5" />
          </button>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={handleLoadSample}>
            Fill Sample Data
          </Button>
          <Button variant="ghost" size="sm" onClick={handleReset}>
            <RotateCcw className="size-4 mr-1.5" />
            Reset Data
          </Button>
          <Button
            variant="hero"
            size="sm"
            onClick={handleExport}
            disabled={isExporting}
            className="bg-sky-500 hover:bg-sky-600 text-white font-medium shadow-lg shadow-sky-500/20"
          >
            {isExporting ? <Loader2 className="size-4 animate-spin mr-1.5" /> : <Download className="size-4 mr-1.5" />}
            {isExporting ? "Compiling PDF…" : "Export PDF"}
          </Button>
        </div>
      </header>

      {/* Main Dashboard Space */}
      <main className="flex-1 flex overflow-hidden relative">
        {/* Toggle Sidebar Button */}
        <button
          onClick={() => setIsSidebarOpen(prev => !prev)}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-20 size-6 bg-[#18191b] border-y border-r border-zinc-800 rounded-r-md flex items-center justify-center text-muted-foreground hover:text-foreground cursor-pointer shadow-md"
          style={{ left: isSidebarOpen ? '464px' : '0px', transition: 'left 300ms cubic-bezier(0.4, 0, 0.2, 1)' }}
        >
          {isSidebarOpen ? <ChevronLeft className="size-4" /> : <ChevronRight className="size-4" />}
        </button>

        {/* Form Sidebar Workspace */}
        <div
          className="flex bg-[#18191b] border-r border-zinc-800 h-full overflow-hidden shrink-0 z-10"
          style={{
            width: isSidebarOpen ? '464px' : '0px',
            opacity: isSidebarOpen ? 1 : 0,
            transition: 'width 300ms cubic-bezier(0.4, 0, 0.2, 1), opacity 200ms ease'
          }}
        >
          {/* Icons navigation strip */}
          <div className="w-16 border-r border-zinc-850 bg-[#161718] flex flex-col items-center py-4 gap-3">
            {TABS.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  title={tab.label}
                  className={cn(
                    "size-10 rounded-xl flex items-center justify-center transition-colors cursor-pointer border border-transparent",
                    isActive ? "bg-sky-500/10 text-sky-400 border-sky-500/20" : "text-muted-foreground hover:bg-zinc-850 hover:text-foreground"
                  )}
                >
                  <Icon className="size-4.5" />
                </button>
              );
            })}
          </div>

          {/* Actual Active Form fields block */}
          <div className="flex-1 p-5 overflow-y-auto">
            {renderFormContent()}
          </div>
        </div>

        {/* Live A4 Sheet Preview Area Wrapper (Fixed viewport screen) */}
        <div className="flex-1 relative overflow-hidden bg-[#0f0f10] flex flex-col">
          {/* Scrollable Canvas Window */}
          <div className="flex-1 overflow-auto p-10 flex justify-center items-start">
            <div 
              style={{ 
                backgroundColor: resumeData.theme.backgroundColor || (resumeData.templateId === 'pink-maroon-modern' ? '#FAF4F0' : '#ffffff'),
                zoom: zoom
              }}
              className="w-[794px] min-h-[1123px] shadow-2xl rounded-sm border border-zinc-800 transition-all duration-300"
            >
              <TemplateRenderer data={resumeData} onChange={setResumeData} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
