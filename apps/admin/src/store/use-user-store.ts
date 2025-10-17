import { create } from "zustand";

export interface User {
  id: string;
  fullName: string;
  email: string;
}

interface UserStore {
  user: User | null;
  userLoading: boolean;
  setUser: (user: User) => void;
  setUserLoading: (loading: boolean) => void;
  clearUser: () => void;
}

const useUserStore = create<UserStore>((set) => ({
  user: null,
  userLoading: false,
  setUser: (user: User) => set({ user: user }),
  setUserLoading: (loading: boolean) => set({ userLoading: loading }),
  clearUser: () => set({ user: null }),
}));

export default useUserStore;
