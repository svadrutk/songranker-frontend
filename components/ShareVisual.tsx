"use client";

import type { JSX } from "react";
import { Music } from "lucide-react";
import type { SessionSong } from "@/lib/api";

type ShareVisualProps = {
  songs: SessionSong[];
};

export function ShareVisual({ songs }: ShareVisualProps): JSX.Element {
  const top1 = songs[0];
  const others = songs.slice(1, 10);

  return (
    <div 
      id="share-visual"
      className="w-[1080px] h-[1920px] bg-black text-white p-10 flex flex-col items-center justify-between relative overflow-hidden"
      style={{
        background: `linear-gradient(135deg, #000000 0%, #1a1a1a 100%)`,
      }}
    >
      {/* Dynamic Background Glow */}
      <div 
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[150%] h-[50%] opacity-30 blur-[120px] rounded-full"
        style={{
          background: `radial-gradient(circle, var(--color-primary) 0%, transparent 70%)`,
          backgroundColor: '#3b82f6', // Fallback blue
        }}
      />

      <div className="w-full space-y-10 relative z-10 flex flex-col items-center">
        {/* Header */}
        <div className="text-center space-y-4">
          <p className="text-2xl font-mono font-black uppercase tracking-[0.4em] text-blue-400">
            Song Ranker
          </p>
          <h1 className="text-7xl font-black tracking-tighter uppercase italic">
            My Favorite Tracks
          </h1>
        </div>

        {/* Number 1 Spot */}
        {top1 && (
          <div className="flex flex-col items-center gap-8 w-full animate-in fade-in zoom-in duration-1000">
            <div className="relative">
              <div className="absolute -inset-4 bg-blue-500/20 blur-2xl rounded-3xl" />
              {top1.cover_url ? (
                <img
                  src={top1.cover_url}
                  alt={top1.name}
                  className="w-80 h-80 rounded-3xl object-cover shadow-2xl relative z-10 border-4 border-white/10"
                  crossOrigin="anonymous"
                />
              ) : (
                <div className="w-80 h-80 rounded-3xl bg-white/5 flex items-center justify-center relative z-10 border-4 border-white/10">
                  <Music className="w-24 h-24 text-white/20" />
                </div>
              )}
              <div className="absolute -top-6 -left-6 w-20 h-20 bg-blue-500 rounded-full flex items-center justify-center text-4xl font-black italic shadow-lg z-20">
                #1
              </div>
            </div>
            <div className="text-center space-y-1">
              <h2 className="text-5xl font-black uppercase tracking-tight max-w-2xl px-4">
                {top1.name}
              </h2>
              <p className="text-3xl font-mono text-white/60 uppercase tracking-widest">
                {top1.artist}
              </p>
            </div>
          </div>
        )}

        {/* The Rest of the Top 10 */}
        <div className="w-full max-w-3xl space-y-2">
          {others.map((song, index) => (
            <div 
              key={song.song_id} 
              className="flex items-center gap-6 p-4 rounded-2xl bg-white/5 border border-white/10"
            >
              <div className="w-20 text-3xl font-black font-mono text-white/20 italic">
                #{index + 2}
              </div>
              {song.cover_url ? (
                <img
                  src={song.cover_url}
                  alt={song.name}
                  className="w-20 h-20 rounded-lg object-cover shadow-lg"
                  crossOrigin="anonymous"
                />
              ) : (
                <div className="w-20 h-20 rounded-lg bg-white/5 flex items-center justify-center">
                  <Music className="w-8 h-8 text-white/20" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h3 className="text-2xl font-bold truncate uppercase tracking-tight">
                  {song.name}
                </h3>
                <p className="text-lg font-mono text-white/40 uppercase truncate">
                  {song.artist}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="w-full flex justify-between items-end border-t border-white/10 pt-10 relative z-10">
        <div className="space-y-1">
          <p className="text-xl font-mono text-white/40 uppercase tracking-widest">
            Ranked with
          </p>
          <p className="text-3xl font-black uppercase tracking-tighter text-blue-400">
            SongRanker.io
          </p>
        </div>
        <div className="text-right">
          <p className="text-xl font-mono text-white/40 uppercase tracking-widest">
            {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </p>
        </div>
      </div>
    </div>
  );
}
