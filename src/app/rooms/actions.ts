"use server";

import { AccessToken, TrackSource } from "livekit-server-sdk";

export async function getLiveKitToken(roomName: string, participantName: string) {
  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;
  if (!apiKey || !apiSecret) {
    throw new Error("LiveKit is not configured.");
  }

  const room = roomName.trim();
  const name = participantName.trim();
  if (!room || !name) {
    throw new Error("Room name and display name are required.");
  }

  const token = new AccessToken(apiKey, apiSecret, {
    identity: name,
    name,
    ttl: "2h",
  });

  token.addGrant({
    roomJoin: true,
    room,
    canSubscribe: true,
    canPublish: true,
    canPublishData: true,
    canPublishSources: [TrackSource.CAMERA, TrackSource.MICROPHONE],
  });

  return token.toJwt();
}
