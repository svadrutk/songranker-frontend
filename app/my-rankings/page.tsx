import { MyRankingsOverview } from "@/components/MyRankingsOverview";

export default function MyRankings() {
  return (
    <div className="flex flex-col min-h-0 h-full w-full py-4 md:py-8 overflow-y-auto px-4 md:px-8">
      <MyRankingsOverview />
    </div>
  );
}
