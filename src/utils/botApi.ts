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
  trades?: Array<Record<string, unknown>>;
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

export interface TradeDecision {
  id: number;
  botId: number;
  timestamp: string;
  coin: string;
  decision: string;
  priceChange: number;
  deviation: number;
  executionStatus: 'Executed' | 'Pending' | 'Failed';
  reason: string;
  metadata?: Record<string, any>;
}

export interface SwapDecision {
  id: number;
  botId: number;
  fromCoin: string;
  toCoin: string;
  fromCoinPrice: number;
  toCoinPrice: number;
  fromCoinSnapshot: number;
  toCoinSnapshot: number;
  priceDeviationPercent: number;
  priceThreshold: number;
  deviationTriggered: boolean;
  unitGainPercent: number;
  ethEquivalentValue: number;
  minEthEquivalent: number;
  globalPeakValue: number;
  currentGlobalPeakValue: number | null;
  globalProtectionTriggered: boolean;
  swapPerformed: boolean;
  reason: string;
  tradeId: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface BotAsset {
  coin: string;
  amount: number;
  usdtValue: number;
  percentage: number;
  lastUpdate: string;
}

export interface LogEntry {
  id: number;
  timestamp: string;
  level: 'INFO' | 'WARNING' | 'ERROR' | 'DEBUG';
  message: string;
  botId: number;
  metadata?: Record<string, any>;
}

export interface PricePoint {
  timestamp: string;
  price: number;
  coin: string;
  source?: string;
}

export interface DeviationPoint {
  timestamp: string;
  baseCoin: string;
  targetCoin: string;
  basePrice: number;
  targetPrice: number;
  deviationPercent: number;
}

export interface CoinPricePoint {
  basePrice: number;
  targetPrice: number;
  timestamp: string;
}

export interface LatestCoinDeviationData {
  [key: string]: number | null;
}

export interface LatestCoinDeviation {
  deviations?: LatestCoinDeviationData;
  prices?: Record<string, CoinPricePoint>;
}

export interface BotDeviationsResponse {
  success: boolean;
  timeSeriesData: Record<string, DeviationPoint[]>;
  latestDeviations: Record<string, LatestCoinDeviation>;
  coins: string[];
  totalCount?: number; // Total count for pagination
  page?: number;       // Current page number
  limit?: number;      // Records per page
}

export interface BotStateData {
  id: number;
  name: string;
  status: 'ACTIVE' | 'PAUSED' | 'ERROR';
  currentCoin: string;
  currentCoinAmount: number;
  currentCoinValueUsd: number;
  initialInvestment: number;
  totalValueUsd: number;
  profitLoss: number;
  profitLossPercentage: number;
  lastTradeTime: string | null;
  tradingPairs: string[];
  lastUpdateTime: string;
  accountId: string;
  exchange: string;
  tradingStrategy: string;
  deviationThreshold: number;
  rebalanceThreshold: number;
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

/**
 * Fetch trade decisions for a specific bot
 */
export async function fetchTradeDecisions(
  botId: number, 
  page: number = 1, 
  pageSize: number = 10
): Promise<{ data: TradeDecision[], count: number }> {
  try {
    const response = await fetch(`${API_URL}/api/bots/${botId}/trade-decisions?page=${page}&limit=${pageSize}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      }
    });
    
    return handleResponse(response);
  } catch (error: any) {
    console.error(`Error fetching trade decisions for bot ${botId}:`, error);
    return { data: [], count: 0 }; // Return empty data on error
  }
}

/**
 * Fetch swap decisions for a specific bot
 */
export interface SwapDecisionsResponse {
  total: number;
  offset: number;
  limit: number;
  items: SwapDecision[];
}

export async function fetchSwapDecisions(
  botId: number, 
  page: number = 1, 
  pageSize: number = 10
): Promise<SwapDecisionsResponse> {
  try {
    // Convert page to offset for API
    const offset = (page - 1) * pageSize;
    
    const response = await fetch(`${API_URL}/api/bots/${botId}/swap-decisions?offset=${offset}&limit=${pageSize}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      }
    });
    
    return handleResponse(response);
  } catch (error: any) {
    console.error(`Error fetching swap decisions for bot ${botId}:`, error);
    return { total: 0, offset: 0, limit: pageSize, items: [] }; // Return empty data on error
  }
}

/**
 * Fetch bot logs
 */
export async function fetchBotLogs(
  botId: number, 
  page: number = 1, 
  pageSize: number = 10,
  level: string = 'ALL'
): Promise<{ data: LogEntry[], count: number }> {
  try {
    let url = `${API_URL}/api/bots/${botId}/logs?page=${page}&limit=${pageSize}`;
    if (level !== 'ALL') {
      url += `&level=${level}`;
    }
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      }
    });
    
    // Transform the raw logs array into the expected format with data and count properties
    const logs = await handleResponse(response);
    
    // If the response is already in {data, count} format, return it directly
    if (logs && typeof logs === 'object' && 'data' in logs && 'count' in logs) {
      return logs;
    }
    
    // Otherwise, assume it's an array of logs and transform it
    const logsArray = Array.isArray(logs) ? logs : [];
    return { data: logsArray, count: logsArray.length };
  } catch (error: any) {
    console.error(`Error fetching logs for bot ${botId}:`, error);
    return { data: [], count: 0 }; // Return empty data on error
  }
}

/**
 * Fetch bot state data
 */
export async function fetchBotState(botId: number): Promise<BotStateData> {
  try {
    const response = await fetch(`${API_URL}/api/bots/${botId}/state`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      }
    });
    
    return handleResponse(response);
  } catch (error: any) {
    console.error(`Error fetching state for bot ${botId}:`, error);
    throw new Error(`Failed to fetch bot state: ${error.message || 'Unknown error'}`);
  }
}

/**
 * Fetch price history data for a bot
 * @param {number} botId - ID of the bot
 * @param {Date|string} fromTime - Start date for data range
 * @param {Date|string} toTime - End date for data range
 * @param {string|null} coin - Optional coin to filter by
 * @returns {Promise<PricePoint[]>} - Price history data
 */
export async function fetchPriceHistory(
  botId: number,
  fromTime?: Date | string | null,
  toTime?: Date | string | null,
  coin?: string | null
): Promise<PricePoint[]> {
  try {
    // Default to last 24 hours if not provided
    if (!fromTime) {
      const to = new Date();
      const from = new Date(to);
      from.setDate(from.getDate() - 1);
      fromTime = from;
      toTime = to;
    }
    
    // Ensure dates are ISO strings
    const fromTimeStr = fromTime instanceof Date ? fromTime.toISOString() : fromTime;
    const toTimeStr = toTime instanceof Date ? toTime.toISOString() : toTime;
    
    // Build the URL - always use the main prices endpoint, not the coin-specific one
    let url = `${API_URL}/api/bots/${botId}/prices?from_time=${fromTimeStr}&to_time=${toTimeStr}`;
    
    // Add coin filter if provided
    if (coin) {
      url += `&coin=${coin}`;
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
    console.error(`Error fetching price history for bot ${botId}${coin ? `, coin ${coin}` : ''}:`, error);
    return []; // Return empty array on error
  }
}

/**
 * Fetch available coins for a bot
 */
export async function fetchBotCoins(botId: number): Promise<string[]> {
  try {
    const response = await fetch(`${API_URL}/api/bots/${botId}/coins`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      }
    });
    
    return handleResponse(response);
  } catch (error: any) {
    console.error(`Error fetching available coins for bot ${botId}:`, error);
    return []; // Return empty array on error
  }
}

/**
 * Fetch relative coin deviation data for charting
 * @param {number} botId - ID of the bot to fetch deviations for
 * @param {Object} options - Optional parameters
 * @param {Date|string} options.from - Start date for data range
 * @param {Date|string} options.to - End date for data range
 * @param {string} options.baseCoin - Filter by base coin
 * @param {string} options.targetCoin - Filter by target coin
 * @param {string} options.timeRange - Time range for data
 * @param {number} options.page - Page number for pagination
 * @param {number} options.limit - Number of records per page
 * @returns {Promise<BotDeviationsResponse>} - Deviation data for charting
 */
export async function fetchBotDeviations(
  botId: number,
  options: {
    from?: Date | string;
    to?: Date | string;
    baseCoin?: string;
    targetCoin?: string;
    timeRange?: string;
    page?: number;
    limit?: number;
  } = {}
): Promise<BotDeviationsResponse> {
  try {
    const params = new URLSearchParams();
    
    // Handle both legacy and new parameter options
    if (options.from) params.append('from', new Date(options.from).toISOString());
    if (options.to) params.append('to', new Date(options.to).toISOString());
    if (options.baseCoin) params.append('baseCoin', options.baseCoin);
    if (options.targetCoin) params.append('targetCoin', options.targetCoin);
    if (options.timeRange) params.append('timeRange', options.timeRange);
    if (options.page !== undefined) params.append('page', options.page.toString());
    if (options.limit !== undefined) params.append('limit', options.limit.toString());
    
    const queryString = params.toString() ? `?${params.toString()}` : '';
    
    // Use the legacy API endpoint structure
    const response = await fetch(`${API_URL}/api/deviations/bots/${botId}${queryString}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      }
    });
    
    if (!response.ok) {
      if (response.status === 401) {
        // Handle unauthorized error like in legacy code
        localStorage.removeItem('token'); // This mimics the logout function
        throw new Error('Please login again');
      }
      throw new Error('Failed to fetch deviation data');
    }
    
    return response.json();
  } catch (error: any) {
    console.error(`Error fetching deviation data for bot ${botId}:`, error);
    throw error; // Throw error like legacy code instead of returning empty array
  }
}

// Keep fetchDeviationData as an alias for backwards compatibility
export const fetchDeviationData = fetchBotDeviations;

/**
 * Fetch price comparison between initial snapshot and current prices
 * @param {number} botId - ID of the bot
 * @returns {Promise<PriceComparisonData>} - Price comparison data with initial and current prices
 */
export interface PriceComparisonData {
  coins: string[];
  initialPrices: Record<string, number>;
  currentPrices: Record<string, number>;
  percentChanges: Record<string, number>;
  timestamp: string;
}

export async function fetchPriceComparison(botId: number): Promise<PriceComparisonData> {
  try {
    const response = await fetch(`${API_URL}/api/snapshots/bots/${botId}/price-comparison`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      }
    });
    
    return handleResponse(response);
  } catch (error: any) {
    console.error(`Error fetching price comparison data for bot ${botId}:`, error);
    throw new Error(`Failed to fetch price comparison data: ${error.message || 'Unknown error'}`);
  }
}

/**
 * Fetch historical price data with snapshot reference points
 * @param {number} botId - ID of the bot
 * @param {Object} options - Optional parameters
 * @param {Date|string} options.fromTime - Start date for data range
 * @param {Date|string} options.toTime - End date for data range
 * @param {string} options.coin - Filter by coin
 * @returns {Promise<HistoricalComparisonData>} - Historical price data with snapshot reference
 */
export interface HistoricalDataPoint {
  timestamp: string;
  price: number;
  isSnapshot?: boolean;
}

export interface HistoricalComparisonData {
  coin: string;
  data: HistoricalDataPoint[];
}

export async function fetchHistoricalComparison(
  botId: number,
  options: {
    fromTime?: Date | string;
    toTime?: Date | string;
    coin?: string;
  } = {}
): Promise<HistoricalComparisonData> {
  try {
    const params = new URLSearchParams();
    
    if (options.fromTime) {
      params.append('fromTime', options.fromTime instanceof Date 
        ? options.fromTime.toISOString() 
        : options.fromTime);
    }
    
    if (options.toTime) {
      params.append('toTime', options.toTime instanceof Date 
        ? options.toTime.toISOString() 
        : options.toTime);
    }
    
    if (options.coin && options.coin !== 'all') {
      params.append('coin', options.coin);
    }
    
    const queryString = params.toString() ? `?${params.toString()}` : '';
    
    const response = await fetch(`${API_URL}/api/snapshots/bots/${botId}/historical-comparison${queryString}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      }
    });
    
    return handleResponse(response);
  } catch (error: any) {
    console.error(`Error fetching historical comparison data for bot ${botId}:`, error);
    throw new Error(`Failed to fetch historical comparison data: ${error.message || 'Unknown error'}`);
  }
}
