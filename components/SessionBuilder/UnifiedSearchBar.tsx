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
  placeholder = "Paste playlist link or search artist…",
}: UnifiedSearchBarProps): JSX.Element {
  const inputRef = useRef<HTMLInputElement>(null);
  
  // URL detection and service identification
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
      <div className={cn(
        "relative flex items-center transition-all duration-500 rounded-xl md:rounded-3xl border-2 bg-background/80 backdrop-blur-xl shadow-2xl overflow-hidden group-focus-within:shadow-[0_0_50px_rgba(var(--primary-rgb),0.1)]",
        isUrl ? "border-primary/60 ring-4 md:ring-8 ring-primary/5" : "border-border/40 focus-within:border-primary/40 focus-within:ring-4 md:focus-within:ring-8 focus-within:ring-primary/5"
      )}>
        <div className="pl-4 md:pl-6 pointer-events-none flex items-center">
          {serviceInfo ? (
            <serviceInfo.Icon className={cn("h-5 w-5 md:h-6 md:w-6 animate-in zoom-in duration-300", serviceInfo.color)} />
          ) : (
            <Search className="h-5 w-5 md:h-6 md:w-6 text-muted-foreground group-focus-within:text-primary transition-colors" />
          )}
        </div>
        
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          onFocus={onFocus}
          onBlur={onBlur}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="flex-1 h-12 md:h-16 px-3 md:px-6 bg-transparent border-none focus:outline-none text-base md:text-xl font-bold tracking-tighter placeholder:text-muted-foreground/30 placeholder:normal-case placeholder:font-normal placeholder:tracking-normal"
          autoFocus
        />

        <div className="pr-3 md:pr-4 flex items-center gap-2 md:gap-3">
          {query && (
            <button 
              onClick={() => onQueryChange("")}
              className="p-1.5 md:p-2 hover:bg-muted/50 rounded-lg transition-colors"
              aria-label="Clear search"
            >
              <X className="h-4 w-4 md:h-5 md:w-5 text-muted-foreground" />
            </button>
          )}
          
          {loadingSuggestions && (
            <Loader2 className="h-5 w-5 md:h-6 md:w-6 text-primary animate-spin" />
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

      {/* Mobile IMPORT button -- full-width below the input */}
      {isUrl && (
        <button
          onClick={() => onImportPlaylist(query)}
          className="md:hidden w-full mt-3 bg-primary text-primary-foreground font-mono font-black uppercase tracking-widest py-3.5 rounded-xl active:scale-[0.98] transition-all animate-in fade-in slide-in-from-bottom-4 duration-300 text-sm"
        >
          IMPORT PLAYLIST
        </button>
      )}

      {/* Suggestions dropdown */}
      {showSuggestions && suggestions.length > 0 && !isUrl && (
        <div className="absolute top-full left-0 right-0 mt-2 md:mt-6 bg-popover/90 backdrop-blur-xl md:backdrop-blur-2xl border-2 border-primary/10 rounded-2xl md:rounded-[2rem] shadow-2xl z-50 max-h-60 md:max-h-96 overflow-y-auto p-2 md:p-3 animate-in fade-in slide-in-from-top-4 duration-500">
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                onSuggestionClick(suggestion);
              }}
              className="w-full text-left px-4 py-3 md:px-8 md:py-5 text-base md:text-xl font-bold tracking-tighter hover:bg-primary hover:text-primary-foreground transition-all rounded-xl md:rounded-2xl flex items-center gap-4 md:gap-6 group/item"
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
