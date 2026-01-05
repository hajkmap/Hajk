import { create } from "zustand";

export interface WebSocketMessage {
  type: string;
  payload: unknown;
  timestamp: number;
}

interface WebSocketState {
  socket: WebSocket | null;
  isConnected: boolean;
  isReconnecting: boolean;
  lastMessage: WebSocketMessage | null;
  messages: WebSocketMessage[];
  connectionError: string | null;
  reconnectAttempts: number;

  connect: (url: string) => void;
  disconnect: () => void;
  sendMessage: (message: unknown) => void;
  clearMessages: () => void;
}

const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_DELAY_BASE = 1000; // 1 second base delay

let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;

const useWebSocketStore = create<WebSocketState>((set, get) => ({
  socket: null,
  isConnected: false,
  isReconnecting: false,
  lastMessage: null,
  messages: [],
  connectionError: null,
  reconnectAttempts: 0,

  connect: (url: string) => {
    const { socket: existingSocket, reconnectAttempts } = get();

    // Close existing socket if any
    if (existingSocket) {
      existingSocket.close();
    }

    // Clear any pending reconnect timeout
    if (reconnectTimeout) {
      clearTimeout(reconnectTimeout);
      reconnectTimeout = null;
    }

    try {
      const socket = new WebSocket(url);

      socket.onopen = () => {
        set({
          isConnected: true,
          isReconnecting: false,
          socket,
          connectionError: null,
          reconnectAttempts: 0,
        });
        console.log("[WebSocket] Connected to", url);
      };

      socket.onmessage = (event: MessageEvent) => {
        const rawData = event.data as string;
        let message: WebSocketMessage;

        try {
          // Try to parse as JSON first
          const data = JSON.parse(rawData) as {
            type: string;
            payload: unknown;
          };
          message = {
            type: data.type ?? "unknown",
            payload: data.payload ?? data,
            timestamp: Date.now(),
          };
        } catch {
          // If not JSON, treat as plain text message
          // Determine message type from content
          let type = "text";
          if (rawData.startsWith("Health check")) {
            type = "health-check";
          } else if (rawData.startsWith("Broadcast")) {
            type = "broadcast";
          } else if (rawData.startsWith("Hello")) {
            type = "welcome";
          }

          message = {
            type,
            payload: rawData,
            timestamp: Date.now(),
          };
        }

        set((state) => ({
          lastMessage: message,
          messages: [...state.messages.slice(-99), message], // Keep last 100 messages
        }));
      };

      socket.onclose = (event) => {
        set({ isConnected: false, socket: null });
        console.log("[WebSocket] Disconnected", event.code, event.reason);

        // Attempt reconnection if not a clean close
        if (!event.wasClean && reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
          const delay = RECONNECT_DELAY_BASE * Math.pow(2, reconnectAttempts);
          console.log(
            `[WebSocket] Reconnecting in ${delay}ms (attempt ${
              reconnectAttempts + 1
            }/${MAX_RECONNECT_ATTEMPTS})`
          );

          set({
            isReconnecting: true,
            reconnectAttempts: reconnectAttempts + 1,
          });

          reconnectTimeout = setTimeout(() => {
            get().connect(url);
          }, delay);
        }
      };

      socket.onerror = (error) => {
        console.error("[WebSocket] Error:", error);
        set({ connectionError: "WebSocket connection error" });
      };

      set({ socket });
    } catch (error) {
      console.error("[WebSocket] Failed to connect:", error);
      set({
        connectionError:
          error instanceof Error ? error.message : "Failed to connect",
      });
    }
  },

  disconnect: () => {
    const { socket } = get();

    // Clear any pending reconnect timeout
    if (reconnectTimeout) {
      clearTimeout(reconnectTimeout);
      reconnectTimeout = null;
    }

    if (socket) {
      socket.close(1000, "Client disconnecting"); // Clean close
      set({
        socket: null,
        isConnected: false,
        isReconnecting: false,
        reconnectAttempts: 0,
      });
    }
  },

  sendMessage: (message: unknown) => {
    const { socket, isConnected } = get();
    if (socket && isConnected && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(message));
    } else {
      console.warn("[WebSocket] Cannot send message - not connected");
    }
  },

  clearMessages: () => set({ messages: [], lastMessage: null }),
}));

export default useWebSocketStore;
