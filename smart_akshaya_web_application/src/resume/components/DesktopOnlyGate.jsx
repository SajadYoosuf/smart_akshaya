import { ArrowLeft, FileText, Laptop, Monitor, Smartphone } from 'lucide-react';
import { RESUME_STUDIO_MIN_WIDTH } from '../lib/useMinViewport';

export { RESUME_STUDIO_MIN_WIDTH };

export default function DesktopOnlyGate({ onViewChange, minWidth = RESUME_STUDIO_MIN_WIDTH }) {
  return (
    <div className="rb-desktop-gate">
      <div className="rb-desktop-gate-card">
        <div className="rb-desktop-gate-icon-row">
          <span className="rb-desktop-gate-icon rb-desktop-gate-icon--muted">
            <Smartphone size={28} strokeWidth={1.75} />
          </span>
          <span className="rb-desktop-gate-arrow" aria-hidden="true">→</span>
          <span className="rb-desktop-gate-icon rb-desktop-gate-icon--accent">
            <Laptop size={28} strokeWidth={1.75} />
          </span>
          <span className="rb-desktop-gate-icon rb-desktop-gate-icon--accent">
            <Monitor size={28} strokeWidth={1.75} />
          </span>
        </div>

        <div className="rb-desktop-gate-badge">
          <FileText size={14} />
          Resume Studio
        </div>

        <h1 className="rb-desktop-gate-title">Use a laptop or monitor</h1>
        <p className="rb-desktop-gate-text">
          Resume Studio needs a wider screen for editing, live preview, and PDF export.
          Please open Smart Akshaya on a laptop or desktop monitor to use this feature.
        </p>

        <p className="rb-desktop-gate-hint">
          Minimum screen width: <strong>{minWidth}px</strong>
        </p>

        {onViewChange && (
          <button
            type="button"
            className="rb-desktop-gate-back"
            onClick={() => onViewChange('dashboard')}
          >
            <ArrowLeft size={16} />
            Back to Dashboard
          </button>
        )}
      </div>
    </div>
  );
}
