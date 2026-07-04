import { useState } from "react";
import { Settings2, Check } from "lucide-react";
import { getApiBase, setApiBase, DEFAULT_API_BASE } from "@/lib/resume-api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export function ApiSettings() {
  const [value, setValue] = useState(getApiBase());
  const [saved, setSaved] = useState(false);

  function save() {
    setApiBase(value || DEFAULT_API_BASE);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings2 />
          Backend
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80">
        <div className="space-y-1">
          <h4 className="text-sm font-semibold text-foreground">Backend URL</h4>
          <p className="text-xs text-muted-foreground">
            Where your Python resume server is running.
          </p>
        </div>
        <div className="mt-3 space-y-2">
          <Label htmlFor="api-base" className="text-xs text-muted-foreground">
            Base URL
          </Label>
          <Input
            id="api-base"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={DEFAULT_API_BASE}
          />
          <Button size="sm" className="w-full" onClick={save}>
            {saved ? <Check /> : null}
            {saved ? "Saved" : "Save"}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
