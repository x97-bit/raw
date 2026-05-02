import { useEffect, useRef, useCallback, useState } from "react";

// ============================================================================
// useWebSocket Hook
// ============================================================================
// Provides real-time updates from the server via WebSocket connection.
// Automatically reconnects on disconnection and handles authentication.
// ============================================================================

const WS_RECONNECT_DELAY = 3000; // 3 seconds
const WS_MAX_RECONNECT_ATTEMPTS = 10;
const WS_PING_INTERVAL = 25000; // 25 seconds

/**
 * WebSocket hook for real-time data updates.
 * 
 * @param {Object} options
 * @param {string} options.token - JWT access token for authentication
 * @param {string[]} options.subscribePorts - Port IDs to subscribe to
 * @param {function} options.onEvent - Callback when an event is received
 * @param {boolean} options.enabled - Whether the connection should be active
 * @returns {Object} WebSocket state and controls
 */
export function useWebSocket({ token, subscribePorts = [], onEvent, enabled = true }) {
  const wsRef = useRef(null);
  const reconnectAttempts = useRef(0);
  const reconnectTimer = useRef(null);
  const pingTimer = useRef(null);
  const [connected, setConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState(null);

  const cleanup = useCallback(() => {
    if (reconnectTimer.current) {
      clearTimeout(reconnectTimer.current);
      reconnectTimer.current = null;
    }
    if (pingTimer.current) {
      clearInterval(pingTimer.current);
      pingTimer.current = null;
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setConnected(false);
  }, []);

  const connect = useCallback(() => {
    if (!token || !enabled) return;

    cleanup();

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const host = window.location.host;
    const url = `${protocol}//${host}/ws?token=${encodeURIComponent(token)}`;

    try {
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        setConnected(true);
        reconnectAttempts.current = 0;

        // Subscribe to ports
        for (const portId of subscribePorts) {
          ws.send(JSON.stringify({ type: "subscribe:port", portId }));
        }

        // Start ping interval
        pingTimer.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: "ping" }));
          }
        }, WS_PING_INTERVAL);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          setLastEvent(data);
          if (onEvent) {
            onEvent(data);
          }
        } catch {
          // Ignore malformed messages
        }
      };

      ws.onclose = (event) => {
        setConnected(false);
        if (pingTimer.current) {
          clearInterval(pingTimer.current);
          pingTimer.current = null;
        }

        // Don't reconnect if intentionally closed or auth failed
        if (event.code === 4001 || event.code === 1000) return;

        // Attempt reconnection
        if (reconnectAttempts.current < WS_MAX_RECONNECT_ATTEMPTS) {
          reconnectAttempts.current += 1;
          const delay = WS_RECONNECT_DELAY * Math.min(reconnectAttempts.current, 5);
          reconnectTimer.current = setTimeout(connect, delay);
        }
      };

      ws.onerror = () => {
        // Error handling is done in onclose
      };
    } catch {
      // Connection failed, will retry
      if (reconnectAttempts.current < WS_MAX_RECONNECT_ATTEMPTS) {
        reconnectAttempts.current += 1;
        reconnectTimer.current = setTimeout(connect, WS_RECONNECT_DELAY);
      }
    }
  }, [token, enabled, subscribePorts, onEvent, cleanup]);

  // Connect on mount and when dependencies change
  useEffect(() => {
    if (enabled && token) {
      connect();
    }
    return cleanup;
  }, [enabled, token, connect, cleanup]);

  // Update subscriptions when ports change
  useEffect(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      for (const portId of subscribePorts) {
        wsRef.current.send(JSON.stringify({ type: "subscribe:port", portId }));
      }
    }
  }, [subscribePorts]);

  const sendMessage = useCallback((message) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    }
  }, []);

  return {
    connected,
    lastEvent,
    sendMessage,
    reconnect: connect,
    disconnect: cleanup,
  };
}

/**
 * Simplified hook for components that just need to know when data changes.
 * Triggers a callback when relevant data mutations occur.
 * 
 * @param {Object} options
 * @param {string} options.token - JWT access token
 * @param {string} options.portId - Current port ID to watch
 * @param {function} options.onDataChange - Called when data changes (should trigger refetch)
 */
export function useRealtimeRefresh({ token, portId, onDataChange }) {
  const handleEvent = useCallback((event) => {
    if (!event || !event.type) return;

    // Check if this event is relevant to our current view
    const mutationTypes = [
      "transaction:created",
      "transaction:updated",
      "transaction:deleted",
      "debt:created",
      "debt:updated",
      "debt:deleted",
      "expense:created",
      "expense:updated",
      "expense:deleted",
      "account:updated",
      "report:invalidated",
    ];

    if (mutationTypes.includes(event.type)) {
      if (onDataChange) {
        onDataChange(event);
      }
    }
  }, [onDataChange]);

  return useWebSocket({
    token,
    subscribePorts: portId ? [portId] : [],
    onEvent: handleEvent,
    enabled: Boolean(token),
  });
}
