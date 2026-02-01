"use client";

import type { JSX } from "react";
import { Search, Loader2 } from "lucide-react";

type SearchBarProps = Readonly<{
  query: string;
  onQueryChange: (query: string) => void;
  suggestions: string[];
  showSuggestions: boolean;
  loadingSuggestions: boolean;
  onSuggestionClick: (suggestion: string) => void;
  onFocus: () => void;
  onBlur: () => void;
}>;

export function SearchBar({
  query,
  onQueryChange,
  suggestions,
  showSuggestions,
  loadingSuggestions,
  onSuggestionClick,
  onFocus,
  onBlur,
}: SearchBarProps): JSX.Element {
  return (
    <div className="flex gap-2 animate-in fade-in slide-in-from-top-1 duration-300">
      <div className="relative flex-1 overflow-visible">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground z-10" />
        <input
          type="text"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          onFocus={onFocus}
          onBlur={onBlur}
          placeholder="Search artist..."
          className="flex h-10 w-full rounded-md border border-input bg-background px-10 py-2 text-sm transition-all focus-visible:outline-none focus-visible:border-primary/20 focus-visible:ring-1 focus-visible:ring-primary/10 disabled:cursor-not-allowed disabled:opacity-50 shadow-sm"
        />
        
        {/* Loading indicator */}
        {loadingSuggestions && (
          <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground animate-spin z-10" />
        )}
        
        {/* Suggestions dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-popover border border-border rounded-md shadow-lg z-50 max-h-60 overflow-y-auto">
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                type="button"
                onClick={() => onSuggestionClick(suggestion)}
                className="w-full text-left px-4 py-2.5 text-sm hover:bg-accent transition-colors first:rounded-t-md last:rounded-b-md"
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
