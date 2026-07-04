import { useRef, useState } from "react";
import { ImageUp, Loader2, Copy, Check, Palette } from "lucide-react";
import { toast } from "sonner";
import { generateTemplate } from "@/lib/resume-api";
import { Button } from "@/components/ui/button";

export function TemplateGenerator() {
  const inputRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [css, setCss] = useState(null);
  const [copied, setCopied] = useState(false);
  const [previewName, setPreviewName] = useState(null);

  async function handleFile(file) {
    if (!file) return;
    setPreviewName(file.name);
    setLoading(true);
    setCss(null);
    try {
      const result = await generateTemplate(file);
      setCss(result);
      toast.success("Template CSS generated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not generate template");
    } finally {
      setLoading(false);
    }
  }

  async function copy() {
    if (!css) return;
    await navigator.clipboard.writeText(css);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <section className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-soft)]">
      <div className="flex items-start gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent/20 text-accent-foreground">
          <Palette className="size-5" />
        </div>
        <div className="flex-1">
          <h3 className="text-base font-semibold text-foreground">Style from a screenshot</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Optional — upload a layout screenshot and AI vision returns matching CSS.
          </p>
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />

      <Button
        variant="outline"
        className="mt-4"
        disabled={loading}
        onClick={() => inputRef.current?.click()}
      >
        {loading ? <Loader2 className="animate-spin" /> : <ImageUp />}
        {loading ? "Analyzing…" : previewName ? "Upload another" : "Upload screenshot"}
      </Button>

      {css && (
        <div className="mt-4 overflow-hidden rounded-xl border border-border bg-foreground/[0.03]">
          <div className="flex items-center justify-between border-b border-border px-3 py-2">
            <span className="text-xs font-medium text-muted-foreground">template.css</span>
            <Button variant="ghost" size="sm" onClick={copy}>
              {copied ? <Check className="text-primary" /> : <Copy />}
              {copied ? "Copied" : "Copy"}
            </Button>
          </div>
          <pre className="max-h-72 overflow-auto p-4 text-xs leading-relaxed text-foreground">
            <code>{css}</code>
          </pre>
        </div>
      )}
    </section>
  );
}
