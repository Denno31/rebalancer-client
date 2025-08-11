'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
} from 'chart.js';
import { fetchPriceHistory, fetchBotCoins, PricePoint } from '@/utils/botApi';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '../ui/Spinner';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

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
  const [timeRange, setTimeRange] = useState<string>('24h'); // '24h', '7d', '30d', '90d'
  const [viewMode, setViewMode] = useState<'chart' | 'table'>('table'); // Default to table view as in legacy
  const chartRef = useRef(null);

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
      prices: number[],
      timestamps: string[],
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

  const toggleViewMode = () => {
    setViewMode(prev => prev === 'chart' ? 'table' : 'chart');
  };

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

  // Chart configuration
  const chartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        callbacks: {
          label: function(context) {
            return `${context.dataset.label}: ${formatCurrency(context.parsed.y)}`;
          }
        }
      },
    },
    scales: {
      x: {
        ticks: {
          maxRotation: 0,
          autoSkip: true,
          maxTicksLimit: 10,
        },
        grid: {
          display: true,
          color: 'rgba(255, 255, 255, 0.1)',
        },
      },
      y: {
        position: 'right',
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
        ticks: {
          callback: function(value) {
            return formatCurrency(value as number);
          }
        }
      }
    },
    interaction: {
      intersect: false,
      mode: 'index',
    },
  };

  // Prepare chart data with all coins or selected coin
  const prepareChartData = useMemo(() => {
    if (!Object.keys(processedData).length) return { labels: [], datasets: [] };
    
    // Use timestamps from the first coin as the base for labels
    // This is just a fallback if no coins are available
    let labels: string[] = [];
    const firstCoin = Object.keys(processedData)[0];
    if (processedData[firstCoin]?.timestamps) {
      labels = processedData[firstCoin].timestamps;
    }
    
    // Create a dataset for each coin, or just the selected coin if one is selected
    const coinEntries = selectedCoin 
      ? Object.entries(processedData).filter(([coin]) => coin === selectedCoin)
      : Object.entries(processedData);
    
    return {
      labels: labels.map((timestamp: string) => formatTimestamp(timestamp)),
      datasets: coinEntries.map(([coin, data], index) => ({
        label: coin,
        data: data.prices,
        fill: false,
        borderColor: `hsl(${index * 30 % 360}, 70%, 50%)`, // Use HSL colors based on index
        backgroundColor: `hsla(${index * 30 % 360}, 70%, 50%, 0.2)`,
        borderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 4,
        tension: 0.1
      }))
    };
  }, [processedData, selectedCoin, formatTimestamp]);

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
              value={selectedCoin as string}
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
          
          {/* View Mode Toggle */}
          <button 
            onClick={toggleViewMode}
            className="px-3 py-1.5 text-sm bg-gray-800 border border-gray-700 rounded-md hover:bg-gray-700"
          >
            {viewMode === 'chart' ? 'Show Table' : 'Show Chart'}
          </button>
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
          
          {/* Latest Prices */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {Object.keys(processedData).map((coin) => {
              const coinData = processedData[coin];
              if (!coinData || coinData.prices.length === 0) return null;
              
              // Get the latest price (should be first in the array)
              const latestPrice = coinData.prices[0];
              const latestTimestamp = coinData.timestamps[0];
              
              // Calculate price change if we have at least 2 data points
              let priceChange = null;
              if (coinData.prices.length >= 2) {
                const firstPrice = coinData.prices[coinData.prices.length - 1];
                priceChange = ((latestPrice - firstPrice) / firstPrice) * 100;
              }
              
              return (
                <div 
                  key={coin} 
                  className={`p-4 rounded-md ${selectedCoin === coin ? 'bg-primary/20 border border-primary/30' : 'bg-gray-800'} cursor-pointer`}
                  onClick={() => setSelectedCoin(selectedCoin === coin ? null : coin as string)} // Toggle selection
                >
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-sm text-gray-400">{coin}</p>
                    {priceChange !== null && (
                      <span className={`text-xs font-medium ${priceChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)}%
                      </span>
                    )}
                  </div>
                  <p className="text-xl font-bold">
                    {formatCurrency(latestPrice)}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Last updated: {formatTimestamp(latestTimestamp)}
                  </p>
                </div>
              );
            })}
          </div>
          
          {viewMode === 'chart' ? (
            <div className="h-96 w-full bg-gray-800 rounded-md p-4">
              {Object.keys(processedData).length > 0 ? (
                <Line 
                  ref={chartRef}
                  options={chartOptions} 
                  data={prepareChartData} 
                />
              ) : (
                <div className="flex justify-center items-center h-full">
                  <p className="text-gray-400">No data available for chart</p>
                </div>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto bg-gray-800 rounded-md">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="py-3 px-4 text-gray-400 font-medium">Time</th>
                    <th className="py-3 px-4 text-gray-400 font-medium">Coin</th>
                    <th className="py-3 px-4 text-gray-400 font-medium">Price</th>
                    <th className="py-3 px-4 text-gray-400 font-medium">Source</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Show the most recent prices first */}
                  {[...relevantPriceData].reverse().slice(0, 100).map((data, index) => (
                    <tr key={index} className="border-b border-gray-800 hover:bg-gray-700/50">
                      <td className="py-3 px-4">{formatTimestamp(data.timestamp)}</td>
                      <td className="py-3 px-4">{data.coin}</td>
                      <td className="py-3 px-4 font-medium">{formatCurrency(data.price)}</td>
                      <td className="py-3 px-4 text-gray-400">{data.source || 'N/A'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {relevantPriceData.length > 100 && (
                <div className="text-center py-2 text-gray-400 text-sm">
                  Showing the 100 most recent data points of {relevantPriceData.length} total records
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default PriceHistory;
