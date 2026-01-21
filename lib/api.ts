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
};

export type SessionDetail = {
  session_id: string;
  songs: SessionSong[];
  comparison_count: number;
  convergence_score?: number;
};

export type ComparisonResponse = {
  success: boolean;
  new_elo_a: number;
  new_elo_b: number;
  sync_queued: boolean;
  convergence_score?: number;
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
};

export type ComparisonCreate = {
  song_a_id: string;
  song_b_id: string;
  winner_id: string | null;
  is_tie: boolean;
};

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000";

export async function searchArtistReleaseGroups(query: string): Promise<ReleaseGroup[]> {
  if (!query) return [];

  try {
    const response = await fetch(`${BACKEND_URL}/search?query=${encodeURIComponent(query)}`, {
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`Backend error: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error searching artists:", error);
    return [];
  }
}

export async function getReleaseGroupTracks(id: string): Promise<string[]> {
  if (!id) return [];

  try {
    const response = await fetch(`${BACKEND_URL}/tracks/${id}`, {
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`Backend error: ${response.statusText}`);
    }

    const data: TrackResponse = await response.json();
    return data.tracks;
  } catch (error) {
    console.error("Error fetching tracks:", error);
    return [];
  }
}

export async function createSession(payload: SessionCreate): Promise<SessionResponse> {
  try {
    const response = await fetch(`${BACKEND_URL}/sessions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("[API] Session creation failed:", errorData);
      throw new Error(errorData.detail || `Failed to create session: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("[API] Error in createSession:", error);
    throw error;
  }
}

export async function getUserSessions(userId: string): Promise<SessionSummary[]> {
  try {
    const response = await fetch(`${BACKEND_URL}/users/${userId}/sessions`, {
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch user sessions: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("[API] Error in getUserSessions:", error);
    return [];
  }
}

export async function getSessionSongs(sessionId: string): Promise<SessionSong[]> {
  try {
    const response = await fetch(`${BACKEND_URL}/sessions/${sessionId}/songs`, {
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch session songs: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("[API] Error in getSessionSongs:", error);
    return [];
  }
}

export async function getSessionDetail(sessionId: string): Promise<SessionDetail | null> {
  try {
    const response = await fetch(`${BACKEND_URL}/sessions/${sessionId}`, {
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch session detail: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("[API] Error in getSessionDetail:", error);
    return null;
  }
}

export async function deleteSession(sessionId: string): Promise<boolean> {
  try {
    const response = await fetch(`${BACKEND_URL}/sessions/${sessionId}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      throw new Error(`Failed to delete session: ${response.statusText}`);
    }

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
  try {
    const response = await fetch(`${BACKEND_URL}/sessions/${sessionId}/comparisons`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `Failed to create comparison: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("[API] Error in createComparison:", error);
    throw error;
  }
}

