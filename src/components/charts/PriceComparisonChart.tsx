'use client';

import React, { useState, useEffect } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { Line } from 'react-chartjs-2';
import { Card } from '../ui/Card';
import { fetchPriceHistory, fetchBotCoins, PricePoint } from '@/utils/botApi';

// Register ChartJS components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

interface PriceData {
  timestamp: string;
  coin: string;
  price: number;
}

interface PriceComparisonChartProps {
  botId: number;
}

const PriceComparisonChart: React.FC<PriceComparisonChartProps> = ({ botId }) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [priceData, setPriceData] = useState<Record<string, PriceData[]>>({});
  const [viewMode, setViewMode] = useState<'chart' | 'table'>('table'); // Default to table view
  const [timeRange, setTimeRange] = useState<'1d' | '7d' | '30d' | 'all'>('7d');

  // Fetch price data
  useEffect(() => {
    const loadPriceData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // First fetch available coins for this bot
        const coins = await fetchBotCoins(botId);
        
        if (!coins || coins.length === 0) {
          setError('No coins available for this bot');
          setLoading(false);
          return;
        }
        
        // Convert timeRange to API format
        const apiTimeRange = timeRange === '1d' ? '24h' : timeRange;
        
        // Fetch price data for each coin
        const priceDataMap: Record<string, PriceData[]> = {};
        
        // Use Promise.all to fetch price data for all coins in parallel
        await Promise.all(coins.map(async (coin) => {
          try {
            const pricePoints = await fetchPriceHistory(botId, coin, apiTimeRange);
            
            if (pricePoints && pricePoints.length > 0) {
              priceDataMap[coin] = pricePoints.map(point => ({
                timestamp: point.timestamp,
                coin: point.coin,
                price: point.price
              }));
            }
          } catch (coinErr) {
            console.error(`Error fetching price data for ${coin}:`, coinErr);
            // Continue with other coins even if one fails
          }
        }));
        
        setPriceData(priceDataMap);
      } catch (err: any) {
        console.error('Failed to fetch price data:', err);
        setError('Failed to load price data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    loadPriceData();
  }, [botId, timeRange]);

  // Format data for Chart.js
  const chartData = {
    labels: Object.values(priceData)[0]?.map(item => new Date(item.timestamp).toLocaleString()) || [],
    datasets: Object.entries(priceData).map(([coin, data], index) => {
      const colors = [
        { border: 'rgba(75, 192, 192, 1)', background: 'rgba(75, 192, 192, 0.2)' },
        { border: 'rgba(255, 99, 132, 1)', background: 'rgba(255, 99, 132, 0.2)' },
        { border: 'rgba(54, 162, 235, 1)', background: 'rgba(54, 162, 235, 0.2)' },
        { border: 'rgba(255, 206, 86, 1)', background: 'rgba(255, 206, 86, 0.2)' },
        { border: 'rgba(153, 102, 255, 1)', background: 'rgba(153, 102, 255, 0.2)' },
      ];
      
      return {
        label: coin,
        data: data.map(item => item.price),
        borderColor: colors[index % colors.length].border,
        backgroundColor: colors[index % colors.length].background,
        borderWidth: 2,
        tension: 0.4,
        pointRadius: 2,
      };
    }),
  };

  // Chart options
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: false,
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
          maxRotation: 45,
          minRotation: 45,
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

  // Format price with currency
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 6,
    }).format(price);
  };

  // Format timestamp
  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  // Calculate price change percentage
  const calculateChange = (data: PriceData[]) => {
    if (!data || data.length < 2) return 0;
    const first = data[0].price;
    const last = data[data.length - 1].price;
    return ((last - first) / first) * 100;
  };

  // Get CSS class based on price change
  const getChangeClass = (change: number) => {
    if (change > 0) return 'text-green-400';
    if (change < 0) return 'text-red-400';
    return 'text-gray-400';
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
    <div className="space-y-4">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <h2 className="text-xl font-bold">Price Movement</h2>
        
        <div className="flex items-center gap-4">
          {/* Time range selector */}
          <div className="inline-flex items-center bg-gray-800 rounded-md">
            {(['1d', '7d', '30d', 'all'] as const).map(range => (
              <button
                key={range}
                className={`px-3 py-1 text-sm ${timeRange === range ? 'bg-blue-600 text-white' : 'text-gray-400'} ${
                  range === '1d' ? 'rounded-l-md' : range === 'all' ? 'rounded-r-md' : ''
                }`}
                onClick={() => setTimeRange(range)}
              >
                {range === '1d' ? '1D' : range === '7d' ? '1W' : range === '30d' ? '1M' : 'All'}
              </button>
            ))}
          </div>
          
          {/* View mode selector */}
          <div className="inline-flex items-center bg-gray-800 rounded-md">
            <button
              className={`px-3 py-1 text-sm rounded-l-md ${viewMode === 'table' ? 'bg-blue-600 text-white' : 'text-gray-400'}`}
              onClick={() => setViewMode('table')}
            >
              Table
            </button>
            <button
              className={`px-3 py-1 text-sm rounded-r-md ${viewMode === 'chart' ? 'bg-blue-600 text-white' : 'text-gray-400'}`}
              onClick={() => setViewMode('chart')}
            >
              Chart
            </button>
          </div>
        </div>
      </div>

      {viewMode === 'chart' ? (
        <div className="h-96 w-full">
          <Line data={chartData} options={chartOptions} />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Price summary cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(priceData).map(([coin, data]) => {
              const change = calculateChange(data);
              const latestPrice = data[data.length - 1]?.price || 0;
              
              return (
                <div key={coin} className="bg-gray-800 rounded-md p-4">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-bold text-white">{coin}</h3>
                    <div className={`${getChangeClass(change)}`}>
                      {change > 0 ? '+' : ''}{change.toFixed(2)}%
                    </div>
                  </div>
                  <div className="text-xl font-medium">{formatPrice(latestPrice)}</div>
                  <div className="text-xs text-gray-400 mt-2">
                    Last updated: {formatTimestamp(data[data.length - 1]?.timestamp || '')}
                  </div>
                </div>
              );
            })}
          </div>
          
          {/* Price data table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="py-3 px-4 text-gray-400 font-medium">Time</th>
                  {Object.keys(priceData).map(coin => (
                    <th key={coin} className="py-3 px-4 text-gray-400 font-medium">{coin} Price</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Object.values(priceData)[0]?.map((_, rowIndex) => {
                  // Use first coin's timestamps for the rows
                  const timestamp = Object.values(priceData)[0][rowIndex].timestamp;
                  
                  return (
                    <tr key={rowIndex} className="border-b border-gray-800">
                      <td className="py-3 px-4">{formatTimestamp(timestamp)}</td>
                      {Object.entries(priceData).map(([coin, data]) => (
                        <td key={coin} className="py-3 px-4">
                          {formatPrice(data[rowIndex]?.price || 0)}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default PriceComparisonChart;
