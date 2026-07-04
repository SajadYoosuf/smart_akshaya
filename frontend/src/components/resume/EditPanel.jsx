import { useMemo, useState } from "react";
import { Search, Mail, Phone, MapPin, LinkIcon, User } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const FIELD_META = [
  { key: "name", label: "Full name", icon: User },
  { key: "email", label: "Email", icon: Mail },
  { key: "phone", label: "Phone", icon: Phone },
  { key: "url", label: "Website / LinkedIn", icon: LinkIcon },
  { key: "location", label: "Location", icon: MapPin },
];

export function EditPanel({
  original,
  fieldValues,
  onFieldChange,
  uniqueTexts,
  textEdits,
  onTextEdit,
}) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return uniqueTexts;
    return uniqueTexts.filter((t) => t.text.toLowerCase().includes(q));
  }, [query, uniqueTexts]);

  return (
    <div className="grid gap-6 lg:grid-cols-5">
      {/* Contact details */}
      <section className="lg:col-span-2 rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-soft)]">
        <h3 className="text-base font-semibold text-foreground">Contact details</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Detected automatically — edit anything that's off.
        </p>
        <div className="mt-5 space-y-4">
          {FIELD_META.map(({ key, label, icon: Icon }) => (
            <div key={key} className="space-y-1.5">
              <Label htmlFor={`field-${key}`} className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground font-semibold">
                <Icon className="size-3.5" />
                {label}
              </Label>
              <Input
                id={`field-${key}`}
                value={fieldValues[key] ?? ""}
                placeholder={original[key] ? undefined : "Not detected"}
                onChange={(e) => onFieldChange(key, e.target.value)}
              />
            </div>
          ))}
        </div>
      </section>

      {/* Text elements */}
      <section className="lg:col-span-3 rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-soft)]">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-semibold text-foreground">Text blocks</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Rewrite any line. Empty = keep the original.
            </p>
          </div>
          <span className="shrink-0 rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
            {uniqueTexts.length} found
          </span>
        </div>

        <div className="relative mt-4">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search text blocks…"
            className="pl-9"
          />
        </div>

        <div className="mt-4 max-h-[28rem] space-y-3 overflow-y-auto pr-1">
          {filtered.length === 0 && (
            <p className="py-10 text-center text-sm text-muted-foreground">No matches.</p>
          )}
          {filtered.map((t, i) => (
            <div key={`${t.text}-${i}`} className="rounded-xl border border-border bg-background/60 p-3">
              <div className="mb-2 flex items-center gap-2">
                <span className="rounded-md bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                  {t.size.toFixed(1)}pt
                </span>
                <span className="truncate text-[11px] text-muted-foreground">{t.font}</span>
              </div>
              <p className="mb-2 line-clamp-2 text-sm font-medium text-foreground">{t.text}</p>
              <textarea
                value={textEdits[t.text] ?? ""}
                onChange={(e) => onTextEdit(t.text, e.target.value)}
                placeholder="Replacement text…"
                rows={2}
                className="w-full min-h-[50px] rounded-md border border-input bg-background/50 px-3 py-1.5 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50 mt-1 resize-y"
              />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
