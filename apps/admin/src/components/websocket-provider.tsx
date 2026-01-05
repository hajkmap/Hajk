import { useEffect, useRef } from "react";
import { useLocation } from "react-router";
import { toast } from "react-toastify";
import useWebSocketStore from "../store/use-websocket-store";
import useAdminPresenceStore, {
  AdminPresence,
} from "../store/use-admin-presence-store";
import useUserStore from "../store/use-user-store";
import useAppStateStore from "../store/use-app-state-store";

interface WebSocketProviderProps {
  children: React.ReactNode;
}

// Message types from backend
interface PresenceMessage {
  type: "presence-update" | "presence-join" | "presence-leave";
  payload: AdminPresence | { id: string };
}

interface AdminSyncMessage {
  type: "admin-sync";
  payload: {
    admins: AdminPresence[];
  };
}

type WSMessage = PresenceMessage | AdminSyncMessage;

// Parse route to determine what resource is being edited
function parseRoute(pathname: string): {
  resourceType: AdminPresence["resourceType"];
  resourceId: string;
} | null {
  const patterns: {
    regex: RegExp;
    type: AdminPresence["resourceType"];
  }[] = [
    { regex: /^\/maps\/(.+)$/, type: "map" },
    {
      regex: /^\/(search-layers|editing-layers|display-layers)\/(.+)$/,
      type: "layer",
    },
    { regex: /^\/tools\/(.+)$/, type: "tool" },
    { regex: /^\/groups\/(.+)$/, type: "group" },
    { regex: /^\/services\/(.+)$/, type: "service" },
  ];

  for (const { regex, type } of patterns) {
    const match = pathname.match(regex);
    if (match) {
      const id = type === "layer" ? match[2] : match[1];
      return { resourceType: type, resourceId: id };
    }
  }

  return null;
}

/**
 * WebSocket provider for multi-admin awareness.
 * Connects when user is authenticated and tracks admin presence.
 */
export function WebSocketProvider({ children }: WebSocketProviderProps) {
  const location = useLocation();
  const user = useUserStore((state) => state.user);
  const apiBaseUrl = useAppStateStore((state) => state.apiBaseUrl);
  const isConnected = useWebSocketStore((state) => state.isConnected);
  const lastMessage = useWebSocketStore((state) => state.lastMessage);

  // Refs to track state without causing re-renders
  const lastBroadcastedResource = useRef<string | null>(null);
  const prevAdminsRef = useRef<AdminPresence[]>([]);
  const isRegistered = useRef(false);
  const connectedUserId = useRef<string | null>(null);

  // Extract user.id to avoid re-running effect when user object reference changes
  const userId = user?.id ?? null;

  // Connect to WebSocket when user is authenticated
  useEffect(() => {
    if (!userId || !apiBaseUrl) {
      return;
    }

    // Don't reconnect if already connected for this user
    if (
      connectedUserId.current === userId &&
      useWebSocketStore.getState().isConnected
    ) {
      return;
    }

    const url = new URL(apiBaseUrl);
    const wsProtocol = url.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${wsProtocol}//${url.host}/api/v3/websockets`;

    connectedUserId.current = userId;
    useWebSocketStore.getState().connect(wsUrl);
    isRegistered.current = false;

    return () => {
      useWebSocketStore.getState().disconnect();
      connectedUserId.current = null;
      isRegistered.current = false;
    };
  }, [userId, apiBaseUrl]);

  // Register with backend when connected
  useEffect(() => {
    if (!isConnected || !user || isRegistered.current) {
      return;
    }

    useWebSocketStore.getState().sendMessage({
      type: "register",
      payload: {
        userId: user.id,
        userName: user.fullName || user.email,
      },
    });
    isRegistered.current = true;
  }, [isConnected, user]);

  // Update presence when route changes
  useEffect(() => {
    if (!isConnected || !user) {
      return;
    }

    const resource = parseRoute(location.pathname);
    const resourceKey = resource
      ? `${resource.resourceType}:${resource.resourceId}`
      : null;

    // Only broadcast if resource actually changed
    if (resourceKey === lastBroadcastedResource.current) {
      return;
    }

    lastBroadcastedResource.current = resourceKey;
    const wsStore = useWebSocketStore.getState();
    const presenceStore = useAdminPresenceStore.getState();

    if (resource) {
      const presence: AdminPresence = {
        id: `${user.id}-${Date.now()}`,
        userId: user.id,
        userName: user.fullName || user.email,
        resource: resourceKey!,
        resourceType: resource.resourceType,
        resourceId: resource.resourceId,
        timestamp: Date.now(),
      };

      presenceStore.setMyPresence(presence);

      wsStore.sendMessage({
        type: "presence-update",
        payload: {
          resourceType: resource.resourceType,
          resourceId: resource.resourceId,
        },
      });
    } else {
      wsStore.sendMessage({
        type: "presence-leave",
        payload: {},
      });
      presenceStore.setMyPresence(null);
    }
  }, [location.pathname, isConnected, user]);

  // Handle incoming WebSocket messages
  useEffect(() => {
    if (!lastMessage) return;

    const msg = lastMessage as unknown as WSMessage;
    const store = useAdminPresenceStore.getState();

    switch (msg.type) {
      case "admin-sync":
        if ("admins" in msg.payload) {
          store.setActiveAdmins(msg.payload.admins);
        }
        break;

      case "presence-join":
      case "presence-update":
        if ("userId" in msg.payload) {
          store.addAdmin(msg.payload);
        }
        break;

      case "presence-leave":
        if ("id" in msg.payload) {
          store.removeAdmin(msg.payload.id);
        }
        break;
    }
  }, [lastMessage]);

  // Show toast notifications when other admins join/leave current resource
  useEffect(() => {
    const resource = parseRoute(location.pathname);
    if (!resource) {
      prevAdminsRef.current = [];
      return;
    }

    const currentAdmins = useAdminPresenceStore
      .getState()
      .getAdminsOnResource(resource.resourceType, resource.resourceId);
    const prevAdmins = prevAdminsRef.current;

    // Find newly joined admins
    const newAdmins = currentAdmins.filter(
      (a) => !prevAdmins.find((p) => p.userId === a.userId)
    );

    // Find admins who left
    const leftAdmins = prevAdmins.filter(
      (p) => !currentAdmins.find((a) => a.userId === p.userId)
    );

    newAdmins.forEach((admin) => {
      toast.info(
        `${admin.userName} started editing this ${resource.resourceType}`,
        { position: "bottom-right", autoClose: 5000 }
      );
    });

    leftAdmins.forEach((admin) => {
      toast.info(
        `${admin.userName} stopped editing this ${resource.resourceType}`,
        { position: "bottom-right", autoClose: 3000 }
      );
    });

    prevAdminsRef.current = currentAdmins;
  }, [location.pathname, lastMessage]);

  // Periodically clear stale presence entries
  useEffect(() => {
    const interval = setInterval(() => {
      useAdminPresenceStore.getState().clearStalePresence();
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  return <>{children}</>;
}

export default WebSocketProvider;
