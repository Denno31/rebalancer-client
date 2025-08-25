'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { Alert, AlertTitle } from '@/components/ui/Alert';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  ArcElement,
  Title, 
  Tooltip, 
  Legend 
} from 'chart.js';
import { Line, Doughnut } from 'react-chartjs-2';
import Link from 'next/link';

// Import types and API functions
import { Bot } from '@/types/botTypes';
import { Trade } from '@/types/tradeTypes';
import { AssetAllocation } from '@/types/botAssetTypes';
import { fetchBots, fetchBotPrices, fetchBotAssets, fetchBotTrades, Asset } from '@/utils/botApi';
import { fetchDashboardStats, DashboardStats, DashboardTrade, PortfolioHistoryPoint } from '@/utils/dashboardApi';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

// Extended types for dashboard usage
interface DashboardBot extends Partial<Bot> {
  id: number;
  name: string;
  enabled: boolean;
  coins: string[];
  currentCoin: string | null;
  status?: string;
  performance?: number;
  trades?: DashboardTrade[];
  budget?: number;
}

// Now importing DashboardTrade from dashboardApi.ts

// Asset interface is now imported from botApi.ts

// Dashboard page component
export default function HomePage() {
  return (
    <DashboardLayout>
      <DashboardContent />
    </DashboardLayout>
  );
}

// Separate component for dashboard content
function DashboardContent(): React.ReactElement {
  // State
  const [bots, setBots] = useState<DashboardBot[]>([]);
  const [prices, setPrices] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
  
  const [portfolioValue, setPortfolioValue] = useState<number>(0);
  const [portfolioChange, setPortfolioChange] = useState<number>(0);
  const [activeBots, setActiveBots] = useState<number>(0);
  const [totalBots, setTotalBots] = useState<number>(0);
  const [totalTrades, setTotalTrades] = useState<number>(0);
  const [tradeSuccessRate, setTradeSuccessRate] = useState<number>(0);
  const [recentTrades, setRecentTrades] = useState<DashboardTrade[]>([]);
  const [assetAllocation, setAssetAllocation] = useState<Record<string, number>>({});

  // Portfolio chart data
  const [portfolioChartData, setPortfolioChartData] = useState({
    labels: [] as string[],
    datasets: [
      {
        label: 'Portfolio Value',
        data: [] as number[],
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
        tension: 0.4
      }
    ]
  });

  // Asset allocation chart data
  const [allocationChartData, setAllocationChartData] = useState({
    labels: [] as string[],
    datasets: [
      {
        data: [] as number[],
        backgroundColor: [
          'rgba(255, 99, 132, 0.6)',
          'rgba(54, 162, 235, 0.6)',
          'rgba(255, 206, 86, 0.6)',
          'rgba(75, 192, 192, 0.6)',
          'rgba(153, 102, 255, 0.6)',
          'rgba(255, 159, 64, 0.6)',
          'rgba(199, 199, 199, 0.6)'
        ],
        borderWidth: 1
      }
    ]
  });

  // Chart options
  const portfolioChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: '#E5E7EB'
        }
      },
      title: {
        display: true,
        text: 'Portfolio Value Over Time',
        color: '#E5E7EB'
      }
    },
    scales: {
      y: {
        ticks: {
          color: '#9CA3AF'
        },
        grid: {
          color: '#374151'
        }
      },
      x: {
        ticks: {
          color: '#9CA3AF'
        },
        grid: {
          color: '#374151'
        }
      }
    }
  };

  const allocationChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right' as const,
        labels: {
          color: '#E5E7EB'
        }
      },
      title: {
        display: true,
        text: 'Asset Allocation',
        color: '#E5E7EB'
      }
    }
  };

  // Fetch data function - common for both initial load and refresh
  const fetchDashboardData = async () => {
    try {
      // Clear error state before fetching
      setError(null);
      
      // Fetch all dashboard data in one call from our new consolidated endpoint
      const dashboardData = await fetchDashboardStats();
      
      // Set state with returned data
      setTotalBots(dashboardData.totalBots);
      setActiveBots(dashboardData.activeBots);
      setPortfolioValue(dashboardData.portfolioValue);
      setPortfolioChange(dashboardData.portfolioChange);
      setTotalTrades(dashboardData.totalTrades);
      setTradeSuccessRate(dashboardData.successRate);
      setRecentTrades(dashboardData.recentTrades);
      setAssetAllocation(dashboardData.assetAllocation);
      
      // Set asset allocation chart data
      const allocationLabels = Object.keys(dashboardData.assetAllocation);
      const allocationData = Object.values(dashboardData.assetAllocation);
      
      setAllocationChartData({
        labels: allocationLabels,
        datasets: [
          {
            data: allocationData,
            backgroundColor: [
              'rgba(255, 99, 132, 0.6)',
              'rgba(54, 162, 235, 0.6)',
              'rgba(255, 206, 86, 0.6)',
              'rgba(75, 192, 192, 0.6)',
              'rgba(153, 102, 255, 0.6)',
              'rgba(255, 159, 64, 0.6)',
              'rgba(199, 199, 199, 0.6)'
            ],
            borderWidth: 1
          }
        ]
      });
      
      // Format portfolio history data for chart
      const dates = dashboardData.portfolioHistory.map(item => {
        const date = new Date(item.date);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      });
      
      const portfolioValues = dashboardData.portfolioHistory.map(item => item.value);
      
      setPortfolioChartData({
        labels: dates,
        datasets: [
          {
            label: 'Portfolio Value',
            data: portfolioValues,
            borderColor: 'rgb(75, 192, 192)',
            backgroundColor: 'rgba(75, 192, 192, 0.5)',
            tension: 0.4
          }
        ]
      });
      
      // For backward compatibility, also fetch bots to populate the bots state
      // This can be removed if other parts of the component don't rely on this data
      try {
        const botsData = await fetchBots();
        const dashboardBots = botsData.map(bot => ({
          id: bot.id,
          name: bot.name,
          enabled: bot.enabled === true, 
          status: bot.status || 'unknown',
          currentCoin: bot.currentCoin || null,
          coins: [],
          performance: bot.performance,
          budget: bot.budget
        }));
        
        setBots(dashboardBots);
      } catch (botErr) {
        console.error('Error fetching bot data:', botErr);
        // Don't set error state here to avoid interrupting the UI flow
      }
      
      // Update last refreshed time
      setLastRefreshed(new Date());
      
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data. Please try again later.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Initial data load
  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Handle manual refresh
  const handleManualRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  // Format timestamp for display
  const formatTimestamp = (timestamp: string): string => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true
    });
  };

  // Loading state skeleton UI
  const renderSkeleton = () => (
    <div className="dashboard-container p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-white">Dashboard</h1>
        <div className="animate-pulse w-32 h-10 bg-gray-800 rounded"></div>
      </div>
      
      {/* Skeleton Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {[1, 2, 3, 4].map(i => (
          <Card key={i} className="p-4 h-24">
            <div className="h-full flex flex-col justify-between animate-pulse">
              <div className="h-4 w-24 bg-gray-700 rounded"></div>
              <div className="h-6 w-16 bg-gray-700 rounded"></div>
            </div>
          </Card>
        ))}
      </div>
      
      {/* Skeleton Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <Card className="lg:col-span-2 p-4 h-64 animate-pulse">
          <div className="h-4 w-40 bg-gray-700 rounded mb-4"></div>
          <div className="h-56 bg-gray-800/50 rounded"></div>
        </Card>
        <Card className="p-4 h-64 animate-pulse">
          <div className="h-4 w-40 bg-gray-700 rounded mb-4"></div>
          <div className="h-56 bg-gray-800/50 rounded-full mx-auto w-56"></div>
        </Card>
      </div>
      
      {/* Skeleton Recent Trades */}
      <Card className="p-4 mb-6 animate-pulse">
        <div className="h-4 w-40 bg-gray-700 rounded mb-6"></div>
        <div className="space-y-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-10 bg-gray-800/50 rounded w-full"></div>
          ))}
        </div>
      </Card>
    </div>
  );
  
  // Show loading skeleton when initially loading
  if (loading && !refreshing) {
    return renderSkeleton();
  }

  // Main dashboard UI
  return (
    <div className="dashboard-container p-4">
      {/* Header with refresh button */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-semibold text-white">Dashboard</h1>
          {error && (
            <div className="bg-red-900/20 border border-red-500 text-red-200 px-3 py-1 rounded text-sm">
              Error: {error}
            </div>
          )}
        </div>
        
        <div className="flex items-center space-x-4">
          {lastRefreshed && (
            <span className="text-sm text-gray-400">
              Last updated: {lastRefreshed.toLocaleTimeString()}
            </span>
          )}
          <Button 
            onClick={handleManualRefresh} 
            disabled={refreshing}
            size="sm"
            variant="secondary"
            className="flex items-center space-x-2"
          >
            {refreshing ? (
              <>
                <Spinner size="sm" />
                <span>Refreshing...</span>
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M23 4v6h-6" />
                  <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                </svg>
                <span>Refresh</span>
              </>
            )}
          </Button>
          <Link href="/bots/create">
            <Button variant="primary" className="flex items-center space-x-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              <span>Create Bot</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Error display */}
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertTitle>Error</AlertTitle>
          <p>{error}</p>
        </Alert>
      )}

      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {/* Portfolio Value */}
        <Card className="p-4">
          <h3 className="text-sm font-medium text-gray-400">Total Portfolio Value</h3>
          <p className="text-2xl font-semibold text-white">${portfolioValue.toLocaleString('en-US', { maximumFractionDigits: 2 })}</p>
          <p className={`text-sm ${portfolioChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            {portfolioChange >= 0 ? '+' : ''}{portfolioChange.toFixed(2)}%
          </p>
        </Card>
        
        {/* Active Bots */}
        <Card className="p-4">
          <h3 className="text-sm font-medium text-gray-400">Active Bots</h3>
          <p className="text-2xl font-semibold text-white">{activeBots}</p>
          <p className="text-sm text-gray-400">of {totalBots} total</p>
        </Card>
        
        {/* Trade Success Rate */}
        <Card className="p-4">
          <h3 className="text-sm font-medium text-gray-400">Trade Success Rate</h3>
          <p className="text-2xl font-semibold text-white">{tradeSuccessRate.toFixed(0)}%</p>
          <div className="w-full bg-gray-700 h-1 mt-2 rounded-full overflow-hidden">
            <div 
              className="bg-green-500 h-full" 
              style={{ width: `${tradeSuccessRate}%` }}
            ></div>
          </div>
        </Card>
        
        {/* Total Trades */}
        <Card className="p-4">
          <h3 className="text-sm font-medium text-gray-400">Total Trades</h3>
          <p className="text-2xl font-semibold text-white">{totalTrades}</p>
          <p className="text-sm text-gray-400">across all bots</p>
        </Card>
      </div>
      
      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        {/* Portfolio Value Chart */}
        <Card className="lg:col-span-2 p-4">
          <h3 className="text-lg font-medium text-white mb-4">Portfolio Performance</h3>
          <div className="h-64">
            <Line options={portfolioChartOptions} data={portfolioChartData} />
          </div>
        </Card>
        
        {/* Asset Allocation Chart */}
        <Card className="p-4">
          <h3 className="text-lg font-medium text-white mb-4">Asset Allocation</h3>
          <div className="h-64">
            <Doughnut options={allocationChartOptions} data={allocationChartData} />
          </div>
        </Card>
      </div>
      
      {/* Recent Trades */}
      <Card className="p-4 mb-6">
        <h3 className="text-lg font-medium text-white mb-4">Recent Trades</h3>
        {recentTrades.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs text-gray-400 border-b border-gray-700">
                  <th className="pb-2">Bot</th>
                  <th className="pb-2">From</th>
                  <th className="pb-2">To</th>
                  <th className="pb-2">Status</th>
                  <th className="pb-2">Time</th>
                </tr>
              </thead>
              <tbody>
                {recentTrades.map((trade) => (
                  <tr key={trade.id} className="border-b border-gray-800">
                    <td className="py-3 pr-4">
                      <Link href={`/bots/${trade.botId}`}>
                        <span className="text-blue-400 hover:text-blue-300">{trade.botName}</span>
                      </Link>
                    </td>
                    <td className="py-3 pr-4">{trade.fromCoin}</td>
                    <td className="py-3 pr-4">{trade.toCoin}</td>
                    <td className="py-3 pr-4">
                      <span className={`px-2 py-1 text-xs rounded ${
                        trade.status === 'completed' ? 'bg-green-900/20 text-green-400' :
                        trade.status === 'failed' ? 'bg-red-900/20 text-red-400' :
                        'bg-yellow-900/20 text-yellow-400'
                      }`}>
                        {trade.status}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-sm text-gray-400">{formatTimestamp(trade.timestamp)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-400">
            No trades found
          </div>
        )}
      </Card>
      
      {refreshing && (
        <div className="fixed bottom-4 right-4 bg-gray-800 text-white px-4 py-2 rounded-md shadow-lg flex items-center space-x-2">
          <Spinner size="sm" />
          <span>Refreshing dashboard...</span>
        </div>
      )}
    </div>
  );
}
