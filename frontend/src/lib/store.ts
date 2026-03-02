import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface User {
  id: string;
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: string[];
  organizationId: string;
}

export interface UIState {
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (isOpen: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  isMobileMenuOpen: false,
  setIsMobileMenuOpen: (isOpen) => set({ isMobileMenuOpen: isOpen }),
}));

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  isLoading: boolean;
  isHydrated: boolean; // Added for hydration check
  setUser: (user: User | null) => void;
  setAccessToken: (token: string | null) => void;
  setIsLoading: (isLoading: boolean) => void;
  setHasHydrated: (state: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      isLoading: false,
      isHydrated: false,
      setUser: (user) => set({ user }),
      setAccessToken: (token) => set({ accessToken: token }),
      setIsLoading: (isLoading) => set({ isLoading }),
      setHasHydrated: (state) => set({ isHydrated: state }),
      logout: () => {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
        }
        set({ user: null, accessToken: null });
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
