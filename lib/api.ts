"use server";

export type CoverArtArchive = {
  artwork: boolean | null;
  back: boolean | null;
  count: number | null;
  darkened: boolean | null;
  front: boolean | null;
  url?: string;
};

export type ReleaseGroup = {
  id: string; // Release Group MBID or Last.fm ID
  title: string;
  artist?: string;
  type: string;
  cover_art?: CoverArtArchive;
};

export type SongInput = {
  name: string;
  artist: string;
  album?: string | null;
  spotify_id?: string | null;
  cover_url?: string | null;
};

export type SessionCreate = {
  user_id?: string | null;
  songs: SongInput[];
};

export type SessionResponse = {
  session_id: string;
  count: number;
};

export type SessionSummary = {
  session_id: string;
  created_at: string;
  primary_artist: string;
  song_count: number;
  comparison_count: number;
  convergence_score: number;
  top_album_covers: string[];
};

export type ComparisonPair = {
  song_a_id: string;
  song_b_id: string;
  winner_id: string | null;
  is_tie: boolean;
};

export type SessionDetail = {
  session_id: string;
  songs: SessionSong[];
  comparison_count: number;
  convergence_score?: number;
  comparisons?: ComparisonPair[];
};

export type ComparisonResponse = {
  success: boolean;
  new_elo_a: number;
  new_elo_b: number;
  sync_queued: boolean;
  convergence_score?: number;
};

export type UndoComparisonResponse = {
  success: boolean;
  comparison_id: string;
  song_a_id: string;
  song_b_id: string;
  restored_elo_a: number;
  restored_elo_b: number;
  sync_queued: boolean;
};

export type TrackResponse = {
  tracks: string[];
};

export type SessionSong = {
  song_id: string;
  name: string;
  artist: string;
  album: string | null;
  spotify_id: string | null;
  cover_url: string | null;
  local_elo: number;
  bt_strength: number | null;
  comparison_count: number;
};

export type ComparisonCreate = {
  song_a_id: string;
  song_b_id: string;
  winner_id: string | null;
  is_tie: boolean;
  decision_time_ms?: number;
};

export type LeaderboardSong = {
  id: string;
  name: string;
  artist: string;
  album: string | null;
  album_art_url: string | null;
  global_elo: number;
  global_bt_strength: number;
  global_votes_count: number;
  rank: number;
};

export type LeaderboardResponse = {
  artist: string;
  songs: LeaderboardSong[];
  total_comparisons: number;
  pending_comparisons: number;
  last_updated: string | null;
};

export type LeaderboardStats = {
  artist: string;
  total_comparisons: number;
  pending_comparisons: number;
  last_updated: string | null;
};

export type ArtistSuggestion = {
  name: string;
};

export type ArtistWithLeaderboard = {
  artist: string;
  total_comparisons: number;
  last_updated: string | null;
};

export type ArtistsWithLeaderboardsResponse = {
  artists: ArtistWithLeaderboard[];
};

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

// Helper to show errors visually
function triggerErrorBanner(message: string) {
  if (typeof window !== 'undefined') {
    // Dynamic import to avoid SSR issues
    import('@/components/ErrorBanner').then(({ showError }) => {
      showError(message);
    }).catch((err) => {
      console.error('[API] Failed to show error banner:', err);
    });
  }
}

async function fetchBackend<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${BACKEND_URL}${endpoint}`;
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const message = errorData.detail || `API Error: ${response.status} ${response.statusText}`;
      throw new Error(message);
    }

    return await response.json();
  } catch (error) {
    if (error instanceof TypeError && error.message.includes("fetch")) {
      const message = `Cannot reach backend at ${BACKEND_URL}. Check connection.`;
      triggerErrorBanner(message);
      throw new Error(message);
    }
    throw error;
  }
}

export async function searchArtistReleaseGroups(query: string): Promise<ReleaseGroup[]> {
  if (!query) return [];
  try {
    return await fetchBackend<ReleaseGroup[]>(`/search?query=${encodeURIComponent(query)}`, {
      cache: "no-store",
    });
  } catch (error) {
    console.error("[API] Error searching artists:", error);
    return [];
  }
}

export async function getReleaseGroupTracks(id: string): Promise<string[]> {
  if (!id) return [];
  try {
    const data = await fetchBackend<TrackResponse>(`/tracks/${id}`, {
      cache: "no-store",
    });
    return data.tracks;
  } catch (error) {
    console.error("[API] Error fetching tracks:", error);
    return [];
  }
}

export async function createSession(payload: SessionCreate): Promise<SessionResponse> {
  return fetchBackend<SessionResponse>("/sessions", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getUserSessions(userId: string): Promise<SessionSummary[]> {
  try {
    return await fetchBackend<SessionSummary[]>(`/users/${userId}/sessions`, {
      cache: "no-store",
    });
  } catch (error) {
    console.error("[API] Error in getUserSessions:", error);
    return [];
  }
}

export async function getSessionSongs(sessionId: string): Promise<SessionSong[]> {
  try {
    return await fetchBackend<SessionSong[]>(`/sessions/${sessionId}/songs`, {
      cache: "no-store",
    });
  } catch (error) {
    console.error("[API] Error in getSessionSongs:", error);
    return [];
  }
}

export async function getSessionDetail(sessionId: string): Promise<SessionDetail | null> {
  try {
    return await fetchBackend<SessionDetail>(`/sessions/${sessionId}`, {
      cache: "no-store",
    });
  } catch (error) {
    console.error("[API] Error in getSessionDetail:", error);
    return null;
  }
}

export async function deleteSession(sessionId: string): Promise<boolean> {
  try {
    await fetchBackend(`/sessions/${sessionId}`, {
      method: "DELETE",
    });
    return true;
  } catch (error) {
    console.error("[API] Error in deleteSession:", error);
    return false;
  }
}

export async function createComparison(
  sessionId: string,
  payload: ComparisonCreate
): Promise<ComparisonResponse> {
  return fetchBackend<ComparisonResponse>(`/sessions/${sessionId}/comparisons`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function undoLastComparison(sessionId: string): Promise<UndoComparisonResponse> {
  return fetchBackend<UndoComparisonResponse>(
    `/sessions/${sessionId}/comparisons/last`,
    { method: "DELETE" }
  );
}

export async function getLeaderboardStats(artist: string): Promise<LeaderboardStats | null> {
  try {
    return await fetchBackend<LeaderboardStats>(`/leaderboard/${encodeURIComponent(artist)}/stats`, {
      cache: "no-store",
    });
  } catch (error) {
    console.error("[API] Error fetching leaderboard stats:", error);
    return null;
  }
}

export async function getGlobalLeaderboard(artist: string, limit: number = 100): Promise<LeaderboardResponse | null> {
  try {
    return await fetchBackend<LeaderboardResponse>(
      `/leaderboard/${encodeURIComponent(artist)}?limit=${limit}`,
      { cache: "no-store" }
    );
  } catch (error) {
    console.error("[API] Error fetching global leaderboard:", error);
    return null;
  }
}

export async function suggestArtists(query: string): Promise<string[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];
  try {
    const data = await fetchBackend<ArtistSuggestion[] | string[]>(
      `/suggest?query=${encodeURIComponent(trimmed)}`
    );
    if (!Array.isArray(data)) return [];
    return data
      .map((a: ArtistSuggestion | string) =>
        typeof a === "string" ? a : (a as ArtistSuggestion).name
      )
      .filter((name): name is string => Boolean(name));
  } catch (error) {
    console.error("[API] Error fetching artist suggestions:", error);
    return [];
  }
}

export async function getArtistsWithLeaderboards(limit: number = 50): Promise<ArtistWithLeaderboard[]> {
  try {
    const data = await fetchBackend<ArtistsWithLeaderboardsResponse>(
      `/leaderboard/artists?limit=${limit}`,
      { cache: "no-store" }
    );
    return data.artists ?? [];
  } catch (error) {
    console.error("[API] Error fetching artists with leaderboards:", error);
    return [];
  }
}

export type GlobalActivityStats = {
  total_sessions: number;
  total_comparisons: number;
  artists_ranked: number;
  avg_convergence: number;
  completed_sessions: number;
  completion_rate: number;
};

export async function getGlobalActivityStats(): Promise<GlobalActivityStats | null> {
  try {
    return await fetchBackend<GlobalActivityStats>("/activity/global", { cache: "no-store" });
  } catch (error) {
    console.error("[API] Error fetching global activity stats:", error);
    return null;
  }
}

export type FeedbackCreate = {
  message: string;
  user_id?: string | null;
  user_agent?: string | null;
  url?: string | null;
  session_id?: string | null;
  star_rating?: number | null;
};

export type FeedbackResponse = {
  id: string;
  message: string;
  created_at: string;
};

export async function submitFeedback(payload: FeedbackCreate): Promise<FeedbackResponse> {
  return fetchBackend<FeedbackResponse>("/feedback", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}