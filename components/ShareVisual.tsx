"use client";

import { useMemo, type JSX } from "react";
import type { SessionSong } from "@/lib/api";

type ShareVisualProps = {
  songs: SessionSong[];
  orderId: number;
  dateStr: string;
  timeStr: string;
};

export function ShareVisual({ songs, orderId, dateStr, timeStr }: ShareVisualProps): JSX.Element {
  const top10 = songs.slice(0, 10);
  
  const barcodePattern = useMemo(() => {
    // Generate a pseudo-random but stable pattern based on the songs
    const seed = songs.reduce((acc, s) => acc + s.name.length, 0);
    return [...Array(80)].map((_, i) => ({
      width: [1, 2, 4, 6][(seed + i) % 4],
      visible: ((seed * (i + 1)) % 10) > 1
    }));
  }, [songs]);

  return (
    <div 
      id="share-visual"
      className="w-[1080px] bg-black p-20 flex flex-col items-center justify-start font-mono"
      style={{ minHeight: '1200px' }}
    >
      {/* Receipt Paper */}
      <div className="w-[850px] bg-[#1a1a1a] text-white flex flex-col relative shadow-[0_50px_100px_rgba(0,0,0,0.5)]">
        {/* Top Jagged Edge */}
        <div className="absolute -top-6 left-0 w-full h-6 overflow-hidden flex">
          {[...Array(30)].map((_, i) => (
            <div key={i} className="w-8 h-8 bg-[#1a1a1a] rotate-45 transform origin-bottom-left shrink-0" style={{ marginTop: '16px' }} />
          ))}
        </div>

        {/* Receipt Header */}
        <div className="p-16 text-center border-b-2 border-dashed border-white/10">
          <h1 className="text-6xl font-black tracking-tighter uppercase mb-4">SongRanker</h1>
          <div className="space-y-1 text-2xl font-bold opacity-40">
            <p>ORDER #SR-{orderId}</p>
            <p>{dateStr} @ {timeStr}</p>
          </div>
        </div>

        {/* List Section */}
        <div className="px-16 py-12 space-y-10">
          <div className="flex justify-between text-3xl font-black uppercase border-b-2 border-white/5 pb-6">
            <span>TRACK / ARTIST</span>
            <span>QTY</span>
          </div>
          
          <div className="space-y-12">
            {top10.map((song, index) => (
              <div key={song.song_id} className="flex justify-between items-center">
                <div className="flex items-center gap-6 flex-1 min-w-0 pr-8">
                  <div className="w-20 h-20 shrink-0 border border-white/10 overflow-hidden bg-white/5">
                    {song.cover_url ? (
                      <img 
                        src={song.cover_url} 
                        alt={song.name} 
                        className="w-full h-full object-cover"
                        crossOrigin="anonymous"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center opacity-20">
                        ?
                      </div>
                    )}
                  </div>
                  <div className="flex items-start gap-4 min-w-0">
                    <span className="text-4xl font-black opacity-20 w-12 shrink-0">{index + 1}</span>
                    <div className="min-w-0">
                      <p className="text-4xl font-black uppercase tracking-tight leading-none mb-2 truncate">
                        {song.name}
                      </p>
                      <p className="text-2xl font-bold opacity-40 uppercase tracking-widest truncate">
                        {song.artist}
                      </p>
                    </div>
                  </div>
                </div>
                <span className="text-3xl font-black opacity-20 shrink-0">1x</span>
              </div>
            ))}
          </div>
        </div>

        {/* Barcode / Footer */}
        <div className="px-16 pb-20 pt-10 flex flex-col items-center gap-10">
          <div className="w-full flex flex-col gap-3">
             <div className="w-full h-32 flex items-stretch gap-1">
                {barcodePattern.map((bar, i) => (
                  <div 
                    key={i} 
                    className="bg-white flex-1" 
                    style={{ 
                      opacity: bar.visible ? 0.9 : 0,
                      flexGrow: bar.width
                    }} 
                  />
                ))}
              </div>
              <p className="text-center text-2xl font-bold opacity-20 tracking-[1em] ml-[1em]">
                SONGRANKER.APP
              </p>
          </div>
        </div>
      </div>
    </div>
  );
}
