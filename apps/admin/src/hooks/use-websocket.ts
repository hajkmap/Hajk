import { useEffect, useCallback, useRef } from "react";
import useWebSocketStore, {
  WebSocketMessage,
} from "../store/use-websocket-store";

interface UseWebSocketOptions {
  /** Auto-connect when the hook mounts */
  autoConnect?: boolean;
  /** Handler for specific message types */
  onMessage?: (message: WebSocketMessage) => void;
  /** Filter messages by type(s) */
  messageTypes?: string[];
  /** Callback when connection is established */
  onConnect?: () => void;
  /** Callback when connection is lost */
  onDisconnect?: () => void;
}

/**
 * Custom hook for WebSocket communication
 *
 * @example
 * ```tsx
 * // Basic usage
 * const { isConnected, sendMessage } = useWebSocket("ws://localhost:3002/ws");
 *
 * // With message handler
 * const { isConnected } = useWebSocket("ws://localhost:3002/ws", {
 *   onMessage: (msg) => console.log("Received:", msg),
 *   messageTypes: ["layer-update", "config-change"],
 * });
 * ```
 */
export function useWebSocket(url: string, options: UseWebSocketOptions = {}) {
  const {
    autoConnect = true,
    onMessage,
    messageTypes,
    onConnect,
    onDisconnect,
  } = options;

  const {
    socket,
    isConnected,
    isReconnecting,
    lastMessage,
    messages,
    connectionError,
    connect,
    disconnect,
    sendMessage,
    clearMessages,
  } = useWebSocketStore();

  // Track previous connection state for callbacks
  const prevConnected = useRef(isConnected);

  // Handle connection/disconnection callbacks
  useEffect(() => {
    if (isConnected && !prevConnected.current) {
      onConnect?.();
    } else if (!isConnected && prevConnected.current) {
      onDisconnect?.();
    }
    prevConnected.current = isConnected;
  }, [isConnected, onConnect, onDisconnect]);

  // Auto-connect on mount
  useEffect(() => {
    if (autoConnect && url) {
      connect(url);
    }

    // Disconnect on unmount
    return () => {
      // Only disconnect if this component initiated the connection
      // In a real app, you might want more sophisticated connection management
    };
  }, [autoConnect, url, connect]);

  // Handle incoming messages
  useEffect(() => {
    if (!lastMessage || !onMessage) return;

    // If messageTypes is specified, filter messages
    if (messageTypes && messageTypes.length > 0) {
      if (messageTypes.includes(lastMessage.type)) {
        onMessage(lastMessage);
      }
    } else {
      // No filter, call handler for all messages
      onMessage(lastMessage);
    }
  }, [lastMessage, onMessage, messageTypes]);

  // Memoized send function with type
  const send = useCallback(
    (type: string, payload: unknown) => {
      sendMessage({ type, payload });
    },
    [sendMessage]
  );

  // Get messages filtered by type
  const getMessagesByType = useCallback(
    (type: string) => {
      return messages.filter((msg) => msg.type === type);
    },
    [messages]
  );

  return {
    // State
    socket,
    isConnected,
    isReconnecting,
    lastMessage,
    messages,
    connectionError,

    // Actions
    connect: () => connect(url),
    disconnect,
    send,
    sendMessage,
    clearMessages,

    // Utilities
    getMessagesByType,
  };
}

/**
 * Hook to subscribe to specific WebSocket message types
 *
 * @example
 * ```tsx
 * useWebSocketSubscription(["layer-update"], (message) => {
 *   console.log("Layer updated:", message.payload);
 * });
 * ```
 */
export function useWebSocketSubscription(
  messageTypes: string[],
  handler: (message: WebSocketMessage) => void
) {
  const { lastMessage } = useWebSocketStore();
  const handlerRef = useRef(handler);

  // Keep handler ref updated
  useEffect(() => {
    handlerRef.current = handler;
  }, [handler]);

  useEffect(() => {
    if (!lastMessage) return;

    if (messageTypes.includes(lastMessage.type)) {
      handlerRef.current(lastMessage);
    }
  }, [lastMessage, messageTypes]);
}

export default useWebSocket;
