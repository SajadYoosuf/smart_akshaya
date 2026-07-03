import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Upload, Download, Sparkles, ArrowLeft, Share2, RefreshCw, Plus, Trash2, GraduationCap, Briefcase, User, Settings, Globe, FileText, X, Eye } from 'lucide-react';
import { pdfjs } from 'react-pdf';
import pdfWorkerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

pdfjs.GlobalWorkerOptions.workerSrc = pdfWorkerSrc;

// ─── PDF Thumbnail — direct canvas render via pdfjs core API ───────────────────
// Skips react-pdf's Document/Page wrappers (fewer abstractions = easier to debug)
function PdfThumbnail({ pdfUrl }) {
  const canvasRef = useRef(null);
  const [status, setStatus] = useState('loading'); // 'loading' | 'ready' | 'error'

  useEffect(() => {
    let cancelled = false;
    let renderTask = null;

    async function render() {
      try {
        // Use fetch() — plain GET, no Range headers — avoids Vite dev server 204 on XHR Range requests
        const response = await fetch(pdfUrl);
        if (!response.ok) throw new Error(`HTTP ${response.status} fetching ${pdfUrl}`);
        const arrayBuffer = await response.arrayBuffer();
        if (cancelled) return;

        const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
        const pdf = await loadingTask.promise;
        if (cancelled) return;

        const page = await pdf.getPage(1);
        if (cancelled) return;

        const baseViewport = page.getViewport({ scale: 1 });
        const scale = 178 / baseViewport.width;
        const viewport = page.getViewport({ scale });

        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        canvas.width = viewport.width;
        canvas.height = viewport.height;

        renderTask = page.render({ canvasContext: ctx, viewport });
        await renderTask.promise;
        if (!cancelled) setStatus('ready');
      } catch (err) {
        console.error('[PdfThumbnail] render failed for', pdfUrl, err);
        if (!cancelled) setStatus('error');
      }
    }

    render();
    return () => {
      cancelled = true;
      renderTask?.cancel?.();
    };
  }, [pdfUrl]);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', backgroundColor: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
      {/* Shimmer skeleton while loading */}
      {status === 'loading' && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', gap: '6px', padding: '12px', backgroundColor: '#ffffff' }}>
          <div style={{ height: '10px', width: '60%', background: 'linear-gradient(90deg,#e2e8f0 25%,#f1f5f9 50%,#e2e8f0 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.2s infinite', borderRadius: '4px' }} />
          <div style={{ height: '6px', width: '40%', background: 'linear-gradient(90deg,#e2e8f0 25%,#f1f5f9 50%,#e2e8f0 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.2s infinite', borderRadius: '4px' }} />
          <div style={{ height: '40px', width: '100%', background: 'linear-gradient(90deg,#e2e8f0 25%,#f1f5f9 50%,#e2e8f0 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.2s infinite', borderRadius: '4px', marginTop: '8px' }} />
          <div style={{ height: '40px', width: '100%', background: 'linear-gradient(90deg,#e2e8f0 25%,#f1f5f9 50%,#e2e8f0 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.2s infinite', borderRadius: '4px' }} />
          <div style={{ height: '30px', width: '80%', background: 'linear-gradient(90deg,#e2e8f0 25%,#f1f5f9 50%,#e2e8f0 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.2s infinite', borderRadius: '4px' }} />
        </div>
      )}
      {/* Canvas — visible only when ready */}
      <canvas ref={canvasRef} style={{ display: status === 'ready' ? 'block' : 'none', width: '100%' }} />
      {/* Error fallback */}
      {status === 'error' && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', color: '#94a3b8', fontSize: '10px', textAlign: 'center', padding: '10px' }}>
          <FileText size={22} style={{ opacity: 0.4 }} />
          <span>Preview unavailable</span>
        </div>
      )}
    </div>
  );
}


// ─── PDF Preview Modal (iframe-based — zero worker complexity) ─────────────────
function PdfPreviewModal({ pdfUrl, pdfName, onClose, onSelect }) {
  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 9999,
      background: 'rgba(0,0,0,0.75)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      animation: 'fadeIn 0.15s ease',
    }}>
      <div style={{
        width: '90vw',
        height: '92vh',
        background: 'var(--bg-surface)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        borderRadius: '12px',
        boxShadow: '0 25px 60px rgba(0,0,0,0.5)',
        border: '1px solid var(--border)',
      }}>
        {/* Modal Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: '1px solid var(--border)', backgroundColor: 'var(--bg-base)' }}>
          <div>
            <span style={{ fontSize: '14px', fontWeight: '800', color: 'var(--text-primary)' }}>
              {pdfName.replace('.pdf', '')}
            </span>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginTop: '2px' }}>
              Click "Use This Template" to extract data into your editor
            </span>
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button
              onClick={onSelect}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                backgroundColor: 'var(--primary)', border: 'none',
                borderRadius: '8px', padding: '8px 18px',
                fontSize: '13px', fontWeight: '700', color: '#ffffff',
                cursor: 'pointer', boxShadow: 'var(--shadow-glow)'
              }}
            >
              <Eye size={14} />
              Use This Template
            </button>
            <button
              onClick={onClose}
              style={{
                width: '34px', height: '34px', borderRadius: '50%',
                backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)',
                color: 'var(--text-primary)', display: 'flex', alignItems: 'center',
                justifyContent: 'center', cursor: 'pointer'
              }}
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Iframe PDF Viewer */}
        <div style={{ flex: 1, minHeight: 0 }}>
          <iframe
            src={pdfUrl}
            title="PDF preview"
            style={{ width: '100%', height: '100%', border: 'none' }}
          />
        </div>
      </div>
    </div>
  );
}

const INITIAL_RESUME_DATA = {
  fullName: 'Alexander Sterling',
  title: 'Senior Crop Specialist & Agronomist',
  email: 'alex.sterling@example.com',
  phone: '+1 (555) 012-3456',
  location: 'Sydney, AU',
  address: '42 Wallaby Way, Sydney, Australia',
  profile: 'Results-oriented Agronomist with over 8 years of experience in crop management and precision agriculture. Proven track record in optimizing crop yields through data-driven strategies and innovative cultivation techniques.',
  gender: 'Male',
  dob: '1992-08-15',
  nationality: 'Australian',
  religion: 'Christian',
  education: [
    { school: 'Wardiere University', degree: 'Bachelor of Design', year: '2011 - 2015' }
  ],
  experience: [
    { company: 'AgriCorp International', role: 'Senior Crop Specialist', period: '2018 - Present', description: 'Managed large-scale crop production over 5,000 hectares. Implemented IoT-based soil monitoring systems. Reduced water consumption by 22% using precision irrigation.' }
  ],
  skills: ['Soil Science', 'Precision Ag', 'Data Analysis', 'GIS Mapping'],
  languages: [
    { name: 'English', level: 'Native' },
    { name: 'Spanish', level: 'Fluent' }
  ],
  references: [
    { name: 'Estelle Darcy', relation: 'Wardiere Inc. / CTO', phone: '123-456-7890', email: 'hello@reallygreatsite.com' },
    { name: 'Harper Richard', relation: 'Wardiere Inc. / CEO', phone: '123-456-7890', email: 'hello@reallygreatsite.com' }
  ]
};

// Map PDF template filename to dynamic rendering layout
const getMappedLayoutType = (pdfName) => {
  if (!pdfName) return 'minimalist';
  const name = pdfName.toLowerCase();
  if (name.includes('blue') || name.includes('purple')) return 'blue-simple';
  if (name.includes('minimalist') || name.includes('grey') || name.includes('accountant')) return 'minimalist';
  if (name.includes('modern') || name.includes('slate') || name.includes('black')) return 'modern-slate';
  return 'clean-academic';
};


// PDF Text content parsing helper to structure JSON
function parsePdfTextContent(items) {
  if (!items || items.length === 0) return {};

  // Sort items: top-to-bottom (Y desc), left-to-right (X asc)
  const sortedItems = [...items].sort((a, b) => {
    const yDiff = b.transform[5] - a.transform[5];
    if (Math.abs(yDiff) > 5) {
      return yDiff; // Different line
    }
    return a.transform[4] - b.transform[4]; // Same line, left-to-right
  });

  // Group into lines
  const lines = [];
  let currentLine = [];
  let currentY = sortedItems[0] ? sortedItems[0].transform[5] : 0;

  for (const item of sortedItems) {
    if (Math.abs(item.transform[5] - currentY) > 5) {
      if (currentLine.length > 0) {
        lines.push(currentLine.map(it => it.str).join(' ').trim());
      }
      currentLine = [item];
      currentY = item.transform[5];
    } else {
      currentLine.push(item);
    }
  }
  if (currentLine.length > 0) {
    lines.push(currentLine.map(it => it.str).join(' ').trim());
  }

  // Filter out empty lines
  const cleanLines = lines.map(l => l.trim()).filter(l => l.length > 0);

  // Now parse fields from cleanLines
  const result = {
    fullName: '',
    title: '',
    email: '',
    phone: '',
    location: '',
    profile: '',
    education: [],
    experience: [],
    skills: [],
    languages: []
  };

  let currentSection = '';
  let expItem = null;
  let eduItem = null;

  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
  const phoneRegex = /(\+?\d[\d-\s\(\)]{8,}\d)/;

  for (let i = 0; i < cleanLines.length; i++) {
    const line = cleanLines[i];
    const lowerLine = line.toLowerCase();

    // 1. Email extraction
    const emailMatch = line.match(emailRegex);
    if (emailMatch && !result.email) {
      result.email = emailMatch[0];
    }

    // 2. Phone extraction
    const phoneMatch = line.match(phoneRegex);
    if (phoneMatch && !result.phone) {
      result.phone = phoneMatch[0];
    }

    // Detect section headers
    if (lowerLine.includes('profile') || lowerLine.includes('about me') || lowerLine.includes('summary') || lowerLine.includes('objective')) {
      currentSection = 'profile';
      continue;
    } else if (lowerLine.includes('experience') || lowerLine.includes('employment') || lowerLine.includes('work history')) {
      currentSection = 'experience';
      continue;
    } else if (lowerLine.includes('education') || lowerLine.includes('academic') || lowerLine.includes('studies')) {
      currentSection = 'education';
      continue;
    } else if (lowerLine.includes('skills') || lowerLine.includes('expertise') || lowerLine.includes('key competencies')) {
      currentSection = 'skills';
      continue;
    } else if (lowerLine.includes('languages') || lowerLine.includes('language')) {
      currentSection = 'languages';
      continue;
    } else if (lowerLine.includes('reference') || lowerLine.includes('contact')) {
      currentSection = 'other';
      continue;
    }

    // Parse depending on active section
    if (currentSection === '') {
      // First 2-3 lines before any section headers usually contain Name and Job Title
      if (!result.fullName && line.split(' ').length >= 2 && line.split(' ').length <= 4) {
        result.fullName = line;
      } else if (result.fullName && !result.title && !emailMatch && !phoneMatch) {
        result.title = line;
      }
    } else if (currentSection === 'profile') {
      if (result.profile.length < 300) {
        result.profile = result.profile ? result.profile + ' ' + line : line;
      }
    } else if (currentSection === 'skills') {
      const parts = line.split(/[,|•]|\s{2,}/).map(p => p.trim()).filter(p => p.length > 1);
      parts.forEach(p => {
        if (!result.skills.includes(p) && result.skills.length < 12) {
          result.skills.push(p);
        }
      });
    } else if (currentSection === 'languages') {
      const langParts = line.split(/[-–—:(•]/);
      const name = langParts[0] ? langParts[0].trim() : '';
      if (name && name.length > 2 && name.length < 20) {
        const level = langParts[1] ? langParts[1].replace(/[)]/g, '').trim() : 'Fluent';
        result.languages.push({ name, level });
      }
    } else if (currentSection === 'education') {
      const yearMatch = line.match(/\d{4}\s*[-–—]\s*\d{4}|\d{4}/);
      if (yearMatch) {
        if (eduItem) result.education.push(eduItem);
        eduItem = {
          school: line.replace(yearMatch[0], '').replace(/[,|–-]/g, '').trim(),
          degree: 'Degree',
          year: yearMatch[0]
        };
      } else if (eduItem) {
        if (eduItem.degree === 'Degree') {
          eduItem.degree = line;
        } else {
          eduItem.school = eduItem.school + ', ' + line;
        }
      } else {
        eduItem = { school: line, degree: 'Degree', year: '' };
      }
    } else if (currentSection === 'experience') {
      const periodMatch = line.match(/\d{4}\s*[-–—]\s*(Present|\d{4})|\d{4}/i);
      if (periodMatch) {
        if (expItem) result.experience.push(expItem);
        expItem = {
          company: '',
          role: line.replace(periodMatch[0], '').replace(/[,|–-]/g, '').trim(),
          period: periodMatch[0],
          description: ''
        };
      } else if (expItem) {
        if (!expItem.company) {
          expItem.company = line;
        } else if (!expItem.description) {
          expItem.description = line;
        } else {
          expItem.description = expItem.description + ' ' + line;
        }
      } else {
        expItem = { company: line, role: 'Professional Role', period: '', description: '' };
      }
    }
  }

  if (eduItem) result.education.push(eduItem);
  if (expItem) result.experience.push(expItem);

  if (result.education.length === 0) {
    result.education = [
      { school: 'Wardiere University', degree: 'Bachelor of Design', year: '2011 - 2015' }
    ];
  }
  if (result.experience.length === 0) {
    result.experience = [
      { company: 'Global Design Inc', role: 'Lead Graphic Designer', period: '2016 - 2021', description: 'Designed high-conversion brand elements and templates.' }
    ];
  }

  const locationLine = cleanLines.find(l =>
    l.toLowerCase().includes('sydney') ||
    l.toLowerCase().includes('london') ||
    l.toLowerCase().includes('new york') ||
    l.toLowerCase().includes('san francisco') ||
    (l.includes(',') && l.split(',')[1] && l.split(',')[1].trim().length === 2)
  );
  if (locationLine) {
    result.location = locationLine;
    result.address = locationLine;
  }

  return {
    fullName: result.fullName || 'Richard Sanchez',
    title: result.title || 'Creative Specialist',
    email: result.email || 'richard@example.com',
    phone: result.phone || '+1 (555) 019-2834',
    location: result.location || 'London, UK',
    address: result.address || 'London, United Kingdom',
    profile: result.profile || 'Creative specialist with high expertise in template building and modern typography.',
    education: result.education,
    experience: result.experience,
    skills: result.skills.length > 0 ? result.skills : ['Graphic Design', 'Figma', 'Typography'],
    languages: result.languages.length > 0 ? result.languages : [{ name: 'English', level: 'Native' }]
  };
}

export default function ResumeGenerator({ onViewChange }) {
  const [pdfTemplates, setPdfTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null); // String name of the PDF file
  const [profileImage, setProfileImage] = useState(null);
  const [isParsing, setIsParsing] = useState(false);
  // Preview modal state — null when closed, { pdfName, pdfUrl } when open
  const [previewModal, setPreviewModal] = useState(null);

  const [formData, setFormData] = useState(() => {
    const saved = localStorage.getItem('smart_akshaya_resume_creator_data');
    return saved ? JSON.parse(saved) : INITIAL_RESUME_DATA;
  });

  const [skillInput, setSkillInput] = useState('');
  const [toastMsg, setToastMsg] = useState('');
  const fileInputRef = useRef(null);

  // Fetch the list of local PDFs on mount
  useEffect(() => {
    fetch('/resumes/resumes.json')
      .then(res => res.json())
      .then(data => setPdfTemplates(data))
      .catch(err => console.error("Could not load resumes list:", err));
  }, []);

  useEffect(() => {
    localStorage.setItem('smart_akshaya_resume_creator_data', JSON.stringify(formData));
  }, [formData]);

  const triggerToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3000);
  };

  // --- PDF Text Extraction (react-pdf's pdfjs instance) ---
  const extractDataFromPdf = async (pdfName) => {
    setIsParsing(true);
    setPreviewModal(null);
    setSelectedTemplate(pdfName);
    try {
      const url = encodeURI(`/resumes/${pdfName}`);

      // Use fetch() — avoids pdfjs XHR Range header that causes Vite dev server 204
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status} loading PDF`);
      const arrayBuffer = await response.arrayBuffer();

      const pdfDoc = await pdfjs.getDocument({ data: arrayBuffer }).promise;

      // Extract text from all pages (max 3)
      const numPages = Math.min(pdfDoc.numPages, 3);
      let allItems = [];
      for (let p = 1; p <= numPages; p++) {
        const page = await pdfDoc.getPage(p);
        const content = await page.getTextContent();
        allItems = allItems.concat(content.items);
      }

      const parsed = parsePdfTextContent(allItems);
      // Replace form data with extracted values; keep personal fields the user set
      setFormData(prev => ({
        ...prev,
        ...parsed,
        education: parsed.education?.length > 0 ? parsed.education : prev.education,
        experience: parsed.experience?.length > 0 ? parsed.experience : prev.experience,
        skills: parsed.skills?.length > 0 ? parsed.skills : prev.skills,
        languages: parsed.languages?.length > 0 ? parsed.languages : prev.languages,
        // Keep these — not extractable from a PDF template
        references: prev.references,
        gender: prev.gender,
        dob: prev.dob,
        nationality: prev.nationality,
        religion: prev.religion,
      }));
      triggerToast('✅ Data extracted from PDF — review and edit on the left!');
    } catch (err) {
      console.error('PDF extraction error:', err);
      triggerToast('⚠️ Could not extract PDF text — please fill in manually');
    } finally {
      setIsParsing(false);
    }
  };

  // Open / close the PDF preview modal
  const openPreview = (pdfName) => {
    setPreviewModal({ pdfName, pdfUrl: encodeURI(`/resumes/${pdfName}`) });
  };
  const closePreview = () => setPreviewModal(null);

  // --- IMAGE Uploader ---
  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setProfileImage(event.target.result);
      triggerToast("Profile photo updated!");
    };
    reader.readAsDataURL(file);
  };

  // --- DYNAMIC FORM HANDLERS ---
  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleListItemChange = (section, index, field, value) => {
    setFormData(prev => {
      const list = [...prev[section]];
      list[index] = { ...list[index], [field]: value };
      return { ...prev, [section]: list };
    });
  };

  const addListItem = (section, emptyObject) => {
    setFormData(prev => ({
      ...prev,
      [section]: [...prev[section], emptyObject]
    }));
  };

  const removeListItem = (section, index) => {
    setFormData(prev => ({
      ...prev,
      [section]: prev[section].filter((_, i) => i !== index)
    }));
  };

  // Skills
  const handleAddSkill = (e) => {
    if (e.key === 'Enter' || e.type === 'click') {
      e.preventDefault();
      const val = skillInput.trim();
      if (val && !formData.skills.includes(val)) {
        setFormData(prev => ({
          ...prev,
          skills: [...prev.skills, val]
        }));
        setSkillInput('');
      }
    }
  };

  const removeSkill = (skill) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.filter(s => s !== skill)
    }));
  };

  // Print PDF trigger
  const handlePrint = () => {
    window.print();
  };

  const layoutType = getMappedLayoutType(selectedTemplate);

  return (
    <div className="resume-editor-container" style={{ height: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-base)', overflow: 'hidden' }}>

      {/* Dynamic Print CSS Injection */}
      <style>{`
        @media print {
          body {
            background: #ffffff !important;
            color: #000000 !important;
          }
          .no-print, 
          .passport-header, 
          .sidebar-container, 
          .content-area > :not(.resume-editor-container), 
          .resume-editor-container > :not(.resume-editor-grid),
          .resume-editor-grid > :not(.resume-editor-right) {
            display: none !important;
          }
          .resume-editor-grid {
            display: block !important;
            height: auto !important;
            overflow: visible !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          .resume-editor-right {
            display: block !important;
            width: 100% !important;
            height: auto !important;
            padding: 0 !important;
            background: none !important;
            overflow: visible !important;
          }
          .resume-print-page {
            box-shadow: none !important;
            border: none !important;
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            height: auto !important;
            max-width: none !important;
            max-height: none !important;
          }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>

      {/* Top Header Controls */}
      <div className="no-print" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 24px', borderBottom: '1px solid var(--border)', backgroundColor: 'var(--bg-surface)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>


          <span style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-primary)' }}>
            Resume & Bio Data Creator
          </span>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => {
              navigator.clipboard.writeText(window.location.href);
              triggerToast("Link copied to share!");
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: 'transparent',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              padding: '8px 16px',
              fontSize: '13px',
              fontWeight: '700',
              color: 'var(--text-primary)',
              cursor: 'pointer'
            }}
          >
            <Share2 size={14} />
            Share
          </button>

          <button
            onClick={handlePrint}
            disabled={!selectedTemplate}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: selectedTemplate ? 'var(--primary)' : 'var(--border)',
              border: 'none',
              borderRadius: '8px',
              padding: '8px 16px',
              fontSize: '13px',
              fontWeight: '700',
              color: '#ffffff',
              cursor: selectedTemplate ? 'pointer' : 'default',
              boxShadow: selectedTemplate ? 'var(--shadow-glow)' : 'none',
              opacity: selectedTemplate ? 1 : 0.6
            }}
          >
            <Download size={14} />
            Download PDF
          </button>
        </div>
      </div>

      {/* Editor Grid Workspace */}
      <div className="resume-editor-grid" style={{ display: 'grid', gridTemplateColumns: '460px 1fr', flex: 1, overflow: 'hidden' }}>

        {/* LEFT COLUMN: Input Forms (Scrollable) */}
        <div className="resume-editor-left no-print" style={{ backgroundColor: 'var(--bg-surface)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '20px', padding: '20px', overflowY: 'auto' }}>

          {/* Section 1: Personal Details */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', paddingBottom: '16px', borderBottom: '1px solid var(--border)' }}>
            <h4 style={{ fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px', margin: '0 0 4px 0' }}>
              <User size={13} style={{ color: 'var(--primary)' }} />
              Personal Details
            </h4>

            {/* Profile Photo Uploader */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <div
                onClick={() => fileInputRef.current.click()}
                style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '8px',
                  border: '1px dashed var(--border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  overflow: 'hidden',
                  backgroundColor: 'var(--bg-base)'
                }}
              >
                {profileImage ? (
                  <img src={profileImage} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <Upload size={18} style={{ color: 'var(--text-muted)' }} />
                )}
              </div>
              <div>
                <span style={{ fontSize: '12.5px', fontWeight: '700', color: 'var(--text-primary)', display: 'block' }}>Profile Image</span>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginTop: '2px' }}>JPG or PNG format</span>
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageUpload} />
            </div>

            <div>
              <label style={{ fontSize: '10.5px', fontWeight: '800', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Full Name</label>
              <input className="form-input" value={formData.fullName} onChange={(e) => handleChange('fullName', e.target.value)} placeholder="Alexander Sterling" style={{ height: '36px', fontSize: '13px' }} />
            </div>

            <div>
              <label style={{ fontSize: '10.5px', fontWeight: '800', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Job Title</label>
              <input className="form-input" value={formData.title} onChange={(e) => handleChange('title', e.target.value)} placeholder="Senior Crop Specialist" style={{ height: '36px', fontSize: '13px' }} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '10.5px', fontWeight: '800', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Mobile Number</label>
                <input className="form-input" value={formData.phone} onChange={(e) => handleChange('phone', e.target.value)} placeholder="+1 (555) 012" style={{ height: '36px', fontSize: '13px' }} />
              </div>
              <div>
                <label style={{ fontSize: '10.5px', fontWeight: '800', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Email Address</label>
                <input className="form-input" value={formData.email} onChange={(e) => handleChange('email', e.target.value)} placeholder="alex@example.com" style={{ height: '36px', fontSize: '13px' }} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '10.5px', fontWeight: '800', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>City/Location</label>
                <input className="form-input" value={formData.location} onChange={(e) => handleChange('location', e.target.value)} placeholder="Sydney, AU" style={{ height: '36px', fontSize: '13px' }} />
              </div>
              <div>
                <label style={{ fontSize: '10.5px', fontWeight: '800', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Full Address</label>
                <input className="form-input" value={formData.address} onChange={(e) => handleChange('address', e.target.value)} placeholder="42 Wallaby Way" style={{ height: '36px', fontSize: '13px' }} />
              </div>
            </div>
          </div>

          {/* Section 2: Basic Details (Gender, DOB, etc) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', paddingBottom: '16px', borderBottom: '1px solid var(--border)' }}>
            <h4 style={{ fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px', margin: '0 0 4px 0' }}>
              <Settings size={13} style={{ color: 'var(--primary)' }} />
              Basic Details
            </h4>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '10.5px', fontWeight: '800', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Gender</label>
                <select
                  className="form-input"
                  value={formData.gender}
                  onChange={(e) => handleChange('gender', e.target.value)}
                  style={{ height: '36px', fontSize: '13px', backgroundColor: 'var(--bg-base)' }}
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '10.5px', fontWeight: '800', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Date of Birth</label>
                <input type="date" className="form-input" value={formData.dob} onChange={(e) => handleChange('dob', e.target.value)} style={{ height: '36px', fontSize: '13px' }} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '10.5px', fontWeight: '800', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Nationality</label>
                <input className="form-input" value={formData.nationality} onChange={(e) => handleChange('nationality', e.target.value)} placeholder="Australian" style={{ height: '36px', fontSize: '13px' }} />
              </div>
              <div>
                <label style={{ fontSize: '10.5px', fontWeight: '800', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Religion</label>
                <input className="form-input" value={formData.religion} onChange={(e) => handleChange('religion', e.target.value)} placeholder="Christian" style={{ height: '36px', fontSize: '13px' }} />
              </div>
            </div>
          </div>

          {/* Professional Profile */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingBottom: '16px', borderBottom: '1px solid var(--border)' }}>
            <label style={{ fontSize: '11px', fontWeight: '800', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Professional Profile / Summary</label>
            <textarea
              className="form-input"
              value={formData.profile}
              onChange={(e) => handleChange('profile', e.target.value)}
              placeholder="Results-oriented Agronomist with over 8 years..."
              style={{ height: '80px', fontSize: '12.5px', padding: '8px 12px', resize: 'none', lineHeight: '1.5' }}
            />
          </div>

          {/* Section 3: Education */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', paddingBottom: '16px', borderBottom: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h4 style={{ fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px', margin: 0 }}>
                <GraduationCap size={13} style={{ color: 'var(--primary)' }} />
                Education
              </h4>
              <button
                onClick={() => addListItem('education', { school: '', degree: '', year: '' })}
                style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: '700', fontSize: '11px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px' }}
              >
                <Plus size={12} /> Add
              </button>
            </div>

            {formData.education.map((edu, idx) => (
              <div key={idx} style={{ border: '1px solid var(--border)', borderRadius: '8px', padding: '10px', backgroundColor: 'var(--bg-base)', position: 'relative' }}>
                <button
                  onClick={() => removeListItem('education', idx)}
                  style={{ position: 'absolute', top: '8px', right: '8px', background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}
                >
                  <Trash2 size={13} />
                </button>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <input className="form-input" value={edu.degree} onChange={(e) => handleListItemChange('education', idx, 'degree', e.target.value)} placeholder="Degree / Course (e.g. Bachelor of Design)" style={{ height: '32px', fontSize: '12px' }} />
                  <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '8px' }}>
                    <input className="form-input" value={edu.school} onChange={(e) => handleListItemChange('education', idx, 'school', e.target.value)} placeholder="School / University" style={{ height: '32px', fontSize: '12px' }} />
                    <input className="form-input" value={edu.year} onChange={(e) => handleListItemChange('education', idx, 'year', e.target.value)} placeholder="e.g. 2011 - 2015" style={{ height: '32px', fontSize: '12px' }} />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Section 4: Work Experience */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', paddingBottom: '16px', borderBottom: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h4 style={{ fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px', margin: 0 }}>
                <Briefcase size={13} style={{ color: 'var(--primary)' }} />
                Experience
              </h4>
              <button
                onClick={() => addListItem('experience', { company: '', role: '', period: '', description: '' })}
                style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: '700', fontSize: '11px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px' }}
              >
                <Plus size={12} /> Add
              </button>
            </div>

            {formData.experience.map((exp, idx) => (
              <div key={idx} style={{ border: '1px solid var(--border)', borderRadius: '8px', padding: '10px', backgroundColor: 'var(--bg-base)', position: 'relative' }}>
                <button
                  onClick={() => removeListItem('experience', idx)}
                  style={{ position: 'absolute', top: '8px', right: '8px', background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}
                >
                  <Trash2 size={13} />
                </button>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <input className="form-input" value={exp.role} onChange={(e) => handleListItemChange('experience', idx, 'role', e.target.value)} placeholder="Job Title / Role" style={{ height: '32px', fontSize: '12px' }} />
                  <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '8px' }}>
                    <input className="form-input" value={exp.company} onChange={(e) => handleListItemChange('experience', idx, 'company', e.target.value)} placeholder="Company Name" style={{ height: '32px', fontSize: '12px' }} />
                    <input className="form-input" value={exp.period} onChange={(e) => handleListItemChange('experience', idx, 'period', e.target.value)} placeholder="e.g. 2018 - Present" style={{ height: '32px', fontSize: '12px' }} />
                  </div>
                  <textarea
                    className="form-input"
                    value={exp.description}
                    onChange={(e) => handleListItemChange('experience', idx, 'description', e.target.value)}
                    placeholder="Short description of responsibilities..."
                    style={{ height: '56px', fontSize: '11.5px', padding: '6px 10px', resize: 'none' }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Section 5: Expertise/Skills */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', paddingBottom: '16px', borderBottom: '1px solid var(--border)' }}>
            <h4 style={{ fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px', margin: 0 }}>
              <Sparkles size={13} style={{ color: 'var(--primary)' }} />
              Expertise / Skills
            </h4>

            <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
              <input
                className="form-input"
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={handleAddSkill}
                placeholder="Add skill (press Enter)"
                style={{ height: '32px', fontSize: '12.5px' }}
              />
              <button
                onClick={handleAddSkill}
                style={{ padding: '0 12px', border: 'none', backgroundColor: 'var(--primary)', color: '#fff', borderRadius: '6px', cursor: 'pointer', fontWeight: '700', fontSize: '12px' }}
              >
                Add
              </button>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
              {formData.skills.map(skill => (
                <div key={skill} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', backgroundColor: 'var(--bg-base)', border: '1px solid var(--border)', borderRadius: '6px', padding: '4px 8px', fontSize: '11.5px' }}>
                  <span>{skill}</span>
                  <button onClick={() => removeSkill(skill)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 0 }}>
                    <Trash2 size={10} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Section 6: Languages */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', paddingBottom: '16px', borderBottom: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h4 style={{ fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px', margin: 0 }}>
                <Globe size={13} style={{ color: 'var(--primary)' }} />
                Languages
              </h4>
              <button
                onClick={() => addListItem('languages', { name: '', level: '' })}
                style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: '700', fontSize: '11px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px' }}
              >
                <Plus size={12} /> Add
              </button>
            </div>

            {formData.languages.map((lang, idx) => (
              <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 30px', gap: '8px', alignItems: 'center' }}>
                <input className="form-input" value={lang.name} onChange={(e) => handleListItemChange('languages', idx, 'name', e.target.value)} placeholder="English" style={{ height: '32px', fontSize: '12px' }} />
                <input className="form-input" value={lang.level} onChange={(e) => handleListItemChange('languages', idx, 'level', e.target.value)} placeholder="Native" style={{ height: '32px', fontSize: '12px' }} />
                <button
                  onClick={() => removeListItem('languages', idx)}
                  style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', display: 'flex', justifyContent: 'center' }}
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>

          {/* Section 7: References */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', paddingBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h4 style={{ fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px', margin: 0 }}>
                <FileText size={13} style={{ color: 'var(--primary)' }} />
                References
              </h4>
              <button
                onClick={() => addListItem('references', { name: '', relation: '', phone: '', email: '' })}
                style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: '700', fontSize: '11px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px' }}
              >
                <Plus size={12} /> Add
              </button>
            </div>

            {formData.references.map((refEntry, idx) => (
              <div key={idx} style={{ border: '1px solid var(--border)', borderRadius: '8px', padding: '10px', backgroundColor: 'var(--bg-base)', position: 'relative' }}>
                <button
                  onClick={() => removeListItem('references', idx)}
                  style={{ position: 'absolute', top: '8px', right: '8px', background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}
                >
                  <Trash2 size={13} />
                </button>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <input className="form-input" value={refEntry.name} onChange={(e) => handleListItemChange('references', idx, 'name', e.target.value)} placeholder="Reference Name (e.g. Estelle Darcy)" style={{ height: '32px', fontSize: '12px' }} />
                  <input className="form-input" value={refEntry.relation} onChange={(e) => handleListItemChange('references', idx, 'relation', e.target.value)} placeholder="Relation / Company (e.g. Wardiere Inc. / CTO)" style={{ height: '32px', fontSize: '12px' }} />
                  <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.5fr', gap: '8px' }}>
                    <input className="form-input" value={refEntry.phone} onChange={(e) => handleListItemChange('references', idx, 'phone', e.target.value)} placeholder="Phone" style={{ height: '32px', fontSize: '12px' }} />
                    <input className="form-input" value={refEntry.email} onChange={(e) => handleListItemChange('references', idx, 'email', e.target.value)} placeholder="Email" style={{ height: '32px', fontSize: '12px' }} />
                  </div>
                </div>
              </div>
            ))}
          </div>

        </div>

        {/* RIGHT COLUMN: Interactive Selector and Live Document Preview Area */}
        <div className="resume-editor-right" style={{ flex: 1, backgroundColor: 'var(--bg-base)', padding: '32px', overflowY: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

          {/* STEP 1: CANVA-STYLE LOCAL PDF TEMPLATE SELECTOR */}
          {!selectedTemplate ? (
            <div style={{ width: '100%', maxWidth: '800px', display: 'flex', flexDirection: 'column', gap: '20px', animation: 'fadeIn 0.2s ease' }}>
              <div style={{ textAlign: 'center', marginBottom: '12px' }}>
                <h3 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-primary)', margin: '0 0 6px 0' }}>
                  Select a PDF Design Template
                </h3>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>
                  Click any template to <strong>preview it</strong> — then choose to use it in your editor.
                </p>
              </div>

              {/* Parsing overlay that covers the grid while PDF.js reads the file */}
              {isParsing && (
                <div style={{
                  position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
                  backgroundColor: 'rgba(15,23,42,0.75)', zIndex: 9999,
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px'
                }}>
                  <div style={{
                    width: '48px', height: '48px', borderRadius: '50%',
                    border: '4px solid rgba(255,255,255,0.2)',
                    borderTopColor: 'var(--primary)',
                    animation: 'spin 0.7s linear infinite'
                  }} />
                  <span style={{ color: '#ffffff', fontWeight: '700', fontSize: '15px' }}>
                    Extracting data from PDF…
                  </span>
                  <span style={{ color: '#94a3b8', fontSize: '12px' }}>
                    This takes a moment. Form fields will fill automatically.
                  </span>
                </div>
              )}

              {/* Canva style layout: Tall A4 preview cards */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px', justifyContent: 'center' }}>
                {pdfTemplates.map(pdfName => {
                  const currentLayout = getMappedLayoutType(pdfName);
                  return (
                    <div
                      key={pdfName}
                      onClick={() => extractDataFromPdf(pdfName)}
                      style={{
                        width: '180px',
                        height: '254px', /* exact A4 aspect ratio 1 : 1.414 */
                        backgroundColor: '#ffffff',
                        border: '1.5px solid var(--border)',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        position: 'relative',
                        overflow: 'hidden',
                        boxShadow: 'var(--shadow-md)',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        transition: 'all 0.15s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = 'var(--primary)';
                        e.currentTarget.style.transform = 'translateY(-2px)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = 'var(--border)';
                        e.currentTarget.style.transform = 'none';
                      }}
                    >
                      {/* Live PDF rendered via pdfjs-dist canvas */}
                      <div style={{ flex: 1, overflow: 'hidden' }}>
                        <PdfThumbnail pdfUrl={encodeURI(`/resumes/${pdfName}`)} />
                      </div>

                      {/* Card Title Header Overlay */}
                      <div style={{ padding: '8px', backgroundColor: 'rgba(15, 23, 42, 0.9)', color: '#ffffff', borderTop: '1px solid var(--border)', zIndex: 10 }}>
                        <span
                          style={{
                            fontSize: '10px',
                            fontWeight: '800',
                            display: 'block',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}
                          title={pdfName.replace('.pdf', '')}
                        >
                          {pdfName.replace('.pdf', '')}
                        </span>
                        <span style={{ fontSize: '8px', color: '#94a3b8', display: 'block', marginTop: '1px' }}>
                          LAYOUT: {currentLayout.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (

            /* STEP 2: ACTIVE TEMPLATE PREVIEW SCREEN */
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>

              {/* Floating styled preview A4 sheet */}
              <div
                className="resume-print-page"
                style={{
                  width: '100%',
                  maxWidth: '800px',
                  minHeight: '1080px',
                  backgroundColor: '#ffffff',
                  color: '#1e293b',
                  boxShadow: 'var(--shadow-xl)',
                  border: '1px solid var(--border)',
                  borderRadius: '6px',
                  boxSizing: 'border-box',
                  fontFamily: 'system-ui, -apple-system, sans-serif',
                  animation: 'fadeIn 0.2s ease-out',
                  overflow: 'hidden'
                }}
              >
                {/* ─── TEMPLATE 1: MINIMALIST (ISABEL STYLE) ─── */}
                {layoutType === 'minimalist' && (
                  <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', minHeight: '1080px' }}>
                    {/* Left Grey Sidebar */}
                    <div style={{ backgroundColor: '#f8fafc', borderRight: '1px solid #e2e8f0', padding: '40px 24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>

                      {/* Photo */}
                      {profileImage ? (
                        <div style={{ width: '120px', height: '120px', borderRadius: '50%', overflow: 'hidden', border: '3px solid #ffffff', boxShadow: '0 4px 10px rgba(0,0,0,0.08)', alignSelf: 'center', margin: '0 auto 12px' }}>
                          <img src={profileImage} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                      ) : (
                        <div style={{ width: '120px', height: '120px', borderRadius: '50%', backgroundColor: '#cbd5e1', alignSelf: 'center', margin: '0 auto 12px' }} />
                      )}

                      {/* About Me */}
                      {formData.profile && (
                        <div>
                          <h4 style={{ fontSize: '12.5px', fontWeight: '800', textTransform: 'uppercase', color: '#0f172a', borderBottom: '1.5px solid #cbd5e1', paddingBottom: '4px', margin: '0 0 10px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            👤 About Me
                          </h4>
                          <p style={{ fontSize: '11px', color: '#475569', lineHeight: '1.6', margin: 0 }}>
                            {formData.profile}
                          </p>
                        </div>
                      )}

                      {/* Contact */}
                      <div>
                        <h4 style={{ fontSize: '12.5px', fontWeight: '800', textTransform: 'uppercase', color: '#0f172a', borderBottom: '1.5px solid #cbd5e1', paddingBottom: '4px', margin: '0 0 10px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          📞 Contact
                        </h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '11px', color: '#475569' }}>
                          {formData.phone && <span>📞 {formData.phone}</span>}
                          {formData.email && <span style={{ wordBreak: 'break-all' }}>✉️ {formData.email}</span>}
                          {formData.address && <span>📍 {formData.address}</span>}
                        </div>
                      </div>

                      {/* Skills */}
                      {formData.skills.length > 0 && (
                        <div>
                          <h4 style={{ fontSize: '12.5px', fontWeight: '800', textTransform: 'uppercase', color: '#0f172a', borderBottom: '1.5px solid #cbd5e1', paddingBottom: '4px', margin: '0 0 10px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            ⚙️ Skills
                          </h4>
                          <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '11px', color: '#475569', lineHeight: '1.6' }}>
                            {formData.skills.map(s => <li key={s}>{s}</li>)}
                          </ul>
                        </div>
                      )}

                      {/* Languages */}
                      {formData.languages.length > 0 && (
                        <div>
                          <h4 style={{ fontSize: '12.5px', fontWeight: '800', textTransform: 'uppercase', color: '#0f172a', borderBottom: '1.5px solid #cbd5e1', paddingBottom: '4px', margin: '0 0 10px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            🗣️ Language
                          </h4>
                          <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '11px', color: '#475569', lineHeight: '1.6' }}>
                            {formData.languages.map(l => <li key={l.name}>{l.name} ({l.level})</li>)}
                          </ul>
                        </div>
                      )}
                    </div>

                    {/* Right Main Column */}
                    <div style={{ padding: '40px 32px', display: 'flex', flexDirection: 'column', gap: '28px' }}>

                      {/* Name / Title header */}
                      <div>
                        <h1 style={{ fontSize: '38px', fontWeight: '800', color: '#0f172a', margin: '0 0 4px 0', letterSpacing: '-1px' }}>
                          {formData.fullName || 'Name'}
                        </h1>
                        <h3 style={{ fontSize: '13px', fontWeight: '700', textTransform: 'uppercase', color: '#475569', letterSpacing: '1px', margin: 0 }}>
                          {formData.title || 'Job Title'}
                        </h3>
                      </div>

                      {/* Education */}
                      {formData.education.length > 0 && (
                        <div>
                          <h4 style={{ fontSize: '13.5px', fontWeight: '800', textTransform: 'uppercase', color: '#0f172a', borderBottom: '1.5px solid #cbd5e1', paddingBottom: '6px', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            🎓 Education
                          </h4>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {formData.education.map((edu, idx) => (
                              <div key={idx} style={{ display: 'flex', gap: '16px' }}>
                                <span style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', whiteSpace: 'nowrap', width: '90px', paddingTop: '2px' }}>
                                  ({edu.year})
                                </span>
                                <div>
                                  <strong style={{ fontSize: '12.5px', color: '#0f172a', display: 'block' }}>{edu.school.toUpperCase()}</strong>
                                  <span style={{ fontSize: '11.5px', color: '#475569' }}>{edu.degree}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Experience */}
                      {formData.experience.length > 0 && (
                        <div>
                          <h4 style={{ fontSize: '13.5px', fontWeight: '800', textTransform: 'uppercase', color: '#0f172a', borderBottom: '1.5px solid #cbd5e1', paddingBottom: '6px', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            💼 Experience
                          </h4>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            {formData.experience.map((exp, idx) => (
                              <div key={idx} style={{ display: 'flex', gap: '16px' }}>
                                <span style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', whiteSpace: 'nowrap', width: '90px', paddingTop: '2px' }}>
                                  ({exp.period})
                                </span>
                                <div style={{ flex: 1 }}>
                                  <strong style={{ fontSize: '12.5px', color: '#0f172a', display: 'block' }}>{exp.role.toUpperCase()}</strong>
                                  <span style={{ fontSize: '11.5px', color: '#64748b', display: 'block', margin: '2px 0 6px 0' }}>{exp.company}</span>
                                  {exp.description && (
                                    <p style={{ fontSize: '11px', color: '#475569', lineHeight: '1.5', margin: 0 }}>
                                      {exp.description}
                                    </p>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* References */}
                      {formData.references.length > 0 && (
                        <div>
                          <h4 style={{ fontSize: '13.5px', fontWeight: '800', textTransform: 'uppercase', color: '#0f172a', borderBottom: '1.5px solid #cbd5e1', paddingBottom: '6px', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            📁 References
                          </h4>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                            {formData.references.map((r, i) => (
                              <div key={i} style={{ fontSize: '11px', lineHeight: '1.5' }}>
                                <strong style={{ fontSize: '11.5px', color: '#0f172a', display: 'block' }}>{r.name}</strong>
                                <span style={{ color: '#64748b', display: 'block' }}>{r.relation}</span>
                                {r.phone && <span style={{ display: 'block' }}>Ph: {r.phone}</span>}
                                {r.email && <span style={{ display: 'block' }}>Email: {r.email}</span>}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                    </div>
                  </div>
                )}

                {/* ─── TEMPLATE 2: BLUE SIMPLE (RICHARD STYLE) ─── */}
                {layoutType === 'blue-simple' && (
                  <div style={{ minHeight: '1080px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', flex: 1 }}>
                      {/* Left Dark Blue Column */}
                      <div style={{ backgroundColor: '#0f172a', color: '#ffffff', padding: '40px 20px', display: 'flex', flexDirection: 'column', gap: '28px' }}>
                        {/* Profile Pic */}
                        {profileImage ? (
                          <div style={{ width: '120px', height: '120px', borderRadius: '50%', overflow: 'hidden', border: '4px solid #ffffff', alignSelf: 'center', margin: '0 auto 12px' }}>
                            <img src={profileImage} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          </div>
                        ) : (
                          <div style={{ width: '120px', height: '120px', borderRadius: '50%', backgroundColor: '#334155', border: '4px solid #ffffff', alignSelf: 'center', margin: '0 auto 12px' }} />
                        )}

                        {/* Contact */}
                        <div>
                          <h4 style={{ fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.8px', borderBottom: '1px solid #475569', paddingBottom: '6px', margin: '0 0 10px 0' }}>
                            CONTACT
                          </h4>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '10.5px', color: '#94a3b8' }}>
                            {formData.phone && <span>📞 {formData.phone}</span>}
                            {formData.email && <span style={{ wordBreak: 'break-all' }}>✉️ {formData.email}</span>}
                            {formData.location && <span>📍 {formData.location}</span>}
                          </div>
                        </div>

                        {/* Education */}
                        {formData.education.length > 0 && (
                          <div>
                            <h4 style={{ fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.8px', borderBottom: '1px solid #475569', paddingBottom: '6px', margin: '0 0 12px 0' }}>
                              EDUCATION
                            </h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                              {formData.education.map((edu, idx) => (
                                <div key={idx} style={{ fontSize: '10.5px' }}>
                                  <div style={{ color: '#94a3b8', fontWeight: '700' }}>{edu.year}</div>
                                  <strong style={{ color: '#ffffff', display: 'block', marginTop: '2px' }}>{edu.school.toUpperCase()}</strong>
                                  <span style={{ color: '#cbd5e1' }}>{edu.degree}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Skills */}
                        {formData.skills.length > 0 && (
                          <div>
                            <h4 style={{ fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.8px', borderBottom: '1px solid #475569', paddingBottom: '6px', margin: '0 0 10px 0' }}>
                              SKILLS
                            </h4>
                            <ul style={{ margin: 0, paddingLeft: '14px', fontSize: '10.5px', color: '#cbd5e1', lineHeight: '1.6' }}>
                              {formData.skills.map(s => <li key={s}>{s}</li>)}
                            </ul>
                          </div>
                        )}

                        {/* Languages */}
                        {formData.languages.length > 0 && (
                          <div>
                            <h4 style={{ fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.8px', borderBottom: '1px solid #475569', paddingBottom: '6px', margin: '0 0 10px 0' }}>
                              LANGUAGES
                            </h4>
                            <ul style={{ margin: 0, paddingLeft: '14px', fontSize: '10.5px', color: '#cbd5e1', lineHeight: '1.6' }}>
                              {formData.languages.map(l => <li key={l.name}>{l.name} ({l.level})</li>)}
                            </ul>
                          </div>
                        )}

                      </div>

                      {/* Right Main Column */}
                      <div style={{ padding: '40px 32px', display: 'flex', flexDirection: 'column', gap: '28px' }}>

                        {/* Name and Job Title Header */}
                        <div>
                          <h1 style={{ fontSize: '38px', fontWeight: '800', color: '#0f172a', margin: '0 0 4px 0', letterSpacing: '-1px', textTransform: 'uppercase' }}>
                            {formData.fullName || 'Richard Sanchez'}
                          </h1>
                          <h3 style={{ fontSize: '13px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--primary)', letterSpacing: '1px', margin: 0 }}>
                            {formData.title || 'Marketing Manager'}
                          </h3>
                        </div>

                        {/* Profile Section */}
                        {formData.profile && (
                          <div>
                            <h4 style={{ fontSize: '12.5px', fontWeight: '800', textTransform: 'uppercase', color: '#0f172a', borderBottom: '1.5px solid #cbd5e1', paddingBottom: '6px', margin: '0 0 10px 0', letterSpacing: '0.8px' }}>
                              PROFILE
                            </h4>
                            <p style={{ fontSize: '12px', color: '#475569', lineHeight: '1.6', margin: 0 }}>
                              {formData.profile}
                            </p>
                          </div>
                        )}

                        {/* Work Experience Section */}
                        {formData.experience.length > 0 && (
                          <div>
                            <h4 style={{ fontSize: '12.5px', fontWeight: '800', textTransform: 'uppercase', color: '#0f172a', borderBottom: '1.5px solid #cbd5e1', paddingBottom: '6px', margin: '0 0 14px 0', letterSpacing: '0.8px' }}>
                              WORK EXPERIENCE
                            </h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                              {formData.experience.map((exp, idx) => (
                                <div key={idx} style={{ paddingLeft: '12px', borderLeft: '2px solid #cbd5e1', position: 'relative' }}>
                                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--primary)', position: 'absolute', left: '-5px', top: '4px' }} />
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                                    <div>
                                      <strong style={{ fontSize: '12.5px', color: '#0f172a' }}>{exp.company}</strong>
                                      <span style={{ fontSize: '11px', color: '#64748b', marginLeft: '6px' }}>({exp.role})</span>
                                    </div>
                                    <span style={{ fontSize: '10.5px', fontWeight: '700', color: '#64748b' }}>{exp.period}</span>
                                  </div>
                                  {exp.description && (
                                    <p style={{ fontSize: '11px', color: '#475569', lineHeight: '1.5', margin: 0 }}>
                                      {exp.description}
                                    </p>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* References Section */}
                        {formData.references.length > 0 && (
                          <div style={{ marginTop: 'auto' }}>
                            <h4 style={{ fontSize: '12.5px', fontWeight: '800', textTransform: 'uppercase', color: '#0f172a', borderBottom: '1.5px solid #cbd5e1', paddingBottom: '6px', margin: '0 0 12px 0', letterSpacing: '0.8px' }}>
                              REFERENCE
                            </h4>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                              {formData.references.map((r, i) => (
                                <div key={i} style={{ fontSize: '11px', lineHeight: '1.5' }}>
                                  <strong style={{ fontSize: '11.5px', color: '#0f172a', display: 'block' }}>{r.name}</strong>
                                  <span style={{ color: '#64748b', display: 'block' }}>{r.relation}</span>
                                  {r.phone && <span style={{ display: 'block' }}>Phone: {r.phone}</span>}
                                  {r.email && <span style={{ display: 'block' }}>Email: {r.email}</span>}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>


                  </div>
                )}

                {/* ─── TEMPLATE 3: MODERN SLATE ─── */}
                {layoutType === 'modern-slate' && (
                  <div style={{ padding: '48px', minHeight: '1080px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      {/* Centered Header */}
                      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                        <h1 style={{ fontSize: '32px', fontWeight: '800', color: '#1e293b', margin: '0 0 6px 0', textTransform: 'uppercase' }}>
                          {formData.fullName}
                        </h1>
                        <h3 style={{ fontSize: '12.5px', fontWeight: '700', color: 'var(--primary)', letterSpacing: '1px', textTransform: 'uppercase', margin: '0 0 12px 0' }}>
                          {formData.title}
                        </h3>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', fontSize: '11px', color: '#64748b' }}>
                          {formData.phone && <span>📞 {formData.phone}</span>}
                          {formData.email && <span>✉️ {formData.email}</span>}
                          {formData.location && <span>📍 {formData.location}</span>}
                        </div>
                      </div>

                      <div style={{ width: '100%', height: '2px', backgroundColor: '#e2e8f0', marginBottom: '24px' }} />

                      {/* Summary */}
                      {formData.profile && (
                        <div style={{ marginBottom: '24px' }}>
                          <p style={{ fontSize: '12px', color: '#475569', lineHeight: '1.6', textAlign: 'center', margin: 0, fontStyle: 'italic' }}>
                            "{formData.profile}"
                          </p>
                        </div>
                      )}

                      {/* 2 Equal Columns Grid */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
                        <div>
                          {/* Experience */}
                          {formData.experience.length > 0 && (
                            <div style={{ marginBottom: '24px' }}>
                              <h4 style={{ fontSize: '12px', fontWeight: '800', color: '#0f172a', borderBottom: '1.5px solid var(--primary)', paddingBottom: '4px', marginBottom: '12px', textTransform: 'uppercase' }}>
                                Experience
                              </h4>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                                {formData.experience.map((exp, idx) => (
                                  <div key={idx}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px' }}>
                                      <strong style={{ color: '#0f172a' }}>{exp.role}</strong>
                                      <span style={{ color: '#64748b', fontWeight: '600' }}>{exp.period}</span>
                                    </div>
                                    <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '4px' }}>{exp.company}</div>
                                    <p style={{ fontSize: '11px', color: '#475569', lineHeight: '1.4', margin: 0 }}>{exp.description}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        <div>
                          {/* Education */}
                          {formData.education.length > 0 && (
                            <div style={{ marginBottom: '20px' }}>
                              <h4 style={{ fontSize: '12px', fontWeight: '800', color: '#0f172a', borderBottom: '1.5px solid var(--primary)', paddingBottom: '4px', marginBottom: '12px', textTransform: 'uppercase' }}>
                                Education
                              </h4>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {formData.education.map((edu, idx) => (
                                  <div key={idx} style={{ fontSize: '11.5px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                      <strong style={{ color: '#0f172a' }}>{edu.degree}</strong>
                                      <span style={{ color: '#64748b' }}>{edu.year}</span>
                                    </div>
                                    <span style={{ fontSize: '11px', color: '#64748b' }}>{edu.school}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Skills */}
                          {formData.skills.length > 0 && (
                            <div style={{ marginBottom: '20px' }}>
                              <h4 style={{ fontSize: '12px', fontWeight: '800', color: '#0f172a', borderBottom: '1.5px solid var(--primary)', paddingBottom: '10px', textTransform: 'uppercase' }}>
                                Key Expertise
                              </h4>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                                {formData.skills.map(s => (
                                  <span key={s} style={{ backgroundColor: '#f1f5f9', color: '#334155', padding: '4px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: '600' }}>{s}</span>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Languages */}
                          {formData.languages.length > 0 && (
                            <div style={{ marginBottom: '20px' }}>
                              <h4 style={{ fontSize: '12px', fontWeight: '800', color: '#0f172a', borderBottom: '1.5px solid var(--primary)', paddingBottom: '4px', marginBottom: '10px', textTransform: 'uppercase' }}>
                                Languages
                              </h4>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '11px', color: '#475569' }}>
                                {formData.languages.map(l => (
                                  <div key={l.name} style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ fontWeight: '600' }}>{l.name}</span>
                                    <span>{l.level}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div style={{ borderTop: '1px solid #e2e8f0', padding: '12px', textAlign: 'center', fontSize: '9px', color: '#94a3b8', letterSpacing: '0.5px' }}>
                      Generated via Smart Akshaya Resume Creator
                    </div>
                  </div>
                )}

                {/* ─── TEMPLATE 4: CLEAN ACADEMIC ─── */}
                {layoutType === 'clean-academic' && (
                  <div style={{ padding: '48px', minHeight: '1080px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      {/* Left Aligned Header */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                        <div>
                          <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#111827', margin: '0 0 4px 0', fontFamily: 'Georgia, serif' }}>
                            {formData.fullName}
                          </h1>
                          <h3 style={{ fontSize: '12px', fontWeight: '600', color: '#4b5563', letterSpacing: '0.5px', margin: 0 }}>
                            {formData.title}
                          </h3>
                        </div>
                        <div style={{ textAlign: 'right', fontSize: '11px', color: '#4b5563', lineHeight: '1.5' }}>
                          {formData.phone && <div>Phone: {formData.phone}</div>}
                          {formData.email && <div>Email: {formData.email}</div>}
                          {formData.location && <div>Address: {formData.location}</div>}
                        </div>
                      </div>

                      <div style={{ width: '100%', height: '1.5px', backgroundColor: '#111827', marginBottom: '20px' }} />

                      {/* Summary */}
                      {formData.profile && (
                        <div style={{ marginBottom: '20px' }}>
                          <h4 style={{ fontSize: '12px', fontWeight: '700', fontFamily: 'Georgia, serif', textTransform: 'uppercase', color: '#111827', margin: '0 0 6px 0' }}>
                            Summary
                          </h4>
                          <p style={{ fontSize: '11.5px', color: '#374151', lineHeight: '1.6', margin: 0 }}>
                            {formData.profile}
                          </p>
                        </div>
                      )}

                      {/* Education */}
                      {formData.education.length > 0 && (
                        <div style={{ marginBottom: '20px' }}>
                          <h4 style={{ fontSize: '12px', fontWeight: '700', fontFamily: 'Georgia, serif', textTransform: 'uppercase', color: '#111827', margin: '0 0 8px 0', borderBottom: '1px solid #111827', paddingBottom: '2px' }}>
                            Education
                          </h4>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {formData.education.map((edu, idx) => (
                              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', fontSize: '11.5px' }}>
                                <div>
                                  <strong style={{ color: '#111827' }}>{edu.degree}</strong>
                                  <div style={{ color: '#4b5563', marginTop: '1px' }}>{edu.school}</div>
                                </div>
                                <span style={{ fontWeight: '600', color: '#374151' }}>{edu.year}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Experience */}
                      {formData.experience.length > 0 && (
                        <div style={{ marginBottom: '20px' }}>
                          <h4 style={{ fontSize: '12px', fontWeight: '700', fontFamily: 'Georgia, serif', textTransform: 'uppercase', color: '#111827', margin: '0 0 8px 0', borderBottom: '1px solid #111827', paddingBottom: '2px' }}>
                            Professional Experience
                          </h4>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                            {formData.experience.map((exp, idx) => (
                              <div key={idx} style={{ fontSize: '11.5px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2px' }}>
                                  <div>
                                    <strong style={{ color: '#111827' }}>{exp.role}</strong>
                                    <span style={{ color: '#4b5563', marginLeft: '6px' }}>— {exp.company}</span>
                                  </div>
                                  <span style={{ fontWeight: '600', color: '#374151' }}>{exp.period}</span>
                                </div>
                                <p style={{ fontSize: '11px', color: '#4b5563', lineHeight: '1.5', margin: 0 }}>{exp.description}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Skills & Languages */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', marginBottom: '20px' }}>
                        {formData.skills.length > 0 && (
                          <div>
                            <h4 style={{ fontSize: '12px', fontWeight: '700', fontFamily: 'Georgia, serif', textTransform: 'uppercase', color: '#111827', margin: '0 0 6px 0', borderBottom: '1px solid #111827', paddingBottom: '2px' }}>
                              Skills & Competencies
                            </h4>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', fontSize: '11px', color: '#374151' }}>
                              {formData.skills.join(', ')}
                            </div>
                          </div>
                        )}

                        {formData.languages.length > 0 && (
                          <div>
                            <h4 style={{ fontSize: '12px', fontWeight: '700', fontFamily: 'Georgia, serif', textTransform: 'uppercase', color: '#111827', margin: '0 0 6px 0', borderBottom: '1px solid #111827', paddingBottom: '2px' }}>
                              Languages
                            </h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '11px', color: '#374151' }}>
                              {formData.languages.map(l => (
                                <div key={l.name} style={{ display: 'flex', justifyContent: 'space-between' }}>
                                  <span style={{ fontWeight: '600' }}>{l.name}</span>
                                  <span>{l.level}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div style={{ borderTop: '1px solid #e2e8f0', padding: '12px', textAlign: 'center', fontSize: '9px', color: '#94a3b8', letterSpacing: '0.5px' }}>
                      Generated via Smart Akshaya Resume Creator
                    </div>
                  </div>
                )}
              </div>

              {/* SELECT ANOTHER ONE - Dynamic Switcher button */}
              <button
                onClick={() => setSelectedTemplate(null)}
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  border: '1.5px solid var(--border)',
                  color: 'var(--text-primary)',
                  padding: '10px 20px',
                  borderRadius: '30px',
                  fontSize: '13px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: 'var(--shadow-md)',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--primary)';
                  e.currentTarget.style.backgroundColor = 'var(--primary-glow)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border)';
                  e.currentTarget.style.backgroundColor = 'var(--bg-surface)';
                }}
              >
                <RefreshCw size={13} />
                Select Another Template
              </button>
            </div>
          )}

        </div>

      </div>

      {/* Floating success toast */}
      {toastMsg && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: '#0f172a',
            color: '#ffffff',
            padding: '12px 24px',
            borderRadius: '8px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
            zIndex: 2000,
            fontSize: '13px',
            fontWeight: '600',
            textAlign: 'center',
            animation: 'fadeIn 0.2s ease-out'
          }}
        >
          {toastMsg}
        </div>
      )}
      {/* PDF Preview Modal — shows when user clicks a template card */}
      {previewModal && (
        <PdfPreviewModal
          pdfUrl={previewModal.pdfUrl}
          pdfName={previewModal.pdfName}
          onClose={closePreview}
          onSelect={() => extractDataFromPdf(previewModal.pdfName)}
        />
      )}

    </div>
  );
}
