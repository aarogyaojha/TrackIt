import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Role } from '@trackit/types';

/**
 * Auth state lives in src/lib/redux/ rather than inside features/auth/ because
 * session management is cross-cutting across the entire application: it is accessed
 * by root providers, HTTP interceptors (outside React), layout shells, and multiple feature areas.
 *
 * This Redux Toolkit setup supersedes the earlier Zustand mention in AGENTS.md
 * as the explicit project choice for global client-only state management.
 */

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  organizationId: string | null;
}

export interface AuthState {
  accessToken: string | null;
  user: AuthUser | null;
  isInitializing: boolean;
}

const initialState: AuthState = {
  accessToken: null,
  user: null,
  isInitializing: true,
};

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setSession: (
      state,
      action: PayloadAction<{ accessToken: string; user: AuthUser }>,
    ) => {
      state.accessToken = action.payload.accessToken;
      state.user = action.payload.user;
      state.isInitializing = false;
    },
    clearSession: (state) => {
      state.accessToken = null;
      state.user = null;
      state.isInitializing = false;
    },
    setInitializing: (state, action: PayloadAction<boolean>) => {
      state.isInitializing = action.payload;
    },
  },
});

export const { setSession, clearSession, setInitializing } = authSlice.actions;
export default authSlice.reducer;
