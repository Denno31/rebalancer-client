'use client';

import React, { useState, useEffect, useMemo, useCallback, FC } from 'react';
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Alert, AlertDescription } from "@/components/ui/Alert";
import { Line } from 'react-chartjs-2';
import { Switch } from "@/components/ui/Switch";
import { BarChart as BarChartIcon, Table as TableIcon, ChevronUp, ChevronDown, RefreshCw } from 'lucide-react';
import { fetchPriceComparison, fetchHistoricalComparison } from '@/utils/botApi';


// Define types for props and state
interface PriceComparisonData {
  coin: string;
  initialPrice: number;
  currentPrice: number;
  percentChange: number;
  snapshotTimestamp: string;
  lastUpdated: string;
  wasEverHeld: boolean;
  unitsHeld: number;
}

interface PriceComparisonResponse {
  botId: string;
  botName: string;
  priceComparisons: PriceComparisonData[];
  preferredStablecoin: string;
  totalCount?: number;
  page?: number;
  limit?: number;
}

interface HistoricalPrice {
  timestamp: string;
  price: number;
  source: string;
  percentChange: number;
}

interface CoinHistoricalData {
  coin: string;
  snapshot: {
    initialPrice: number;
    snapshotTimestamp: string;
    wasEverHeld: boolean;
    unitsHeld: number;
  };
  prices: HistoricalPrice[];
}

interface HistoricalComparisonResponse {
  botId: string;
  botName: string;
  fromTime: string;
  toTime: string;
  data: CoinHistoricalData[];
}

interface PriceComparisonChartProps {
  botId: string | number;
}

const PriceComparisonChart: React.FC<PriceComparisonChartProps> = ({ botId }) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [priceComparisonData, setPriceComparisonData] = useState<PriceComparisonData[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [historicalData, setHistoricalData] = useState<CoinHistoricalData[]>([]);
  const [viewMode, setViewMode] = useState<'chart' | 'cards' | 'table'>('table'); // Default to cards view
  const [timeRange, setTimeRange] = useState<'1h' | '6h' | '12h' | '24h' | '3d' | '7d' | '30d'>('24h');
  const [selectedCoin, setSelectedCoin] = useState<string>('all');
  const [autoRefresh, setAutoRefresh] = useState<boolean>(true);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
  const [sortColumn, setSortColumn] = useState<string>('coin');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [rowsPerPage, setRowsPerPage] = useState<number>(10);
  

  // Time range options in milliseconds - memoized to prevent recreation
  const timeRanges = useMemo<Record<string, number>>(() => ({
    '1h': 60 * 60 * 1000,
    '6h': 6 * 60 * 60 * 1000,
    '12h': 12 * 60 * 60 * 1000,
    '24h': 24 * 60 * 60 * 1000,
    '3d': 3 * 24 * 60 * 60 * 1000,
    '7d': 7 * 24 * 60 * 60 * 1000,
    '30d': 30 * 24 * 60 * 60 * 1000
  }), []);

  // Define data loading functions outside useEffect to prevent recreating them on every render
  // Flag to track if data is currently being silently refreshed
  const [isSilentRefresh, setIsSilentRefresh] = useState<boolean>(false);

  const loadPriceComparison = useCallback(async () => {
    if (!botId) return;
    
    try {
      // Convert botId to number if it's a string to ensure API compatibility
      const data = await fetchPriceComparison(Number(botId), { page: currentPage, limit: rowsPerPage });
      const responseData = data as unknown as PriceComparisonResponse;
      // Ensure data has the expected structure
      if (responseData && Array.isArray(responseData.priceComparisons)) {
        setPriceComparisonData(responseData.priceComparisons);
        // Store pagination information
        setTotalCount(responseData.totalCount || responseData.priceComparisons.length);
      } else {
        setPriceComparisonData([]);
        setTotalCount(0);
        console.error('Invalid price comparison data format:', responseData);
      }
      setLastRefreshed(new Date());
      setError(null);
    } catch (err: any) {
      
      console.error('Error fetching price comparison:', err);
      if (err && err.message) {
        setError(err.message);
      } else {
        setError('Failed to load price comparison data');
      }
    }
  }, [botId, currentPage, rowsPerPage]);

  // Get options for historical comparison - memoized to prevent recreation
  const historicalOptions = useMemo(() => {
    const options: {
      fromTime: Date | string;
      toTime: Date | string;
      coin?: string;
    } = {
      fromTime: new Date(Date.now() - timeRanges[timeRange]),
      toTime: new Date()
    };

    // Add coin filter if specific coin is selected
    if (selectedCoin !== 'all') {
      options.coin = selectedCoin;
    }
    
    return options;
  }, [selectedCoin, timeRange, timeRanges]);

  const loadHistoricalComparison = useCallback(async () => {
    if (!botId) return;
    
    try {
      // Convert botId to number if it's a string to ensure API compatibility
      const response = await fetchHistoricalComparison(Number(botId), historicalOptions) as unknown as HistoricalComparisonResponse;
      // Ensure response has the expected structure
      if (response && Array.isArray(response.data)) {
        setHistoricalData(response.data);
      } else {
        setHistoricalData([]);
        console.error('Invalid historical comparison data format:', response);
      }
      setError(null);
    } catch (err: any) {
      console.error('Error fetching historical comparison:', err);
      setError('Failed to load historical price data');
    }
  }, [botId, historicalOptions]);

  // Handle initial data loading and refreshing
  useEffect(() => {
    if (!botId) return;
    
    let isMounted = true;
    
    const loadData = async (silent = false) => {
      if (!isMounted) return;
      
      // Only show loading state if not in silent refresh mode
      if (!silent) {
        setLoading(true);
      }
      
      try {
        // Load both data sources in parallel
        await Promise.all([
          loadPriceComparison(),
          loadHistoricalComparison()
        ]);
      } catch (error) {
        // Error handling is already in loadPriceComparison and loadHistoricalComparison
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    
    // Load data when component mounts or pagination/refresh parameters change
    loadData(false);
    
    // Set up auto-refresh interval if enabled
    if (autoRefresh) {
      const interval = setInterval(() => {
        setIsSilentRefresh(true);
        loadPriceComparison().finally(() => setIsSilentRefresh(false));
      }, 60000); // Refresh every minute
      
      return () => clearInterval(interval);
    }
    
    // Cleanup function
    return () => { isMounted = false; };
  }, [botId, autoRefresh, loadPriceComparison, loadHistoricalComparison, currentPage, rowsPerPage]);

  // Utility functions
  function formatPercentage(value: number): string {
    if (value === null || value === undefined) return 'N/A';
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  }

  function formatTimestamp(timestamp: string): string {
    if (!timestamp) return 'N/A';
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  function formatPrice(price: number): string {
    if (price === null || price === undefined) return 'N/A';
    return `$${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}`;
  }

  function getChangeClass(change: number): string {
    if (change > 0) return 'text-green-500';
    if (change < 0) return 'text-red-500';
    return 'text-gray-500';
  }

  // Process and prepare chart data
  const chartData = useMemo(() => {
    if (!historicalData || historicalData.length === 0) return null;

    // Extract timestamps for x-axis labels
    const allTimestamps = new Set<string>();
    historicalData.forEach(coin => {
      if (!coin.prices) return;
      
      coin.prices.forEach(price => {
        if (price.timestamp) {
          allTimestamps.add(price.timestamp);
        }
      });
    });

    const sortedTimestamps = [...allTimestamps].sort();

    // Prepare datasets for each coin
    const datasets = historicalData.map((coin, index) => {
      // Generate a color based on index
      const hue = (index * 137.5) % 360;
      const color = `hsl(${hue}, 70%, 60%)`;

      return {
        label: coin.coin,
        data: coin.prices.map(price => price.percentChange),
        borderColor: color,
        backgroundColor: `${color}33`, // Add 20% alpha
        tension: 0.4,
        pointRadius: 2,
        pointHoverRadius: 5,
        fill: false
      };
    });

    return {
      labels: sortedTimestamps.map(timestamp => formatTimestamp(timestamp)),
      datasets
    };
  }, [historicalData]);

  // Chart options
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const label = context.dataset.label || '';
            const value = context.raw !== null ? context.raw : 'N/A';
            return `${label}: ${formatPercentage(value)}`;
          }
        }
      },
      legend: {
        position: 'top' as const,
        labels: {
          usePointStyle: true,
          padding: 20
        }
      },
      title: {
        display: true,
        text: 'Price Movement Since Initial Snapshot',
        font: {
          size: 16
        },
        padding: {
          top: 10,
          bottom: 20
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(this: any, tickValue: number | string, index: number, ticks: any) {
            // Handle the value regardless of whether it's a string or number
            return formatPercentage(Number(tickValue));
          }
        },
        title: {
          display: true,
          text: 'Price Change (%)',
          font: {
            size: 12
          }
        }
      },
      x: {
        ticks: {
          maxRotation: 45,
          minRotation: 45
        },
        title: {
          display: true,
          text: 'Time',
          font: {
            size: 12
          }
        }
      }
    }
  };

  // Handle time range selection
  const handleTimeRangeChange = useCallback((range: string) => {
    setTimeRange(range as '1h' | '6h' | '12h' | '24h' | '3d' | '7d' | '30d');
  }, []);

  // Handle coin selection
  const handleCoinChange = useCallback((coin: string) => {
    setSelectedCoin(coin);
  }, []);

  // Toggle auto-refresh
  const toggleAutoRefresh = () => {
    setAutoRefresh(!autoRefresh);
  };

  // Toggle view mode between chart and table
  const toggleViewMode = useCallback(() => {
    setViewMode(prevMode => prevMode === 'chart' ? 'table' : 'chart');
  }, []);
  
  // Handle sorting
  const handleSortChange = useCallback((column: string) => {
    setSortColumn(prev => {
      if (prev === column) {
        setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
        return column;
      }
      setSortDirection('asc');
      return column;
    });
  }, []);

  const toggleTableView = () => {
    setViewMode('table');
  };

  // Toggle auto-refresh handler
  const handleAutoRefreshChange = useCallback((checked: boolean) => {
    setAutoRefresh(checked);
  }, []);

  // Refresh data with optional silent mode
  const manualRefresh = useCallback((silent = false) => {
    if (!silent) {
      setLoading(true);
    }
    
    Promise.all([
      loadPriceComparison(),
      loadHistoricalComparison()
    ]).finally(() => {
      setLoading(false);
      setLastRefreshed(new Date());
    });
  }, [loadPriceComparison, loadHistoricalComparison]);
  
  // Silent refresh that updates data without showing loading spinner
  const silentRefresh = useCallback(() => {
    manualRefresh(true);
  }, [manualRefresh]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <Card className="p-4 w-full">
      <div className="mb-4 flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant={timeRange === '1h' ? 'primary' : 'outline'}
            onClick={() => handleTimeRangeChange('1h')}
          >
            1H
          </Button>
          <Button
            size="sm"
            variant={timeRange === '6h' ? 'primary' : 'outline'}
            onClick={() => handleTimeRangeChange('6h')}
          >
            6H
          </Button>
          <Button
            size="sm"
            variant={timeRange === '12h' ? 'primary' : 'outline'}
            onClick={() => handleTimeRangeChange('12h')}
          >
            12H
          </Button>
          <Button
            size="sm"
            variant={timeRange === '24h' ? 'primary' : 'outline'}
            onClick={() => handleTimeRangeChange('24h')}
          >
            24H
          </Button>
          <Button
            size="sm"
            variant={timeRange === '3d' ? 'primary' : 'outline'}
            onClick={() => handleTimeRangeChange('3d')}
          >
            3D
          </Button>
          <Button
            size="sm"
            variant={timeRange === '7d' ? 'primary' : 'outline'}
            onClick={() => handleTimeRangeChange('7d')}
          >
            7D
          </Button>
          <Button
            size="sm"
            variant={timeRange === '30d' ? 'primary' : 'outline'}
            onClick={() => handleTimeRangeChange('30d')}
          >
            30D
          </Button>
        </div>

        <div className="flex-1 w-full sm:w-auto">
          <select
            className="w-full p-2 bg-gray-800 border border-gray-700 rounded-md"
            value={selectedCoin}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleCoinChange(e.target.value)}
          >
            <option value="all">All Coins</option>
            {priceComparisonData.map((coin) => (
              <option key={coin.coin} value={coin.coin}>
                {coin.coin}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="autoRefresh"
              checked={autoRefresh}
              onCheckedChange={handleAutoRefreshChange}
            />
            <label htmlFor="autoRefresh" className="text-sm">
              Auto-refresh
            </label>
          </div>

          <Button size="sm" variant="outline" onClick={() => manualRefresh(false)}>
            <RefreshCw size={16} className="mr-1" />
            Refresh
          </Button>
          
          <Button size="sm" variant="secondary" onClick={() => silentRefresh()}>
            <RefreshCw size={16} className="mr-1" />
            Quick Refresh
          </Button>

          <div className="flex border rounded-md overflow-hidden">
            <Button
              size="sm"
              variant={viewMode === 'cards' ? 'secondary' : 'outline'}
              className="px-2 rounded-none"
              onClick={() => setViewMode('cards')}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1"><rect width="7" height="7" x="3" y="3" rx="1"></rect><rect width="7" height="7" x="14" y="3" rx="1"></rect><rect width="7" height="7" x="14" y="14" rx="1"></rect><rect width="7" height="7" x="3" y="14" rx="1"></rect></svg>
              Cards
            </Button>
            <Button
              size="sm"
              variant={viewMode === 'table' ? 'secondary' : 'outline'}
              className="px-2 rounded-none"
              onClick={() => setViewMode('table')}
            >
              <TableIcon size={16} className="mr-1" />
              Table
            </Button>
            <Button
              size="sm"
              variant={viewMode === 'chart' ? 'secondary' : 'outline'}
              className="px-2 rounded-none"
              onClick={() => setViewMode('chart')}
            >
              <BarChartIcon size={16} className="mr-1" />
              Chart
            </Button>
          </div>
        </div>
      </div>

      {lastRefreshed && (
        <div className="text-xs text-muted-foreground mb-4">
          Last updated: {lastRefreshed.toLocaleTimeString()}
        </div>
      )}

      {/* Chart View */}
      {viewMode === 'chart' && chartData ? (
        <div className="h-96 w-full">
          <Line data={chartData} options={chartOptions} />
        </div>
      ) : null}

      {/* Cards View */}
      {viewMode === 'cards' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {priceComparisonData.map((coin) => (
            <div key={coin.coin} className="bg-card border rounded-lg p-4 shadow-sm">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-lg font-semibold">{coin.coin}</h3>
                <Badge variant={coin.percentChange >= 0 ? 'outline' : 'destructive'} className={coin.percentChange >= 0 ? 'bg-green-900/20 text-green-400 border-green-800' : ''}>
                  {formatPercentage(coin.percentChange)}
                </Badge>
              </div>
              <div className="text-2xl font-medium">{formatPrice(coin.currentPrice)}</div>
              <div className="mt-2 flex justify-between text-xs text-muted-foreground">
                <span>Initial: {formatPrice(coin.initialPrice)}</span>
                <span>{new Date(coin.snapshotTimestamp).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Table View */}
      {viewMode === 'table' && (
        <div className="overflow-x-auto">
          <table className="w-full table-auto">
            <thead className="bg-gray-800">
              <tr>
                <th 
                  className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-700"
                  onClick={() => handleSortChange('coin')}
                >
                  <div className="flex items-center">
                    <span>Coin</span>
                    {sortColumn === 'coin' && (
                      <span className="ml-1">
                        {sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </span>
                    )}
                  </div>
                </th>
                <th 
                  className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-700"
                  onClick={() => handleSortChange('initialPrice')}
                >
                  <div className="flex items-center">
                    <span>Initial Price</span>
                    {sortColumn === 'initialPrice' && (
                      <span className="ml-1">
                        {sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </span>
                    )}
                  </div>
                </th>
                <th 
                  className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-700"
                  onClick={() => handleSortChange('currentPrice')}
                >
                  <div className="flex items-center">
                    <span>Current Price</span>
                    {sortColumn === 'currentPrice' && (
                      <span className="ml-1">
                        {sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </span>
                    )}
                  </div>
                </th>
                <th 
                  className="px-4 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-700"
                  onClick={() => handleSortChange('percentChange')}
                >
                  <div className="flex items-center justify-end">
                    <span>Change</span>
                    {sortColumn === 'percentChange' && (
                      <span className="ml-1">
                        {sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </span>
                    )}
                  </div>
                </th>
                <th 
                  className="px-4 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-700"
                  onClick={() => handleSortChange('snapshotTimestamp')}
                >
                  <div className="flex items-center justify-end">
                    <span>Snapshot Date</span>
                    {sortColumn === 'snapshotTimestamp' && (
                      <span className="ml-1">
                        {sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </span>
                    )}
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="bg-gray-900 divide-y divide-gray-800">
              {priceComparisonData
                .sort((a, b) => {
                  const aValue = a[sortColumn as keyof typeof a];
                  const bValue = b[sortColumn as keyof typeof b];
                  
                  if (aValue === null || aValue === undefined) return 1;
                  if (bValue === null || bValue === undefined) return -1;
                  
                  if (typeof aValue === 'string' && typeof bValue === 'string') {
                    return sortDirection === 'asc' 
                      ? aValue.localeCompare(bValue) 
                      : bValue.localeCompare(aValue);
                  } else {
                    return sortDirection === 'asc' 
                      ? (aValue < bValue ? -1 : 1) 
                      : (bValue < aValue ? -1 : 1);
                  }
                })
                .map((coin) => (
                  <tr key={coin.coin} className="hover:bg-gray-800/50 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap font-medium">{coin.coin}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{formatPrice(coin.initialPrice)}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{formatPrice(coin.currentPrice)}</td>
                    <td className={`px-4 py-3 text-right whitespace-nowrap ${getChangeClass(coin.percentChange)}`}>
                      {formatPercentage(coin.percentChange)}
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap text-muted-foreground">
                      {new Date(coin.snapshotTimestamp).toLocaleDateString()}
                    </td>
                  </tr>
              ))}
              {priceComparisonData.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                    No price data available
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          
          {/* Pagination Controls */}
          <div className="flex justify-between items-center mt-4">
            <div className="text-sm text-gray-400">
              Showing {priceComparisonData.length > 0 ? (currentPage - 1) * rowsPerPage + 1 : 0} to {Math.min(
                currentPage * rowsPerPage, 
                totalCount || priceComparisonData.length
              )} of {totalCount || priceComparisonData.length} entries
            </div>
            
            <div className="flex items-center space-x-2">
              <select 
                className="bg-gray-800 border border-gray-700 text-white text-sm rounded-md px-2 py-1"
                value={rowsPerPage}
                onChange={(e) => {
                  setRowsPerPage(Number(e.target.value));
                  setCurrentPage(1); // Reset to first page when changing rows per page
                }}
              >
                <option value="5">5 rows</option>
                <option value="10">10 rows</option>
                <option value="25">25 rows</option>
                <option value="50">50 rows</option>
              </select>
              
              <div className="flex items-center space-x-1">
                <button
                  className={`px-3 py-1 rounded-md ${currentPage === 1 ? 'bg-gray-800 text-gray-500 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </button>
                
                <div className="flex items-center px-2 py-1 bg-gray-800 rounded-md">
                  <span className="text-white">{currentPage}</span>
                  <span className="text-gray-400 mx-1">of</span>
                  <span className="text-white">
                    {Math.ceil((totalCount || priceComparisonData.length) / rowsPerPage) || 1}
                  </span>
                </div>
                
                <button
                  className={`px-3 py-1 rounded-md ${
                    currentPage >= Math.ceil((totalCount || priceComparisonData.length) / rowsPerPage) ? 
                    'bg-gray-800 text-gray-500 cursor-not-allowed' : 
                    'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil((totalCount || priceComparisonData.length) / rowsPerPage)))}
                  disabled={currentPage >= Math.ceil((totalCount || priceComparisonData.length) / rowsPerPage)}
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};

export default PriceComparisonChart;
