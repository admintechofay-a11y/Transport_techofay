import { create } from 'zustand';
import { User, Company } from '@/types/api.types';

interface AuthState {
  token: string | null;
  user: User | null;
  company: Company | null;
  isAuthenticated: boolean;
  setAuth: (token: string, user: User, company: Company) => void;
  updateUser: (user: Partial<User>) => void;
  updateCompany: (company: Partial<Company>) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => {
  // Read initial auth state from localStorage
  const savedToken = localStorage.getItem('technofay_token') || localStorage.getItem('fleetbase_token');
  const savedUser = localStorage.getItem('technofay_user') || localStorage.getItem('fleetbase_user');
  const savedCompany = localStorage.getItem('technofay_company') || localStorage.getItem('fleetbase_company');

  return {
    token: savedToken || null,
    user: savedUser ? JSON.parse(savedUser) : null,
    company: savedCompany ? JSON.parse(savedCompany) : {
      uuid: 'company_techofay_01',
      name: 'Technofay Transport & Logistics',
      currency: 'INR',
    },
    isAuthenticated: !!savedToken,

    setAuth: (token, user, company) => {
      localStorage.setItem('technofay_token', token);
      localStorage.setItem('technofay_user', JSON.stringify(user));
      localStorage.setItem('technofay_company', JSON.stringify(company));
      set({ token, user, company, isAuthenticated: true });
    },

    updateUser: (updatedUser) => {
      set((state) => {
        const newUser = state.user ? { ...state.user, ...updatedUser } : (updatedUser as User);
        localStorage.setItem('technofay_user', JSON.stringify(newUser));
        return { user: newUser };
      });
    },

    updateCompany: (updatedCompany) => {
      set((state) => {
        const newComp = state.company ? { ...state.company, ...updatedCompany } : (updatedCompany as Company);
        localStorage.setItem('technofay_company', JSON.stringify(newComp));
        return { company: newComp };
      });
    },

    logout: () => {
      localStorage.removeItem('technofay_token');
      localStorage.removeItem('technofay_user');
      localStorage.removeItem('technofay_company');
      localStorage.removeItem('fleetbase_token');
      localStorage.removeItem('fleetbase_user');
      localStorage.removeItem('fleetbase_company');
      set({ token: null, user: null, company: null, isAuthenticated: false });
    },
  };
});
