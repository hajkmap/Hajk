import log4js from "../utils/hajk-logger.js";
import { type CustomWebSocket } from "./index.ts";
import { type WebSocket } from "ws";

const logger = log4js.getLogger("websockets.presence");

export interface AdminPresence {
  id: string;
  userId: string;
  userName: string;
  resource: string;
  resourceType: "map" | "layer" | "tool" | "group" | "service";
  resourceId: string;
  timestamp: number;
  connectionId: string; // WebSocket connection UUID
}

interface PresenceConnection {
  socket: CustomWebSocket;
  presence: AdminPresence | null;
  userId: string;
  userName: string;
}

class AdminPresenceService {
  // Map of connection UUID to presence data
  private connections = new Map<string, PresenceConnection>();

  /**
   * Register a new WebSocket connection
   */
  registerConnection(
    socket: CustomWebSocket,
    userId: string,
    userName: string
  ): void {
    this.connections.set(socket.uuid, {
      socket,
      presence: null,
      userId,
      userName,
    });

    logger.trace(
      `Registered connection ${socket.uuid} for user ${userName} (${userId})`
    );

    // Send current presence state to the new connection
    this.sendAdminSync(socket);
  }

  /**
   * Unregister a WebSocket connection (on disconnect)
   */
  unregisterConnection(connectionId: string): void {
    const connection = this.connections.get(connectionId);
    if (connection?.presence) {
      // Broadcast that this admin left
      this.broadcastPresenceLeave(connection.presence);
    }

    this.connections.delete(connectionId);
    logger.trace(`Unregistered connection ${connectionId}`);
  }

  /**
   * Update presence for a connection
   */
  updatePresence(
    connectionId: string,
    resourceType: AdminPresence["resourceType"],
    resourceId: string
  ): void {
    const connection = this.connections.get(connectionId);
    if (!connection) {
      logger.warn(
        `Cannot update presence: connection ${connectionId} not found. Total connections: ${this.connections.size}`
      );
      return;
    }

    logger.trace(
      `Updating presence for ${connection.userName} to ${resourceType}:${resourceId}`
    );

    const presence: AdminPresence = {
      id: `${connection.userId}-${Date.now()}`,
      userId: connection.userId,
      userName: connection.userName,
      resource: `${resourceType}:${resourceId}`,
      resourceType,
      resourceId,
      timestamp: Date.now(),
      connectionId,
    };

    // If there was previous presence, broadcast leave first
    if (connection.presence) {
      this.broadcastPresenceLeave(connection.presence);
    }

    connection.presence = presence;
    logger.trace(
      `Broadcasting presence-join to ${this.connections.size - 1} other connections`
    );
    this.broadcastPresenceJoin(presence);

    logger.trace(
      `Updated presence for ${connection.userName}: ${resourceType}:${resourceId}`
    );
  }

  /**
   * Clear presence for a connection (user navigated away from editable resource)
   */
  clearPresence(connectionId: string): void {
    const connection = this.connections.get(connectionId);
    if (!connection) return;

    if (connection.presence) {
      this.broadcastPresenceLeave(connection.presence);
      connection.presence = null;
    }
  }

  /**
   * Get all active admin presences
   */
  getAllPresences(): AdminPresence[] {
    const presences: AdminPresence[] = [];
    for (const connection of this.connections.values()) {
      if (connection.presence) {
        presences.push(connection.presence);
      }
    }
    return presences;
  }

  /**
   * Get admins on a specific resource
   */
  getAdminsOnResource(
    resourceType: AdminPresence["resourceType"],
    resourceId: string
  ): AdminPresence[] {
    return this.getAllPresences().filter(
      (p) => p.resourceType === resourceType && p.resourceId === resourceId
    );
  }

  /**
   * Send full admin sync to a specific client
   */
  private sendAdminSync(socket: CustomWebSocket): void {
    const message = {
      type: "admin-sync",
      payload: {
        admins: this.getAllPresences(),
      },
    };
    this.sendToSocket(socket, message);
  }

  /**
   * Broadcast presence join to all clients except the one who joined
   */
  private broadcastPresenceJoin(presence: AdminPresence): void {
    const message = {
      type: "presence-join",
      payload: presence,
    };
    this.broadcastExcept(presence.connectionId, message);
  }

  /**
   * Broadcast presence leave to all clients
   */
  private broadcastPresenceLeave(presence: AdminPresence): void {
    const message = {
      type: "presence-leave",
      payload: { id: presence.id, userId: presence.userId },
    };
    this.broadcastExcept(presence.connectionId, message);
  }

  /**
   * Broadcast a message to all connections except one
   */
  private broadcastExcept(excludeConnectionId: string, message: unknown): void {
    for (const [connectionId, connection] of this.connections) {
      if (connectionId !== excludeConnectionId) {
        this.sendToSocket(connection.socket, message);
      }
    }
  }

  /**
   * Broadcast a message to all connections
   */
  broadcast(message: unknown): void {
    for (const connection of this.connections.values()) {
      this.sendToSocket(connection.socket, message);
    }
  }

  /**
   * Send a message to a specific socket
   */
  private sendToSocket(socket: WebSocket, message: unknown): void {
    if (socket.readyState === socket.OPEN) {
      socket.send(JSON.stringify(message));
    }
  }
}

// Export singleton instance
export const adminPresenceService = new AdminPresenceService();

export default adminPresenceService;
