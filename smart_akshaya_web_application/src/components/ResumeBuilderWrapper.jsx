import ResumeStudio from "../resume/ResumeStudio";
import DesktopOnlyGate from "../resume/components/DesktopOnlyGate";
import { useMinViewport, RESUME_STUDIO_MIN_WIDTH } from "../resume/lib/useMinViewport";

/**
 * Route entry for resume-studio — delegates to src/resume/ResumeStudio (white theme).
 * Blocked on small screens; requires laptop/monitor width for layout and export.
 */
export default function ResumeBuilderWrapper({ onViewChange }) {
  const isDesktop = useMinViewport(RESUME_STUDIO_MIN_WIDTH);

  if (!isDesktop) {
    return (
      <DesktopOnlyGate
        onViewChange={onViewChange}
        minWidth={RESUME_STUDIO_MIN_WIDTH}
      />
    );
  }

  return <ResumeStudio onViewChange={onViewChange} />;
}
