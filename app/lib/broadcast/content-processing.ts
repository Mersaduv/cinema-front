"use client";

import Pusher, { type Channel } from "pusher-js";
import { tokenStorage } from "../token-storage";

export type ContentProcessingEntityType = "movie" | "series";

export interface ContentProcessingUpdate {
  entity_type: ContentProcessingEntityType;
  entity_id: number;
  processing_status: string;
  image_status?: string | null;
  pipeline_status?: string | null;
  processing_error?: string | null;
  slug?: string | null;
}

type UpdateHandler = (update: ContentProcessingUpdate) => void;

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8005/api";

function readBroadcastConfig() {
  const key = process.env.NEXT_PUBLIC_REVERB_APP_KEY?.trim();

  if (!key) {
    return null;
  }

  const host = process.env.NEXT_PUBLIC_REVERB_HOST?.trim() || "localhost";
  const port = Number(process.env.NEXT_PUBLIC_REVERB_PORT || 8080);
  const scheme = process.env.NEXT_PUBLIC_REVERB_SCHEME?.trim() || "http";

  return { key, host, port, scheme };
}

let sharedClient: Pusher | null = null;

function getSharedClient(): Pusher | null {
  const config = readBroadcastConfig();
  const token = tokenStorage.getToken();

  if (!config || !token) {
    return null;
  }

  if (sharedClient) {
    return sharedClient;
  }

  sharedClient = new Pusher(config.key, {
    cluster: "mt1",
    wsHost: config.host,
    wsPort: config.port,
    wssPort: config.port,
    forceTLS: config.scheme === "https",
    enabledTransports: ["ws", "wss"],
    authEndpoint: `${API_BASE_URL}/broadcasting/auth`,
    auth: {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    },
  });

  return sharedClient;
}

export function isContentProcessingBroadcastAvailable(): boolean {
  return readBroadcastConfig() !== null && tokenStorage.getToken() !== null;
}

export function subscribeContentProcessingUpdates(
  entityType: ContentProcessingEntityType,
  entityId: number,
  handler: UpdateHandler,
): () => void {
  const client = getSharedClient();

  if (!client) {
    return () => undefined;
  }

  const channelName = `private-${entityType}.${entityId}`;
  const channel: Channel = client.subscribe(channelName);

  const eventHandler = (payload: ContentProcessingUpdate) => {
    handler(payload);
  };

  channel.bind("content.processing.updated", eventHandler);

  return () => {
    channel.unbind("content.processing.updated", eventHandler);

    if (client.connection.state === "connected") {
      client.unsubscribe(channelName);
    }
  };
}

export function resetContentProcessingBroadcastClient(): void {
  if (sharedClient) {
    sharedClient.disconnect();
    sharedClient = null;
  }
}
