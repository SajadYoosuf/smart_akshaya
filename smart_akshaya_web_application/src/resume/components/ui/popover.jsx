import * as React from "react";
import { cn } from "../../lib/utils";

export function Popover({ children }) {
  const [open, setOpen] = React.useState(false);
  return (
    <div className="relative inline-block text-left">
      {React.Children.map(children, child => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child, { open, setOpen });
        }
        return child;
      })}
    </div>
  );
}

export function PopoverTrigger({ asChild, children, open, setOpen }) {
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, {
      onClick: (e) => {
        e.preventDefault();
        setOpen(!open);
      },
    });
  }
  return (
    <button onClick={(e) => { e.preventDefault(); setOpen(!open); }} type="button">
      {children}
    </button>
  );
}

export function PopoverContent({ className, children, open, setOpen, align = "end" }) {
  if (!open) return null;
  return (
    <>
      <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
      <div
        className={cn(
          "absolute z-50 mt-2 w-80 rounded-md border border-border bg-card p-4 text-popover-foreground shadow-md outline-none",
          align === "end" ? "right-0 origin-top-right" : "left-0 origin-top-left",
          className
        )}
      >
        {children}
      </div>
    </>
  );
}
