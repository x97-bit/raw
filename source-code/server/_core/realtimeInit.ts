import type { Server as HttpServer } from "http";
import { initWebSocket, closeWebSocket, getConnectedClientsCount } from "./websocket";

// ============================================================================
// Real-time Layer Initialization
// ============================================================================
// Initializes WebSocket server for real-time push notifications.
// This module should be called once during server startup after the HTTP
// server is created but before it starts listening.
// ============================================================================

let _initialized = false;

/**
 * Initialize the real-time layer (WebSocket server).
 * Must be called after the HTTP server is created.
 */
export function initRealtimeLayer(httpServer: HttpServer): void {
  if (_initialized) {
    console.warn("[Realtime] Already initialized, skipping.");
    return;
  }

  initWebSocket(httpServer);
  _initialized = true;
  console.info("[Realtime] WebSocket server initialized.");
}

/**
 * Get real-time layer status for health checks.
 */
export function getRealtimeStatus(): { active: boolean; clients: number } {
  return {
    active: _initialized,
    clients: getConnectedClientsCount(),
  };
}

/**
 * Gracefully shut down the real-time layer.
 */
export function shutdownRealtimeLayer(): void {
  closeWebSocket();
  _initialized = false;
}
