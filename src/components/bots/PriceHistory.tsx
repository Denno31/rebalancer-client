'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { fetchPriceHistory, fetchBotCoins, PricePoint } from '@/utils/botApi';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '../ui/Spinner';

// Chart.js registration removed - not needed for table-only view

// Using PricePoint interface from botApi.ts

interface PriceHistoryProps {
  botId: number | string;
}

const PriceHistory: React.FC<PriceHistoryProps> = ({ botId }) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [priceData, setPriceData] = useState<PricePoint[]>([]);
  const [coins, setCoins] = useState<string[]>([]);
  const [selectedCoin, setSelectedCoin] = useState<string | null>(null); // No default selection
  const [sortColumn, setSortColumn] = useState<string>('timestamp');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [timeRange, setTimeRange] = useState<string>('24h'); // '24h', '7d', '30d', '90d'
  // Table view only - no chart references needed

  // Fetch available coins for this bot
  useEffect(() => {
    const loadAvailableCoins = async () => {
      try {
        const availableCoins = await fetchBotCoins(Number(botId));
        if (availableCoins && availableCoins.length > 0) {
          setCoins(availableCoins);
        } else {
          // Fallback to common coins if API returns empty
          const fallbackCoins = ['BTC', 'ETH', 'USDT'];
          setCoins(fallbackCoins);
        }
      } catch (err) {
        console.error('Failed to fetch available coins:', err);
        // Fallback to common coins on error
        const fallbackCoins = ['BTC', 'ETH', 'USDT'];
        setCoins(fallbackCoins);
      }
    };

    loadAvailableCoins();
  }, [botId]);

  // Process price data by coin for chart and table
  const processedData = useMemo(() => {
    if (priceData.length === 0) return {};

    // Group by coin
    const result: Record<string, {
      prices: number[];
      timestamps: string[];
      sources: string[]
    }> = {};

    priceData.forEach(record => {
      if (!result[record.coin]) {
        result[record.coin] = {
          prices: [],
          timestamps: [],
          sources: []
        };
      }
      result[record.coin].prices.push(record.price);
      result[record.coin].timestamps.push(record.timestamp);
      if (record.source) {
        result[record.coin].sources.push(record.source);
      }
    });

    return result;
  }, [priceData]);

  // Extract available coins from price data
  useEffect(() => {
    if (priceData.length > 0) {
      const uniqueCoins = [...new Set(priceData.map(item => item.coin))];
      setCoins(uniqueCoins);
    }
  }, [priceData]);

  // Fetch price history data
  useEffect(() => {
    const loadPriceHistory = async () => {
      try {
        setLoading(true);
        setError(null);

        // Calculate time range based on selection
        const toTime = new Date();
        const fromTime = new Date(toTime);

        switch (timeRange) {
          case '24h':
            fromTime.setDate(fromTime.getDate() - 1);
            break;
          case '7d':
            fromTime.setDate(fromTime.getDate() - 7);
            break;
          case '30d':
            fromTime.setDate(fromTime.getDate() - 30);
            break;
          case '90d':
            fromTime.setDate(fromTime.getDate() - 90);
            break;
          default:
            fromTime.setDate(fromTime.getDate() - 1); // Default to 24h
        }

        // Call API with the correct signature
        const data = await fetchPriceHistory(
          Number(botId),
          fromTime,
          toTime,
          selectedCoin // This can be null to get all coins
        );

        if (data && data.length > 0) {
          setPriceData(data);
        } else {
          setPriceData([]);
        }
      } catch (err: any) {
        console.error('Failed to fetch price history:', err);
        setError('Failed to load price history. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    loadPriceHistory();

    // Set up auto-refresh interval
    const interval = setInterval(loadPriceHistory, 60000); // Refresh every minute

    return () => clearInterval(interval);
  }, [botId, selectedCoin, timeRange]);

  const handleCoinChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedCoin(e.target.value);
  };

  const handleTimeRangeChange = (range: string) => {
    setTimeRange(range);
  };

  // Toggle view mode removed - table view only

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

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 6,
    }).format(value);
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);

    if (timeRange === '24h') {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    }
  };

  // Get price data sources
  const priceDataSources = useMemo(() => {
    const result: Record<string, number> = {};

    priceData.forEach(data => {
      if (data.source) {
        result[data.source] = (result[data.source] || 0) + 1;
      }
    });

    return result;
  }, [priceData]);

  // Get filtered price data if a coin is selected
  const relevantPriceData = useMemo(() => {
    if (!selectedCoin) return priceData; // Return all data if no coin selected
    return priceData.filter(data => data.coin === selectedCoin);
  }, [priceData, selectedCoin]);

  // Chart configuration and chart data preparation removed - not needed for table-only view

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
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
        <h2 className="text-xl font-bold">Price History</h2>
        
        <div className="flex flex-wrap items-center gap-4">
          {/* Coin Selector */}
          <div>
            <select
              className="bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-sm"
              value={selectedCoin ?? ''}
              onChange={handleCoinChange}
            >
              {coins.map((coin) => (
                <option key={coin} value={coin}>
                  {coin}
                </option>
              ))}
            </select>
          </div>
          
          {/* Time Range Selector */}
          <div className="flex">
            {['24h', '7d', '30d', 'all'].map((range) => (
              <button
                key={range}
                onClick={() => handleTimeRangeChange(range)}
                className={`px-3 py-1.5 text-sm border-t border-b border-r first:border-l first:rounded-l-md last:rounded-r-md ${
                  timeRange === range 
                    ? 'bg-blue-600 text-white border-blue-600' 
                    : 'bg-gray-800 text-gray-300 border-gray-700 hover:bg-gray-700'
                }`}
              >
                {range === 'all' ? 'All' : range.toUpperCase()}
              </button>
            ))}
          </div>
          
          {/* View Mode Toggle removed - table only */}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-48">
          <Spinner size="lg" />
          <span className="ml-3 text-gray-400">Loading price history...</span>
        </div>
      ) : error ? (
        <div className="bg-red-900/20 border border-red-800 text-red-300 p-4 rounded-md mb-6">
          <p>{error}</p>
        </div>
      ) : priceData.length === 0 ? (
        <div className="text-center py-10 text-gray-400">
          No price history data available {selectedCoin ? `for ${selectedCoin}` : ''}
        </div>
      ) : (
        <>
          {/* Price Sources */}
          <div className="mb-4 flex flex-wrap gap-2">
            {Object.entries(priceDataSources).map(([source, count]) => (
              <Badge key={source} variant="outline" className="bg-gray-800 text-xs">
                {source}: {count} points
              </Badge>
            ))}
          </div>
          
          {/* Grid cards removed */}
          
          <div className="overflow-x-auto">
              <table className="w-full table-auto">
                <thead className="bg-gray-800">
                  <tr>
                    <th 
                      className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-700"
                      onClick={() => handleSortChange('timestamp')}
                    >
                      <div className="flex items-center">
                        <span>Time</span>
                        {sortColumn === 'timestamp' && (
                          <span className="ml-1">
                            {sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                          </span>
                        )}
                      </div>
                    </th>
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
                      onClick={() => handleSortChange('price')}
                    >
                      <div className="flex items-center">
                        <span>Price</span>
                        {sortColumn === 'price' && (
                          <span className="ml-1">
                            {sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                          </span>
                        )}
                      </div>
                    </th>
                    <th 
                      className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-700"
                      onClick={() => handleSortChange('source')}
                    >
                      <div className="flex items-center">
                        <span>Source</span>
                        {sortColumn === 'source' && (
                          <span className="ml-1">
                            {sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                          </span>
                        )}
                      </div>
                    </th>
                    <th 
                      className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-700"
                      onClick={() => handleSortChange('change')}
                    >
                      <div className="flex items-center">
                        <span>Change</span>
                        {sortColumn === 'change' && (
                          <span className="ml-1">
                            {sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                          </span>
                        )}
                      </div>
                    </th>
                    <th 
                      className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-700"
                      onClick={() => handleSortChange('changePercent')}
                    >
                      <div className="flex items-center">
                        <span>Change %</span>
                        {sortColumn === 'changePercent' && (
                          <span className="ml-1">
                            {sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                          </span>
                        )}
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-gray-900 divide-y divide-gray-800">
                  {relevantPriceData
                    .sort((a, b) => {
                      let aValue = a[sortColumn as keyof typeof a];
                      let bValue = b[sortColumn as keyof typeof b];
                      
                      if (aValue === null || aValue === undefined) return 1;
                      if (bValue === null || bValue === undefined) return -1;
                      
                      // Handle case when source might be undefined
                      if (sortColumn === 'source') {
                        aValue = aValue || 'N/A';
                        bValue = bValue || 'N/A';
                      }
                      
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
                    .slice(0, 100)
                    .map((data, index) => (
                      <tr key={index} className="hover:bg-gray-800/50 transition-colors">
                        <td className="px-4 py-3 whitespace-nowrap">{formatTimestamp(data.timestamp)}</td>
                        <td className="px-4 py-3 whitespace-nowrap">{data.coin}</td>
                        <td className="px-4 py-3 whitespace-nowrap font-medium">{formatCurrency(data.price)}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-gray-400">{data.source || 'N/A'}</td>
                        <td className="px-4 py-3 whitespace-nowrap font-medium">
                          {data.change !== undefined && (
                            <span className={`${data.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                              {data.change >= 0 ? '+' : ''}{data.change.toFixed(6)}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap font-medium">
                          {data.changePercent !== undefined && (
                            <span className={`${data.changePercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                              {data.changePercent >= 0 ? '+' : ''}{data.changePercent.toFixed(2)}%
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  {relevantPriceData.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                        No price history data available {selectedCoin ? `for ${selectedCoin}` : ''}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
              {relevantPriceData.length > 100 && (
                <div className="text-center py-2 text-gray-400 text-sm">
                  Showing the 100 most recent data points of {relevantPriceData.length} total records
                </div>
              )}
            </div>
        </>
      )}
    </div>
  );
};

export default PriceHistory;
