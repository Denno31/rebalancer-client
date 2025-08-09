'use client';

import React, { useState, useEffect } from 'react';
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
  const [selectedCoin, setSelectedCoin] = useState<string>('');
  const [timeRange, setTimeRange] = useState<string>('7d'); // '24h', '7d', '30d', 'all'
  const [viewMode, setViewMode] = useState<'chart' | 'table'>('table');

  // Fetch available coins for this bot
  useEffect(() => {
    const loadAvailableCoins = async () => {
      try {
        const availableCoins = await fetchBotCoins(Number(botId));
        if (availableCoins && availableCoins.length > 0) {
          setCoins(availableCoins);
          if (!selectedCoin) {
            // Default to first available coin
            setSelectedCoin(availableCoins[0]);
          }
        } else {
          // Fallback to common coins if API returns empty
          const fallbackCoins = ['BTC', 'ETH', 'USDT'];
          setCoins(fallbackCoins);
          if (!selectedCoin) {
            setSelectedCoin('BTC');
          }
        }
      } catch (err) {
        console.error('Failed to fetch available coins:', err);
        // Fallback to common coins on error
        const fallbackCoins = ['BTC', 'ETH', 'USDT'];
        setCoins(fallbackCoins);
        if (!selectedCoin) {
          setSelectedCoin('BTC');
        }
      }
    };
    
    loadAvailableCoins();
  }, [botId, selectedCoin]);

  // Fetch price history data
  useEffect(() => {
    const loadPriceHistory = async () => {
      try {
        if (!selectedCoin) return;
        
        setLoading(true);
        setError(null);
        
        const data = await fetchPriceHistory(
          Number(botId),
          selectedCoin,
          timeRange
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

    if (selectedCoin) {
      loadPriceHistory();
    }
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

  const chartData = {
    labels: priceData.map(data => formatTimestamp(data.timestamp)),
    datasets: [
      {
        label: selectedCoin,
        data: priceData.map(data => data.price),
        borderColor: 
          selectedCoin === 'BTC' ? 'rgba(247, 147, 26, 1)' : 
          selectedCoin === 'ETH' ? 'rgba(87, 118, 206, 1)' :
          selectedCoin === 'SOL' ? 'rgba(20, 241, 149, 1)' :
          'rgba(0, 122, 255, 1)',
        backgroundColor: 
          selectedCoin === 'BTC' ? 'rgba(247, 147, 26, 0.2)' :
          selectedCoin === 'ETH' ? 'rgba(87, 118, 206, 0.2)' :
          selectedCoin === 'SOL' ? 'rgba(20, 241, 149, 0.2)' :
          'rgba(0, 122, 255, 0.2)',
        borderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 4,
        fill: true,
        tension: 0.4,
      }
    ]
  };

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
              value={selectedCoin}
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

      {priceData.length === 0 ? (
        <div className="text-center py-10 text-gray-400">
          No price history data available for {selectedCoin}
        </div>
      ) : (
        <>
          {viewMode === 'chart' ? (
            <div className="h-96 w-full">
              <Line options={chartOptions} data={chartData} />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="py-3 px-4 text-gray-400 font-medium">Time</th>
                    <th className="py-3 px-4 text-gray-400 font-medium">Price</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Show the most recent prices first */}
                  {[...priceData].reverse().slice(0, 100).map((data, index) => (
                    <tr key={index} className="border-b border-gray-800">
                      <td className="py-3 px-4">{formatTimestamp(data.timestamp)}</td>
                      <td className="py-3 px-4 font-medium">{formatCurrency(data.price)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {priceData.length > 100 && (
                <div className="text-center py-2 text-gray-400 text-sm">
                  Showing the 100 most recent data points of {priceData.length} total records
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
