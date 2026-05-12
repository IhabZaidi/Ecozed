import { create } from "zustand";
import { persist } from "zustand/middleware";

interface Store {
  id: string;
  name: string;
}

interface User {
  id: string;
  username: string;
  role: string;
  permissions: string[];
  stores: Store[];
}

interface AuthState {
  user: User | null;
  activeStoreIds: string[];
  setUser: (user: User | null) => void;
  setActiveStoreIds: (ids: string[]) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      activeStoreIds: [],
      setUser: (user) => set({ 
        user, 
        activeStoreIds: user?.stores?.map(s => s.id) || [] 
      }),
      setActiveStoreIds: (ids) => set({ activeStoreIds: ids }),
      logout: () => set({ user: null, activeStoreIds: [] }),
    }),
    {
      name: "auth-storage",
    }
  )
);
