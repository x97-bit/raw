import { Server as HttpServer } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { verifyAccessToken } from "./appAuth";

// ============================================================================
// WebSocket Server for Real-Time Updates
// ============================================================================
// Provides real-time push notifications to connected clients when data changes.
// Supports:
// - Transaction mutations (create, update, delete)
// - Financial report invalidation
// - System notifications
// ============================================================================

type WSClient = {
  ws: WebSocket;
  userId: number;
  username: string;
  subscribedPorts: Set<string>;
  lastPing: number;
};

type WSEvent = {
  type: "transaction:created" | "transaction:updated" | "transaction:deleted"
    | "debt:created" | "debt:updated" | "debt:deleted"
    | "expense:created" | "expense:updated" | "expense:deleted"
    | "account:updated"
    | "report:invalidated"
    | "notification";
  payload: Record<string, unknown>;
  portId?: string;
  accountType?: string;
  timestamp: number;
  userId?: number;
};

let _wss: WebSocketServer | null = null;
const _clients = new Map<string, WSClient>();
const HEARTBEAT_INTERVAL = 30_000; // 30 seconds
const CLIENT_TIMEOUT = 60_000; // 60 seconds without pong

/**
 * Initialize WebSocket server attached to the existing HTTP server.
 */
export function initWebSocket(server: HttpServer): WebSocketServer {
  _wss = new WebSocketServer({
    server,
    path: "/ws",
    maxPayload: 64 * 1024, // 64KB max message size
  });

  _wss.on("connection", async (ws, req) => {
    const clientId = generateClientId();

    // Authenticate via query param token or cookie
    const url = new URL(req.url || "/", `http://${req.headers.host}`);
    const token = url.searchParams.get("token");

    if (!token) {
      ws.close(4001, "Authentication required");
      return;
    }

    try {
      const decoded = verifyAccessToken(token);
      if (!decoded || !decoded.userId) {
        ws.close(4001, "Invalid token");
        return;
      }

      const client: WSClient = {
        ws,
        userId: decoded.userId,
        username: decoded.username || "unknown",
        subscribedPorts: new Set(),
        lastPing: Date.now(),
      };

      _clients.set(clientId, client);

      // Send connection confirmation
      sendToClient(ws, {
        type: "connected",
        clientId,
        timestamp: Date.now(),
      });

      // Handle incoming messages (subscriptions, pong)
      ws.on("message", (data) => {
        try {
          const message = JSON.parse(data.toString());
          handleClientMessage(clientId, client, message);
        } catch {
          // Ignore malformed messages
        }
      });

      ws.on("pong", () => {
        client.lastPing = Date.now();
      });

      ws.on("close", () => {
        _clients.delete(clientId);
      });

      ws.on("error", () => {
        _clients.delete(clientId);
      });
    } catch {
      ws.close(4001, "Authentication failed");
    }
  });

  // Start heartbeat interval
  const heartbeatTimer = setInterval(() => {
    const now = Date.now();
    for (const [id, client] of _clients.entries()) {
      if (now - client.lastPing > CLIENT_TIMEOUT) {
        client.ws.terminate();
        _clients.delete(id);
        continue;
      }
      if (client.ws.readyState === WebSocket.OPEN) {
        client.ws.ping();
      }
    }
  }, HEARTBEAT_INTERVAL);

  _wss.on("close", () => {
    clearInterval(heartbeatTimer);
  });

  console.info("[WebSocket] Server initialized on /ws");
  return _wss;
}

/**
 * Handle messages from connected clients.
 */
function handleClientMessage(
  _clientId: string,
  client: WSClient,
  message: Record<string, unknown>
) {
  switch (message.type) {
    case "subscribe:port":
      if (typeof message.portId === "string") {
        client.subscribedPorts.add(message.portId);
      }
      break;

    case "unsubscribe:port":
      if (typeof message.portId === "string") {
        client.subscribedPorts.delete(message.portId);
      }
      break;

    case "ping":
      sendToClient(client.ws, { type: "pong", timestamp: Date.now() });
      break;
  }
}

/**
 * Broadcast an event to all connected clients that are subscribed to the relevant port.
 * If no portId is specified, the event is sent to all clients.
 */
export function broadcastEvent(event: WSEvent): void {
  if (!_wss || _clients.size === 0) return;

  const message = JSON.stringify({
    type: event.type,
    payload: event.payload,
    portId: event.portId,
    accountType: event.accountType,
    timestamp: event.timestamp,
  });

  for (const [, client] of _clients) {
    // Skip the user who triggered the event (they already have the update)
    if (event.userId && client.userId === event.userId) continue;

    // Check if client is subscribed to this port
    if (event.portId && !client.subscribedPorts.has(event.portId)) continue;

    if (client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(message);
    }
  }
}

/**
 * Send a targeted notification to a specific user.
 */
export function sendToUser(userId: number, event: Omit<WSEvent, "timestamp">): void {
  if (!_wss || _clients.size === 0) return;

  const message = JSON.stringify({
    ...event,
    timestamp: Date.now(),
  });

  for (const [, client] of _clients) {
    if (client.userId === userId && client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(message);
    }
  }
}

/**
 * Get the count of currently connected clients.
 */
export function getConnectedClientsCount(): number {
  return _clients.size;
}

/**
 * Gracefully close all WebSocket connections.
 */
export function closeWebSocket(): void {
  if (_wss) {
    for (const [, client] of _clients) {
      client.ws.close(1001, "Server shutting down");
    }
    _clients.clear();
    _wss.close();
    _wss = null;
  }
}

// ============================================================================
// Helper functions
// ============================================================================

function sendToClient(ws: WebSocket, data: Record<string, unknown>): void {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(data));
  }
}

function generateClientId(): string {
  return `ws_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
}

// ============================================================================
// Event emitter helpers for use in route handlers
// ============================================================================

/**
 * Emit a transaction mutation event.
 * Call this after successfully creating, updating, or deleting a transaction.
 */
export function emitTransactionEvent(
  action: "created" | "updated" | "deleted",
  transaction: { id: number; portId?: string; accountType?: string; accountId?: number },
  userId?: number
): void {
  broadcastEvent({
    type: `transaction:${action}`,
    payload: {
      transactionId: transaction.id,
      accountId: transaction.accountId,
    },
    portId: transaction.portId,
    accountType: transaction.accountType,
    timestamp: Date.now(),
    userId,
  });
}

/**
 * Emit a debt mutation event.
 */
export function emitDebtEvent(
  action: "created" | "updated" | "deleted",
  debt: { id: number; portId?: string; accountId?: number },
  userId?: number
): void {
  broadcastEvent({
    type: `debt:${action}`,
    payload: {
      debtId: debt.id,
      accountId: debt.accountId,
    },
    portId: debt.portId,
    timestamp: Date.now(),
    userId,
  });
}

/**
 * Emit a report invalidation event.
 * Tells clients to refresh their cached reports.
 */
export function emitReportInvalidation(portId?: string, accountType?: string): void {
  broadcastEvent({
    type: "report:invalidated",
    payload: { reason: "data_mutation" },
    portId,
    accountType,
    timestamp: Date.now(),
  });
}
