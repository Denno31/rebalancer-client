import { API_URL } from './config';

// Type definitions
export interface LoginResponse {
  access_token: string;
  token_type: string;
}

export interface RegistrationResponse {
  id: number;
  email: string;
  username: string;
  isActive: boolean;
  isSuperuser: boolean;
  createdAt: string;
}

export interface PasswordResetRequestResponse {
  message: string;
  resetToken?: string; // Only included in development mode
}

export interface PasswordResetResponse {
  message: string;
  success: boolean;
}

// Helper function to handle API responses
const handleResponse = async (response: Response) => {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Network error' }));
    throw new Error(error.detail || 'Network error');
  }
  return response.json();
};

// Auth functions
export async function login(username: string, password: string): Promise<LoginResponse> {
  const response = await fetch(`${API_URL}/api/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ username, password })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Login failed');
  }

  const data = await response.json();
  localStorage.setItem('token', data.access_token);
  return data;
}

export async function register(email: string, username: string, password: string): Promise<RegistrationResponse> {
  const response = await fetch(`${API_URL}/api/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, username, password })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Registration failed');
  }

  return response.json();
}

export function logout(): void {
  localStorage.removeItem('token');
}

// Helper function to get auth header
export function getAuthHeader(): Record<string, string> {
  if (typeof window === 'undefined') {
    return {}; // Running on server
  }
  
  const token = localStorage.getItem('token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}

// Password reset functions
export async function requestPasswordReset(email: string): Promise<PasswordResetRequestResponse> {
  const response = await fetch(`${API_URL}/api/password-reset-request`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Password reset request failed');
  }

  return response.json();
}

export async function resetPassword(token: string, password: string): Promise<PasswordResetResponse> {
  const response = await fetch(`${API_URL}/api/password-reset`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ token, password })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Password reset failed');
  }

  return response.json();
}

// Token validation function (for the reset password page)
export async function validateResetToken(token: string): Promise<{ valid: boolean }> {
  try {
    const response = await fetch(`${API_URL}/api/validate-reset-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token })
    });

    if (!response.ok) {
      return { valid: false };
    }

    return { valid: true };
  } catch (error) {
    return { valid: false };
  }
}

// Bot data types
export interface Bot {
  id: number;
  name: string;
  status: string;
  currentCoin?: string;
  accountId?: number;
  preferredStablecoin?: string;
  budget?: number;
  created?: string;
  lastTraded?: string;
}

// Fetch all bots
export async function fetchBots(): Promise<Bot[]> {
  const response = await fetch(`${API_URL}/api/bots`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader()
    }
  });
  
  return handleResponse(response);
}
