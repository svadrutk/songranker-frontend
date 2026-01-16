"use client";

import { Button } from "@/components/ui/button";

export default function SongRanker() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="flex items-center gap-4">
        <Button variant="outline" className="h-64 w-64" aria-label="Rank option 1" />
        <div className="flex flex-col gap-4">
          <Button variant="outline" className="h-28 w-40" aria-label="Rank option 2" />
          <Button variant="outline" className="h-28 w-40" aria-label="Rank option 3" />
        </div>
        <Button variant="outline" className="h-64 w-64" aria-label="Rank option 4" />
      </div>
    </div>
  );
}
