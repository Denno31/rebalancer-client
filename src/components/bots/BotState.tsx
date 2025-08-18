'use client';

import React, { useState, useEffect } from 'react';
import { Badge } from '../ui/Badge';
import { fetchBotState, BotStateData } from '@/utils/botApi';

// Using BotStateData interface from botApi.ts

interface BotStateProps {
  botId: number | string;
}

const BotState: React.FC<BotStateProps> = ({ botId }) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [botState, setBotState] = useState<BotStateData | null>(null);
  const [sortBy, setSortBy] = useState<string>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    const loadBotState = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const data = await fetchBotState(Number(botId));
        setBotState(data);
      } catch (err: any) {
        console.error('Failed to fetch bot state:', err);
        setError(`Failed to load bot state: ${err.message || 'Unknown error'}`);
      } finally {
        setLoading(false);
      }
    };

    loadBotState();
  }, [botId]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 6,
    }).format(value);
  };

  const formatCryptoAmount = (amount: number, coin: string) => {
    return `${amount.toFixed(6)} ${coin}`;
  };

  const formatPercentage = (value: number) => {
    return `${value > 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  const formatDateTime = (timestamp: string | null) => {
    const formatTimestamp = (timestamp: string) => {
      return new Date(timestamp).toLocaleString();
    };
    
    if (!timestamp) return 'Never';
    return formatTimestamp(timestamp);
  };

  // Handle sorting change
  const handleSortChange = (column: string) => {
    if (sortBy === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortDirection('asc'); // Default to ascending when changing columns
    }
  };
  
  // Prepare data for the state table
  const getStateTableData = () => {
    if (!botState) return [];
    
    // Create an array of state properties to display in the table
    const stateData = Object.entries(botState)
      .filter(([key]) => {
        // Exclude certain fields from the table display
        const excludedFields = ['id', 'botId', 'createdAt', 'updatedAt', 'currentPrice'];
        return !excludedFields.includes(key);
      })
      .map(([key, value]) => {
        return {
          name: key,
          value: value,
          displayValue: formatStateValue(key, value)
        };
      });
      
    // Sort the state data
    return stateData.sort((a, b) => {
      const valA = a[sortBy as keyof typeof a];
      const valB = b[sortBy as keyof typeof b];
      
      if (typeof valA === 'string' && typeof valB === 'string') {
        return sortDirection === 'asc' ? 
          valA.localeCompare(valB) : 
          valB.localeCompare(valA);
      }
      
      return 0;
    });
  };
  
  // Format state values for display
  const formatStateValue = (key: string, value: any) => {
    if (value === null || value === undefined) return 'N/A';
    
    if (key.includes('At') && typeof value === 'string') {
      return formatDateTime(value);
    } else if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No';
    } else if (typeof value === 'number') {
      if (key.includes('Price') || key.includes('Value')) {
        return formatCurrency(value);
      } else if (key.includes('Percentage') || key.includes('Deviation')) {
        return `${value.toFixed(2)}%`;
      }
    }
    
    return String(value);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <Badge variant="outline" className="bg-green-900/20 text-green-400 border-green-800">Active</Badge>;
      case 'PAUSED':
        return <Badge variant="outline" className="bg-yellow-900/20 text-yellow-400 border-yellow-800">Paused</Badge>;
      case 'ERROR':
        return <Badge variant="destructive">Error</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
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

  if (!botState) {
    return (
      <div className="text-center py-10 text-gray-400">
        No state information available
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Overview Card */}
      <div className="bg-gray-800 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Bot State</h2>
          <div className="flex items-center space-x-2">
            <span>Status:</span>
            {getStatusBadge(botState.status)}
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Current Holding */}
          <div className="bg-gray-700/30 rounded-lg p-4">
            <h3 className="text-gray-400 text-sm mb-2">Current Holding</h3>
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center mr-3">
                {botState.currentCoin.substring(0, 1)}
              </div>
              <div>
                <div className="font-bold text-lg">{botState.currentCoin}</div>
                <div className="text-sm">{formatCryptoAmount(botState.currentCoinAmount, botState.currentCoin)}</div>
              </div>
            </div>
            <div className="mt-2 text-right text-blue-400 font-medium">
              {formatCurrency(botState.currentCoinValueUsd)}
            </div>
          </div>

          {/* Profit/Loss */}
          <div className="bg-gray-700/30 rounded-lg p-4">
            <h3 className="text-gray-400 text-sm mb-2">Profit/Loss</h3>
            <div className="font-bold text-2xl mb-1 flex items-center">
              <span className={botState.profitLoss >= 0 ? 'text-green-400' : 'text-red-400'}>
                {formatCurrency(botState.profitLoss)}
              </span>
            </div>
            <div className={`text-sm ${botState.profitLossPercentage >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {formatPercentage(botState.profitLossPercentage)} from initial investment
            </div>
          </div>

          {/* Total Value */}
          <div className="bg-gray-700/30 rounded-lg p-4">
            <h3 className="text-gray-400 text-sm mb-2">Total Value</h3>
            <div className="font-bold text-2xl mb-1">
              {formatCurrency(botState.totalValueUsd)}
            </div>
            <div className="text-sm text-gray-400">
              Initial: {formatCurrency(botState.initialInvestment)}
            </div>
          </div>
        </div>
      </div>
      
      {/* Bot State Details */}
      {botState && (
        <div className="mt-6 bg-gray-900/50 rounded-xl p-4 shadow-lg">
          <h3 className="text-xl font-medium mb-4">Bot State Details</h3>
          
          <div className="overflow-x-auto rounded-md border border-gray-700">
            <table className="w-full table-auto">
              <thead className="bg-gray-800">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-700" onClick={() => handleSortChange('name')}>
                    <div className="flex items-center">
                      Property
                      {sortBy === 'name' && (
                        <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={sortDirection === 'asc' ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"}></path>
                        </svg>
                      )}
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-700" onClick={() => handleSortChange('value')}>
                    <div className="flex items-center">
                      Value
                      {sortBy === 'value' && (
                        <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={sortDirection === 'asc' ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"}></path>
                        </svg>
                      )}
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700 bg-gray-900/50">
                {getStateTableData().length > 0 ? getStateTableData().map((item) => (
                  <tr key={item.name} className="hover:bg-gray-700/50 transition-colors duration-150">
                    <td className="px-4 py-3 text-sm font-medium text-blue-400">{item.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-200">{item.displayValue}</td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={2} className="px-4 py-6 text-center text-gray-400">
                      No state details available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      {/* Details */}
      <div>
        <h3 className="text-lg font-medium mb-4">Bot Details</h3>
        <div className="rounded-md border border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full table-auto">
              <thead className="bg-gray-800">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Property</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700 bg-gray-900/50">
                <tr className="hover:bg-gray-700/50 transition-colors duration-150">
                  <td className="px-4 py-3 text-sm font-medium text-blue-400">Exchange</td>
                  <td className="px-4 py-3 text-sm text-gray-200">{botState.exchange}</td>
                </tr>
                <tr className="hover:bg-gray-700/50 transition-colors duration-150">
                  <td className="px-4 py-3 text-sm font-medium text-blue-400">Account ID</td>
                  <td className="px-4 py-3 text-sm text-gray-200">{botState.accountId}</td>
                </tr>
                <tr className="hover:bg-gray-700/50 transition-colors duration-150">
                  <td className="px-4 py-3 text-sm font-medium text-blue-400">Trading Strategy</td>
                  <td className="px-4 py-3 text-sm text-gray-200">{botState.tradingStrategy}</td>
                </tr>
                <tr className="hover:bg-gray-700/50 transition-colors duration-150">
                  <td className="px-4 py-3 text-sm font-medium text-blue-400">Trading Pairs</td>
                  <td className="px-4 py-3 text-sm text-gray-200">
                    <div className="flex flex-wrap gap-2">
                      {botState.tradingPairs.map((pair) => (
                        <Badge key={pair} variant="outline" className="bg-gray-700/50">
                          {pair}
                        </Badge>
                      ))}
                    </div>
                  </td>
                </tr>
                <tr className="hover:bg-gray-700/50 transition-colors duration-150">
                  <td className="px-4 py-3 text-sm font-medium text-blue-400">Deviation Threshold</td>
                  <td className="px-4 py-3 text-sm text-gray-200">{botState.deviationThreshold}%</td>
                </tr>
                <tr className="hover:bg-gray-700/50 transition-colors duration-150">
                  <td className="px-4 py-3 text-sm font-medium text-blue-400">Rebalance Threshold</td>
                  <td className="px-4 py-3 text-sm text-gray-200">{botState.rebalanceThreshold}%</td>
                </tr>
                <tr className="hover:bg-gray-700/50 transition-colors duration-150">
                  <td className="px-4 py-3 text-sm font-medium text-blue-400">Last Trade</td>
                  <td className="px-4 py-3 text-sm text-gray-200">{formatDateTime(botState.lastTradeTime)}</td>
                </tr>
                <tr className="hover:bg-gray-700/50 transition-colors duration-150">
                  <td className="px-4 py-3 text-sm font-medium text-blue-400">Last Updated</td>
                  <td className="px-4 py-3 text-sm text-gray-200">{formatDateTime(botState.lastUpdateTime)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BotState;
