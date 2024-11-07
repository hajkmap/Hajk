import { create } from "zustand";

export interface User {
  id: string;
  fullName: string;
  email: string;
}

interface UserStore {
  user: User | null;
  setUser: (user: User) => void;
  clearUser: () => void;
}

const useUserStore = create<UserStore>((set) => ({
  user: null,
  setUser: (user: User) => set({ user: user }),
  clearUser: () => set({ user: null }),
}));

export default useUserStore;
