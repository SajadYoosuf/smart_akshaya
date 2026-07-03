import React, { useState, useRef, useEffect } from 'react';
import { Upload, Download, Sparkles, Sliders, RefreshCw, ZoomIn, ZoomOut, RotateCcw, RotateCw, HelpCircle, ArrowLeft } from 'lucide-react';

const TAB_PHOTO = 'psc-photo';
const TAB_SIG = 'psc-signature';

export default function PscPhotoCreator({ onViewChange }) {
  const [activeTab, setActiveTab] = useState(TAB_PHOTO);

  // --- TAB 1: PHOTO STATE ---
  const [photoSource, setPhotoSource] = useState(null);
  const [photoName, setPhotoName] = useState('');
  const [photoDate, setPhotoDate] = useState('');
  const [photoNameFontSize, setPhotoNameFontSize] = useState(14);
  const [photoDateFontSize, setPhotoDateFontSize] = useState(12);
  const [photoScale, setPhotoScale] = useState(0.8);
  const [photoOffset, setPhotoOffset] = useState({ x: 0, y: 0 });
  const [photoFileName, setPhotoFileName] = useState('');

  // --- TAB 2: SIGNATURE STATE ---
  const [sigSource, setSigSource] = useState(null);
  const [sigScale, setSigScale] = useState(0.8);
  const [sigOffset, setSigOffset] = useState({ x: 0, y: 0 });
  const [sigRotation, setSigRotation] = useState(0);
  const [sigFileName, setSigFileName] = useState('');

  // --- DRAGGING STATE ---
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });

  // --- REFS ---
  const photoCanvasRef = useRef(null);
  const sigCanvasRef = useRef(null);
  const photoInputRef = useRef(null);
  const sigInputRef = useRef(null);
  const [photoImgEl, setPhotoImgEl] = useState(null);
  const [sigImgEl, setSigImgEl] = useState(null);
  const [toastMsg, setToastMsg] = useState('');

  const triggerToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3000);
  };

  // --- UPLOAD HANDLERS ---
  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFileName(file.name);

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        setPhotoSource(event.target.result);
        setPhotoImgEl(img);
        setPhotoScale(0.5);
        setPhotoOffset({ x: 0, y: 0 });
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleSigUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSigFileName(file.name);

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        setSigSource(event.target.result);
        setSigImgEl(img);
        setSigScale(0.5);
        setSigOffset({ x: 0, y: 0 });
        setSigRotation(0);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  // --- DRAW EFFECTS ---
  useEffect(() => {
    if (activeTab === TAB_PHOTO) {
      drawPhoto();
    }
  }, [activeTab, photoSource, photoImgEl, photoName, photoDate, photoNameFontSize, photoDateFontSize, photoScale, photoOffset]);

  useEffect(() => {
    if (activeTab === TAB_SIG) {
      drawSignature();
    }
  }, [activeTab, sigSource, sigImgEl, sigScale, sigOffset, sigRotation]);

  const drawPhoto = () => {
    const canvas = photoCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    // Standard size: 3.5cm x 4.5cm. Let's draw at 350x450 high quality.
    canvas.width = 350;
    canvas.height = 450;

    // Fill background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (photoImgEl) {
      ctx.save();
      // Clip image to the top 370px of the canvas (leaving 80px for the text card)
      ctx.beginPath();
      ctx.rect(0, 0, canvas.width, 370);
      ctx.clip();

      const drawW = photoImgEl.naturalWidth * photoScale;
      const drawH = photoImgEl.naturalHeight * photoScale;
      const cX = canvas.width / 2 + photoOffset.x;
      const cY = 185 + photoOffset.y; // Center of 370px image window

      ctx.drawImage(photoImgEl, cX - drawW / 2, cY - drawH / 2, drawW, drawH);
      ctx.restore();
    } else {
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(0, 0, canvas.width, 370);
      ctx.fillStyle = '#94a3b8';
      ctx.font = '14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('No Photo Uploaded', canvas.width / 2, 185);
    }

    // Bottom name/date block
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 370, canvas.width, 80);

    // Divider line
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, 370);
    ctx.lineTo(canvas.width, 370);
    ctx.stroke();

    // Name text
    ctx.fillStyle = '#000000';
    ctx.font = `bold ${photoNameFontSize * 1.5}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText((photoName || 'NAME').toUpperCase(), canvas.width / 2, 408);

    // Date text
    ctx.font = `${photoDateFontSize * 1.5}px sans-serif`;
    ctx.fillText(photoDate || 'DD-MM-YYYY', canvas.width / 2, 434);
  };

  const drawSignature = () => {
    const canvas = sigCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    // Standard PSC signature is 150x100. Let's double it to 300x200 for preview crispness.
    canvas.width = 300;
    canvas.height = 200;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (sigImgEl) {
      ctx.save();
      const cX = canvas.width / 2 + sigOffset.x;
      const cY = canvas.height / 2 + sigOffset.y;

      ctx.translate(cX, cY);
      ctx.rotate((sigRotation * Math.PI) / 180);

      const drawW = sigImgEl.naturalWidth * sigScale;
      const drawH = sigImgEl.naturalHeight * sigScale;

      ctx.drawImage(sigImgEl, -drawW / 2, -drawH / 2, drawW, drawH);
      ctx.restore();
    } else {
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#94a3b8';
      ctx.font = '13px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Signature Placement Area', canvas.width / 2, canvas.height / 2);
    }
  };

  // --- MOUSE & TOUCH EVENT HANDLERS (ZOOM & PAN) ---
  const handleMouseDown = (e) => {
    setIsDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    dragStart.current = { x: e.clientX, y: e.clientY };

    if (activeTab === TAB_PHOTO) {
      setPhotoOffset(prev => ({ x: prev.x + dx, y: prev.y + dy }));
    } else {
      setSigOffset(prev => ({ x: prev.x + dx, y: prev.y + dy }));
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e) => {
    const zoomFactor = 0.04;
    const change = e.deltaY < 0 ? zoomFactor : -zoomFactor;
    if (activeTab === TAB_PHOTO) {
      setPhotoScale(prev => Math.max(0.1, Math.min(3, prev + change)));
    } else {
      setSigScale(prev => Math.max(0.1, Math.min(3, prev + change)));
    }
  };

  const handleZoom = (direction) => {
    const zoomFactor = 0.15;
    const change = direction === 'in' ? zoomFactor : -zoomFactor;
    if (activeTab === TAB_PHOTO) {
      setPhotoScale(prev => Math.max(0.1, Math.min(3, prev + change)));
    } else {
      setSigScale(prev => Math.max(0.1, Math.min(3, prev + change)));
    }
  };

  // --- DOWNLOAD ACTIONS ---
  const handleDownload = () => {
    if (activeTab === TAB_PHOTO) {
      if (!photoSource) return;
      const canvas = photoCanvasRef.current;
      const link = document.createElement('a');
      link.download = `psc_photo_${photoName || 'applicant'}.jpg`;
      link.href = canvas.toDataURL('image/jpeg', 0.95);
      link.click();
      triggerToast("PSC Photo downloaded!");
    } else {
      if (!sigSource) return;
      // Download signature strictly at standard KPSC 150x100 pixels
      const canvas = document.createElement('canvas');
      canvas.width = 150;
      canvas.height = 100;
      const ctx = canvas.getContext('2d');

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, 150, 100);

      if (sigImgEl) {
        ctx.save();
        // Scale offset to 150x100 grid (our preview canvas was 300x200, so half values)
        const cX = 75 + sigOffset.x / 2;
        const cY = 50 + sigOffset.y / 2;
        ctx.translate(cX, cY);
        ctx.rotate((sigRotation * Math.PI) / 180);

        const drawW = sigImgEl.naturalWidth * (sigScale / 2);
        const drawH = sigImgEl.naturalHeight * (sigScale / 2);

        ctx.drawImage(sigImgEl, -drawW / 2, -drawH / 2, drawW, drawH);
        ctx.restore();
      }

      const link = document.createElement('a');
      link.download = `psc_signature.jpg`;
      link.href = canvas.toDataURL('image/jpeg', 0.95);
      link.click();
      triggerToast("PSC Signature downloaded!");
    }
  };

  // --- RESET ACTIONS ---
  const handleReset = () => {
    if (activeTab === TAB_PHOTO) {
      setPhotoSource(null);
      setPhotoImgEl(null);
      setPhotoName('');
      setPhotoDate('');
      setPhotoNameFontSize(14);
      setPhotoDateFontSize(12);
      setPhotoScale(0.8);
      setPhotoOffset({ x: 0, y: 0 });
      setPhotoFileName('');
    } else {
      setSigSource(null);
      setSigImgEl(null);
      setSigScale(0.8);
      setSigOffset({ x: 0, y: 0 });
      setSigRotation(0);
      setSigFileName('');
    }
    triggerToast("Canvas reset!");
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-base)', color: 'var(--text-primary)', animation: 'fadeIn 0.2s ease', padding: '24px' }}>
      
      {/* Dynamic Tab Selector */}
      <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: '20px' }}>
        <div style={{ display: 'inline-flex', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)', padding: '4px', borderRadius: '8px' }}>
          <button 
            onClick={() => setActiveTab(TAB_PHOTO)}
            style={{
              padding: '8px 18px',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: activeTab === TAB_PHOTO ? 'var(--primary)' : 'transparent',
              color: activeTab === TAB_PHOTO ? '#ffffff' : 'var(--text-secondary)',
              fontWeight: '700',
              fontSize: '13px',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            PSC Photo
          </button>
          <button 
            onClick={() => setActiveTab(TAB_SIG)}
            style={{
              padding: '8px 18px',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: activeTab === TAB_SIG ? 'var(--primary)' : 'transparent',
              color: activeTab === TAB_SIG ? '#ffffff' : 'var(--text-secondary)',
              fontWeight: '700',
              fontSize: '13px',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            PSC Signature
          </button>
        </div>
      </div>

      {/* RENDER TAB 1: PSC PHOTO VIEW */}
      {activeTab === TAB_PHOTO && (
        <div className="resizer-upload-grid" style={{ gap: '24px', alignItems: 'stretch' }}>
          
          {/* LEFT SIDE: Preview & Instructions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Canvas Preview Card */}
            <div 
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderRadius: '16px',
                border: '1.5px solid var(--border)',
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                boxShadow: 'var(--shadow-lg)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', marginBottom: '14px', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                  PSC Photo Preview
                </span>
                
                {/* Zoom buttons */}
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button 
                    onClick={() => handleZoom('in')} 
                    style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: 'var(--bg-base)', border: '1px solid var(--border)', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                  >
                    <ZoomIn size={14} />
                  </button>
                  <button 
                    onClick={() => handleZoom('out')} 
                    style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: 'var(--bg-base)', border: '1px solid var(--border)', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                  >
                    <ZoomOut size={14} />
                  </button>
                </div>
              </div>

              {/* Dotted border workspace wrapper */}
              <div 
                onWheel={handleWheel}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                style={{
                  border: '2px dashed var(--border)',
                  padding: '16px',
                  borderRadius: '12px',
                  backgroundColor: 'var(--bg-base)',
                  cursor: isDragging ? 'grabbing' : 'grab',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.3)',
                  marginBottom: '10px'
                }}
              >
                <canvas 
                  ref={photoCanvasRef} 
                  style={{
                    width: '200px',
                    height: '257px', // scaled display of 350x450
                    borderRadius: '4px',
                    display: 'block',
                    backgroundColor: '#ffffff',
                    boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
                  }}
                />
              </div>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                Standard Aspect Ratio (3.5cm x 4.5cm)
              </span>
            </div>

            {/* Instructions */}
            <div 
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderRadius: '12px',
                border: '1px solid var(--border)',
                padding: '16px 20px',
                fontSize: '12.5px',
                color: 'var(--text-secondary)',
                lineHeight: '1.6'
              }}
            >
              <h5 style={{ fontWeight: '800', display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-primary)', margin: '0 0 8px 0' }}>
                <HelpCircle size={15} style={{ color: 'var(--primary)' }} />
                Instructions
              </h5>
              <ul style={{ margin: 0, paddingLeft: '18px' }}>
                <li>Use the <strong>mouse wheel</strong> to zoom in or out of the photo.</li>
                <li><strong>Click and drag</strong> the image to position the head correctly.</li>
                <li>Ensure the head and shoulders are clearly visible within the frame.</li>
              </ul>
            </div>
          </div>

          {/* RIGHT SIDE: Photo creation form */}
          <div 
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderRadius: '16px',
              border: '1.5px solid var(--border)',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxShadow: 'var(--shadow-lg)'
            }}
          >
            <div>
              <h2 style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text-primary)', margin: '0 0 4px 0' }}>
                Create PSC Photo
              </h2>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '0 0 20px 0' }}>
                Personalize and optimize your official identification photo in seconds.
              </p>

              {/* File Upload Box */}
              <div className="form-group" style={{ marginBottom: '18px' }}>
                <label className="form-label" style={{ fontSize: '10.5px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                  Upload Original Photo
                </label>
                {!photoSource ? (
                  <div 
                    onClick={() => photoInputRef.current.click()}
                    style={{
                      border: '2px dashed var(--border)',
                      borderRadius: '8px',
                      height: '110px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      gap: '8px',
                      backgroundColor: 'var(--bg-base)',
                      marginTop: '6px'
                    }}
                  >
                    <Upload size={22} style={{ color: 'var(--primary)' }} />
                    <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)' }}>
                      Click to select or drag and drop
                    </span>
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', border: '1px solid var(--border)', borderRadius: '8px', padding: '10px 14px', backgroundColor: 'var(--bg-base)', marginTop: '6px' }}>
                    <div style={{ width: '40px', height: '50px', borderRadius: '4px', overflow: 'hidden', border: '1px solid var(--border)' }}>
                      <img src={photoSource} alt="Source" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                    <div>
                      <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-primary)', display: 'block', maxWidth: '220px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {photoFileName}
                      </span>
                      <button 
                        onClick={() => photoInputRef.current.click()}
                        style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: '11px', fontWeight: '700', cursor: 'pointer', padding: 0, textDecoration: 'underline' }}
                      >
                        Select another one
                      </button>
                    </div>
                  </div>
                )}
                <input ref={photoInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePhotoUpload} />
              </div>

              {/* Name & Date Inputs Row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '18px' }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '10.5px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                    Name of Applicant
                  </label>
                  <input 
                    className="form-input" 
                    placeholder="Enter full name" 
                    value={photoName} 
                    onChange={(e) => setPhotoName(e.target.value)} 
                    style={{ height: '38px', fontSize: '13px' }}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '10.5px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                    Photo Taken Date
                  </label>
                  <input 
                    className="form-input" 
                    placeholder="DD-MM-YYYY" 
                    value={photoDate} 
                    onChange={(e) => setPhotoDate(e.target.value)} 
                    style={{ height: '38px', fontSize: '13px' }}
                  />
                </div>
              </div>

              {/* Sliders for Font Sizes */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: '800', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    <span>NAME FONT SIZE</span>
                    <span>{photoNameFontSize}px</span>
                  </div>
                  <input 
                    type="range"
                    min="10"
                    max="22"
                    value={photoNameFontSize}
                    onChange={(e) => setPhotoNameFontSize(parseInt(e.target.value))}
                    style={{ width: '100%', cursor: 'pointer', accentColor: 'var(--primary)' }}
                  />
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: '800', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    <span>DATE FONT SIZE</span>
                    <span>{photoDateFontSize}px</span>
                  </div>
                  <input 
                    type="range"
                    min="8"
                    max="18"
                    value={photoDateFontSize}
                    onChange={(e) => setPhotoDateFontSize(parseInt(e.target.value))}
                    style={{ width: '100%', cursor: 'pointer', accentColor: 'var(--primary)' }}
                  />
                </div>
              </div>

            </div>

            {/* Bottom Actions Row */}
            <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
              <button 
                onClick={handleDownload}
                disabled={!photoSource}
                style={{
                  flex: 1,
                  backgroundColor: photoSource ? 'var(--primary)' : 'var(--border)',
                  color: '#ffffff',
                  padding: '12px',
                  borderRadius: '8px',
                  fontWeight: '700',
                  fontSize: '13px',
                  border: 'none',
                  cursor: photoSource ? 'pointer' : 'default',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  opacity: photoSource ? 1 : 0.6
                }}
              >
                <Download size={15} />
                Download Processed Photo
              </button>
              <button 
                onClick={handleReset}
                style={{
                  width: '100px',
                  backgroundColor: 'transparent',
                  border: '1px solid var(--border)',
                  color: 'var(--text-primary)',
                  borderRadius: '8px',
                  fontWeight: '700',
                  fontSize: '13px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <RefreshCw size={14} />
                Reset
              </button>
            </div>

          </div>

        </div>
      )}

      {/* RENDER TAB 2: PSC SIGNATURE VIEW */}
      {activeTab === TAB_SIG && (
        <div className="resizer-upload-grid" style={{ gap: '24px', alignItems: 'stretch' }}>
          
          {/* LEFT SIDE: Preview, Signature Controls & Malayalam Instructions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Signature Preview Card */}
            <div 
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderRadius: '16px',
                border: '1.5px solid var(--border)',
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                boxShadow: 'var(--shadow-lg)'
              }}
            >
              <div style={{ alignSelf: 'flex-start', fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '14px' }}>
                PSC Signature Preview
              </div>

              {/* Green placement border block */}
              <div 
                onWheel={handleWheel}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                style={{
                  border: '2px dashed #10b981',
                  padding: '16px',
                  borderRadius: '12px',
                  backgroundColor: 'var(--bg-base)',
                  cursor: isDragging ? 'grabbing' : 'grab',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                  boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.3)',
                  width: '100%',
                  maxWidth: '340px',
                  marginBottom: '16px'
                }}
              >
                <canvas 
                  ref={sigCanvasRef} 
                  style={{
                    width: '300px',
                    height: '200px', // double display size of 150x100
                    borderRadius: '4px',
                    display: 'block',
                    backgroundColor: '#ffffff',
                    boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
                  }}
                />
              </div>

              {/* Toolbar Actions Bar (Zoom and Rotate) */}
              <div 
                style={{
                  display: 'flex',
                  gap: '12px',
                  backgroundColor: 'var(--bg-base)',
                  border: '1px solid var(--border)',
                  padding: '6px 14px',
                  borderRadius: '30px',
                  boxShadow: 'var(--shadow-sm)'
                }}
              >
                <button 
                  onClick={() => handleZoom('in')} 
                  title="Zoom In"
                  style={{ background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                >
                  <ZoomIn size={16} />
                </button>
                <button 
                  onClick={() => handleZoom('out')} 
                  title="Zoom Out"
                  style={{ background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                >
                  <ZoomOut size={16} />
                </button>
                <span style={{ color: 'var(--border)' }}>|</span>
                <button 
                  onClick={() => setSigRotation(r => (r - 90) % 360)} 
                  title="Rotate Left"
                  style={{ background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                >
                  <RotateCcw size={16} />
                </button>
                <button 
                  onClick={() => setSigRotation(r => (r + 90) % 360)} 
                  title="Rotate Right"
                  style={{ background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                >
                  <RotateCw size={16} />
                </button>
              </div>
            </div>

            {/* Bilingual Malayalam Instructions */}
            <div 
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderRadius: '12px',
                border: '1px solid var(--border)',
                padding: '16px 20px',
                fontSize: '12.5px',
                color: 'var(--text-secondary)',
                lineHeight: '1.6'
              }}
            >
              <h5 style={{ fontWeight: '800', display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-primary)', margin: '0 0 8px 0' }}>
                <HelpCircle size={15} style={{ color: 'var(--primary)' }} />
                Editor Instructions
              </h5>
              <p style={{ margin: '0 0 6px 0' }}>
                Upload your signature image below. Use your <strong>mouse wheel</strong> to zoom in/out and <strong>drag the image</strong> to position it perfectly within the frame.
              </p>
              <p style={{ margin: 0, fontStyle: 'italic', color: 'var(--primary)' }}>
                മലയാളം: മൗസ് വീൽ ഉപയോഗിച്ച് സൂം ചെയ്യാം, മൗസ് ഉപയോഗിച്ച് ഡ്രാഗ് ചെയ്ത് കൃത്യമായി ഫിറ്റ് ചെയ്യാം.
              </p>
            </div>
          </div>

          {/* RIGHT SIDE: Signature settings and KPSC specifications */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Upload & Action Card */}
            <div 
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderRadius: '16px',
                border: '1.5px solid var(--border)',
                padding: '24px',
                boxShadow: 'var(--shadow-lg)'
              }}
            >
              <h4 style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '14px', letterSpacing: '0.5px' }}>
                Choose Signature Photo
              </h4>

              {/* Uploader */}
              <div className="form-group" style={{ marginBottom: '18px' }}>
                {!sigSource ? (
                  <div 
                    onClick={() => sigInputRef.current.click()}
                    style={{
                      border: '2px dashed var(--border)',
                      borderRadius: '8px',
                      height: '110px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      gap: '8px',
                      backgroundColor: 'var(--bg-base)',
                      padding: '16px',
                      textAlign: 'center'
                    }}
                  >
                    <Upload size={22} style={{ color: 'var(--primary)' }} />
                    <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)' }}>
                      Upload a signature image
                    </span>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                      PNG, JPG or JPEG (Max. 500KB)
                    </span>
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', border: '1px solid var(--border)', borderRadius: '8px', padding: '10px 14px', backgroundColor: 'var(--bg-base)' }}>
                    <div style={{ width: '50px', height: '35px', borderRadius: '4px', overflow: 'hidden', border: '1px solid var(--border)', backgroundColor: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <img src={sigSource} alt="Sig Source" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                    </div>
                    <div>
                      <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-primary)', display: 'block', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {sigFileName}
                      </span>
                      <button 
                        onClick={() => sigInputRef.current.click()}
                        style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: '11px', fontWeight: '700', cursor: 'pointer', padding: 0, textDecoration: 'underline' }}
                      >
                        Select another one
                      </button>
                    </div>
                  </div>
                )}
                <input ref={sigInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleSigUpload} />
              </div>

              {/* Signature Download Action */}
              <button 
                onClick={handleDownload}
                disabled={!sigSource}
                style={{
                  width: '100%',
                  backgroundColor: sigSource ? '#10b981' : 'var(--border)',
                  color: '#ffffff',
                  padding: '12px',
                  borderRadius: '8px',
                  fontWeight: '700',
                  fontSize: '13px',
                  border: 'none',
                  cursor: sigSource ? 'pointer' : 'default',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  marginBottom: '12px',
                  opacity: sigSource ? 1 : 0.6
                }}
              >
                <Download size={15} />
                Download Signature
              </button>

              <button 
                onClick={handleReset}
                style={{
                  width: '100%',
                  backgroundColor: 'transparent',
                  border: '1px solid var(--border)',
                  color: 'var(--text-primary)',
                  borderRadius: '8px',
                  padding: '10px',
                  fontWeight: '700',
                  fontSize: '12.5px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <RefreshCw size={13} />
                Reset Canvas
              </button>
            </div>

            {/* KPSC Specifications */}
            <div 
              style={{
                backgroundColor: 'rgba(15, 23, 42, 0.4)',
                border: '1.5px solid var(--border)',
                borderRadius: '16px',
                padding: '16px 20px',
                boxShadow: 'var(--shadow-md)'
              }}
            >
              <h5 style={{ fontWeight: '800', color: 'var(--text-primary)', fontSize: '12px', textTransform: 'uppercase', margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Sparkles size={13} style={{ color: 'var(--primary)' }} />
                KPSC Specifications
              </h5>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12.5px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Dimensions:</span>
                  <span style={{ fontWeight: '700' }}>150 x 100 pixels</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Resolution:</span>
                  <span style={{ fontWeight: '700' }}>200 DPI</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>File Size:</span>
                  <span style={{ fontWeight: '700' }}>Below 30 KB</span>
                </div>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* Floating success toast */}
      {toastMsg && (
        <div 
          style={{
            position: 'fixed',
            bottom: '24px',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: 'var(--primary)',
            color: 'var(--bg-base)',
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

    </div>
  );
}
