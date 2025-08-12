import { API_URL } from './config';
import { Bot as BotType } from '@/types/botTypes';
import { User, UserLogin, UserRegistration, ResetPasswordRequest, ResetPasswordConfirm } from '@/types/userTypes';

// Re-export the Bot type for backward compatibility
export type Bot = BotType;

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

// Bot API functions

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

// Fetch a single bot by ID
export async function getBot(botId: number): Promise<Bot> {
  const response = await fetch(`${API_URL}/api/bots/${botId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader()
    }
  });
  
  return handleResponse(response);
}

// Fetch accounts from 3Commas
export async function fetchAccounts() {
  console.log('in account')
  const response = await fetch(`${API_URL}/api/accounts`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader()
    }
  });
  
  return handleResponse(response);
}

// Fetch available coins for an account
export async function fetchAvailableCoins(accountId: string) {
  const response = await fetch(`${API_URL}/api/coins/accounts/${accountId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader()
    }
  });
  
  return handleResponse(response);
}

// Create a new bot
export async function createBot(botData: Partial<Bot>) {
  const response = await fetch(`${API_URL}/api/bots`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader()
    },
    body: JSON.stringify(botData)
  });
  
  return handleResponse(response);
}

// Update an existing bot
export async function updateBot(botId: number, botData: Partial<Bot>) {
  const response = await fetch(`${API_URL}/api/bots/${botId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader()
    },
    body: JSON.stringify(botData)
  });
  
  return handleResponse(response);
}

// Fetch trades for a specific bot
export async function fetchBotTrades(botId: number) {
  const response = await fetch(`${API_URL}/api/bots/${botId}/trades`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader()
    }
  });
  
  return handleResponse(response);
}

// Sell bot's current coin to a stablecoin
export async function sellToStablecoin(botId: number, fromCoin: string, amount: string | number, targetStablecoin: string) {
  const response = await fetch(`${API_URL}/api/trades/sell-to-stablecoin`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader()
    },
    body: JSON.stringify({ botId, fromCoin, amount, targetStablecoin })
  });
  
  return handleResponse(response);
}

// Toggle bot enabled status
export async function toggleBotStatus(botId: number, enabled: boolean) {
  const response = await fetch(`${API_URL}/api/bots/${botId}/toggle`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader()
    },
    body: JSON.stringify({ enabled })
  });
  
  return handleResponse(response);
}

// System Configuration Types
export interface SystemConfig {
  pricing_source: string;
  fallback_source: string;
  update_interval: number;
  websocket_enabled: boolean;
  analytics_enabled: boolean;
  analytics_save_interval: number;
}

export interface ApiConfig {
  api_key: string;
  api_secret: string;
  mode: string;
}

export interface ApiConfigs {
  [provider: string]: ApiConfig;
}

// Fetch system configuration
export async function fetchSystemConfig(): Promise<SystemConfig> {
  const response = await fetch(`${API_URL}/api/config/system`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader()
    }
  });
  
  return handleResponse(response);
}

// Update system configuration
export async function updateSystemConfig(config: SystemConfig): Promise<SystemConfig> {
  const response = await fetch(`${API_URL}/api/config/system`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader()
    },
    body: JSON.stringify(config)
  });
  
  return handleResponse(response);
}

// Fetch API configurations
export async function fetchApiConfigs(): Promise<ApiConfigs> {
  const response = await fetch(`${API_URL}/api/config/api`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader()
    }
  });
  
  return handleResponse(response);
}

// Update API configuration
export async function updateApiConfig(provider: string, config: ApiConfig): Promise<ApiConfig> {
  const response = await fetch(`${API_URL}/api/config/api/${provider}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader()
    },
    body: JSON.stringify(config)
  });
  
  return handleResponse(response);
}

// Download database backup
export async function downloadDatabaseBackup(): Promise<Blob> {
  const response = await fetch(`${API_URL}/api/system/backup`, {
    method: 'GET',
    headers: {
      ...getAuthHeader()
    }
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Network error' }));
    throw new Error(error.detail || 'Failed to download backup');
  }
  
  return response.blob();
}
