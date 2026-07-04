/**
 * PDF export via html2canvas.
 * Tailwind v4 uses oklch() — html2canvas cannot parse it.
 * Fix: inject a sanitized copy of app CSS (oklch → hex) into an iframe
 * and keep Tailwind class names so layout is preserved.
 */

import html2canvas from 'html2canvas';

const UNSAFE_COLOR_RE = /oklch|oklab|color-mix|lch\(|lab\(/i;

const FONT_LINK =
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Montserrat:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400&display=swap';

let colorCtx = null;

function getColorCtx() {
  if (!colorCtx) {
    colorCtx = document.createElement('canvas').getContext('2d');
  }
  return colorCtx;
}

/** Convert any CSS color (including oklch) to hex/rgb html2canvas accepts. */
export function toSafeColor(value) {
  const trimmed = (value || '').trim();
  if (!trimmed || trimmed === 'transparent' || trimmed === 'currentcolor') return trimmed;
  if (!UNSAFE_COLOR_RE.test(trimmed)) return trimmed;

  try {
    const ctx = getColorCtx();
    ctx.fillStyle = '#000000';
    ctx.fillStyle = trimmed;
    return ctx.fillStyle || '#000000';
  } catch {
    return '#000000';
  }
}

export function sanitizeCssForHtml2Canvas(cssText) {
  if (!cssText) return cssText;

  return cssText
    .replace(/oklch\([^)]*\)/gi, (match) => toSafeColor(match))
    .replace(/oklab\([^)]*\)/gi, (match) => toSafeColor(match))
    .replace(/color-mix\([^)]*\)/gi, 'rgba(0,0,0,0.08)');
}

/** Collect all app CSS and replace unsupported color functions. */
export async function collectSanitizedAppCss() {
  const chunks = [];

  for (const sheet of document.styleSheets) {
    try {
      for (const rule of sheet.cssRules) {
        chunks.push(rule.cssText);
      }
    } catch {
      if (sheet.href) {
        try {
          const res = await fetch(sheet.href);
          if (res.ok) chunks.push(await res.text());
        } catch {
          /* ignore cross-origin sheets */
        }
      }
    }
  }

  document.querySelectorAll('style').forEach((el) => {
    if (el.textContent) chunks.push(el.textContent);
  });

  return sanitizeCssForHtml2Canvas(chunks.join('\n'));
}

function fixImages(sourceRoot, clone) {
  const sourceImages = sourceRoot.querySelectorAll('img');
  const cloneImages = clone.querySelectorAll('img');
  cloneImages.forEach((img, index) => {
    const original = sourceImages[index];
    if (!original?.src) return;
    img.src = original.src;
    img.crossOrigin = 'anonymous';
  });
}

/**
 * Clone the resume into a hidden iframe with sanitized Tailwind CSS.
 * Class names are kept so grid/flex/% widths still apply.
 */
export async function createExportIframe(sourceRoot) {
  const sanitizedCss = await collectSanitizedAppCss();

  const iframe = document.createElement('iframe');
  iframe.setAttribute('aria-hidden', 'true');
  iframe.style.cssText = [
    'position:fixed',
    'left:-99999px',
    'top:0',
    `width:${sourceRoot.offsetWidth}px`,
    `height:${sourceRoot.scrollHeight}px`,
    'border:0',
    'visibility:hidden',
  ].join(';');

  document.body.appendChild(iframe);

  const doc = iframe.contentDocument;
  doc.open();
  doc.write(`<!DOCTYPE html><html><head>
    <link rel="stylesheet" href="${FONT_LINK}" />
    <style>${sanitizedCss}</style>
  </head><body style="margin:0;padding:0;background:#fff;"></body></html>`);
  doc.close();

  const clone = sourceRoot.cloneNode(true);
  fixImages(sourceRoot, clone);
  doc.body.appendChild(clone);

  if (doc.fonts?.ready) {
    await doc.fonts.ready;
  }
  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));

  return {
    clone,
    iframe,
    cleanup: () => iframe.remove(),
  };
}

/** Patch live document <style> tags during export as an extra safety net. */
export function patchDocumentStylesForExport() {
  const patches = [];
  document.querySelectorAll('style').forEach((styleEl) => {
    const original = styleEl.textContent;
    if (UNSAFE_COLOR_RE.test(original)) {
      patches.push({ styleEl, original });
      styleEl.textContent = sanitizeCssForHtml2Canvas(original);
    }
  });
  return () => {
    patches.forEach(({ styleEl, original }) => {
      styleEl.textContent = original;
    });
  };
}

/**
 * Capture the resume artboard to a canvas for PDF export.
 */
export async function captureResumeToCanvas(sourceRoot, { width, height, backgroundColor = '#ffffff' } = {}) {
  const restoreStyles = patchDocumentStylesForExport();
  const { clone: exportRoot, iframe, cleanup } = await createExportIframe(sourceRoot);

  try {
    return await html2canvas(exportRoot, {
      window: iframe.contentWindow,
      scale: 2,
      useCORS: true,
      allowTaint: true,
      logging: false,
      width,
      height: height || exportRoot.scrollHeight,
      windowWidth: width,
      backgroundColor,
      onclone: (clonedDoc) => {
        clonedDoc.querySelectorAll('style').forEach((styleEl) => {
          styleEl.textContent = sanitizeCssForHtml2Canvas(styleEl.textContent);
        });
      },
    });
  } finally {
    restoreStyles();
    cleanup();
  }
}
