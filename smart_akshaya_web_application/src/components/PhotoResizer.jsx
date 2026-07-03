import React, { useState, useRef, useEffect } from 'react';
import { Upload, Download, RefreshCw, ZoomIn, Move, RotateCw, X, Check, ArrowLeft, Image as ImageIcon, Sliders, ChevronRight, HelpCircle, Link as LinkIcon, RotateCcw } from 'lucide-react';

export default function PhotoResizer({ onEditorStateChange }) {
  const [activeTab, setActiveTab] = useState('photo'); // 'photo' or 'signature'
  const [sourceImage, setSourceImage] = useState(null);
  const [originalImgElement, setOriginalImgElement] = useState(null);
  const [fileName, setFileName] = useState('image.jpg');
  const [originalResolution, setOriginalResolution] = useState('1200 x 1600 px');

  // Dimensions & Unit
  const [width, setWidth] = useState('150');
  const [height, setHeight] = useState('200');
  const [unit, setUnit] = useState('px'); // px, cm

  // File size limits in KB
  const [minSize, setMinSize] = useState('15');
  const [maxSize, setMaxSize] = useState('30');

  // Cropping & Transform states
  const [zoom, setZoom] = useState(1.0); // 0.2 to 4.0
  const [panX, setPanX] = useState(0);   // in px
  const [panY, setPanY] = useState(0);   // in px
  const [rotation, setRotation] = useState(0); // 0, 90, 180, 270

  // Interactive drag states
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [dragActive, setDragActive] = useState(false);

  const [estimatedSize, setEstimatedSize] = useState(0); // in KB
  const [compressionResult, setCompressionResult] = useState(null); // Blob
  const [touchStartDist, setTouchStartDist] = useState(0);
  const [toastMsg, setToastMsg] = useState('');

  const previewCanvasRef = useRef(null);
  const canvasContainerRef = useRef(null);
  const fileInputRef = useRef(null);

  // Notify parent component of editing state to hide/show main sidebar
  useEffect(() => {
    if (onEditorStateChange) {
      onEditorStateChange(!!sourceImage);
    }
  }, [sourceImage, onEditorStateChange]);

  // Set default dimensions on tab change
  useEffect(() => {
    if (activeTab === 'photo') {
      setWidth('150');
      setHeight('200');
      setMinSize('15');
      setMaxSize('30');
      setUnit('px');
    } else {
      setWidth('150');
      setHeight('100');
      setMinSize('10');
      setMaxSize('20');
      setUnit('px');
    }
  }, [activeTab]);

  // Process file upload helper
  const processFile = (file) => {
    if (!file) return;
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        setOriginalResolution(`${img.width} x ${img.height} px`);
        setSourceImage(event.target.result);
        setOriginalImgElement(img);

        // Reset transforms
        setZoom(1.0);
        setPanX(0);
        setPanY(0);
        setRotation(0);
        setCompressionResult(null);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    processFile(file);
  };

  // Drag and drop event handlers
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  // Add Wheel Event Listener for Zoom inside image
  useEffect(() => {
    const container = canvasContainerRef.current;
    if (!container) return;

    const handleWheel = (e) => {
      e.preventDefault();
      const zoomFactor = 0.05;
      if (e.deltaY < 0) {
        setZoom((prev) => Math.min(prev + zoomFactor, 4.0));
      } else {
        setZoom((prev) => Math.max(prev - zoomFactor, 0.2));
      }
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      container.removeEventListener('wheel', handleWheel);
    };
  }, [sourceImage]);

  // Redraw canvas preview
  useEffect(() => {
    if (!previewCanvasRef.current || !originalImgElement) return;

    const canvas = previewCanvasRef.current;
    const ctx = canvas.getContext('2d');

    const wVal = parseFloat(width) || 150;
    const hVal = parseFloat(height) || 200;
    const aspectRatio = wVal / hVal;

    // Set dynamic viewport aspect ratio centered
    canvas.width = 460;
    canvas.height = 460;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Calculate crop boundary inside 460x460
    let cropW = 340;
    let cropH = 340 / aspectRatio;
    if (cropH > 340) {
      cropH = 340;
      cropW = 340 * aspectRatio;
    }

    const cropX = (canvas.width - cropW) / 2;
    const cropY = (canvas.height - cropH) / 2;

    ctx.save();

    // Background style
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Apply transforms and draw image
    ctx.save();
    ctx.translate(canvas.width / 2 + panX, canvas.height / 2 + panY);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(zoom, zoom);

    const imgRatio = originalImgElement.width / originalImgElement.height;
    let drawW = cropW;
    let drawH = cropW / imgRatio;
    if (drawH < cropH) {
      drawH = cropH;
      drawW = cropH * imgRatio;
    }

    ctx.drawImage(originalImgElement, -drawW / 2, -drawH / 2, drawW, drawH);
    ctx.restore();

    // Semi-transparent crop boundary overlay
    ctx.fillStyle = 'rgba(10, 15, 30, 0.75)';
    ctx.fillRect(0, 0, canvas.width, cropY); // Top
    ctx.fillRect(0, cropY + cropH, canvas.width, canvas.height - (cropY + cropH)); // Bottom
    ctx.fillRect(0, cropY, cropX, cropH); // Left
    ctx.fillRect(cropX + cropW, cropY, canvas.width - (cropX + cropW), cropH); // Right

    // Bounding border
    ctx.strokeStyle = '#2563eb';
    ctx.lineWidth = 2.5;
    ctx.strokeRect(cropX, cropY, cropW, cropH);

    // Bounding corners white points
    ctx.fillStyle = '#ffffff';
    const cornerSize = 8;
    ctx.fillRect(cropX - 4, cropY - 4, cornerSize, cornerSize);
    ctx.fillRect(cropX + cropW - 4, cropY - 4, cornerSize, cornerSize);
    ctx.fillRect(cropX - 4, cropY + cropH - 4, cornerSize, cornerSize);
    ctx.fillRect(cropX + cropW - 4, cropY + cropH - 4, cornerSize, cornerSize);

    // Grid rule of thirds lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cropX + cropW / 3, cropY);
    ctx.lineTo(cropX + cropW / 3, cropY + cropH);
    ctx.moveTo(cropX + (cropW * 2) / 3, cropY);
    ctx.lineTo(cropX + (cropW * 2) / 3, cropY + cropH);
    ctx.moveTo(cropX, cropY + cropH / 3);
    ctx.lineTo(cropX + cropW, cropY + cropH / 3);
    ctx.moveTo(cropX, cropY + (cropH * 2) / 3);
    ctx.lineTo(cropX + cropW, cropY + (cropH * 2) / 3);
    ctx.stroke();

    ctx.restore();

    // Estimated Size evaluation
    const timer = setTimeout(evaluateFileSize, 200);
    return () => clearTimeout(timer);
  }, [originalImgElement, width, height, unit, zoom, panX, panY, rotation, minSize, maxSize]);

  const evaluateFileSize = async () => {
    if (!originalImgElement) return;

    const wVal = parseFloat(width) || 150;
    const hVal = parseFloat(height) || 200;

    const targetWidth = unit === 'cm' ? Math.round(wVal * 118.11) : Math.round(wVal);
    const targetHeight = unit === 'cm' ? Math.round(hVal * 118.11) : Math.round(hVal);

    const offscreen = document.createElement('canvas');
    offscreen.width = targetWidth;
    offscreen.height = targetHeight;
    const ctx = offscreen.getContext('2d');

    const previewAspectRatio = wVal / hVal;
    let cropW = 340;
    let cropH = 340 / previewAspectRatio;
    if (cropH > 340) {
      cropH = 340;
      cropW = 340 * previewAspectRatio;
    }
    const scaleFactor = targetWidth / cropW;

    ctx.save();
    ctx.fillStyle = '#ffffff'; // White background for JPEG
    ctx.fillRect(0, 0, targetWidth, targetHeight);

    ctx.translate(targetWidth / 2 + panX * scaleFactor, targetHeight / 2 + panY * scaleFactor);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(zoom * scaleFactor, zoom * scaleFactor);

    const imgRatio = originalImgElement.width / originalImgElement.height;
    let drawW = cropW;
    let drawH = cropW / imgRatio;
    if (drawH < cropH) {
      drawH = cropH;
      drawW = cropH * imgRatio;
    }

    ctx.drawImage(originalImgElement, -drawW / 2, -drawH / 2, drawW, drawH);
    ctx.restore();

    const maxKb = parseFloat(maxSize) || 30;
    const maxBytes = maxKb * 1024;

    let finalBlob = null;
    let finalSize = 0;

    for (let q = 0.95; q >= 0.05; q -= 0.05) {
      const blob = await new Promise(resolve => offscreen.toBlob(resolve, 'image/jpeg', q));
      if (blob) {
        finalSize = blob.size;
        finalBlob = blob;
        if (blob.size <= maxBytes) {
          break;
        }
      }
    }

    if (finalBlob) {
      setEstimatedSize(finalSize / 1024);
      setCompressionResult(finalBlob);
    }
  };

  const handleMouseDown = (e) => {
    if (!sourceImage) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - panX, y: e.clientY - panY });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    setPanX(e.clientX - dragStart.x);
    setPanY(e.clientY - dragStart.y);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const getTouchDistance = (touches) => {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const handleTouchStart = (e) => {
    if (!sourceImage) return;
    if (e.touches.length === 1) {
      setIsDragging(true);
      const touch = e.touches[0];
      setDragStart({ x: touch.clientX - panX, y: touch.clientY - panY });
    } else if (e.touches.length === 2) {
      setIsDragging(false);
      const dist = getTouchDistance(e.touches);
      setTouchStartDist(dist);
    }
  };

  const handleTouchMove = (e) => {
    if (!sourceImage) return;
    if (e.touches.length === 1 && isDragging) {
      const touch = e.touches[0];
      setPanX(touch.clientX - dragStart.x);
      setPanY(touch.clientY - dragStart.y);
    } else if (e.touches.length === 2 && touchStartDist > 0) {
      const dist = getTouchDistance(e.touches);
      const factor = dist / touchStartDist;
      setZoom((prev) => Math.min(Math.max(prev * factor, 0.2), 4.0));
      setTouchStartDist(dist);
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    setTouchStartDist(0);
  };

  const triggerToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 4000);
  };

  const handleSaveImage = async () => {
    if (!compressionResult) return;

    if ('showSaveFilePicker' in window) {
      try {
        const ext = unit === 'cm' ? 'jpg' : 'jpeg';
        const suggestedName = `cropmaster_${activeTab}_${width}x${height}.${ext}`;
        const handle = await window.showSaveFilePicker({
          suggestedName,
          types: [{
            description: 'JPEG Image',
            accept: {
              'image/jpeg': ['.jpg', '.jpeg']
            }
          }]
        });
        const writable = await handle.createWritable();
        await writable.write(compressionResult);
        await writable.close();

        triggerToast('Image saved successfully!');

        // Reset editor view
        setSourceImage(null);
        setOriginalImgElement(null);
      } catch (err) {
        console.warn('File save cancelled or failed:', err);
      }
    } else {
      const url = URL.createObjectURL(compressionResult);
      const link = document.createElement('a');
      link.download = `cropmaster_${activeTab}_${width}x${height}.${unit === 'cm' ? 'jpg' : 'jpeg'}`;
      link.href = url;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 100);

      triggerToast('Image downloaded to your device!');

      // Reset editor view
      setSourceImage(null);
      setOriginalImgElement(null);
    }
  };

  const isSizeOk = estimatedSize >= parseFloat(minSize) && estimatedSize <= parseFloat(maxSize);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-base)', color: 'var(--text-primary)' }}>

      {/* ─── SCREEN 1: UPLOAD STATE ─────────────────────────────────────── */}
      {!sourceImage && (
        <div style={{ flex: 1, padding: '40px 24px', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>

          {/* Header & Back Link */}


          {/* Two-Column Layout */}
          <div className="resizer-upload-grid">

            {/* Left Card: Upload Zone */}
            <div
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderRadius: '16px',
                border: '1.5px solid var(--border)',
                padding: '32px',
                boxShadow: 'var(--shadow-xl)'
              }}
            >
              <h2 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '8px' }}>
                Upload your photo or signature
              </h2>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '24px' }}>
                High-precision cropping starts with a clear source. Select or drag your file below.
              </p>

              {/* Dashed dropzone container */}
              <div
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current.click()}
                style={{
                  width: '100%',
                  height: '240px',
                  border: `2px dashed ${dragActive ? 'var(--primary)' : 'var(--border)'}`,
                  borderRadius: '12px',
                  backgroundColor: dragActive ? 'var(--primary-glow)' : 'var(--bg-base)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  gap: '16px',
                  transition: 'all 0.2s ease',
                  marginBottom: '24px'
                }}
              >
                <div
                  style={{
                    width: '52px',
                    height: '52px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--primary-glow)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--primary)'
                  }}
                >
                  <Upload size={24} />
                </div>
                <div style={{ textAlign: 'center' }}>
                  <h4 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)' }}>
                    Drag & drop or click to browse
                  </h4>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                    Supported formats: JPG, PNG (Max 5MB)
                  </p>
                </div>
              </div>

              {/* Upload Action Row */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px', backgroundColor: 'var(--bg-base)', border: '1px solid var(--border)', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)' }}>
                    📄 JPG
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px', backgroundColor: 'var(--bg-base)', border: '1px solid var(--border)', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)' }}>
                    📄 PNG
                  </span>
                </div>

                <button
                  onClick={() => fileInputRef.current.click()}
                  style={{
                    backgroundColor: 'var(--primary)',
                    color: '#ffffff',
                    padding: '12px 24px',
                    borderRadius: '8px',
                    fontWeight: '700',
                    fontSize: '14px',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    boxShadow: 'var(--shadow-glow)'
                  }}
                >
                  Proceed to Crop
                  <span>→</span>
                </button>
              </div>

            </div>

            {/* Right Side Cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

              {/* Card 1: Checklist Instructions */}
              <div
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  borderRadius: '16px',
                  border: '1.5px solid var(--border)',
                  overflow: 'hidden',
                  boxShadow: 'var(--shadow-md)'
                }}
              >
                <div
                  style={{
                    backgroundColor: '#047857',
                    color: '#ffffff',
                    padding: '16px 20px',
                    fontWeight: '700',
                    fontSize: '15px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <HelpCircle size={16} />
                  Crop and resize {activeTab === 'photo' ? 'Photo' : 'Signature'}
                </div>

                <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {[
                    'റീസൈസ് ചെയ്യേണ്ട (ഫോട്ടോ/ഒപ്പ്) സെലക്ട് ചെയ്യുക',
                    'ആവശ്യമായ Width & Height സെറ്റ് ചെയ്യുക',
                    'ഫോട്ടോയുടെ മിനിമം & മാക്സിമം സൈസ് സെറ്റ് ചെയ്യുക',
                    'ഫോട്ടോ റോട്ടേറ്റ് ചെയ്യേണ്ടതുണ്ടെങ്കിൽ റോട്ടേറ്റ് ബട്ടൺ ഉപയോഗിക്കുക',
                    'സേവ് ബട്ടൺ അമർത്തി ഫോട്ടോ സേവ് ചെയ്യുക'
                  ].map((inst, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                      <div style={{
                        width: '18px', height: '18px', borderRadius: '4px',
                        backgroundColor: 'rgba(4, 120, 87, 0.08)', border: '1px solid #047857',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#047857', fontSize: '10px', fontWeight: 'bold', marginTop: '2px', flexShrink: 0
                      }}>✓</div>
                      <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: '600', lineHeight: 1.3 }}>
                        {inst}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Card 2: Quick switch link card */}


              {/* Card 3: Soft Auto Crop Indicator */}


            </div>

          </div>

        </div>
      )}

      {/* ─── SCREEN 2: CROP EDITOR STATE ───────────────────────────────── */}
      {sourceImage && (
        <div className="resizer-editor-grid">

          {/* LEFT AREA: Canvas, title, grid */}
          {/* LEFT AREA: Canvas, title, grid */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              padding: '24px',
              position: 'relative',
              background: 'radial-gradient(circle, var(--bg-surface) 0%, var(--bg-base) 100%)',
              height: '100%'
            }}
          >

            {/* Top Workspace Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', zIndex: 10 }}>
              <button
                onClick={() => {
                  setSourceImage(null);
                  setOriginalImgElement(null);
                }}
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--bg-surface)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
              >
                <ArrowLeft size={16} />
              </button>
              <span style={{ color: 'var(--text-primary)', fontWeight: '700', fontSize: '14px' }}>
                Edit: {fileName}
              </span>
            </div>

            {/* Resolution and DPI Pill Info */}
            <div
              style={{
                alignSelf: 'center',
                backgroundColor: 'var(--bg-surface)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border)',
                padding: '10px 24px',
                borderRadius: '9999px',
                fontSize: '13px',
                fontWeight: '700',
                boxShadow: 'var(--shadow-md)',
                display: 'flex',
                gap: '12px',
                zIndex: 10,
                marginTop: '16px',
                marginBottom: '16px'
              }}
            >
              <span>Resolution: {originalResolution}</span>
              <span style={{ color: 'var(--border)' }}>|</span>
              <span>DPI: 300</span>
            </div>

            {/* Centered Canvas Wrapper */}
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
              {/* Centered Canvas Container with Mouse Zoom & Move */}
              <div
                ref={canvasContainerRef}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                className="resizer-canvas-container"
                style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
              >
                <canvas
                  ref={previewCanvasRef}
                  style={{ display: 'block', width: '100%', height: '100%' }}
                />
              </div>
            </div>

          </div>

          {/* RIGHT SIDEBAR: Controls panel */}
          <div
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderLeft: '1px solid var(--border)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              height: '100%'
            }}
          >
            {/* Top controls section */}
            <div style={{ padding: '24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '24px' }}>

              {/* Sidebar Header progress */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', color: 'var(--primary)', marginBottom: '8px', letterSpacing: '0.5px' }}>
                  <span>Step 3 of 3</span>
                  <span>Finalizing</span>
                </div>
                {/* Blue custom progress bar */}
                <div style={{ width: '100%', height: '4px', backgroundColor: 'var(--bg-base)', borderRadius: '2px', overflow: 'hidden' }}>
                  <div style={{ width: '95%', height: '100%', backgroundColor: 'var(--primary)' }} />
                </div>
                <h3 style={{ fontSize: '16px', fontWeight: '800', color: 'var(--text-primary)', marginTop: '16px' }}>
                  Fine-Tuning & Export
                </h3>
              </div>

              {/* TRANSFORM SECTION */}
              <div>
                <h4 style={{ fontSize: '11.5px', fontWeight: '800', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '12px', letterSpacing: '0.5px' }}>
                  Transform
                </h4>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    onClick={() => setRotation((prev) => (prev + 90) % 360)}
                    style={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      padding: '10px 16px',
                      borderRadius: '8px',
                      border: '1px solid var(--border)',
                      backgroundColor: 'var(--bg-base)',
                      color: 'var(--text-primary)',
                      fontWeight: '700',
                      fontSize: '12.5px',
                      cursor: 'pointer'
                    }}
                  >
                    <RotateCw size={14} />
                    Rotate 90°
                  </button>

                  <button
                    onClick={() => {
                      setRotation(0);
                      setZoom(1.0);
                      setPanX(0);
                      setPanY(0);
                    }}
                    style={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      padding: '10px 16px',
                      borderRadius: '8px',
                      border: '1px solid var(--border)',
                      backgroundColor: 'var(--bg-base)',
                      color: 'var(--text-primary)',
                      fontWeight: '700',
                      fontSize: '12.5px',
                      cursor: 'pointer'
                    }}
                  >
                    <RotateCcw size={14} />
                    Reset All
                  </button>
                </div>
              </div>

              {/* ZOOM & ROTATE SLIDER */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', fontWeight: '800', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '8px', letterSpacing: '0.5px' }}>
                  <span>Zoom Level</span>
                  <span style={{ color: 'var(--primary)' }}>{Math.round(zoom * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.2"
                  max="4.0"
                  step="0.05"
                  value={zoom}
                  onChange={(e) => setZoom(parseFloat(e.target.value))}
                  style={{ width: '100%', height: '6px', cursor: 'pointer', accentColor: 'var(--primary)' }}
                />

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', fontWeight: '800', textTransform: 'uppercase', color: 'var(--text-secondary)', marginTop: '16px', marginBottom: '8px', letterSpacing: '0.5px' }}>
                  <span>Custom Rotation</span>
                  <span style={{ color: 'var(--primary)' }}>{rotation}°</span>
                </div>
                <input
                  type="range"
                  min="-180"
                  max="180"
                  step="1"
                  value={rotation}
                  onChange={(e) => setRotation(parseInt(e.target.value))}
                  style={{ width: '100%', height: '6px', cursor: 'pointer', accentColor: 'var(--primary)' }}
                />
              </div>

              {/* DIMENSIONS */}
              <div>
                <h4 style={{ fontSize: '11.5px', fontWeight: '800', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '12px', letterSpacing: '0.5px' }}>
                  Dimensions
                </h4>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ flex: 1 }}>
                    <span style={{ fontSize: '9px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Width</span>
                    <input
                      type="number"
                      value={width}
                      onChange={(e) => setWidth(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        backgroundColor: 'var(--bg-base)',
                        border: '1px solid var(--border)',
                        borderRadius: '8px',
                        fontSize: '13px',
                        fontWeight: '700',
                        color: 'var(--text-primary)'
                      }}
                    />
                  </div>

                  <LinkIcon size={14} style={{ color: 'var(--text-muted)', marginTop: '12px' }} />

                  <div style={{ flex: 1 }}>
                    <span style={{ fontSize: '9px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Height</span>
                    <input
                      type="number"
                      value={height}
                      onChange={(e) => setHeight(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        backgroundColor: 'var(--bg-base)',
                        border: '1px solid var(--border)',
                        borderRadius: '8px',
                        fontSize: '13px',
                        fontWeight: '700',
                        color: 'var(--text-primary)'
                      }}
                    />
                  </div>

                  <div style={{ width: '80px' }}>
                    <span style={{ fontSize: '9px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Unit</span>
                    <select
                      value={unit}
                      onChange={(e) => setUnit(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 10px',
                        backgroundColor: 'var(--bg-base)',
                        border: '1px solid var(--border)',
                        borderRadius: '8px',
                        fontSize: '13px',
                        fontWeight: '700',
                        color: 'var(--text-primary)',
                        height: '38px'
                      }}
                    >
                      <option value="px">px</option>
                      <option value="cm">cm</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* FILE CONSTRAINTS */}
              <div>
                <h4 style={{ fontSize: '11.5px', fontWeight: '800', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '12px', letterSpacing: '0.5px' }}>
                  File Constraints
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div style={{ border: '1px solid var(--border)', backgroundColor: 'var(--bg-base)', borderRadius: '12px', padding: '12px', display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '9px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>Minimum (KB)</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>📥</span>
                      <input
                        type="number"
                        value={minSize}
                        onChange={(e) => setMinSize(e.target.value)}
                        style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontSize: '18px', fontWeight: '800', color: 'var(--text-primary)' }}
                      />
                    </div>
                  </div>

                  <div style={{ border: '1px solid var(--border)', backgroundColor: 'var(--bg-base)', borderRadius: '12px', padding: '12px', display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '9px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>Maximum (KB)</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>📤</span>
                      <input
                        type="number"
                        value={maxSize}
                        onChange={(e) => setMaxSize(e.target.value)}
                        style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontSize: '18px', fontWeight: '800', color: 'var(--text-primary)' }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Output size stat display */}
              <div
                style={{
                  padding: '12px 16px',
                  borderRadius: '8px',
                  backgroundColor: isSizeOk ? 'rgba(16, 185, 129, 0.05)' : 'rgba(239, 68, 68, 0.05)',
                  border: `1px solid ${isSizeOk ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginTop: 'auto'
                }}
              >
                <div>
                  <span style={{ fontSize: '11px', color: isSizeOk ? '#16a34a' : '#dc2626', fontWeight: '700', textTransform: 'uppercase' }}>Estimated Size</span>
                  <div style={{ fontSize: '16px', fontWeight: '800', color: 'var(--text-primary)' }}>{estimatedSize.toFixed(1)} KB</div>
                </div>
                <div style={{ fontSize: '20px' }}>
                  {isSizeOk ? '✅' : '❌'}
                </div>
              </div>

            </div>

            {/* Bottom Actions */}
            <div style={{ padding: '24px', borderTop: '1px solid var(--border)', display: 'flex', gap: '12px' }}>
              <button
                onClick={handleSaveImage}
                disabled={!compressionResult}
                style={{
                  flex: 1,
                  backgroundColor: 'var(--primary)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '10px',
                  fontWeight: '700',
                  fontSize: '14px',
                  height: '48px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  opacity: compressionResult ? 1 : 0.6
                }}
              >
                <Check size={16} />
                Save Image
              </button>

              <button
                onClick={() => {
                  setSourceImage(null);
                  setOriginalImgElement(null);
                }}
                style={{
                  width: '48px',
                  height: '48px',
                  backgroundColor: '#dc2626',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
              >
                <X size={16} />
              </button>
            </div>

          </div>

        </div>
      )}

      {/* Hidden input file element */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept="image/*"
        style={{ display: 'none' }}
      />

      {/* FOOTER */}
      <footer
        style={{
          backgroundColor: 'var(--bg-base)',
          borderTop: '1px solid var(--border)',
          padding: '16px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '12px',
          color: 'var(--text-muted)'
        }}
      >
        <span><strong>CropMaster Pro</strong> — Precise editing for professionals.</span>
        <span>© 2026 CropMaster Pro. All rights reserved.</span>
      </footer>

      {/* Toast Alert Feedback Overlay */}
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
