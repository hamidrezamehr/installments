import { useState, useRef, useEffect, useId } from "react";
import { ChevronDown } from "lucide-react";

export interface CustomSelectOption {
  value: string;
  label: string;
}

interface CustomSelectProps {
  value: string;
  options: CustomSelectOption[];
  placeholder?: string;
  onChange: (value: string) => void;
  required?: boolean;
  className?: string;
}

export default function CustomSelect({
  value,
  options,
  placeholder = "انتخاب کنید...",
  onChange,
  required,
  className = "",
}: CustomSelectProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const listboxId = useId();

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open]);

  const selected = options.find((o) => o.value === value);
  const displayText = selected ? selected.label : placeholder;

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listboxId : undefined}
        className={`flex w-full items-center justify-between gap-2 rounded-lg border bg-white px-4 py-2.5 text-base font-medium outline-none transition-all ${
          open
            ? "border-indigo-400 ring-2 ring-indigo-500/20 shadow-md shadow-indigo-500/10"
            : "border-black/10 hover:border-black/20"
        } ${selected ? "text-gray-900" : "text-gray-400"}`}
      >
        <span className="truncate text-right">{displayText}</span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-gray-400 transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Options list */}
      {open && (
        <div
          ref={listRef}
          id={listboxId}
          role="listbox"
          className="absolute z-50 mt-1 max-h-60 w-full overflow-y-auto rounded-lg border border-black/10 bg-white py-1 shadow-lg shadow-black/5 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-track]:bg-transparent"
        >
          {options.map((opt) => (
            <div
              key={opt.value}
              role="option"
              aria-selected={opt.value === value}
              onClick={() => {
                onChange(opt.value);
                setOpen(false);
              }}
              className={`cursor-pointer px-4 py-2.5 text-base font-medium transition-colors ${
                opt.value === value
                  ? "bg-indigo-50 text-indigo-600"
                  : "text-gray-900 hover:bg-gray-50"
              }`}
            >
              {opt.label}
            </div>
          ))}
        </div>
      )}

      {/* Hidden native select for form validation */}
      {required && (
        <select
          tabIndex={-1}
          aria-hidden="true"
          value={value}
          onChange={() => {}}
          required={required}
          className="pointer-events-none absolute -left-[9999px] h-0 w-0 opacity-0"
        >
          <option value="">placeholder</option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}
