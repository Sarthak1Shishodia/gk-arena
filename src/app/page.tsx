import TimelineBoard from "@/features/timeline-game/TimelineBoard";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-950 text-white py-12 px-4">
      <div className="max-w-3xl mx-auto text-center mb-10">
        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
          GK Arena
        </h1>
        <p className="text-slate-400 text-sm mt-2">
          Master History, Geography & Science through daily rapid-fire challenges.
        </p>
      </div>

      <TimelineBoard />
    </main>
  );
}
