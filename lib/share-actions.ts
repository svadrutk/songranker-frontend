"use server";

import type { SessionSong } from "@/lib/api";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

export async function generateShareImage(
  songs: SessionSong[],
  orderId: number,
  dateStr: string,
  timeStr: string
): Promise<{ success: true; imageData: string } | { success: false; error: string }> {
  try {
    console.log(`[generateShareImage] Fetching from: ${BACKEND_URL}/generate-receipt`);
    console.log(`[generateShareImage] Sending ${songs.length} songs`);
    
    const response = await fetch(`${BACKEND_URL}/generate-receipt`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        songs, 
        orderId, 
        dateStr, 
        timeStr 
      }),
      signal: AbortSignal.timeout(30000),
    });

    console.log(`[generateShareImage] Response status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[generateShareImage] Error response: ${errorText}`);
      return { success: false, error: `Failed to generate image: ${response.statusText}` };
    }

    // Convert blob to base64 for transfer to client
    const arrayBuffer = await response.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');
    
    console.log(`[generateShareImage] Image generated successfully, size: ${arrayBuffer.byteLength} bytes`);
    
    return { success: true, imageData: base64 };
  } catch (error) {
    console.error("[generateShareImage] Failed to generate share image:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}
