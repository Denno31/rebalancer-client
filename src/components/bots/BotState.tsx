'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { fetchBotState, BotStateData } from '@/utils/botApi';

// Using BotStateData interface from botApi.ts

interface BotStateProps {
  botId: number | string;
}

const BotState: React.FC<BotStateProps> = ({ botId }) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [state, setState] = useState<BotStateData | null>(null);

  useEffect(() => {
    const loadBotState = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const data = await fetchBotState(Number(botId));
        setState(data);
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
    if (!timestamp) return 'Never';
    return new Date(timestamp).toLocaleString();
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

  if (!state) {
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
            {getStatusBadge(state.status)}
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Current Holding */}
          <div className="bg-gray-700/30 rounded-lg p-4">
            <h3 className="text-gray-400 text-sm mb-2">Current Holding</h3>
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center mr-3">
                {state.currentCoin.substring(0, 1)}
              </div>
              <div>
                <div className="font-bold text-lg">{state.currentCoin}</div>
                <div className="text-sm">{formatCryptoAmount(state.currentCoinAmount, state.currentCoin)}</div>
              </div>
            </div>
            <div className="mt-2 text-right text-blue-400 font-medium">
              {formatCurrency(state.currentCoinValueUsd)}
            </div>
          </div>

          {/* Profit/Loss */}
          <div className="bg-gray-700/30 rounded-lg p-4">
            <h3 className="text-gray-400 text-sm mb-2">Profit/Loss</h3>
            <div className="font-bold text-2xl mb-1 flex items-center">
              <span className={state.profitLoss >= 0 ? 'text-green-400' : 'text-red-400'}>
                {formatCurrency(state.profitLoss)}
              </span>
            </div>
            <div className={`text-sm ${state.profitLossPercentage >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {formatPercentage(state.profitLossPercentage)} from initial investment
            </div>
          </div>

          {/* Total Value */}
          <div className="bg-gray-700/30 rounded-lg p-4">
            <h3 className="text-gray-400 text-sm mb-2">Total Value</h3>
            <div className="font-bold text-2xl mb-1">
              {formatCurrency(state.totalValueUsd)}
            </div>
            <div className="text-sm text-gray-400">
              Initial: {formatCurrency(state.initialInvestment)}
            </div>
          </div>
        </div>
      </div>
      
      {/* Details */}
      <div>
        <h3 className="text-lg font-medium mb-4">Bot Details</h3>
        <div className="bg-gray-800 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <tbody>
                <tr className="border-b border-gray-700">
                  <td className="py-3 px-4 text-gray-400">Exchange</td>
                  <td className="py-3 px-4 font-medium">{state.exchange}</td>
                </tr>
                <tr className="border-b border-gray-700">
                  <td className="py-3 px-4 text-gray-400">Account ID</td>
                  <td className="py-3 px-4 font-medium">{state.accountId}</td>
                </tr>
                <tr className="border-b border-gray-700">
                  <td className="py-3 px-4 text-gray-400">Trading Strategy</td>
                  <td className="py-3 px-4 font-medium">{state.tradingStrategy}</td>
                </tr>
                <tr className="border-b border-gray-700">
                  <td className="py-3 px-4 text-gray-400">Trading Pairs</td>
                  <td className="py-3 px-4">
                    <div className="flex flex-wrap gap-2">
                      {state.tradingPairs.map((pair) => (
                        <Badge key={pair} variant="outline" className="bg-gray-700/50">
                          {pair}
                        </Badge>
                      ))}
                    </div>
                  </td>
                </tr>
                <tr className="border-b border-gray-700">
                  <td className="py-3 px-4 text-gray-400">Deviation Threshold</td>
                  <td className="py-3 px-4 font-medium">{state.deviationThreshold}%</td>
                </tr>
                <tr className="border-b border-gray-700">
                  <td className="py-3 px-4 text-gray-400">Rebalance Threshold</td>
                  <td className="py-3 px-4 font-medium">{state.rebalanceThreshold}%</td>
                </tr>
                <tr className="border-b border-gray-700">
                  <td className="py-3 px-4 text-gray-400">Last Trade</td>
                  <td className="py-3 px-4 font-medium">{formatDateTime(state.lastTradeTime)}</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 text-gray-400">Last Updated</td>
                  <td className="py-3 px-4 font-medium">{formatDateTime(state.lastUpdateTime)}</td>
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
