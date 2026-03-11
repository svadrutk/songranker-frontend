"use client";

import { useRef, type JSX } from "react";
import { Search, Loader2, X } from "lucide-react";
import { SiSpotify, SiApplemusic } from "@icons-pack/react-simple-icons";
import { cn } from "@/lib/utils";

type UnifiedSearchBarProps = Readonly<{
  query: string;
  onQueryChange: (query: string) => void;
  suggestions: string[];
  showSuggestions: boolean;
  loadingSuggestions: boolean;
  onSuggestionClick: (suggestion: string) => void;
  onImportPlaylist: (url: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  placeholder?: string;
}>;

export function UnifiedSearchBar({
  query,
  onQueryChange,
  suggestions,
  showSuggestions,
  loadingSuggestions,
  onSuggestionClick,
  onImportPlaylist,
  onFocus,
  onBlur,
  placeholder = "Search artist or paste link…",
}: UnifiedSearchBarProps): JSX.Element {
  const inputRef = useRef<HTMLInputElement>(null);
  
  const getServiceInfo = (val: string) => {
    if (/spotify\.com\/playlist\/([a-zA-Z0-9]+)/.test(val)) {
      return { type: 'spotify', label: 'Spotify', color: 'text-[#1DB954]', Icon: SiSpotify };
    }
    if (/music\.apple\.com\/[a-z]{2}\/playlist\/[a-zA-Z0-9.\-]+\/(pl\.[a-f0-9]+)/.test(val)) {
      return { type: 'apple', label: 'Apple Music', color: 'text-[#FC3C44]', Icon: SiApplemusic };
    }
    return null;
  };

  const serviceInfo = getServiceInfo(query);
  const isUrl = !!serviceInfo;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      if (isUrl) {
        onImportPlaylist(query);
      } else if (suggestions.length > 0) {
        onSuggestionClick(suggestions[0]);
      }
    }
  };

  return (
    <div className="relative w-full group">
      <div className="relative flex items-center w-full">
        <div className="absolute left-0 top-1/2 -translate-y-1/2 pointer-events-none flex items-center z-10">
          {serviceInfo ? (
            <serviceInfo.Icon className={cn("h-5 w-5 md:h-9 md:w-9 animate-in zoom-in duration-300", serviceInfo.color)} />
          ) : loadingSuggestions ? (
            <Loader2 className="h-5 w-5 md:h-9 md:w-9 text-primary animate-spin" />
          ) : (
            <Search className={cn(
              "h-5 w-5 md:h-9 md:w-9 transition-colors duration-300",
              query ? "text-foreground/40" : "text-muted-foreground/25"
            )} />
          )}
        </div>

        <div className="relative flex-1 min-w-0" style={{ maskImage: "linear-gradient(to right, black calc(100% - 3rem), transparent)", WebkitMaskImage: "linear-gradient(to right, black calc(100% - 3rem), transparent)" }}>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            onFocus={onFocus}
            onBlur={onBlur}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="w-full bg-transparent border-none focus:outline-none pl-8 md:pl-14 pr-4 py-3 md:py-7 text-xl md:text-5xl font-semibold tracking-tighter text-foreground placeholder:text-muted-foreground/20 placeholder:font-normal placeholder:tracking-tight caret-primary"
            autoFocus
          />
        </div>

        <div className="flex items-center gap-2 shrink-0 ml-2">
          {query && (
            <button
              onClick={() => onQueryChange("")}
              className="p-2 md:p-2.5 hover:bg-muted/50 rounded-full transition-colors"
              aria-label="Clear search"
            >
              <X className="h-5 w-5 md:h-6 md:w-6 text-muted-foreground/50 hover:text-foreground transition-colors" />
            </button>
          )}

          {isUrl && (
            <button
              onClick={() => onImportPlaylist(query)}
              className="hidden md:block bg-primary text-primary-foreground font-mono font-black uppercase tracking-widest px-6 py-3 rounded-xl hover:scale-105 active:scale-95 transition-all animate-in slide-in-from-right-8 text-xs"
            >
              IMPORT
            </button>
          )}
        </div>
      </div>

      <div className="h-px w-full bg-border/60" />

      {isUrl && (
        <button
          onClick={() => onImportPlaylist(query)}
          className="md:hidden w-full mt-4 bg-primary text-primary-foreground font-mono font-black uppercase tracking-widest py-3.5 rounded-xl active:scale-[0.98] transition-all animate-in fade-in slide-in-from-bottom-4 duration-300 text-sm"
        >
          IMPORT PLAYLIST
        </button>
      )}

      {showSuggestions && suggestions.length > 0 && !isUrl && (
        <div className="absolute left-0 right-0 mt-1 z-50 max-h-60 md:max-h-96 overflow-y-auto py-2 animate-in fade-in slide-in-from-top-2 duration-300">
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                onSuggestionClick(suggestion);
              }}
              className="w-full text-left px-2 md:px-3 py-3 md:py-4 text-base md:text-lg font-medium tracking-tight text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-all rounded-lg flex items-center gap-3 group/item"
            >
              <Search className="h-4 w-4 shrink-0 opacity-30 group-hover/item:opacity-60 transition-opacity" />
              {suggestion}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
