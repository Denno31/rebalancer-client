'use client';

import React, { useState, useEffect } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { Line } from 'react-chartjs-2';
import { Card } from '../ui/Card';
import { fetchBotDeviations, BotDeviationsResponse, DeviationPoint } from '@/utils/botApi';

// Register ChartJS components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

interface DeviationChartProps {
  botId: number;
}

const DeviationChart: React.FC<DeviationChartProps> = ({ botId }) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [deviationData, setDeviationData] = useState<BotDeviationsResponse | null>(null);
  const [viewMode, setViewMode] = useState<'chart' | 'table' | 'heatmap'>('table'); // Default to table view
  const [timeRange, setTimeRange] = useState<string>('24h'); // Default to 24 hours
  const [selectedPair, setSelectedPair] = useState<string | null>(null);
  const [baseCoin, setBaseCoin] = useState<string>('');

  // Fetch deviation data
  useEffect(() => {
    const loadDeviationData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const options: {
          timeRange?: string;
          baseCoin?: string;
        } = { timeRange };
        
        if (baseCoin) {
          options.baseCoin = baseCoin;
        }
        
        const data = await fetchBotDeviations(botId, options);
        setDeviationData(data);
        
        // If we have data and no selected pair yet, select the first one
        if (data.success && data.timeSeriesData && Object.keys(data.timeSeriesData).length > 0 && !selectedPair) {
          setSelectedPair(Object.keys(data.timeSeriesData)[0]);
        }
      } catch (err: any) {
        console.error('Failed to fetch deviation data:', err);
        setError('Failed to load deviation data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    loadDeviationData();
  }, [botId, timeRange, baseCoin]);

  // Get all available pair keys from timeSeriesData
  const availablePairs = deviationData?.success ? Object.keys(deviationData.timeSeriesData || {}) : [];

  // Select data for the selected pair
  const selectedPairData = selectedPair && deviationData?.success 
    ? deviationData.timeSeriesData[selectedPair] || []
    : [];

  // Format data for Chart.js
  const chartData = {
    labels: selectedPairData.map(item => new Date(item.timestamp).toLocaleTimeString()),
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
  
  // Handle coin pair selection
  const handlePairSelection = (pair: string) => {
    setSelectedPair(pair);
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
      <div className="flex flex-col space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold">Relative Deviation Chart</h2>
          <div className="flex items-center space-x-4">
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
                <th className="py-3 px-4 text-gray-400 font-medium">Time</th>
                <th className="py-3 px-4 text-gray-400 font-medium">Base/Target</th>
                <th className="py-3 px-4 text-gray-400 font-medium">Base Price</th>
                <th className="py-3 px-4 text-gray-400 font-medium">Target Price</th>
                <th className="py-3 px-4 text-gray-400 font-medium">Deviation %</th>
              </tr>
            </thead>
            <tbody>
              {selectedPairData.length > 0 ? (
                selectedPairData.map((item, index) => (
                  <tr key={index} className="border-b border-gray-800">
                    <td className="py-3 px-4">{formatTimestamp(item.timestamp)}</td>
                    <td className="py-3 px-4">{`${item.baseCoin}/${item.targetCoin}`}</td>
                    <td className="py-3 px-4">${item.basePrice.toFixed(4)}</td>
                    <td className="py-3 px-4">${item.targetPrice.toFixed(4)}</td>
                    <td className={`py-3 px-4 ${getDeviationClass(item.deviationPercent * 100)}`}>
                      {item.deviationPercent > 0 ? '+' : ''}{(item.deviationPercent * 100).toFixed(2)}%
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-gray-500">
                    {selectedPair ? 'No deviation data available for the selected pair.' : 'Please select a coin pair to view deviations.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
      
      {viewMode === 'heatmap' && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Latest Deviations Heatmap</h3>
          {deviationData?.success && deviationData.latestDeviations && Object.keys(deviationData.latestDeviations).length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(deviationData.latestDeviations).map(([pair, data]) => {
                // Skip if there's no data or prices
                if (!data || !data.deviations) return null;
                
                const deviationValues = Object.entries(data.deviations);
                if (deviationValues.length === 0) return null;
                
                return (
                  <div key={pair} className="bg-gray-800 rounded-md p-4 shadow-md">
                    <h4 className="text-md font-medium mb-2">{pair}</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {deviationValues.map(([coin, deviation]) => (
                        <div 
                          key={`${pair}-${coin}`}
                          className={`p-2 rounded-md ${getDeviationColorClass(deviation as number)}`}
                        >
                          <div className="flex justify-between">
                            <span className="text-sm">{coin}</span>
                            <span className="text-sm font-medium">
                              {deviation !== null ? `${deviation > 0 ? '+' : ''}${Number(deviation).toFixed(2)}%` : 'N/A'}
                            </span>
                          </div>
                        </div>
                      ))}
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
