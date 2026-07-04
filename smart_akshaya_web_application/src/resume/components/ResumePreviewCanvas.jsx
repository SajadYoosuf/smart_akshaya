import TemplateRenderer from "./templates/TemplateRenderer";
import { A4_WIDTH_PX, A4_HEIGHT_PX } from "../lib/a4";

/**
 * Canva-style live preview:
 * - Artboard is always laid out at full 794×1123px (no CSS zoom on the document).
 * - Only the viewport wrapper applies transform: scale() for fit-to-screen zoom.
 * - Export captures the artboard at 1:1 scale.
 */
export default function ResumePreviewCanvas({ resumeData, zoom, sheetRef }) {
  const sheetBg =
    resumeData.theme?.backgroundColor ||
    (resumeData.templateId === "pink-maroon-modern" ? "#FAF4F0" : "#ffffff");

  return (
    <div className="rb-preview-canvas">
      <div
        className="rb-preview-viewport"
        style={{
          width: A4_WIDTH_PX * zoom,
          minHeight: A4_HEIGHT_PX * zoom,
        }}
      >
        <div
          className="rb-preview-artboard-scale"
          style={{
            transform: `scale(${zoom})`,
            width: A4_WIDTH_PX,
          }}
        >
          <div
            ref={sheetRef}
            id="resume-export-sheet"
            className="rb-a4-sheet resume-preview-island"
            style={{
              width: A4_WIDTH_PX,
              minHeight: A4_HEIGHT_PX,
              backgroundColor: sheetBg,
            }}
          >
            <TemplateRenderer data={resumeData} />
          </div>
        </div>
      </div>
    </div>
  );
}
