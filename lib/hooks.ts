"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getUserSessions,
  getArtistsWithLeaderboards,
  getGlobalActivityStats,
  getGlobalLeaderboard,
  getLeaderboardStats,
  suggestArtists,
  getSessionDetail,
  getSessionSongs,
  deleteSession,
  searchArtistReleaseGroups,
  getReleaseGroupTracks,
  type SessionSummary,
  type ArtistWithLeaderboard,
  type GlobalActivityStats,
  type LeaderboardResponse,
  type LeaderboardStats,
  type SessionDetail,
  type SessionSong,
  type ReleaseGroup,
} from "@/lib/api";

// ==================== Utilities ====================

/** Returns a value that updates only after the input has been stable for delayMs. */
export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debouncedValue;
}

// ==================== Query Keys ====================
// Centralized query keys for consistency and cache invalidation

export const queryKeys = {
  // User-specific
  userSessions: (userId: string) => ["sessions", userId] as const,
  
  // Global data
  artistsWithLeaderboards: (limit: number) => ["artists", "leaderboards", limit] as const,
  globalActivityStats: ["activity", "global"] as const,
  
  // Artist-specific
  leaderboard: (artist: string, limit: number) => ["leaderboard", artist, limit] as const,
  leaderboardStats: (artist: string) => ["leaderboard", artist, "stats"] as const,
  artistSuggestions: (query: string) => ["suggestions", query] as const,
  
  // Session-specific
  sessionDetail: (sessionId: string) => ["session", sessionId] as const,
  sessionSongs: (sessionId: string) => ["session", sessionId, "songs"] as const,
  
  // Search
  searchReleases: (query: string) => ["search", "releases", query] as const,
  releaseTracks: (releaseId: string) => ["release", releaseId, "tracks"] as const,
};

// ==================== User Sessions ====================

export function useUserSessions(userId: string | undefined) {
  return useQuery<SessionSummary[], Error>({
    queryKey: queryKeys.userSessions(userId ?? ""),
    queryFn: () => getUserSessions(userId!),
    enabled: !!userId,
    staleTime: 60 * 1000, // Consider fresh for 1 minute
  });
}

// ==================== Global Data ====================

export function useArtistsWithLeaderboards(limit: number = 50) {
  return useQuery<ArtistWithLeaderboard[], Error>({
    queryKey: queryKeys.artistsWithLeaderboards(limit),
    queryFn: () => getArtistsWithLeaderboards(limit),
    staleTime: 2 * 60 * 1000, // Consider fresh for 2 minutes
    refetchOnWindowFocus: true, // Stay in sync with global leaderboard updates
  });
}

export function useGlobalActivityStats() {
  return useQuery<GlobalActivityStats | null, Error>({
    queryKey: queryKeys.globalActivityStats,
    queryFn: getGlobalActivityStats,
    staleTime: 2 * 60 * 1000, // Consider fresh for 2 minutes
  });
}

// ==================== Leaderboards ====================

export function useGlobalLeaderboard(artist: string, limit: number = 100, enabled: boolean = true) {
  return useQuery<LeaderboardResponse | null, Error>({
    queryKey: queryKeys.leaderboard(artist, limit),
    queryFn: () => getGlobalLeaderboard(artist, limit),
    enabled: enabled && !!artist,
    staleTime: 30 * 1000, // Consider fresh for 30 seconds
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes (formerly cacheTime)
    refetchOnWindowFocus: true, // Refetch when user returns so global ranking updates appear
  });
}

export function useLeaderboardStats(artist: string, enabled: boolean = true) {
  return useQuery<LeaderboardStats | null, Error>({
    queryKey: queryKeys.leaderboardStats(artist),
    queryFn: () => getLeaderboardStats(artist),
    enabled: enabled && !!artist,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
    refetchOnWindowFocus: true,
  });
}

// ==================== Suggestions ====================

export function useArtistSuggestions(query: string, enabled: boolean = true) {
  return useQuery<string[], Error>({
    queryKey: queryKeys.artistSuggestions(query),
    queryFn: () => suggestArtists(query),
    enabled: enabled && query.length >= 2,
    staleTime: 5 * 60 * 1000, // Consider fresh for 5 minutes (suggestions don't change often)
  });
}

// ==================== Session Details ====================

export function useSessionDetail(sessionId: string | null, options: { includeComparisons?: boolean } = {}) {
  return useQuery<SessionDetail | null, Error>({
    queryKey: [...queryKeys.sessionDetail(sessionId ?? ""), options.includeComparisons],
    queryFn: () => getSessionDetail(sessionId!, options),
    enabled: !!sessionId,
    staleTime: 30 * 1000,
  });
}

export function useSessionSongs(sessionId: string | null) {
  return useQuery<SessionSong[], Error>({
    queryKey: queryKeys.sessionSongs(sessionId ?? ""),
    queryFn: () => getSessionSongs(sessionId!),
    enabled: !!sessionId,
    staleTime: 30 * 1000,
  });
}

// ==================== Search ====================

export function useSearchReleases(query: string, enabled: boolean = true) {
  return useQuery<ReleaseGroup[], Error>({
    queryKey: queryKeys.searchReleases(query),
    queryFn: () => searchArtistReleaseGroups(query),
    enabled: enabled && query.length >= 2,
    staleTime: 5 * 60 * 1000, // Cache search results for 5 minutes
  });
}

export function useReleaseTracks(releaseId: string, enabled: boolean = true) {
  return useQuery<string[], Error>({
    queryKey: queryKeys.releaseTracks(releaseId),
    queryFn: () => getReleaseGroupTracks(releaseId),
    enabled: enabled && !!releaseId,
    staleTime: 10 * 60 * 1000, // Tracks don't change, cache for 10 minutes
  });
}

// ==================== Mutations ====================

export function useDeleteSession() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: deleteSession,
    onSuccess: () => {
      // Invalidate all session queries to refetch
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
    },
  });
}

// ==================== Cache Invalidation Helpers ====================

export function useInvalidateSessions() {
  const queryClient = useQueryClient();
  
  return (userId?: string) => {
    if (userId) {
      queryClient.invalidateQueries({ queryKey: queryKeys.userSessions(userId) });
    } else {
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
    }
  };
}

export function useInvalidateLeaderboard() {
  const queryClient = useQueryClient();
  
  return (artist?: string) => {
    if (artist) {
      queryClient.invalidateQueries({ queryKey: ["leaderboard", artist] });
    } else {
      queryClient.invalidateQueries({ queryKey: ["leaderboard"] });
    }
  };
}
