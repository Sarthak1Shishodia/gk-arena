import { Suspense } from "react";
import { connection } from "next/server";
import InterviewStage from "./interview-stage";
import { getLiveKitToken } from "../actions";

export default function InterviewRoomPage({
  params,
  searchParams,
}: {
  params: Promise<{ roomName: string }>;
  searchParams: Promise<{ name?: string }>;
}) {
  return (
    <Suspense fallback={<RoomFallback />}>
      <RoomSession params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function RoomSession({
  params,
  searchParams,
}: {
  params: Promise<{ roomName: string }>;
  searchParams: Promise<{ name?: string }>;
}) {
  await connection();
  const { roomName } = await params;
  const { name } = await searchParams;
  const participantName = name?.trim() ?? "";
  const serverUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL;

  let token: string | null = null;
  let error: string | null = null;

  if (!participantName) {
    error = "Open this room from the lobby so it has a display name.";
  } else if (!serverUrl) {
    error = "The LiveKit server URL is missing.";
  } else {
    try {
      token = await getLiveKitToken(roomName, participantName);
    } catch (reason) {
      error = reason instanceof Error ? reason.message : "Could not start the interview room.";
    }
  }

  return <InterviewStage roomName={roomName} token={token} serverUrl={serverUrl} error={error} />;
}

function RoomFallback() {
  return (
    <main className="flex h-[calc(100vh-4rem)] items-center justify-center bg-slate-950 px-4 text-sm text-slate-400">
      Connecting to the interview room…
    </main>
  );
}
