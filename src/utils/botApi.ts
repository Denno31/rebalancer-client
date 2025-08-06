import { API_URL } from './config';
import { getAuthHeader } from './api';

// Types
export interface Bot {
  id: number;
  name: string;
  status: string;
  enabled?: boolean;
  budget?: number;
  currentCoin?: string;
  exchange?: string;
  trades?: any[];
  performance?: number;
  created?: string;
  updated?: string;
}

export interface Asset {
  id?: number;
  botId?: number;
  coin: string;
  balance: number;
  botName?: string;
}

export interface Trade {
  id: number;
  botId: number;
  botName?: string;
  fromCoin: string;
  toCoin: string;
  amount: number;
  timestamp: Date | string;
  type: string;
  status?: string;
  price?: number;
}

export interface BotPrices {
  [key: string]: number;
}

// Helper function to handle API responses
const handleResponse = async (response: Response) => {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Network error' }));
    throw new Error(error.detail || `API error: ${response.status}`);
  }
  return response.json();
};

/**
 * Fetch all bots
 */
export async function fetchBots(): Promise<Bot[]> {
  try {
    const response = await fetch(`${API_URL}/api/bots`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      }
    });
    
    return handleResponse(response);
  } catch (error: any) {
    console.error('Error fetching bots:', error);
    throw new Error(error.message || 'Failed to fetch bots');
  }
}

/**
 * Fetch prices for a specific bot's coins
 */
export async function fetchBotPrices(botId: number): Promise<BotPrices> {
  try {
    const response = await fetch(`${API_URL}/api/bots/${botId}/prices`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      }
    });
    
    return handleResponse(response);
  } catch (error: any) {
    console.error(`Error fetching prices for bot ${botId}:`, error);
    return {}; // Return empty object on error
  }
}

/**
 * Fetch assets for a specific bot
 */
export async function fetchBotAssets(botId: number): Promise<Asset[]> {
  try {
    const response = await fetch(`${API_URL}/api/bots/${botId}/assets`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      }
    });
    
    return handleResponse(response);
  } catch (error: any) {
    console.error(`Error fetching assets for bot ${botId}:`, error);
    return []; // Return empty array on error
  }
}

/**
 * Fetch trades for a specific bot
 */
export async function fetchBotTrades(
  botId: number, 
  page: number | null = null, 
  limit: number | null = null
): Promise<Trade[]> {
  try {
    let url = `${API_URL}/api/bots/${botId}/trades`;
    
    // Add pagination parameters if provided
    const params = new URLSearchParams();
    if (page !== null) params.append('page', page.toString());
    if (limit !== null) params.append('limit', limit.toString());
    
    if (params.toString()) {
      url += `?${params.toString()}`;
    }
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      }
    });
    
    return handleResponse(response);
  } catch (error: any) {
    console.error(`Error fetching trades for bot ${botId}:`, error);
    return []; // Return empty array on error
  }
}

/**
 * Fetch real-time price for a specific coin
 */
export async function fetchRealTimePrice(coin: string): Promise<number> {
  try {
    const response = await fetch(`${API_URL}/api/prices/${coin}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      }
    });
    
    const data = await handleResponse(response);
    return data.price || 0;
  } catch (error: any) {
    console.error(`Error fetching real-time price for ${coin}:`, error);
    return 0; // Return 0 on error
  }
}

/**
 * Fetch bot performance data for charts
 */
export async function fetchBotPerformance(botId: number, period: string = 'week'): Promise<any> {
  try {
    const response = await fetch(`${API_URL}/api/bots/${botId}/performance?period=${period}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      }
    });
    
    return handleResponse(response);
  } catch (error: any) {
    console.error(`Error fetching performance for bot ${botId}:`, error);
    return { labels: [], data: [] }; // Return empty data on error
  }
}
