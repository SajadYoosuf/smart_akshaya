import { useRef, useState } from "react";
import { FileText, UploadCloud, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export function PdfDropzone({ onFile, loading, fileName }) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);

  function pick(file) {
    if (!file) return;
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      return;
    }
    onFile(file);
  }

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        pick(e.dataTransfer.files?.[0]);
      }}
      className={cn(
        "relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed bg-card px-8 py-16 text-center transition-colors",
        dragging ? "border-primary bg-primary/5" : "border-border",
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,.pdf"
        className="hidden"
        onChange={(e) => pick(e.target.files?.[0])}
      />

      <div className="mb-5 flex size-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        {loading ? (
          <Loader2 className="size-7 animate-spin" />
        ) : fileName ? (
          <FileText className="size-7" />
        ) : (
          <UploadCloud className="size-7" />
        )}
      </div>

      <h3 className="text-lg font-semibold text-foreground">
        {loading ? "Reading your resume…" : fileName ?? "Drop your resume PDF here"}
      </h3>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">
        {loading
          ? "Extracting text, contact details and styled text blocks."
          : "We extract your details and every styled text block so you can rewrite them."}
      </p>

      <Button
        variant="hero"
        size="lg"
        className="mt-6"
        disabled={loading}
        onClick={() => inputRef.current?.click()}
      >
        {loading ? "Processing…" : "Choose PDF"}
      </Button>
    </div>
  );
}
