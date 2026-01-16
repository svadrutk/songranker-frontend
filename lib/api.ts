"use server";

export interface CoverArtArchive {
  artwork: boolean | null;
  back: boolean | null;
  count: number | null;
  darkened: boolean | null;
  front: boolean | null;
}

export interface ReleaseGroup {
  id: string; // Release Group MBID
  title: string;
  type: string;
  cover_art: CoverArtArchive;
}

export interface TrackResponse {
  tracks: string[];
}

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000";

export async function searchArtistReleaseGroups(query: string): Promise<ReleaseGroup[]> {
  if (!query) return [];

  try {
    const response = await fetch(`${BACKEND_URL}/search?query=${encodeURIComponent(query)}`, {
      cache: 'no-store'
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
      cache: 'no-store'
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
