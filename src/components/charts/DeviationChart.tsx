'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { Line } from 'react-chartjs-2';
import { Card } from '../ui/Card';
import { fetchBotDeviations, DeviationPoint } from '@/utils/botApi';

// Register ChartJS components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

// Extend DeviationPoint to include snapshot data
interface EnhancedDeviationPoint extends DeviationPoint {
  baseSnapshot?: {
    initialPrice: number;
    unitsHeld: number;
    snapshotTimestamp: string;
  };
  targetSnapshot?: {
    initialPrice: number;
    unitsHeld: number;
    snapshotTimestamp: string;
  };
}

interface DeviationChartProps {
  botId: number;
}

// Define proper types for deviation data
interface PriceData {
  basePrice: number;
  targetPrice: number;
}

// Type for snapshot data
interface SnapshotData {
  initialPrice: number;
  unitsHeld: number;
  snapshotTimestamp: string;
}

// Use a more specific type structure that separates prices from deviations
interface LatestCoinDeviation {
  prices?: {
    [targetCoin: string]: PriceData;
  };
  baseSnapshot?: SnapshotData;
  targetSnapshot?: SnapshotData;
  [targetCoin: string]: number | null | object | undefined;
}

interface DeviationDataResponse {
  success: boolean;
  timeSeriesData: Record<string, DeviationPoint[]>;
  latestDeviations: {
    [baseCoin: string]: LatestCoinDeviation;
  };
  coins: string[];
  totalCount?: number;
  page?: number;
  limit?: number;
}

const DeviationChart: React.FC<DeviationChartProps> = ({ botId }) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [deviationData, setDeviationData] = useState<DeviationDataResponse | null>(null);
  const [viewMode, setViewMode] = useState<'chart' | 'table' | 'heatmap'>('table'); // Default to table view
  const [timeRange, setTimeRange] = useState<string>('24h'); // Default to 24 hours
  const [selectedPair, setSelectedPair] = useState<string | null>(null);
  const [baseCoin, setBaseCoin] = useState<string>('');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [rowsPerPage, setRowsPerPage] = useState<number>(10);

  // Table data state
  const [tableData, setTableData] = useState<Array<{
    pair: string;
    baseCoin: string;
    targetCoin: string;
    basePrice: number;
    targetPrice: number;
    deviationPercent: number;
    baseSnapshot?: any;
    targetSnapshot?: any;
  }>>([]);

  // Reference to track if component is mounted
  const isMounted = React.useRef(true);
  
  // For triggering refreshes
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);
  
  // Auto-refresh configuration
  const [autoRefresh, setAutoRefresh] = useState<boolean>(false);
  const [refreshInterval, setRefreshInterval] = useState<number>(30); // seconds
  const autoRefreshTimerRef = React.useRef<NodeJS.Timeout | null>(null);
  
  // Load deviation data with timeout to prevent infinite loading state
  const loadDeviationData = async (options?: {
    timeRange?: string;
    baseCoin?: string;
    page?: number;
    limit?: number;
  }) => {
    // Create an AbortController for timeout handling
    const controller = new AbortController();
    let timeoutId: NodeJS.Timeout | null = null;
    
    // Ensure loading isn't stuck if component unmounts during request
    if (!isMounted.current) return;
    
    try {
      // Set loading state
      setLoading(true);
      setError(null);
      
      // Set timeout for request - abort after 30 seconds to prevent hanging
      timeoutId = setTimeout(() => {
        console.log('Request timeout triggered, aborting');
        controller.abort();
      }, 30000);
      
      console.log('Fetching deviation data...', options);
      const data = await fetchBotDeviations(botId, options, controller.signal);
      
      // If component unmounted during the fetch, don't update state
      if (!isMounted.current) return;
      
      console.log('Deviation data received successfully');
      setDeviationData(data as DeviationDataResponse);
        
      // If we have data and no selected pair yet, select the first one
      if (data.success && data.timeSeriesData && Object.keys(data.timeSeriesData).length > 0 && !selectedPair) {
        setSelectedPair(Object.keys(data.timeSeriesData)[0]);
      }
      
    } catch (err: unknown) {
      // If component unmounted during the fetch, don't update state
      if (!isMounted.current) return;
      
      if (err instanceof Error && err.name === 'AbortError') {
        console.error('Request was aborted:', err.message);
        setError('Request timed out. Please try again.');
      } else {
        console.error('Failed to fetch deviation data:', err);
        setError('Failed to load deviation data. Please try again later.');
      }
    } finally {
      // Clean up the timeout to prevent memory leaks
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      
      // Reset loading state if component is still mounted
      if (isMounted.current) {
        setLoading(false);
      }
    }
  };
  
  // Soft refresh - keeps current filters and state
  const handleSoftRefresh = () => {
    // Increment the refresh trigger to force a data reload
    setRefreshTrigger(prev => prev + 1);
  };
  
  // Hard refresh - resets all filters and state to default
  const handleHardRefresh = () => {
    // Reset all state to default values
    setTimeRange('24h');
    setSelectedPair(null);
    setBaseCoin('');
    setCurrentPage(1);
    setRowsPerPage(10);
    setViewMode('table');
    
    // Force a data reload
    setRefreshTrigger(prev => prev + 1);
  };
  
  // Function to calculate the number of total pages based on filtered data
  const calculateTotalPages = () => {
    const filteredLength = baseCoin ? 
      tableData.filter(item => item.baseCoin === baseCoin).length : 
      tableData.length;
    return Math.max(1, Math.ceil(filteredLength / rowsPerPage));
  };
  
  // Fetch data when dependencies change or refresh is triggered
  useEffect(() => {
    const options: {
      timeRange?: string;
      baseCoin?: string;
      page?: number;
      limit?: number;
    } = { 
      timeRange,
      page: currentPage,
      limit: rowsPerPage
    };
    
    // Don't filter by baseCoin in the API call to get all pairs
    // We'll filter the display client-side instead
    
    loadDeviationData(options);
    
    // Cleanup function to prevent state updates after unmount
    return () => {
      isMounted.current = false;
    };
  }, [botId, timeRange, currentPage, rowsPerPage, refreshTrigger]);
  
  // Reset isMounted on component mount
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      
      // Clean up auto-refresh timer when component unmounts
      if (autoRefreshTimerRef.current) {
        clearInterval(autoRefreshTimerRef.current);
        autoRefreshTimerRef.current = null;
      }
    };
  }, []);
  
  // Handle auto-refresh timer
  useEffect(() => {
    // Clear any existing timer
    if (autoRefreshTimerRef.current) {
      clearInterval(autoRefreshTimerRef.current);
      autoRefreshTimerRef.current = null;
    }
    
    // Set up new timer if auto-refresh is enabled
    if (autoRefresh && refreshInterval > 0) {
      autoRefreshTimerRef.current = setInterval(() => {
        // Only trigger refresh if component is not already loading
        if (!loading && isMounted.current) {
          handleSoftRefresh();
        }
      }, refreshInterval * 1000);
    }
    
    // Clean up function
    return () => {
      if (autoRefreshTimerRef.current) {
        clearInterval(autoRefreshTimerRef.current);
        autoRefreshTimerRef.current = null;
      }
    };
  }, [autoRefresh, refreshInterval, loading]);

  // Get all available pair keys from timeSeriesData
  const availablePairs = deviationData?.success ? Object.keys(deviationData.timeSeriesData || {}) : [];

  // Get data for the selected pair
  const selectedPairData = selectedPair && deviationData && deviationData.timeSeriesData
    ? deviationData.timeSeriesData[selectedPair] || []
    : [];
  
  // For server-side pagination
  const totalItems = deviationData?.totalCount || selectedPairData.length;
  
  // Calculate pagination variables - use API provided count for server-side pagination when available
  const totalPages = useMemo(() => {
    if (deviationData?.totalCount !== undefined) {
      // Server-side pagination
      return Math.max(1, Math.ceil(deviationData.totalCount / rowsPerPage));
    } else {
      // Fallback to client-side pagination
      return Math.max(1, Math.ceil(selectedPairData.length / rowsPerPage));
    }
  }, [deviationData?.totalCount, selectedPairData.length, rowsPerPage]);
  
  // Use the data directly from API for server-side pagination, otherwise slice locally
  const paginatedData = useMemo(() => {
    // If server is already paginating the data, use it directly
    if (deviationData?.page !== undefined && deviationData?.limit !== undefined) {
      return selectedPairData;
    } else {
      // Fallback to client-side pagination
      const startIndex = (currentPage - 1) * rowsPerPage;
      return selectedPairData.slice(startIndex, startIndex + rowsPerPage);
    }
  }, [selectedPairData, currentPage, rowsPerPage, deviationData?.page, deviationData?.limit]);

  // Format data for Chart.js
  const chartData = {
    labels: paginatedData.map(item => new Date(item.timestamp).toLocaleTimeString()),
    datasets: [
      {
        label: `${selectedPair || ''} Deviation %`,
        data: selectedPairData.map(item => item.deviationPercent * 100), // Convert to percentage
        borderColor: 'rgba(75, 192, 192, 1)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        borderWidth: 2,
        tension: 0.4,
        pointRadius: 4,
        pointBackgroundColor: 'rgba(75, 192, 192, 1)',
      },
    ],
  };

  // Chart options
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          color: 'rgba(255, 255, 255, 0.7)',
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
      },
      x: {
        ticks: {
          color: 'rgba(255, 255, 255, 0.7)',
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
      },
    },
    plugins: {
      legend: {
        display: true,
        position: 'top' as const,
        labels: {
          color: 'rgba(255, 255, 255, 0.7)',
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: 'rgba(255, 255, 255, 1)',
        bodyColor: 'rgba(255, 255, 255, 0.8)',
      },
    },
  };

  // Format timestamp
  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  // Get CSS class based on deviation value for text
  const getDeviationClass = (deviation: number) => {
    if (deviation > 5) return 'text-green-500';
    if (deviation > 0) return 'text-green-400';
    if (deviation < -5) return 'text-red-500';
    if (deviation < 0) return 'text-red-400';
    return 'text-gray-400';
  };
  
  // Get CSS class based on deviation value for background (heatmap)
  const getDeviationColorClass = (deviation: number | null) => {
    if (deviation === null) return 'bg-gray-700';
    if (deviation > 10) return 'bg-green-600';
    if (deviation > 5) return 'bg-green-500'; 
    if (deviation > 2) return 'bg-green-400';
    if (deviation > 0) return 'bg-green-300 text-gray-800';
    if (deviation < -10) return 'bg-red-600';
    if (deviation < -5) return 'bg-red-500';
    if (deviation < -2) return 'bg-red-400';
    if (deviation < 0) return 'bg-red-300 text-gray-800';
    return 'bg-gray-600';
  };
  
  // Define a proper type for the table data
  interface TableDataItem {
    pair: string;
    baseCoin: string;
    targetCoin: string;
    basePrice: number;
    targetPrice: number;
    deviationPercent: number;
    baseSnapshot?: SnapshotData | null;
    targetSnapshot?: SnapshotData | null;
  }

  // Process deviation data when it changes
  useEffect(() => {
    if (deviationData?.success && deviationData.latestDeviations) {
      // Convert latestDeviations object into an array of items for the table
      const newTableData: TableDataItem[] = [];
      
      // Get valid coin list from the API response
      const coinList = deviationData.coins || [];
      
      // Process nested data structure in latestDeviations
      Object.entries(deviationData.latestDeviations).forEach(([baseCoin, baseData]) => {
        // Skip if baseCoin is not in coin list or if baseData is invalid
        if (!coinList.includes(baseCoin) || !baseData) return;
        
        // Safely type baseData as our LatestCoinDeviation interface
        const typedBaseData = baseData as unknown as LatestCoinDeviation;
        
        // Get all keys except special properties and filter only valid coins
        const specialKeys = ['prices', 'baseSnapshot', 'targetSnapshot'];
        const targetCoinKeys = Object.keys(typedBaseData).filter(key => {
          // Skip special properties
          if (specialKeys.includes(key)) return false;
          
          // Skip if not in coins list
          if (!coinList.includes(key)) return false;
          
          // Skip self-references
          if (key === baseCoin) return false;
          
          return true;
        });
        
        // Process each valid target coin
        targetCoinKeys.forEach(targetCoin => {
          // Skip if value is null
          const value = typedBaseData[targetCoin];
          if (value === null) return;
          
          // Construct pair representation
          const pair = `${baseCoin}/${targetCoin}`;
          
          // Get deviation percent
          const deviationPercent = typeof value === 'number' ? value : 0;
          
          // Get price information if available
          let basePrice = 0;
          let targetPrice = 0;
          
          if (typedBaseData.prices && typedBaseData.prices[targetCoin]) {
            basePrice = typedBaseData.prices[targetCoin].basePrice || 0;
            targetPrice = typedBaseData.prices[targetCoin].targetPrice || 0;
          }
          
          // Add to table data array
          newTableData.push({
            pair,
            baseCoin,
            targetCoin,
            basePrice,
            targetPrice,
            deviationPercent,
            baseSnapshot: typedBaseData.baseSnapshot || null,
            targetSnapshot: typedBaseData.targetSnapshot || null
          });
        });
      });
      
      // Sort by absolute deviation value (descending)
      newTableData.sort((a, b) => Math.abs(b.deviationPercent) - Math.abs(a.deviationPercent));
      
      // Update state
      setTableData(newTableData);
    }
  }, [deviationData]);

  // Render rows for the deviation table from tableData
  const renderDeviationTableRows = () => {
    if (!tableData || tableData.length === 0) {
      return (
        <tr>
          <td colSpan={7} className="py-6 text-center text-gray-500">
            No deviation data available.
          </td>
        </tr>
      );
    }
    
    // Filter by baseCoin if selected
    let filteredData = tableData;
    if (baseCoin) {
      filteredData = tableData.filter(item => item.baseCoin === baseCoin);
    }
    
    // Apply pagination for display
    const paginatedTableData = filteredData.slice(
      (currentPage - 1) * rowsPerPage, 
      currentPage * rowsPerPage
    );
    
    return paginatedTableData.length > 0 ? (
      paginatedTableData.map((item, index) => (
        <tr key={index} className="border-b border-gray-800">
          <td className="py-3 px-4"><strong>{item.baseCoin}</strong> / {item.targetCoin}</td>
          <td className="py-3 px-4">
            {item.deviationPercent > 0 ? 
              <span className="text-green-500">↗ Outperforming</span> : 
              <span className="text-red-500">↘ Underperforming</span>}
          </td>
          <td className={`py-3 px-4 ${getDeviationClass(item.deviationPercent)}`}>
            {item.deviationPercent > 0 ? '+' : ''}{(item.deviationPercent).toFixed(2)}%
          </td>
          <td className="py-3 px-4">${item.basePrice.toFixed(4)}</td>
          <td className="py-3 px-4">${item.targetPrice.toFixed(4)}</td>
          <td className="py-3 px-4">
            {item.baseSnapshot?.initialPrice ? 
              `$${parseFloat(item.baseSnapshot.initialPrice).toFixed(4)}` : 
              '–'}
          </td>
          <td className="py-3 px-4">
            {item.baseSnapshot?.unitsHeld ? 
              parseFloat(item.baseSnapshot.unitsHeld).toFixed(4) : 
              '–'}
          </td>
        </tr>
      ))
    ) : (
      <tr>
        <td colSpan={7} className="py-6 text-center text-gray-500">
          No deviation data available for the selected filters.
        </td>
      </tr>
    );
  };
  
  // Handle coin pair selection
  const handlePairSelection = (pair: string) => {
    setSelectedPair(pair);
    setCurrentPage(1); // Reset to first page when changing pairs
  };
  
  // Reset page when changing time range
  useEffect(() => {
    setCurrentPage(1);
  }, [timeRange]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-900/20 border border-red-800 rounded-md p-4">
        <p className="text-red-400">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold">Relative Deviation Chart</h2>
          <div className="flex items-center space-x-4">
            {/* Refresh buttons */}
            <div className="inline-flex items-center space-x-2">
              <div className="relative flex items-center">
                <button
                  className="px-3 py-1 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-l-md flex items-center space-x-1"
                  onClick={handleSoftRefresh}
                  disabled={loading}
                >
                  {loading ? (
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-1"></div>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  )}
                  <span>Refresh</span>
                </button>
                
                {/* Auto-refresh toggle button */}
                <button 
                  className={`h-full px-2 rounded-r-md border-l border-blue-800 ${autoRefresh ? 'bg-blue-800 text-white' : 'bg-blue-600 text-white'}`}
                  onClick={() => setAutoRefresh(!autoRefresh)}
                  disabled={loading}
                  title={autoRefresh ? `Auto-refresh every ${refreshInterval}s (click to disable)` : 'Enable auto-refresh'}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </button>
              </div>
              
              {/* Auto-refresh interval selector (only shown when auto-refresh is enabled) */}
              {autoRefresh && (
                <select
                  className="h-full px-2 py-1 text-sm bg-gray-700 rounded-md border border-gray-600"
                  value={refreshInterval}
                  onChange={(e) => setRefreshInterval(Number(e.target.value))}
                  disabled={loading}
                  title="Select refresh interval"
                >
                  <option value="10">10s</option>
                  <option value="30">30s</option>
                  <option value="60">1m</option>
                  <option value="300">5m</option>
                  <option value="600">10m</option>
                </select>
              )}
              
              <button
                className="px-3 py-1 text-sm bg-gray-700 hover:bg-gray-600 text-white rounded-md flex items-center space-x-1"
                onClick={handleHardRefresh}
                disabled={loading}
                title="Reset all filters and refresh data"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>Reset</span>
              </button>
            </div>
            <div className="inline-flex items-center bg-gray-800 rounded-md">
              <button
                className={`px-3 py-1 text-sm ${timeRange === '24h' ? 'bg-blue-600 text-white' : 'text-gray-400'}`}
                onClick={() => setTimeRange('24h')}
              >
                24h
              </button>
              <button
                className={`px-3 py-1 text-sm ${timeRange === '7d' ? 'bg-blue-600 text-white' : 'text-gray-400'}`}
                onClick={() => setTimeRange('7d')}
              >
                7d
              </button>
              <button
                className={`px-3 py-1 text-sm ${timeRange === '30d' ? 'bg-blue-600 text-white' : 'text-gray-400'}`}
                onClick={() => setTimeRange('30d')}
              >
                30d
              </button>
              <button
                className={`px-3 py-1 text-sm ${timeRange === 'all' ? 'bg-blue-600 text-white' : 'text-gray-400'}`}
                onClick={() => setTimeRange('all')}
              >
                All
              </button>
            </div>
            <div className="inline-flex items-center bg-gray-800 rounded-md">
              <button
                className={`px-3 py-1 text-sm rounded-l-md ${viewMode === 'table' ? 'bg-blue-600 text-white' : 'text-gray-400'}`}
                onClick={() => setViewMode('table')}
              >
                Table
              </button>
              <button
                className={`px-3 py-1 text-sm ${viewMode === 'chart' ? 'bg-blue-600 text-white' : 'text-gray-400'}`}
                onClick={() => setViewMode('chart')}
              >
                Chart
              </button>
              <button
                className={`px-3 py-1 text-sm rounded-r-md ${viewMode === 'heatmap' ? 'bg-blue-600 text-white' : 'text-gray-400'}`}
                onClick={() => setViewMode('heatmap')}
              >
                Heatmap
              </button>
            </div>
          </div>
        </div>
        
        {/* Coin pair selection */}
        {availablePairs.length > 0 && (
          <div className="flex items-center space-x-2 overflow-x-auto pb-2">
            <span className="text-gray-400">Coin Pairs:</span>
            {availablePairs.map((pair) => (
              <button
                key={pair}
                onClick={() => handlePairSelection(pair)}
                className={`px-3 py-1 text-xs rounded-md ${selectedPair === pair ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400'}`}
              >
                {pair}
              </button>
            ))}
          </div>
        )}
      </div>

      {viewMode === 'chart' && (
        <div className="h-80 w-full">
          <Line data={chartData} options={chartOptions} />
        </div>
      )}
      
      {viewMode === 'table' && (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="py-3 px-4 text-gray-400 font-medium">Pair</th>
                <th className="py-3 px-4 text-gray-400 font-medium">Direction</th>
                <th className="py-3 px-4 text-gray-400 font-medium">Deviation %</th>
                <th className="py-3 px-4 text-gray-400 font-medium">Base Price</th>
                <th className="py-3 px-4 text-gray-400 font-medium">Target Price</th>
                <th className="py-3 px-4 text-gray-400 font-medium">Initial Base Price</th>
                <th className="py-3 px-4 text-gray-400 font-medium">Units Held</th>
              </tr>
              <tr>
                <th colSpan={7} className="py-2 px-4">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-400">Filter by coin:</span>
                    <select 
                      className="bg-gray-800 border border-gray-700 text-white text-sm rounded-md px-2 py-1"
                      value={baseCoin}
                      onChange={(e) => setBaseCoin(e.target.value)}
                    >
                      <option value="">All coins</option>
                      {deviationData?.coins?.map(coin => (
                        <option key={coin} value={coin}>{coin}</option>
                      ))}
                    </select>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {renderDeviationTableRows()}
            </tbody>
          </table>
          
          <div className="flex justify-between items-center mt-4">
            <div className="text-sm text-gray-400">
              {/* Calculate total items for latest deviations */}
              {(() => {
                const filteredData = baseCoin ? 
                  tableData.filter(item => item.baseCoin === baseCoin) : 
                  tableData;
                
                return filteredData && filteredData.length > 0 ? 
                  `Showing ${Math.min(1, filteredData.length) > 0 ? (currentPage - 1) * rowsPerPage + 1 : 0} to ${Math.min(
                    currentPage * rowsPerPage, 
                    filteredData.length
                  )} of ${filteredData.length} entries${baseCoin ? ` (filtered from ${tableData.length} total)` : ''}` : 
                  'No data available';
              })()}
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
                <option value="100">100 rows</option>
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
                    {Math.ceil((baseCoin ? tableData.filter(item => item.baseCoin === baseCoin).length : tableData.length) / rowsPerPage) || 1}
                  </span>
                </div>
                
                <button
                  className={`px-3 py-1 rounded-md ${
                    currentPage >= Math.ceil((baseCoin ? tableData.filter(item => item.baseCoin === baseCoin).length : tableData.length) / rowsPerPage) ? 
                    'bg-gray-800 text-gray-500 cursor-not-allowed' : 
                    'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                  onClick={() => setCurrentPage(prev => prev + 1)}
                  disabled={
                    currentPage >= Math.ceil((baseCoin ? tableData.filter(item => item.baseCoin === baseCoin).length : tableData.length) / rowsPerPage)
                  }
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {viewMode === 'heatmap' && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Latest Deviations Heatmap</h3>
          {tableData && tableData.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {tableData.map((item, index) => {
                return (
                  <div key={item.pair} className="bg-gray-800 rounded-md p-4 shadow-md">
                    <h4 className="text-md font-medium mb-2">{item.pair}</h4>
                    <div className="grid grid-cols-2 gap-2">
                      <div 
                        className={`p-2 rounded-md ${getDeviationColorClass(item.deviationPercent * 100)}`}
                      >
                        <div className="flex justify-between">
                          <span className="text-sm">Deviation</span>
                          <span className="text-sm font-medium">
                            {item.deviationPercent !== null ? 
                              `${item.deviationPercent > 0 ? '+' : ''}${(item.deviationPercent * 100).toFixed(2)}%` : 
                              'N/A'
                            }
                          </span>
                        </div>
                      </div>
                      
                      <div className="p-2 rounded-md bg-gray-700">
                        <div className="flex justify-between">
                          <span className="text-sm">Direction</span>
                          <span className="text-sm font-medium">
                            {item.deviationPercent > 0 ? 
                              `${item.baseCoin} → ${item.targetCoin}` : 
                              `${item.targetCoin} → ${item.baseCoin}`
                            }
                          </span>
                        </div>
                      </div>
                      
                      {item.basePrice > 0 && (
                        <div className="p-2 rounded-md bg-gray-700">
                          <div className="flex justify-between">
                            <span className="text-sm">Base Price</span>
                            <span className="text-sm font-medium">${item.basePrice.toFixed(4)}</span>
                          </div>
                        </div>
                      )}
                      
                      {item.targetPrice > 0 && (
                        <div className="p-2 rounded-md bg-gray-700">
                          <div className="flex justify-between">
                            <span className="text-sm">Target Price</span>
                            <span className="text-sm font-medium">${item.targetPrice.toFixed(4)}</span>
                          </div>
                        </div>
                      )}
                      
                      {item.baseSnapshot?.initialPrice && (
                        <div className="p-2 rounded-md bg-gray-700">
                          <div className="flex justify-between">
                            <span className="text-sm">Initial Price</span>
                            <span className="text-sm font-medium">
                              ${parseFloat(item.baseSnapshot.initialPrice).toFixed(4)}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">
              No latest deviation data available.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DeviationChart;
