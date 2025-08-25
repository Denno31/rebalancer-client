import { API_URL } from './config';

/**
 * Dashboard statistics including all metrics and recent trades
 */
export interface DashboardStats {
  totalBots: number;
  activeBots: number;
  portfolioValue: number;
  portfolioChange: number;
  totalTrades: number;
  successRate: number;
  recentTrades: DashboardTrade[];
  assetAllocation: Record<string, number>;
  portfolioHistory: PortfolioHistoryPoint[];
}

/**
 * Recent trade data for the dashboard
 */
export interface DashboardTrade {
  id: number;
  botId: number;
  fromCoin: string;
  toCoin: string;
  timestamp: string;
  status: "pending" | "completed" | "failed";
  botName?: string;
}

/**
 * Portfolio history data point
 */
export interface PortfolioHistoryPoint {
  date: string;
  value: number;
}

/**
 * Fetch all dashboard statistics in a single call
 */
export async function fetchDashboardStats(): Promise<DashboardStats> {
  try {
    const response = await fetch(`${API_URL}/api/dashboard/stats`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch dashboard stats: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    throw error;
  }
}
