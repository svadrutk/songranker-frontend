import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { SongInput } from "@/lib/api";

export type SourceType = 'artist_all' | 'artist_partial' | 'playlist' | 'manual';

export interface BaseSource {
  id: string;
  name: string;
  coverUrl?: string;
  songCount: number;
  status: 'pending' | 'loading' | 'ready' | 'error';
  progress?: number;
  resolvedTracks?: SongInput[];
}

export interface ArtistAllSource extends BaseSource {
  type: 'artist_all';
  artistName: string;
  data: { artistId: string };
}

export interface ArtistPartialSource extends BaseSource {
  type: 'artist_partial';
  artistName: string;
  data: { 
    artistId: string;
    selectedReleaseIds: string[];
  };
}

export interface PlaylistSource extends BaseSource {
  type: 'playlist';
  data: {
    platform: 'spotify' | 'apple';
    playlistId: string;
    cachedTracks?: SongInput[]; 
  };
}

export interface ManualSource extends BaseSource {
  type: 'manual';
  data: {
    songs: SongInput[];
  };
}

export type RankingSource = ArtistAllSource | ArtistPartialSource | PlaylistSource | ManualSource;

export type SessionBuilderStatus = 'empty' | 'building' | 'reviewing';

export type SessionBuilderState = {
  sources: RankingSource[];
  status: SessionBuilderStatus;
  
  // Actions
  addSource: (source: RankingSource) => void;
  removeSource: (id: string) => void;
  updateSource: (id: string, updates: Partial<RankingSource>) => void;
  setStatus: (status: SessionBuilderStatus) => void;
  resetDraft: () => void;
};

export const useSessionBuilderStore = create<SessionBuilderState>()(
  persist(
    (set) => ({
      sources: [],
      status: 'empty',
      
      addSource: (source) => set((state) => ({ 
        sources: [...state.sources, source],
        status: 'building'
      })),
      
      removeSource: (id) => set((state) => {
        const newSources = state.sources.filter((s) => s.id !== id);
        return { 
          sources: newSources,
          status: newSources.length === 0 ? 'empty' : state.status
        };
      }),
      
      updateSource: (id, updates) => set((state) => ({
        sources: state.sources.map((s) => s.id === id ? ({ ...s, ...updates } as RankingSource) : s)
      })),
      
      setStatus: (status) => set({ status }),
      
      resetDraft: () => set({ sources: [], status: 'empty' }),
    }),
    {
      name: "sr-session-builder-draft",
      version: 1,
    }
  )
);
