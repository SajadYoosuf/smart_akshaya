import { useState, useEffect, useRef } from "react";
import {
  Download, Loader2, FileText, ChevronLeft, ChevronRight,
  Layout, Palette, User, Briefcase, GraduationCap, Code, Compass, Award, Users,
  ZoomIn, ZoomOut, Maximize, ArrowLeft
} from "lucide-react";
import { toast, Toaster } from "sonner";
import { jsPDF } from "jspdf";

import { cn } from "./lib/utils";
import { exportPdf } from "./lib/resume-api";
import { A4_WIDTH_PX, A4_HEIGHT_PX } from "./lib/a4";
import { captureResumeToCanvas } from "./lib/exportCanvas";
import ResumePreviewCanvas from "./components/ResumePreviewCanvas";
import BasicsForm from "./components/form/BasicsForm";
import WorkForm from "./components/form/WorkForm";
import EducationForm from "./components/form/EducationForm";
import SkillsForm from "./components/form/SkillsForm";
import ProjectsForm from "./components/form/ProjectsForm";
import CertificationsForm from "./components/form/CertificationsForm";
import ReferencesForm from "./components/form/ReferencesForm";
import StyleCustomizer from "./components/form/StyleCustomizer";
import { SAMPLE_RESUME } from "./lib/sampleData";
import "./resume.css";

const TABS = [
  { id: 'templates', label: 'Templates', icon: Layout, description: 'Pick a professional layout for your resume.' },
  { id: 'style', label: 'Style', icon: Palette, description: 'Customize colors, fonts, and section visibility.' },
  { id: 'basics', label: 'Basics', icon: User, description: 'Add your name, contact info, and summary.' },
  { id: 'work', label: 'Experience', icon: Briefcase, description: 'List your work history and achievements.' },
  { id: 'education', label: 'Education', icon: GraduationCap, description: 'Add degrees, schools, and study dates.' },
  { id: 'skills', label: 'Skills', icon: Code, description: 'Organize skills into categories.' },
  { id: 'projects', label: 'Projects', icon: Compass, description: 'Highlight personal or professional projects.' },
  { id: 'certifications', label: 'Certifications', icon: Award, description: 'Add licenses and certifications.' },
  { id: 'references', label: 'References', icon: Users, description: 'Include professional references.' }
];

const TEMPLATES = [
  { id: 'clean-ats', name: 'Clean ATS', desc: 'Minimalist layout optimized for ATS parsing engines.' },
  { id: 'modern-sidebar', name: 'Modern Sidebar', desc: 'Sleek two-column template with a highlighted sidebar section.' },
  { id: 'premium-creative', name: 'Premium Creative', desc: 'Bold banner header with structured layout split columns.' },
  { id: 'professional-modern', name: 'Professional Modern', desc: 'Classic centered header layout with balanced split columns.' },
  { id: 'pink-maroon-modern', name: 'Pink & Maroon Modern', desc: 'Elegant layout with soft rose pink accents and rich maroon typography.' },
  { id: 'black-minimalist-structural', name: 'Black Minimalist Structural', desc: 'A clean, high-contrast grid layout for technical professionals.' },
  { id: 'professional-modern-cv-1', name: 'Professional Modern CV (1)', desc: 'Elegant light gray sidebar with overlapping dark charcoal header block.' },
  { id: 'black-yellow-modern-professional', name: 'Black Yellow Modern Professional', desc: 'Premium dark sidebar with yellow geometric accents and timeline.' },
  { id: 'professional-modern-uiux-designer', name: 'Professional Modern UI/UX Designer', desc: 'Slate-navy header with cool gray sidebar and custom language ratings.' }
];

const SIDEBAR_WIDTH = 480;

export default function ResumeStudio({ onViewChange }) {
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
  const sheetRef = useRef(null);

  const activeTabMeta = TABS.find(t => t.id === activeTab) || TABS[0];

  const zoomIn = () => setZoom(prev => Math.min(prev + 0.05, 1.5));
  const zoomOut = () => setZoom(prev => Math.max(prev - 0.05, 0.5));
  const resetZoom = () => setZoom(0.85);

  useEffect(() => {
    localStorage.setItem('resume_builder_data', JSON.stringify(resumeData));
  }, [resumeData]);

  const exportWithCanvas = async () => {
    const element = sheetRef.current;
    if (!element) throw new Error("Preview not ready");

    const savedZoom = zoom;
    if (savedZoom !== 1) {
      setZoom(1);
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    }

    try {
      const canvas = await captureResumeToCanvas(element, {
        width: A4_WIDTH_PX,
        height: element.scrollHeight || A4_HEIGHT_PX,
        backgroundColor: resumeData.theme?.backgroundColor || "#ffffff",
      });

      const imgData = canvas.toDataURL("image/jpeg", 0.98);
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pageWidth = 210;
      const pageHeight = 297;
      const imgWidth = pageWidth;
      const imgHeight = (canvas.height * pageWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      const fileName = (resumeData.basics?.name || "resume").replace(/\s+/g, "_");
      pdf.save(`${fileName}_resume.pdf`);
    } finally {
      if (savedZoom !== 1) setZoom(savedZoom);
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
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
      } catch {
        await exportWithCanvas();
      }
      toast.success("PDF downloaded successfully!");
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Download failed");
    } finally {
      setIsExporting(false);
    }
  };

  const renderFormContent = () => {
    switch (activeTab) {
      case 'templates':
        return (
          <div className="rb-template-grid">
            {TEMPLATES.map(tpl => (
              <button
                key={tpl.id}
                type="button"
                onClick={() => setResumeData(prev => ({ ...prev, templateId: tpl.id }))}
                className={cn(
                  "rb-template-card",
                  resumeData.templateId === tpl.id && "rb-template-card--active"
                )}
              >
                <div className="rb-template-thumb">
                  <img src={`/templates/${tpl.id}.png`} alt={tpl.name} />
                </div>
                <div className="rb-template-name">{tpl.name}</div>
                <div className="rb-template-desc">{tpl.desc}</div>
              </button>
            ))}
          </div>
        );
      case 'style':
        return <StyleCustomizer theme={resumeData.theme} onChange={(theme) => setResumeData(prev => ({ ...prev, theme }))} />;
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
        return <WorkForm work={resumeData.work} onChange={(work) => setResumeData(prev => ({ ...prev, work }))} />;
      case 'education':
        return <EducationForm education={resumeData.education} onChange={(education) => setResumeData(prev => ({ ...prev, education }))} />;
      case 'skills':
        return <SkillsForm skills={resumeData.skills} onChange={(skills) => setResumeData(prev => ({ ...prev, skills }))} />;
      case 'projects':
        return <ProjectsForm projects={resumeData.projects} onChange={(projects) => setResumeData(prev => ({ ...prev, projects }))} />;
      case 'certifications':
        return <CertificationsForm certifications={resumeData.certifications} onChange={(certifications) => setResumeData(prev => ({ ...prev, certifications }))} />;
      case 'references':
        return <ReferencesForm references={resumeData.references} onChange={(references) => setResumeData(prev => ({ ...prev, references }))} />;
      default:
        return null;
    }
  };

  return (
    <div className="resume-builder">
      <Toaster position="top-right" richColors />

      <header className="rb-header">
        <div className="rb-header-left">
          {onViewChange && (
            <button type="button" onClick={() => onViewChange('dashboard')} className="rb-back-btn" title="Back to Dashboard">
              <ArrowLeft size={18} />
            </button>
          )}
          <div className="rb-header-icon">
            <FileText size={20} />
          </div>
          <div>
            <div className="rb-header-title">Resume Studio</div>
            <div className="rb-header-subtitle">Build and export professional resumes</div>
          </div>
        </div>

        <div className="rb-zoom-controls">
          <button type="button" onClick={zoomOut} className="rb-zoom-btn" title="Zoom Out">
            <ZoomOut size={16} />
          </button>
          <span className="rb-zoom-value">{Math.round(zoom * 100)}%</span>
          <button type="button" onClick={zoomIn} className="rb-zoom-btn" title="Zoom In">
            <ZoomIn size={16} />
          </button>
          <div className="rb-zoom-divider" />
          <button type="button" onClick={resetZoom} className="rb-zoom-btn rb-zoom-btn--accent" title="Fit to Screen (85%)">
            <Maximize size={14} />
          </button>
        </div>

        <div className="rb-header-actions">
          <button
            type="button"
            onClick={handleExport}
            disabled={isExporting}
            className="rb-btn-primary"
          >
            {isExporting ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
            {isExporting ? "Downloading…" : "Download PDF"}
          </button>
        </div>
      </header>

      <main className="rb-workspace">
        <button
          type="button"
          onClick={() => setIsSidebarOpen(prev => !prev)}
          className="rb-sidebar-toggle"
          style={{ left: isSidebarOpen ? `${SIDEBAR_WIDTH}px` : '0px' }}
        >
          {isSidebarOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
        </button>

        <aside
          className="rb-sidebar"
          style={{
            width: isSidebarOpen ? `${SIDEBAR_WIDTH}px` : '0px',
            opacity: isSidebarOpen ? 1 : 0,
          }}
        >
          <div className="rb-nav-strip">
            {TABS.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  title={tab.label}
                  className={cn("rb-nav-btn", activeTab === tab.id && "rb-nav-btn--active")}
                >
                  <Icon size={18} />
                </button>
              );
            })}
          </div>

          <div className="rb-form-panel">
            <div className="rb-form-panel-header">
              <div className="rb-form-panel-title">{activeTabMeta.label}</div>
              <div className="rb-form-panel-desc">{activeTabMeta.description}</div>
            </div>
            {renderFormContent()}
          </div>
        </aside>

        <section className="rb-preview">
          <div className="rb-preview-toolbar no-print">
            <span className="rb-preview-label">Live Preview</span>
            <span className="rb-preview-label" style={{ color: '#4F46E5', textTransform: 'none', letterSpacing: 0, fontWeight: 600 }}>
              A4 · 210 × 297 mm
            </span>
          </div>

          <ResumePreviewCanvas resumeData={resumeData} zoom={zoom} sheetRef={sheetRef} />
        </section>
      </main>
    </div>
  );
}
