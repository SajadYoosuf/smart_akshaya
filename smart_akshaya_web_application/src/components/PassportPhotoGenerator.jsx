import React, { useState, useRef, useEffect } from 'react';
import { Upload, Download, RefreshCw, Sparkles, Sliders, ArrowLeft, Trash2, HelpCircle, Sun, Contrast as ContrastIcon, Droplet, Eye } from 'lucide-react';

export default function PassportPhotoGenerator({ onViewChange }) {
  const [sourceImage, setSourceImage] = useState(null);
  const [fileName, setFileName] = useState('photo.jpg');
  const [paperSize, setPaperSize] = useState('A4'); // A4, 6x4
  const [copies, setCopies] = useState(8);
  const [borderSize, setBorderSize] = useState(5);
  const [bgColor, setBgColor] = useState('#ffffff');

  // Image Adjustments
  const [brightness, setBrightness] = useState(0.0); // -0.5 to 0.5
  const [contrast, setContrast] = useState(1.0);     // 0.5 to 1.5
  const [saturation, setSaturation] = useState(1.0);   // 0.5 to 1.5
  const [hue, setHue] = useState(0);                 // -90 to 90

  // Background Eraser state
  const [isProcessing, setIsProcessing] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  // References
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const [originalImgElement, setOriginalImgElement] = useState(null);

  // Cleaned transparent image
  const [erasedCanvas, setErasedCanvas] = useState(null);

  // Colors list
  const colorPresets = [
    { name: 'White', value: '#ffffff' },
    { name: 'Light Blue', value: '#bfe6ff' },
    { name: 'Blue', value: '#0040ff' },
  ];

  const triggerToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 4000);
  };

  // Upload handler
  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        setSourceImage(event.target.result);
        setOriginalImgElement(img);

        // Reset eraser and adjustments
        setErasedCanvas(null);
        setBrightness(0.0);
        setContrast(1.0);
        setSaturation(1.0);
        setHue(0);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  // Advanced AI Background Removal
  const handleRemoveBackground = async () => {
    if (!sourceImage) return;
    setIsProcessing(true);
    triggerToast("Loading AI model... (the first run may take up to 10 seconds)");

    try {
      const { removeBackground } = await import('@imgly/background-removal');
      const blob = await removeBackground(sourceImage, {
        progress: (key, current, total) => {
          console.log(`[AI Background] ${key}: ${Math.round((current / total) * 100)}%`);
        }
      });
      const url = URL.createObjectURL(blob);

      const img = new Image();
      img.onload = () => {
        setErasedCanvas(img);
        setIsProcessing(false);
        triggerToast("Background removed successfully!");
      };
      img.src = url;
    } catch (error) {
      console.error("Background removal failed:", error);
      triggerToast("AI background removal failed. Verify connection or file.");
      setIsProcessing(false);
    }
  };

  // Render tiled sheet to canvas
  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    // Define pixel sizing based on paper size
    let sheetWidth = 1240;
    let sheetHeight = 1754; // A4 (210mm x 297mm)
    let pxPerMm = 1240 / 210; // ~5.9 px/mm

    if (paperSize === '6x4') {
      sheetWidth = 1200;
      sheetHeight = 800; // 6x4 (152.4mm x 101.6mm)
      pxPerMm = 1200 / 152.4; // ~7.87 px/mm
    }

    canvas.width = sheetWidth;
    canvas.height = sheetHeight;

    // Fill white paper background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, sheetWidth, sheetHeight);

    // Grid margins & spacing optimized for max copies
    const margin = paperSize === '6x4' ? 40 : 50;
    const spacing = paperSize === '6x4' ? 20 : 30;

    // Standard Passport photo: 35mm x 45mm
    // Photo dimensions scale dynamically (A4: smaller, 6x4: larger)
    const photoWidth = Math.round(35 * pxPerMm);
    const photoHeight = Math.round(45 * pxPerMm);

    let currentX = margin;
    let currentY = margin;

    for (let i = 0; i < copies; i++) {
      // Wrap row
      if (currentX + photoWidth > sheetWidth - margin) {
        currentX = margin;
        currentY += photoHeight + spacing;
      }

      // Stop if running out of paper space
      if (currentY + photoHeight > sheetHeight - margin) {
        break;
      }

      ctx.save();

      // 1. Draw photo background color
      ctx.fillStyle = bgColor;
      ctx.fillRect(currentX, currentY, photoWidth, photoHeight);

      // 2. Draw photo with adjustments
      ctx.save();
      const bFilter = `brightness(${100 + brightness * 100}%)`;
      const cFilter = `contrast(${contrast * 100}%)`;
      const sFilter = `saturate(${saturation * 100}%)`;
      const hFilter = `hue-rotate(${hue}deg)`;
      ctx.filter = `${bFilter} ${cFilter} ${sFilter} ${hFilter}`;

      const imgX = currentX + borderSize;
      const imgY = currentY + borderSize;
      const imgW = photoWidth - borderSize * 2;
      const imgH = photoHeight - borderSize * 2;

      const source = erasedCanvas || originalImgElement;
      if (source) {
        ctx.drawImage(source, imgX, imgY, imgW, imgH);
      } else {
        // Placeholder text if no photo is loaded
        ctx.fillStyle = '#cbd5e1';
        ctx.fillRect(imgX, imgY, imgW, imgH);
        ctx.fillStyle = '#64748b';
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('No Photo', imgX + imgW / 2, imgY + imgH / 2);
      }

      ctx.restore();

      // 3. Draw cut outline borders
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 1;
      ctx.strokeRect(currentX, currentY, photoWidth, photoHeight);

      ctx.restore();
      currentX += photoWidth + spacing;
    }

  }, [sourceImage, originalImgElement, erasedCanvas, paperSize, copies, borderSize, bgColor, brightness, contrast, saturation, hue]);

  // Export full sheet
  const handleDownload = () => {
    if (!canvasRef.current || !sourceImage) return;

    const canvas = canvasRef.current;
    const format = bgColor === 'transparent' ? 'image/png' : 'image/jpeg';
    const ext = bgColor === 'transparent' ? 'png' : 'jpg';

    const link = document.createElement('a');
    link.download = `passport_sheet_${paperSize}_${copies}copies.${ext}`;
    link.href = canvas.toDataURL(format, 0.98);
    link.click();

    triggerToast("Print sheet downloaded successfully!");
  };

  return (
    <div style={{ animation: 'fadeIn 0.3s ease', padding: '40px 24px', maxWidth: '1200px', margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
      {/* Hero Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #F43F5E 0%, #BE123C 100%)',
        borderRadius: '24px',
        padding: '32px 40px',
        color: 'white',
        boxShadow: '0 10px 25px rgba(244, 63, 94, 0.3)',
        marginBottom: '32px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <div style={{ fontSize: '32px', fontWeight: '800', letterSpacing: '-0.5px' }}>
            Passport Photo Creator
          </div>
          <div style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '16px', marginTop: '8px' }}>
            Generate and print multi-photo sheets
          </div>
        </div>
        <div style={{ padding: '16px', background: 'rgba(255, 255, 255, 0.2)', borderRadius: '20px' }}>
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"></path><circle cx="12" cy="13" r="3"></circle></svg>
        </div>
      </div>

      {/* Main Workspace Layout */}
      <div className="passport-main-grid">

        {/* LEFT COLUMN: Full Screen Sheet Live Preview (Centered on Dark Grid) */}
        <div className="passport-left-column">
          {/* Top Label Info */}
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', zIndex: 10 }}>
            <span style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.5px' }}>
              Live Preview
            </span>
            <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--primary)' }}>
              {paperSize === 'A4' ? 'A4 Paper (210 x 297 mm)' : '6" x 4" Paper (152 x 102 mm)'}
            </span>
          </div>

          {/* Centered Canvas Container (No black border padding, white sheet fills workspace) */}
          <div className="passport-canvas-wrapper">
            <div
              style={{
                maxWidth: '100%',
                maxHeight: '100%',
                aspectRatio: paperSize === 'A4' ? '210/297' : '1.5',
                borderRadius: '4px',
                overflow: 'hidden',
                boxShadow: 'var(--shadow-xl)',
                border: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#ffffff'
              }}
            >
              <canvas
                ref={canvasRef}
                style={{
                  width: '100%',
                  height: '100%',
                  display: 'block',
                  objectFit: 'contain'
                }}
              />
            </div>
          </div>

          {/* Download Action Bar */}
          <div style={{ display: 'flex', justifyContent: 'center', zIndex: 10 }}>
            <button
              onClick={handleDownload}
              disabled={!sourceImage}
              style={{
                width: '100%',
                maxWidth: '460px',
                backgroundColor: sourceImage ? 'var(--primary)' : 'var(--border)',
                color: '#ffffff',
                padding: '12px 24px',
                borderRadius: '8px',
                fontWeight: '700',
                fontSize: '14px',
                border: 'none',
                cursor: sourceImage ? 'pointer' : 'default',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: sourceImage ? 'var(--shadow-glow)' : 'none',
                opacity: sourceImage ? 1 : 0.6
              }}
            >
              <Download size={18} />
              Download Sheet
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN: Settings Panel (Fits on screen, no scrolling) */}
        <div className="passport-right-column">

          {/* Card 1: Source & Background Remover Combined */}
          <div
            className="glow-card"
            style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #E2E8F0',
              borderRadius: '20px',
              padding: '24px'
            }}
          >
            <h4 style={{ fontSize: '10.5px', fontWeight: '800', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '8px', letterSpacing: '0.5px' }}>
              Initial Source & Background
            </h4>

            {!sourceImage ? (
              <div
                onClick={() => fileInputRef.current.click()}
                style={{
                  border: '2px dashed var(--border)',
                  borderRadius: '8px',
                  height: '90px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  gap: '6px'
                }}
              >
                <Upload size={20} style={{ color: 'var(--primary)' }} />
                <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)' }}>
                  Choose Photo or Drag & Drop
                </span>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', width: '100%', justifyContent: 'center' }}>
                  {/* Small Thumbnail Preview */}
                  <div
                    style={{
                      width: '60px',
                      height: '75px',
                      borderRadius: '6px',
                      overflow: 'hidden',
                      border: '1px solid var(--border)',
                      backgroundColor: bgColor === 'transparent' ? 'transparent' : bgColor,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <img
                      src={erasedCanvas ? erasedCanvas.src : sourceImage}
                      alt="Thumbnail"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </div>

                  <div>
                    <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)', display: 'block', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: '4px' }}>
                      {fileName}
                    </span>
                    <button
                      onClick={() => fileInputRef.current.click()}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--primary)',
                        fontSize: '12px',
                        fontWeight: '700',
                        cursor: 'pointer',
                        padding: 0,
                        textDecoration: 'underline'
                      }}
                    >
                      Select another one
                    </button>
                  </div>
                </div>

                {/* AI Remove Background Button (Full width, highly visible) */}
                <button
                  onClick={handleRemoveBackground}
                  disabled={isProcessing}
                  style={{
                    width: '100%',
                    backgroundColor: isProcessing ? 'var(--border)' : 'var(--bg-surface)',
                    border: '1.5px solid var(--primary)',
                    borderRadius: '8px',
                    padding: '10px 14px',
                    color: isProcessing ? 'var(--text-muted)' : 'var(--primary)',
                    fontWeight: '700',
                    fontSize: '13px',
                    cursor: !isProcessing ? 'pointer' : 'default',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    marginTop: '4px',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={(e) => {
                    if (!isProcessing) {
                      e.currentTarget.style.backgroundColor = 'var(--primary)';
                      e.currentTarget.style.color = '#ffffff';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isProcessing) {
                      e.currentTarget.style.backgroundColor = 'var(--bg-surface)';
                      e.currentTarget.style.color = 'var(--primary)';
                    }
                  }}
                >
                  {isProcessing ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" style={{ color: 'var(--primary)' }} />
                      Removing Background...
                    </>
                  ) : (
                    <>
                      <Sparkles size={14} style={{ color: 'var(--primary)' }} />
                      Remove Background
                    </>
                  )}
                </button>
              </div>
            )}

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageUpload}
              accept="image/*"
              style={{ display: 'none' }}
            />
          </div>

          {/* Card 2: Print Parameters */}
          <div
            className="glow-card"
            style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #E2E8F0',
              borderRadius: '20px',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}
          >
            <h4 style={{ fontSize: '10.5px', fontWeight: '800', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.5px' }}>
              Print Parameters
            </h4>

            {/* Paper Size & Background Selector */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '10px', fontWeight: '800', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                  Paper Size
                </label>
                <select
                  value={paperSize}
                  onChange={(e) => {
                    const val = e.target.value;
                    setPaperSize(val);
                    if (val === 'A4') {
                      setCopies(24);
                    } else if (val === '6x4') {
                      setCopies(8);
                    }
                  }}
                  style={{
                    width: '100%',
                    padding: '8px',
                    backgroundColor: 'var(--bg-base)',
                    border: '1px solid var(--border)',
                    borderRadius: '6px',
                    fontSize: '12.5px',
                    fontWeight: '700',
                    color: 'var(--text-primary)',
                    height: '34px'
                  }}
                >
                  <option value="A4">A4 Paper</option>
                  <option value="6x4">6 x 4 Paper</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '10px', fontWeight: '800', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                  Bg Color
                </label>
                <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                  <input
                    type="color"
                    value={bgColor === 'transparent' ? '#ffffff' : bgColor}
                    onChange={(e) => setBgColor(e.target.value)}
                    style={{
                      width: '32px',
                      height: '32px',
                      border: '1px solid var(--border)',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      padding: 0
                    }}
                  />

                  {/* swatches */}
                  <div style={{ display: 'flex', gap: '3px' }}>
                    {colorPresets.map(col => (
                      <div
                        key={col.value}
                        onClick={() => setBgColor(col.value)}
                        style={{
                          width: '18px',
                          height: '18px',
                          borderRadius: '50%',
                          backgroundColor: col.value,
                          border: `1.5px solid ${bgColor === col.value ? 'var(--primary)' : 'var(--border)'}`,
                          cursor: 'pointer'
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Copies & Border */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '10px', fontWeight: '800', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                  Number of Copies
                </label>
                <input
                  type="number"
                  min="1"
                  max="48"
                  value={copies}
                  onChange={(e) => setCopies(parseInt(e.target.value) || 1)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    backgroundColor: 'var(--bg-base)',
                    border: '1px solid var(--border)',
                    borderRadius: '6px',
                    fontSize: '12.5px',
                    fontWeight: '700',
                    color: 'var(--text-primary)',
                    height: '34px'
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '10px', fontWeight: '800', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                  Border Size (px)
                </label>
                <input
                  type="number"
                  min="0"
                  max="25"
                  value={borderSize}
                  onChange={(e) => setBorderSize(parseInt(e.target.value) || 0)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    backgroundColor: 'var(--bg-base)',
                    border: '1px solid var(--border)',
                    borderRadius: '6px',
                    fontSize: '12.5px',
                    fontWeight: '700',
                    color: 'var(--text-primary)',
                    height: '34px'
                  }}
                />
              </div>
            </div>

          </div>

          {/* Card 3: Fine Tuning Adjustments */}
          <div
            className="glow-card"
            style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #E2E8F0',
              borderRadius: '20px',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}
          >
            <h4 style={{ fontSize: '10.5px', fontWeight: '800', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.5px' }}>
              Fine Tuning Adjustments
            </h4>

            {/* Grid of Sliders for Compact View */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 16px' }}>

              {/* Brightness */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '3px' }}>
                  <span>Brightness</span>
                  <span style={{ color: 'var(--primary)' }}>{Math.round(brightness * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="-0.5"
                  max="0.5"
                  step="0.02"
                  value={brightness}
                  onChange={(e) => setBrightness(parseFloat(e.target.value))}
                  style={{ width: '100%', height: '4px', cursor: 'pointer', accentColor: 'var(--primary)' }}
                />
              </div>

              {/* Contrast */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '3px' }}>
                  <span>Contrast</span>
                  <span style={{ color: 'var(--primary)' }}>{Math.round(contrast * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="1.5"
                  step="0.02"
                  value={contrast}
                  onChange={(e) => setContrast(parseFloat(e.target.value))}
                  style={{ width: '100%', height: '4px', cursor: 'pointer', accentColor: 'var(--primary)' }}
                />
              </div>

              {/* Saturation */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '3px' }}>
                  <span>Saturation</span>
                  <span style={{ color: 'var(--primary)' }}>{Math.round(saturation * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="1.5"
                  step="0.02"
                  value={saturation}
                  onChange={(e) => setSaturation(parseFloat(e.target.value))}
                  style={{ width: '100%', height: '4px', cursor: 'pointer', accentColor: 'var(--primary)' }}
                />
              </div>

              {/* Hue Rotation */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '3px' }}>
                  <span>Hue</span>
                  <span style={{ color: 'var(--primary)' }}>{hue}°</span>
                </div>
                <input
                  type="range"
                  min="-90"
                  max="90"
                  step="1"
                  value={hue}
                  onChange={(e) => setHue(parseInt(e.target.value))}
                  style={{ width: '100%', height: '4px', cursor: 'pointer', accentColor: 'var(--primary)' }}
                />
              </div>

            </div>

          </div>

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
            backgroundColor: 'var(--primary)',
            color: 'var(--bg-base)',
            padding: '12px 24px',
            borderRadius: '8px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
            zIndex: 2000,
            fontSize: '13.5px',
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
