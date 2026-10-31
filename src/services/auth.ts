import { User, UserRole } from '../types';

const TOKEN_KEY = 'aui_session_token';
const USER_KEY = 'aui_auth_user';

export interface AuthSessionResponse {
  success: boolean;
  token?: string;
  user?: User;
  error?: string;
}

export class AuthService {
  public static getToken(): string | null {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  }

  public static getCurrentUser(): User | null {
    try {
      const stored = localStorage.getItem(USER_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn('[AuthService] Error reading stored user:', e);
    }
    return null;
  }

  public static async login(identifier: string, password: string): Promise<AuthSessionResponse> {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: identifier.trim(), password }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        return {
          success: false,
          error: data.error || 'Authentication failed. Please verify your credentials.',
        };
      }

      // Store active session token and user info
      localStorage.setItem(TOKEN_KEY, data.token);
      localStorage.setItem(USER_KEY, JSON.stringify(data.user));

      return {
        success: true,
        token: data.token,
        user: data.user,
      };
    } catch (err: any) {
      console.error('[AuthService] Login network error:', err);
      return {
        success: false,
        error: 'Unable to connect to campus server. Please verify your network.',
      };
    }
  }

  public static async verifySession(): Promise<{ authenticated: boolean; user?: User }> {
    const token = this.getToken();
    if (!token) {
      return { authenticated: false };
    }

    try {
      const res = await fetch('/api/auth/me', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: 'no-store',
      });

      if (res.ok) {
        const data = await res.json();
        if (data.authenticated && data.user) {
          localStorage.setItem(USER_KEY, JSON.stringify(data.user));
          return { authenticated: true, user: data.user };
        }
      }
    } catch (e) {
      console.warn('[AuthService] Session check failed:', e);
      // If server is temporarily unreachable but token exists, return cached user for offline tolerance
      const cached = this.getCurrentUser();
      if (cached) {
        return { authenticated: true, user: cached };
      }
    }

    this.clearLocalSession();
    return { authenticated: false };
  }

  public static async logout(): Promise<void> {
    const token = this.getToken();
    if (token) {
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      } catch (e) {
        console.warn('[AuthService] Remote logout failed:', e);
      }
    }
    this.clearLocalSession();
  }

  public static clearLocalSession(): void {
    try {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    } catch (e) {
      console.warn('[AuthService] Error clearing local session:', e);
    }
  }

  public static async changePassword(currentPassword: string, newPassword: string): Promise<{ success: boolean; message?: string; error?: string }> {
    const token = this.getToken();
    if (!token) {
      return { success: false, error: 'Session expired. Please sign in again.' };
    }

    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        return { success: true, message: data.message || 'Password changed successfully.' };
      }
      return { success: false, error: data.error || 'Failed to update password.' };
    } catch (e: any) {
      return { success: false, error: e?.message || 'Network error updating password.' };
    }
  }
}
