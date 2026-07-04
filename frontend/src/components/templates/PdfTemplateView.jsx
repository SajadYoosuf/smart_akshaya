import React from 'react';

// Converts PyMuPDF 24-bit integer color to CSS RGB color string
function intToHexColor(colorInt) {
  if (colorInt === undefined || colorInt === null) return 'rgb(0, 0, 0)';
  const r = (colorInt >> 16) & 255;
  const g = (colorInt >> 8) & 255;
  const b = colorInt & 255;
  return `rgb(${r}, ${g}, ${b})`;
}

// Maps original text to user form replacement or custom replacement
function getReplacementText(originalText, data) {
  const pdfTemplate = data.pdfTemplate || {};
  const { candidates = {}, customReplacements = {} } = pdfTemplate;
  
  if (!originalText) return '';
  
  const cleanOriginal = originalText.trim();
  
  // Try custom replacements first (manual text mappings)
  if (customReplacements[cleanOriginal] !== undefined) {
    return customReplacements[cleanOriginal];
  }
  
  // Try candidate-matched standard profile fields next
  if (cleanOriginal === (candidates.name || '').trim() && data.basics?.name) {
    return data.basics.name;
  }
  if (cleanOriginal === (candidates.email || '').trim() && data.basics?.email) {
    return data.basics.email;
  }
  if (cleanOriginal === (candidates.phone || '').trim() && data.basics?.phone) {
    return data.basics.phone;
  }
  if (cleanOriginal === (candidates.url || '').trim() && data.basics?.url) {
    return data.basics.url;
  }
  if (cleanOriginal === (candidates.location || '').trim() && data.basics?.location) {
    return data.basics.location;
  }
  
  return originalText;
}

function getBorderRadius(shape) {
  if (shape === 'rounded-square') return '12px';
  if (shape === 'square') return '0px';
  if (shape === 'squircle') return '24px';
  return '50%';
}

export default function PdfTemplateView({ data, onChange }) {
  const pdfTemplate = data.pdfTemplate || {};
  const { pages = [], allSpans = [] } = pdfTemplate;
  
  if (pages.length === 0) {
    return (
      <div className="p-8 text-center text-zinc-400">
        <p className="text-sm font-semibold">No PDF pages rendered yet.</p>
        <p className="text-xs text-zinc-500 mt-1">Try uploading a PDF resume template in the Templates tab.</p>
      </div>
    );
  }
  
  return (
    <div className="w-full flex flex-col items-center bg-[#0f0f10] p-1 selection:bg-sky-500/30 select-text">
      {pages.map((page) => {
        // Find spans on this page
        const pageSpans = allSpans.filter(s => s.page === page.page);
        
        return (
          <div 
            key={page.page} 
            className="relative bg-white shadow-2xl rounded-sm mb-6 overflow-hidden select-none"
            style={{ 
              width: `${page.width}px`, 
              height: `${page.height}px`,
              // Set background image via style for scaling fidelity
              backgroundImage: `url(${page.imageUrl})`,
              backgroundSize: '100% 100%',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat'
            }}
          >
            {/* Profile Photo Overlay if enabled and on this page */}
            {data.basics?.image && pdfTemplate.showImage && (pdfTemplate.imagePage || 0) === page.page && (
              <div
                style={{
                  position: 'absolute',
                  left: `${pdfTemplate.imageX !== undefined ? pdfTemplate.imageX : 50}px`,
                  top: `${pdfTemplate.imageY !== undefined ? pdfTemplate.imageY : 50}px`,
                  width: `${data.theme?.profileImageSize || 96}px`,
                  height: `${data.theme?.profileImageSize || 96}px`,
                  borderRadius: getBorderRadius(data.theme?.profileImageShape),
                  border: `${data.theme?.profileImageBorderWidth !== undefined ? data.theme.profileImageBorderWidth : 2}px solid ${data.theme?.profileImageBorderColor || '#ffffff'}`,
                  backgroundImage: `url(${data.basics.image})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  cursor: 'move',
                  zIndex: 50,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                  pointerEvents: 'auto'
                }}
                onMouseDown={(e) => {
                  if (!onChange) return;
                  e.preventDefault();
                  
                  const startX = e.clientX;
                  const startY = e.clientY;
                  
                  const currentX = pdfTemplate.imageX !== undefined ? pdfTemplate.imageX : 50;
                  const currentY = pdfTemplate.imageY !== undefined ? pdfTemplate.imageY : 50;
                  
                  const rect = e.currentTarget.parentElement.getBoundingClientRect();
                  const zoomFactor = rect.width / page.width || 1;
                  
                  const handleMouseMove = (moveEvent) => {
                    const dx = (moveEvent.clientX - startX) / zoomFactor;
                    const dy = (moveEvent.clientY - startY) / zoomFactor;
                    
                    let newX = Math.round(currentX + dx);
                    let newY = Math.round(currentY + dy);
                    
                    const size = data.theme?.profileImageSize || 96;
                    newX = Math.max(0, Math.min(page.width - size, newX));
                    newY = Math.max(0, Math.min(page.height - size, newY));
                    
                    onChange({
                      ...data,
                      pdfTemplate: {
                        ...pdfTemplate,
                        imageX: newX,
                        imageY: newY
                      }
                    });
                  };
                  
                  const handleMouseUp = () => {
                    document.removeEventListener('mousemove', handleMouseMove);
                    document.removeEventListener('mouseup', handleMouseUp);
                  };
                  
                  document.addEventListener('mousemove', handleMouseMove);
                  document.addEventListener('mouseup', handleMouseUp);
                }}
                title="Drag to position photo"
              />
            )}

            {/* Overlay the text content back at original coordinates */}
            {pageSpans.map((span, idx) => {
              const text = getReplacementText(span.text, data);
              const [x0, y0, x1, y1] = span.bbox;
              const width = x1 - x0;
              const height = y1 - y0;
              
              // Guess bold / italic styles based on font name flags
              const fontLower = (span.font || '').toLowerCase();
              const isBold = fontLower.includes('bold') || fontLower.includes('black') || fontLower.includes('heavy') || fontLower.includes('medium');
              const isItalic = fontLower.includes('italic') || fontLower.includes('oblique');
              
              // Standard font family mapping
              let fontFamily = 'sans-serif';
              if (fontLower.includes('serif') || fontLower.includes('times') || fontLower.includes('georgia')) {
                fontFamily = 'serif';
              } else if (fontLower.includes('mono') || fontLower.includes('courier') || fontLower.includes('code')) {
                fontFamily = 'monospace';
              }
              
              return (
                <div
                  key={idx}
                  style={{
                    position: 'absolute',
                    left: `${x0}px`,
                    top: `${y0}px`,
                    width: `${width + 20}px`, // extra horizontal safety margin to avoid premature wrapping
                    height: `${height + 2}px`,
                    fontSize: `${span.size}px`,
                    fontFamily: fontFamily,
                    color: intToHexColor(span.color),
                    fontWeight: isBold ? 'bold' : 'normal',
                    fontStyle: isItalic ? 'italic' : 'normal',
                    lineHeight: '1',
                    whiteSpace: 'nowrap',
                    overflow: 'visible',
                    pointerEvents: 'none'
                  }}
                  title={span.text}
                >
                  {text}
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
