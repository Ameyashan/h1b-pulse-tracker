import { useState, useRef, useEffect } from "react";
import { Search, ChevronDown, Plus } from "lucide-react";

const LAW_FIRMS = [
  "Baker McKenzie",
  "Berry Appleman & Leiden (BAL)",
  "Chugh Firm",
  "Cyrus Mehta & Partners",
  "Deloitte Legal",
  "Dickinson Wright",
  "Duane Morris",
  "Envoy Global",
  "EY Law (Ernst & Young)",
  "Fisher Phillips",
  "FordHarrison",
  "Fragomen",
  "Gibson Dunn",
  "Greenberg Traurig",
  "Jackson Lewis",
  "Kirkland & Ellis",
  "Klasko Immigration",
  "KPMG Law",
  "Littler Mendelson",
  "Mayer Brown",
  "Morgan Lewis",
  "Murthy Law Firm",
  "Ogletree Deakins",
  "Perkins Coie",
  "PwC Legal",
  "Rajiv S. Khanna",
  "Seyfarth Shaw",
  "Taft Stettinius",
  "WR Immigration",
  "Wolfsdorf Rosenthal",
];

interface LawFirmComboboxProps {
  value: string;
  onChange: (value: string) => void;
}

export function LawFirmCombobox({ value, onChange }: LawFirmComboboxProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [isOther, setIsOther] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = LAW_FIRMS.filter((f) =>
    f.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (firm: string) => {
    onChange(firm);
    setSearch("");
    setOpen(false);
    setIsOther(false);
  };

  const handleOther = () => {
    setIsOther(true);
    setOpen(false);
    setSearch("");
    onChange("");
  };

  const handleAddNew = () => {
    onChange(search.trim());
    setOpen(false);
    setSearch("");
    setIsOther(false);
  };

  const showAddNew = search.trim().length > 0 && filtered.length === 0;

  return (
    <div className="space-y-1.5">
      <label className="text-xs text-muted-foreground flex items-center gap-1.5">
        Law Firm
        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide bg-purple-500/20 text-purple-400 animate-pulse">
          NEW
        </span>
      </label>
      <div ref={containerRef} className="relative">
        {isOther ? (
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Type your law firm name..."
              value={value}
              onChange={(e) => onChange(e.target.value)}
              className="flex-1 h-[42px] rounded-md border border-border bg-secondary px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <button
              type="button"
              onClick={() => { setIsOther(false); onChange(""); }}
              className="text-xs text-muted-foreground hover:text-foreground px-2"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => { setOpen(!open); setTimeout(() => inputRef.current?.focus(), 50); }}
            className="w-full h-[42px] rounded-md border border-border bg-secondary px-3 text-sm text-left flex items-center justify-between gap-2 hover:border-ring/50 transition-colors"
          >
            <span className={value ? "text-foreground" : "text-muted-foreground"}>
              {value || "Type to search..."}
            </span>
            <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
          </button>
        )}

        {open && (
          <div className="absolute z-50 mt-1 w-full rounded-md border border-border bg-popover shadow-lg shadow-black/30 max-h-64 overflow-hidden flex flex-col">
            <div className="flex items-center gap-2 px-3 py-2 border-b border-border">
              <Search className="h-4 w-4 text-muted-foreground shrink-0" />
              <input
                ref={inputRef}
                type="text"
                placeholder="Search law firms..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
              />
            </div>
            <div className="overflow-y-auto flex-1">
              {filtered.map((firm) => (
                <button
                  key={firm}
                  type="button"
                  onClick={() => handleSelect(firm)}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-accent/10 transition-colors ${
                    value === firm ? "text-primary font-medium" : "text-foreground"
                  }`}
                >
                  {firm}
                </button>
              ))}
              {showAddNew && (
                <button
                  type="button"
                  onClick={handleAddNew}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-accent/10 transition-colors text-primary flex items-center gap-1.5"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add "{search.trim()}" as new firm
                </button>
              )}
              <div className="border-t border-border mt-1">
                <div className="px-3 pt-2 pb-1 text-[10px] text-muted-foreground uppercase tracking-wider">Can't find yours?</div>
                <button
                  type="button"
                  onClick={handleOther}
                  className="w-full text-left px-3 py-2 text-sm text-muted-foreground hover:bg-accent/10 hover:text-foreground transition-colors"
                >
                  Other — type manually
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
