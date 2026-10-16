import { env } from "@/lib/env";
import { logger } from "@/lib/logger";
import type { WsEnvelope } from "@/types";

type Listener = (envelope: WsEnvelope) => void;

class WebSocketClient {
  private url: string;
  private ws: WebSocket | null = null;
  private listeners: Set<Listener> = new Set();
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
  private isExplicitlyClosed = false;

  constructor(endpoint: "/ws/events" | "/ws/alerts") {
    const base = env.NEXT_PUBLIC_WS_URL.replace(/\/$/, "");
    this.url = `${base}${endpoint}`;
  }

  public connect(): void {
    if (typeof window === "undefined") return;
    if (this.ws && (this.ws.readyState === WebSocket.CONNECTING || this.ws.readyState === WebSocket.OPEN)) {
      return;
    }

    this.isExplicitlyClosed = false;

    try {
      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        logger.info(`WebSocket connected to ${this.url}`);
      };

      this.ws.onmessage = (event: MessageEvent) => {
        try {
          const envelope = JSON.parse(event.data as string) as WsEnvelope;
          this.listeners.forEach((listener) => listener(envelope));
        } catch (err) {
          logger.warn("Received malformed WebSocket message", err);
        }
      };

      this.ws.onclose = () => {
        logger.info(`WebSocket closed: ${this.url}`);
        this.scheduleReconnect();
      };

      this.ws.onerror = (err) => {
        logger.error(`WebSocket error on ${this.url}`, err);
        this.ws?.close();
      };
    } catch (err) {
      logger.error(`Failed to initialize WebSocket: ${this.url}`, err);
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect(): void {
    if (this.isExplicitlyClosed) return;
    if (this.reconnectTimeout) clearTimeout(this.reconnectTimeout);
    this.reconnectTimeout = setTimeout(() => {
      this.connect();
    }, 3000);
  }

  public subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    if (this.listeners.size === 1) {
      this.connect();
    }

    return () => {
      this.listeners.delete(listener);
      if (this.listeners.size === 0) {
        this.close();
      }
    };
  }

  public close(): void {
    this.isExplicitlyClosed = true;
    if (this.reconnectTimeout) clearTimeout(this.reconnectTimeout);
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

export const eventsWs = new WebSocketClient("/ws/events");
export const alertsWs = new WebSocketClient("/ws/alerts");
