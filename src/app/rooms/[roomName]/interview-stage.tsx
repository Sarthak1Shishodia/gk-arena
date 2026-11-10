"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { LiveKitRoom, VideoConference, useRoomContext } from "@livekit/components-react";
import "@livekit/components-styles";
import { RoomEvent, type LocalTrackPublication, type Room } from "livekit-client";
import { DoorOpen, Video } from "lucide-react";

type InterviewStageProps = {
  roomName: string;
  token: string | null;
  serverUrl?: string;
  error: string | null;
};

function stopPublication(publication: LocalTrackPublication) {
  const mediaTrack = publication.track?.mediaStreamTrack;
  try {
    publication.track?.stop();
  } catch {
    // The track may already be stopped.
  }
  try {
    mediaTrack?.stop();
  } catch {
    // The hardware light is already off.
  }
}

async function releaseRoom(room: Room) {
  const publications = [...room.localParticipant.trackPublications.values()];
  publications.forEach(stopPublication);
  try {
    await room.localParticipant.setCameraEnabled(false);
    await room.localParticipant.setMicrophoneEnabled(false);
    await room.localParticipant.setScreenShareEnabled(false);
  } catch {
    // The participant can already be disconnected.
  }
  [...room.localParticipant.trackPublications.values()].forEach(stopPublication);
  try {
    await room.disconnect(true);
  } catch {
    // The room can already be disconnected.
  }
}

function RoomPrivacy({ onLeave }: { onLeave: () => void }) {
  const room = useRoomContext();
  const released = useRef(false);

  useEffect(() => {
    const release = () => {
      if (released.current) return;
      released.current = true;
      void releaseRoom(room);
    };
    room.on(RoomEvent.LocalTrackUnpublished, stopPublication);
    window.addEventListener("pagehide", release);
    return () => {
      room.off(RoomEvent.LocalTrackUnpublished, stopPublication);
      window.removeEventListener("pagehide", release);
      release();
    };
  }, [room]);

  return (
    <button
      type="button"
      onClick={() => {
        if (!released.current) {
          released.current = true;
          void releaseRoom(room).finally(onLeave);
          return;
        }
        onLeave();
      }}
      className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:border-rose-400 hover:text-rose-200"
    >
      <DoorOpen className="h-4 w-4" />
      Leave Room
    </button>
  );
}

export default function InterviewStage({ roomName, token, serverUrl, error }: InterviewStageProps) {
  const router = useRouter();
  const [notice, setNotice] = useState<string | null>(null);
  const roomError = error;

  const leaveRoom = () => {
    router.push("/rooms");
  };

  return (
    <main className="flex h-[calc(100vh-4rem)] flex-col bg-slate-950 text-white">
      <header className="flex items-center justify-between gap-3 border-b border-slate-800 bg-slate-950/90 px-4 py-3">
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-indigo-300">
            <Video className="h-3.5 w-3.5 shrink-0" />
            Mock interview
          </p>
          <h1 className="truncate text-lg font-bold">{roomName || "Room"}</h1>
        </div>
        {(!token || roomError || !serverUrl) && (
          <button
            type="button"
            onClick={leaveRoom}
            className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:border-rose-400 hover:text-rose-200"
          >
            <DoorOpen className="h-4 w-4" />
            Leave Room
          </button>
        )}
      </header>

      <section className="min-h-0 flex-1">
        {roomError && (
          <div className="mx-auto mt-10 max-w-lg rounded-2xl border border-rose-500/40 bg-rose-500/10 px-4 py-4 text-sm text-rose-100">
            <p>{roomError}</p>
            <button type="button" onClick={leaveRoom} className="mt-3 font-semibold text-white underline">
              Back to the lobby
            </button>
          </div>
        )}

        {!roomError && token && serverUrl && (
          <LiveKitRoom
            token={token}
            serverUrl={serverUrl}
            connect
            audio
            video
            data-lk-theme="default"
            className="h-full bg-slate-950"
            onError={(nextError) => setNotice(nextError.message)}
          >
            <div className="flex h-full min-h-0 flex-col">
              <div className="flex items-center justify-between gap-3 border-b border-slate-800 bg-slate-950 px-4 py-3">
                <p className="text-sm text-slate-300">
                  Camera and microphone turn off when you leave.
                </p>
                <RoomPrivacy onLeave={leaveRoom} />
              </div>
              {notice && <p className="px-4 py-2 text-sm text-rose-200">{notice}</p>}
              <div className="relative min-h-0 flex-1">
                <div className="absolute inset-0">
                  <VideoConference />
                </div>
              </div>
            </div>
          </LiveKitRoom>
        )}
      </section>
    </main>
  );
}
