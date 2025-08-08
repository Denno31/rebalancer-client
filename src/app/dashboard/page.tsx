'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/Card';
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

// Import types
import { Bot } from '@/types/botTypes';
import { Trade } from '@/types/tradeTypes';
import { AssetAllocation } from '@/types/botAssetTypes';

// Register Chart.js components
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
  coins: string;
  currentCoin: string | null;
  status?: string;
  performance?: number;
  trades?: DashboardTrade[];
  budget?: number; // Allow budget property for dashboard display
  exchange?: string; // Allow exchange property for dashboard display
  thresholdPercentage?: number;
  checkInterval?: number;
  initialCoin?: string;
}

interface Asset {
  coin: string;
  balance: number;
  botName?: string;
  botId?: number;
}

interface DashboardTrade extends Trade {
  profit?: number;
  profitPercentage?: number;
  botName?: string;
  timestamp?: Date;
  type?: string;
  amount?: number;
  executed?: string; // Backward compatibility
}

// Utility function for formatting time differences
function formatTimeDifference(timestamp: Date | string | undefined): string {
  if (!timestamp) return 'Unknown';
  
  const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
  if (isNaN(date.getTime())) return 'Invalid date';
  
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHours = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 0) {
    return `${diffDays}d ago`;
  } else if (diffHours > 0) {
    return `${diffHours}h ago`;
  } else if (diffMin > 0) {
    return `${diffMin}m ago`;
  } else {
    return 'Just now';
  }
}

// Dashboard page component
export default function DashboardPage() {
  return (
    <DashboardLayout>
      <DashboardContent />
    </DashboardLayout>
  );
}

// Separate component for dashboard content
function DashboardContent() {
  // State
  const [bots, setBots] = useState<DashboardBot[]>([]);
  const [prices, setPrices] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [portfolioValue, setPortfolioValue] = useState<number>(0);
  const [portfolioChange, setPortfolioChange] = useState<number>(0);
  const [activeBots, setActiveBots] = useState<number>(0);
  const [totalTrades, setTotalTrades] = useState<number>(0);
  const [recentActivity, setRecentActivity] = useState<DashboardTrade[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);

  useEffect(() => {
    fetchDashboardData();
    
    // Set up auto-refresh every 60 seconds
    const refreshInterval = setInterval(() => {
      fetchDashboardData();
    }, 60000);
    
    return () => clearInterval(refreshInterval);
  }, []);
  
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const botsData = await fetchBots();
      
      // Initialize an empty prices object
      let allPricesData: Record<string, number> = {};
      let allAssetsData: Asset[] = [];
      let allRecentActivity: DashboardTrade[] = []; // Use DashboardTrade which includes timestamp
      
      // Fetch prices, assets, and trades for each bot if there are bots available
      if (botsData && botsData.length > 0) {
        // Use Promise.all to fetch data for all bots in parallel
        const pricePromises = botsData.map(bot => fetchBotPrices(bot.id));
        const assetPromises = botsData.map(bot => fetchBotAssets(bot.id));
        const tradePromises = botsData.map(bot => fetchBotTrades(bot.id, 5, 1));
        
        const [pricesResults, assetsResults, tradesResults] = await Promise.all([
          Promise.all(pricePromises),
          Promise.all(assetPromises),
          Promise.all(tradePromises)
        ]);
        
        // Merge all price data into a single object
        pricesResults.forEach((botPrices) => {
          allPricesData = { ...allPricesData, ...botPrices };
        });
        
        // Combine all assets with their respective bot names
        assetsResults.forEach((botAssets, index) => {
          if (botAssets && botAssets.length) {
            const botName = botsData[index].name;
            const botId = botsData[index].id;
            const assetsWithBotInfo = botAssets.map(asset => ({
              ...asset,
              botName,
              botId
            }));
            allAssetsData = [...allAssetsData, ...assetsWithBotInfo];
          }
        });
        
        // Combine recent trades from all bots
        tradesResults.forEach((botTrades, index) => {
          if (botTrades && botTrades.length) {
            const botName = botsData[index].name;
            const botId = botsData[index].id;
            // Convert trade to DashboardTrade with timestamp
            const tradesWithBotInfo = botTrades.map(trade => ({
              ...trade,
              botName,
              botId,
              timestamp: new Date(trade.executed || trade.executedAt || Date.now())
            }));
            allRecentActivity = [...allRecentActivity, ...tradesWithBotInfo];
          }
        });
        
        // Sort recent activity by timestamp (newest first)
        allRecentActivity.sort((a, b) => {
          const timeA = a.timestamp instanceof Date ? a.timestamp.getTime() : new Date(a.executedAt).getTime();
          const timeB = b.timestamp instanceof Date ? b.timestamp.getTime() : new Date(b.executedAt).getTime();
          return timeB - timeA;
        });
        
        // Limit to the most recent 10 activities
        allRecentActivity = allRecentActivity.slice(0, 10);
        
        // Update state
        setBots(botsData);
        setPrices(allPricesData);
        setAssets(allAssetsData);
        setRecentActivity(allRecentActivity);
        
        // Calculate portfolio stats
        calculatePortfolioStats(botsData, allPricesData, allAssetsData);
      } else {
        // If no bots, set empty data
        setBots([]);
        setPrices({});
        setAssets([]);
        setRecentActivity([]);
        
        // Reset portfolio stats
        setPortfolioValue(0);
        setPortfolioChange(0);
        setActiveBots(0);
        setTotalTrades(0);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const calculatePortfolioStats = (botsData: DashboardBot[], pricesData: Record<string, number>, assetsData: Asset[] = []) => {
    // Calculate total portfolio value
    let total = 0;
    
    assetsData.forEach(asset => {
      if (asset.coin && pricesData[asset.coin]) {
        total += asset.balance * pricesData[asset.coin];
      }
    });
    
    // Set portfolio value
    setPortfolioValue(total);
    
    // Set portfolio change (mock data for now - in a real app, this would be calculated from historical data)
    setPortfolioChange(Math.random() * 10 - 5); // Random value between -5% and 5%
    
    // Set active bots count
    const activeBotsCount = botsData.filter(bot => bot.enabled).length;
    setActiveBots(activeBotsCount);
    
    // Set total trades count (mock data for now)
    // In a real app, you would fetch this from your API
    setTotalTrades(botsData.reduce((acc, bot) => acc + (bot.trades?.length || 0), 0));
  };

  // Mock API functions - these would connect to your backend
  const fetchBots = async (): Promise<DashboardBot[]> => {
    // Mock API call - in a real app, this would call your backend API
    return new Promise(resolve => {
      setTimeout(() => {
        // Create mock bots with all required properties from Bot type
        const mockBots: DashboardBot[] = [
          { 
            id: 1, 
            name: 'ETH Bot', 
            status: 'active', 
            enabled: true, 
            performance: 3.2,
            // Required Bot properties
            coins: 'ETH,USDT',
            thresholdPercentage: 5,
            checkInterval: 10,
            initialCoin: 'ETH',
            budget: 1000,
            currentCoin: 'ETH',
            exchange: 'binance'
          },
          { 
            id: 2, 
            name: 'BTC Bot', 
            status: 'active', 
            enabled: true, 
            performance: 5.1,
            // Required Bot properties
            coins: 'BTC,USDT',
            thresholdPercentage: 5,
            checkInterval: 10,
            initialCoin: 'BTC',
            budget: 1000,
            currentCoin: 'BTC',
            exchange: 'binance'
          },
          { 
            id: 3, 
            name: 'DOT Bot', 
            status: 'paused', 
            enabled: false, 
            performance: -1.3,
            // Required Bot properties
            coins: 'DOT,USDT',
            thresholdPercentage: 5,
            checkInterval: 10,
            initialCoin: 'DOT',
            budget: 1000,
            currentCoin: 'DOT',
            exchange: 'binance'
          },
          { 
            id: 4, 
            name: 'BNB Bot', 
            status: 'active', 
            enabled: true, 
            performance: 2.7,
            // Required Bot properties
            coins: 'BNB,USDT',
            thresholdPercentage: 5,
            checkInterval: 10,
            initialCoin: 'BNB',
            budget: 1000,
            currentCoin: 'BNB',
            exchange: 'binance'
          }
        ];
        
        resolve(mockBots);
      }, 300);
    });
  };
  
  const fetchBotPrices = async (botId: number): Promise<Record<string, number>> => {
    // Mock API call
    return new Promise(resolve => {
      setTimeout(() => {
        resolve({
          ETH: 3500 + Math.random() * 200,
          BTC: 50000 + Math.random() * 1000,
          DOT: 30 + Math.random() * 5,
          BNB: 450 + Math.random() * 20,
          USDT: 1.0,
          USDC: 1.0
        });
      }, 200);
    });
  };
  
  const fetchBotAssets = async (botId: number): Promise<Asset[]> => {
    // Mock API call
    return new Promise(resolve => {
      setTimeout(() => {
        resolve([
          { coin: botId === 1 ? 'ETH' : botId === 2 ? 'BTC' : botId === 3 ? 'DOT' : 'BNB', balance: Math.random() * 10 },
          { coin: 'USDT', balance: Math.random() * 5000 }
        ]);
      }, 250);
    });
  };
  
  const fetchBotTrades = async (botId: number, limit: number, page: number): Promise<DashboardTrade[]> => {
    // Mock API call
    return new Promise(resolve => {
      setTimeout(() => {
        const coins = ['ETH', 'BTC', 'DOT', 'BNB', 'USDT', 'USDC'];
        const trades: DashboardTrade[] = Array(Math.floor(Math.random() * limit) + 1).fill(null).map((_, i) => {
          // Create timestamp for both dashboard and trade interface
          const tradeTimestamp = new Date(Date.now() - Math.floor(Math.random() * 86400000 * 7));
          
          return {
            // Required Trade properties from Trade interface
            id: botId * 100 + i,
            tradeId: `trade-${botId}-${i}`,
            botId,
            fromCoin: coins[Math.floor(Math.random() * coins.length)],
            toCoin: coins[Math.floor(Math.random() * coins.length)],
            fromAmount: Math.random() * 1000,
            toAmount: Math.random() * 1000,
            fromPrice: Math.random() * 100,
            toPrice: Math.random() * 100,
            status: 'completed',
            executedAt: tradeTimestamp.toISOString(),
            
            // Dashboard-specific properties
            timestamp: tradeTimestamp,
            type: Math.random() > 0.5 ? 'buy' : 'sell',
            amount: Math.random() * 1000,
            botName: `Bot ${botId}`,
            executed: tradeTimestamp.toISOString(), // Duplicate for backward compatibility
            profit: Math.random() * 200 - 100,
            profitPercentage: Math.random() * 10 - 5
          };
        });
        resolve(trades);
      }, 200);
    });
  };

  // Helper function to format time differences
  const formatTimeDifference = (timestamp: Date): string => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) {
      return `${days} day${days > 1 ? 's' : ''} ago`;
    } else if (hours > 0) {
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else if (minutes > 0) {
      return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    }
    
    return 'Just now';
  };
  
  // Generate asset allocation data
  const generateAssetAllocationData = () => {
    if (!assets || assets.length === 0) {
      return {
        labels: ['No Data'],
        datasets: [{ data: [100], backgroundColor: ['#e0e0e0'], borderWidth: 0 }]
      };
    }
    
    // Group assets by coin and calculate total value
    const assetsBySymbol: Record<string, {value: number}> = {};
    let totalValue = 0;
    
    assets.forEach(asset => {
      if (!asset.coin) return;
      
      const symbol = asset.coin;
      const price = prices[symbol] || 0;
      const value = asset.balance * price;
      
      if (!assetsBySymbol[symbol]) {
        assetsBySymbol[symbol] = { value: 0 };
      }
      
      assetsBySymbol[symbol].value += value;
      totalValue += value;
    });
    
    // Sort coins by value (descending)
    const sortedAssets = Object.entries(assetsBySymbol)
      .map(([symbol, data]) => ({ symbol, value: data.value }))
      .filter(asset => asset.value > 0)
      .sort((a, b) => b.value - a.value);
  
    // Take top 5 assets and group the rest as "Others"
    let topAssets = sortedAssets.slice(0, 5);
    
    // If there are more than 5 assets, add an "Others" category
    if (sortedAssets.length > 5) {
      const othersValue = sortedAssets
        .slice(5)
        .reduce((sum, asset) => sum + asset.value, 0);
      
      if (othersValue > 0) {
        topAssets = [...topAssets, { symbol: 'Others', value: othersValue }];
      }
    }
    
    // Generate chart data
    const labels = topAssets.map(asset => asset.symbol);
    const data = topAssets.map(asset => asset.value);
    
    // Generate color palette
    const colors = [
      '#3B82F6', // Blue
      '#10B981', // Green
      '#F59E0B', // Yellow
      '#EF4444', // Red
      '#8B5CF6', // Purple
      '#6B7280', // Gray (for "Others")
    ];
    
    return {
      labels,
      datasets: [
        {
          data,
          backgroundColor: colors.slice(0, labels.length),
          borderWidth: 0,
        },
      ],
    };
  };
  
  const assetAllocationData = generateAssetAllocationData();
  
  const assetAllocationOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'right' as const,
        labels: {
          color: '#e0e0e0', // Light text for dark theme
          font: {
            size: 12,
          },
        },
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const value = context.raw;
            const total = context.chart.getDatasetMeta(0).total;
            const percentage = Math.round((value / total) * 100);
            return `${context.label}: $${value.toLocaleString('en-US', { maximumFractionDigits: 2 })} (${percentage}%)`;
          },
        },
      },
    },
  };
  
  // Get top performing bots
  const topBots = [...bots]
    .sort((a, b) => (b.performance || 0) - (a.performance || 0))
    .slice(0, 3);
  
  // Prepare portfolio chart data
  const portfolioChartData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
    datasets: [
      {
        label: 'Portfolio Value',
        data: [
          10000 + Math.random() * 1000,
          11000 + Math.random() * 1000,
          10500 + Math.random() * 1000,
          12000 + Math.random() * 1000,
          13000 + Math.random() * 1000,
          14000 + Math.random() * 1000,
          portfolioValue, // Current value
        ],
        fill: false,
        borderColor: '#3B82F6',
        tension: 0.4,
      },
    ],
  };

  const portfolioChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const value = context.raw;
            return `$${value.toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: false,
        ticks: {
          color: '#9ca3af', // Gray-400 in Tailwind
        },
        grid: {
          color: 'rgba(75, 85, 99, 0.2)', // Gray-600 with opacity
        },
      },
      x: {
        ticks: {
          color: '#9ca3af', // Gray-400 in Tailwind
        },
        grid: {
          display: false,
        },
      },
    },
  };

  // Loading skeleton
  if (loading) {
    return (
      <div className="dashboard-container p-4">
        <h1 className="text-2xl font-semibold text-white mb-6">Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {[1, 2, 3, 4].map(i => (
            <Card key={i} className="p-4 h-24 animate-pulse bg-gray-800">
              <div className="h-full flex flex-col justify-between">
                <div className="h-4 w-24 bg-gray-700 rounded"></div>
                <div className="h-6 w-16 bg-gray-700 rounded"></div>
              </div>
            </Card>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="lg:col-span-2 p-4 h-64 animate-pulse bg-gray-800">x</Card>
          <Card className="p-4 h-64 animate-pulse bg-gray-800">x</Card>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-white">Dashboard</h1>
        <a 
          href="/bots/create" 
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md flex items-center space-x-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
          <span>Create Bot</span>
        </a>
      </div>
      
      {/* Stats Overview */}
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
          <p className="text-sm text-gray-400">of {bots.length} total bots</p>
        </Card>
        
        {/* Total Trades */}
        <Card className="p-4">
          <h3 className="text-sm font-medium text-gray-400">Total Trades</h3>
          <p className="text-2xl font-semibold text-white">{totalTrades}</p>
          <p className="text-sm text-gray-400">Last 30 days</p>
        </Card>
        
        {/* Best Performing Bot */}
        <Card className="p-4">
          <h3 className="text-sm font-medium text-gray-400">Best Performing Bot</h3>
          <p className="text-2xl font-semibold text-white">
            {topBots && topBots.length > 0 ? topBots[0].name : 'N/A'}
          </p>
          <p className={`text-sm ${topBots && topBots.length > 0 && topBots[0].performance && topBots[0].performance >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            {topBots && topBots.length > 0 && topBots[0].performance !== undefined ? 
              `${topBots[0].performance >= 0 ? '+' : ''}${topBots[0].performance.toFixed(2)}%` : 
              '0.00%'}
          </p>
        </Card>
      </div>
      
      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        {/* Portfolio Value Chart */}
        <Card className="lg:col-span-2 p-4">
          <h2 className="text-lg font-semibold text-white mb-4">Portfolio Value</h2>
          <div className="h-64">
            <Line data={portfolioChartData} options={portfolioChartOptions} />
          </div>
        </Card>
        
        {/* Asset Allocation Chart */}
        <Card className="p-4">
          <h2 className="text-lg font-semibold text-white mb-4">Asset Allocation</h2>
          <div className="h-64 flex items-center justify-center">
            <Doughnut data={assetAllocationData} options={assetAllocationOptions} />
          </div>
        </Card>
      </div>
      
      {/* Recent Activity */}
      <Card className="p-4 mb-6">
        <h2 className="text-lg font-semibold text-white mb-4">Recent Activity</h2>
        {recentActivity.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-700">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Bot</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Action</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {recentActivity.map(activity => (
                  <tr key={activity.id} className="hover:bg-gray-700/50">
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-300">{activity.botName}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        activity.type === 'buy' ? 'bg-green-900 text-green-200' : 'bg-red-900 text-red-200'
                      }`}>
                        {activity.type === 'buy' ? 'Bought' : 'Sold'} {activity.fromCoin} → {activity.toCoin}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-300">
                      ${activity.amount ? activity.amount.toLocaleString('en-US', { maximumFractionDigits: 2 }) : '0.00'}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-400">
                      {formatTimeDifference(activity.timestamp)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-400 text-center py-4">No recent activity to display</p>
        )}
      </Card>
      
      {/* Top Performing Bots */}
      <Card className="p-4">
        <h2 className="text-lg font-semibold text-white mb-4">Top Performing Bots</h2>
        {topBots.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {topBots.map(bot => (
              <Card key={bot.id} className="p-4 bg-gray-800">
                <h3 className="text-md font-semibold text-white">{bot.name}</h3>
                <p className={`text-lg ${bot.performance && bot.performance >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {bot.performance !== undefined ? `${bot.performance >= 0 ? '+' : ''}${bot.performance.toFixed(2)}%` : '0.00%'}
                </p>
                <p className="text-xs text-gray-400 mt-1">Last 7 days</p>
              </Card>
            ))}
          </div>
        ) : (
          <p className="text-gray-400 text-center py-4">No bots to display</p>
        )}
      </Card>
    </div>
  );
}
