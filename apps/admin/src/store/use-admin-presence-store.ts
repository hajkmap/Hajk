import { create } from "zustand";

export interface AdminPresence {
  id: string;
  userId: string;
  userName: string;
  resource: string; // e.g., "map:1", "layer:123", "tool:layerswitcher"
  resourceType: "map" | "layer" | "tool" | "group" | "service";
  resourceId: string;
  timestamp: number;
}

interface AdminPresenceState {
  // Other admins currently active
  activeAdmins: AdminPresence[];

  // Current user's presence (what they're editing)
  myPresence: AdminPresence | null;

  // Actions
  setActiveAdmins: (admins: AdminPresence[]) => void;
  addAdmin: (admin: AdminPresence) => void;
  removeAdmin: (adminId: string) => void;
  updateAdmin: (admin: AdminPresence) => void;
  setMyPresence: (presence: AdminPresence | null) => void;

  // Utilities
  getAdminsOnResource: (
    resourceType: string,
    resourceId: string
  ) => AdminPresence[];
  isResourceBeingEdited: (resourceType: string, resourceId: string) => boolean;
  clearStalePresence: (maxAgeMs?: number) => void;
}

const STALE_PRESENCE_MS = 5 * 60 * 1000; // 5 minutes

const useAdminPresenceStore = create<AdminPresenceState>((set, get) => ({
  activeAdmins: [],
  myPresence: null,

  setActiveAdmins: (admins) => set({ activeAdmins: admins }),

  addAdmin: (admin) =>
    set((state) => {
      // Don't add duplicates
      const exists = state.activeAdmins.find((a) => a.id === admin.id);
      if (exists) {
        return {
          activeAdmins: state.activeAdmins.map((a) =>
            a.id === admin.id ? admin : a
          ),
        };
      }
      return { activeAdmins: [...state.activeAdmins, admin] };
    }),

  removeAdmin: (adminId) =>
    set((state) => ({
      activeAdmins: state.activeAdmins.filter((a) => a.id !== adminId),
    })),

  updateAdmin: (admin) =>
    set((state) => ({
      activeAdmins: state.activeAdmins.map((a) =>
        a.id === admin.id ? admin : a
      ),
    })),

  setMyPresence: (presence) => set({ myPresence: presence }),

  getAdminsOnResource: (resourceType, resourceId) => {
    const { activeAdmins, myPresence } = get();
    return activeAdmins.filter(
      (a) =>
        a.resourceType === resourceType &&
        a.resourceId === resourceId &&
        a.id !== myPresence?.id // Exclude self
    );
  },

  isResourceBeingEdited: (resourceType, resourceId) => {
    const admins = get().getAdminsOnResource(resourceType, resourceId);
    return admins.length > 0;
  },

  clearStalePresence: (maxAgeMs = STALE_PRESENCE_MS) => {
    const now = Date.now();
    set((state) => ({
      activeAdmins: state.activeAdmins.filter(
        (a) => now - a.timestamp < maxAgeMs
      ),
    }));
  },
}));

export default useAdminPresenceStore;
