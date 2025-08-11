'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getBot, sellToStablecoin, toggleBotStatus } from '@/utils/api';
import { Bot } from '@/types/botTypes';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/Card';
import BotLogs from '@/components/bots/BotLogs';
import Link from 'next/link';
import TradeHistory from '@/components/bots/TradeHistory';
import TradeDecisions from '@/components/bots/TradeDecisions';
import SwapDecisions from '@/components/bots/SwapDecisions';
import BotAssets from '@/components/bots/BotAssets';
import dynamic from 'next/dynamic';
import DeviationCalculator from '@/components/bots/DeviationCalculator';
import BotState from '@/components/bots/BotState';
import PriceHistory from '@/components/bots/PriceHistory';

// Dynamically import chart components for better performance
const DeviationChart = dynamic(() => import('@/components/charts/DeviationChart'), {
  loading: () => (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  ),
  ssr: false
});

const PriceComparisonChart = dynamic(() => import('@/components/charts/PriceComparisonChart'), {
  loading: () => (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  ),
  ssr: false
});

// Extend Bot type for enriched bot data from the API
interface EnrichedBot {
  id: number;
  name: string;
  state?: {
    currentCoin?: string | null;
    balance?: number;
    usdtValue?: number;
  };
  currentCoin?: string | null;
  balance?: number;
  usdtValue?: number;
  enabled: boolean;
  accountId: number | string;
  description?: string;
  assets?: any[];
  trades?: any[];
  totalTrades?: number;
  successfulTrades?: number;
  successRate?: number;
  lastTrade?: string;
  tradeStats?: {
    totalTrades: number;
    successfulTrades: number;
    successRate: number;
  };
  thresholdPercentage: number;
  initialCoin?: string;
  coins?: string[] | string;
  checkInterval?: number;
  manualBudgetAmount?: number;
  takeProfitPercentage?: number;
  createdAt?: string;
  updatedAt?: string;
  exchangeName?: string;
  currentAsset?: {
    coin: string;
    amount: number;
    usdtEquivalent: number;
    entryPrice: number;
    realTimeUsdtEquivalent: number;
    profit: number;
    profitPercentage: number;
  };
}

export default function BotDetailPage() {
  const params = useParams();
  const router = useRouter();
  const botId = Number(params?.id);
  
  const [bot, setBot] = useState<EnrichedBot | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [showSellModal, setShowSellModal] = useState<boolean>(false);

  useEffect(() => {
    const fetchBot = async () => {
      if (isNaN(botId)) {
        setError('Invalid bot ID');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const data = await getBot(botId);
        setBot(data);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch bot:', err);
        setError('Failed to load bot details. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchBot();
  }, [botId]);

  // Helper functions
  const formatCurrency = (value?: number) => {
    if (value === undefined || value === null) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };
  
  const formatPercentage = (value?: number) => {
    if (value === undefined || value === null) return 'N/A';
    return `${value.toFixed(2)}%`;
  };
  
  const getStatusBadge = () => {
    if (!bot) return null;
    
    if (bot.enabled) {
      return <span className="px-3 py-1 text-sm font-medium rounded-md bg-green-700 text-white">Active</span>;
    } else {
      return <span className="px-3 py-1 text-sm font-medium rounded-md bg-gray-500 text-white">Inactive</span>;
    }
  };
  

  
  const getProfitLossClass = (value?: number) => {
    if (!value) return 'text-gray-400';
    return value > 0 ? 'text-green-400' : value < 0 ? 'text-red-400' : 'text-gray-400';
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-64 p-6">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !bot) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <Card className="p-6">
            <h1 className="text-2xl font-bold mb-4">Error</h1>
            <p className="text-red-400 mb-6">{error || 'Bot not found'}</p>
            <Link 
              href="/bots"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Back to All Bots
            </Link>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout customTitle={bot?.name ? `Bot: ${bot.name}` : 'Bot Details'}>
      <div className="p-6">
        {/* Header Section */}
        <div className="bg-gray-800 p-4 mb-6 rounded-md">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-3">Bot Details</h1>
              <div className="mt-2">
                <h2 className="text-lg font-semibold text-white">WITH</h2>
                <p className="text-gray-400">
                  {bot.exchangeName || 'Unknown Exchange'} • Account ID: {bot.accountId || 'Unknown'}
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              {actionError && (
                <div className="bg-red-900/20 border border-red-800 rounded-md p-2 text-sm">
                  <p className="text-red-400">{actionError}</p>
                </div>
              )}
              <button 
                className={`px-4 py-2 text-white rounded-md flex items-center ${bot.enabled ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'}`}
                onClick={() => {
                  toggleBotStatus(bot.id, !bot.enabled)
                    .then(() => {
                      // Update local bot state
                      setBot({...bot, enabled: !bot.enabled});
                    })
                    .catch(err => setActionError(err.message || 'Failed to toggle bot status'));
                }}
                disabled={actionLoading}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                {bot.enabled ? 'Stop Bot' : 'Start Bot'}
              </button>
              <Link 
                href={`/bots/${bot.id}/edit`}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit Bot
              </Link>
            </div>
          </div>
        </div>

        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* Current Coin Card */}
          <div className="bg-gray-800 rounded-md p-4 flex items-center">
            <div className="bg-blue-900/30 p-3 rounded-full mr-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-400">Current Coin</p>
              <p className="text-xl font-bold">{bot.currentCoin || bot.initialCoin || 'USDT'}</p>
              {bot.currentAsset && (
                <p className="text-sm text-gray-300 mt-1">
                  <span className="font-medium">{bot.currentAsset.amount.toLocaleString(undefined, { maximumFractionDigits: 8 })}</span> units
                </p>
              )}
            </div>
          </div>

          {/* USDT Value Card */}
          <div className="bg-gray-800 rounded-md p-4 flex items-start">
            <div className="bg-blue-900/30 p-3 rounded-full mr-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="w-full">
              <p className="text-sm text-gray-400">USDT Value</p>
              <div className="flex items-baseline gap-2">
                <p className="text-xl font-bold">{formatCurrency(bot.currentAsset?.usdtEquivalent) || formatCurrency(bot.state?.usdtValue) || 'N/A'}</p>
                {bot.currentAsset?.realTimeUsdtEquivalent && (
                  <p className="text-sm text-gray-300">Live: {formatCurrency(bot.currentAsset.realTimeUsdtEquivalent)}</p>
                )}
              </div>
              {bot.currentAsset?.profit && (
                <div className="mt-2 flex items-center gap-2">
                  <div className={`${getProfitLossClass(bot.currentAsset.profit)} font-medium text-sm flex items-center`}>
                    {bot.currentAsset.profit > 0 ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                      </svg>
                    ) : bot.currentAsset.profit < 0 ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    ) : null}
                    {formatCurrency(bot.currentAsset.profit)}
                  </div>
                  <div className={`${getProfitLossClass(bot.currentAsset.profitPercentage)} text-xs px-2 py-0.5 rounded-full ${bot.currentAsset.profitPercentage > 0 ? 'bg-green-900/20' : bot.currentAsset.profitPercentage < 0 ? 'bg-red-900/20' : 'bg-gray-700/20'}`}>
                    {formatPercentage(bot.currentAsset.profitPercentage)}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Total Trades Card */}
          <div className="bg-gray-800 rounded-md p-4 flex items-center">
            <div className="bg-blue-900/30 p-3 rounded-full mr-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-400">Total Trades</p>
              <p className="text-xl font-bold">
                {bot.tradeStats?.totalTrades !== undefined 
                  ? bot.tradeStats.totalTrades 
                  : bot.totalTrades !== undefined 
                    ? bot.totalTrades 
                    : 0}
              </p>
            </div>
          </div>

          {/* Profit Card */}
          <div className="bg-gray-800 rounded-md p-4 flex items-center">
            <div className="bg-blue-900/30 p-3 rounded-full mr-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-400">Profit</p>
              <p className="text-xl font-bold">N/A</p>
            </div>
          </div>
        </div>

        {/* Additional Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          {/* Threshold Card */}
          <div className="bg-gray-800 rounded-md p-4 flex items-center">
            <div className="bg-blue-900/30 p-3 rounded-full mr-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-400">Threshold</p>
              <p className="text-xl font-bold">{formatPercentage(bot.thresholdPercentage) || '0.1%'}</p>
            </div>
          </div>

          {/* Check Interval Card */}
          <div className="bg-gray-800 rounded-md p-4 flex items-center">
            <div className="bg-blue-900/30 p-3 rounded-full mr-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-400">Check Interval</p>
              <p className="text-xl font-bold">{bot.checkInterval || 2} mins</p>
            </div>
          </div>

          {/* Success Rate Card */}
          <div className="bg-gray-800 rounded-md p-4 flex items-center">
            <div className="bg-blue-900/30 p-3 rounded-full mr-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-400">Success Rate</p>
              <p className="text-xl font-bold">
                {bot.tradeStats?.successRate !== undefined 
                  ? `${bot.tradeStats.successRate}%` 
                  : bot.successRate !== undefined 
                    ? `${bot.successRate}%` 
                    : 'N/A'}
              </p>
            </div>
          </div>
        </div>
        
        {/* Tab Navigation and Quick Actions */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          {/* Navigation Tabs */}
          <div className="bg-gray-800 rounded-md flex-1 overflow-hidden">
            <div className="flex border-b border-gray-700 overflow-x-auto">
              {[
                { id: 'overview', label: 'Overview', icon: 'bi bi-grid' },
                { id: 'deviation', label: 'Deviation Chart', icon: 'bi bi-graph-up' },
                { id: 'price-movement', label: 'Price Movement', icon: 'bi bi-graph-up-arrow' },
                { id: 'trades', label: 'Trade History', icon: 'bi bi-clock-history' },
                { id: 'swap-decisions', label: 'Swap Decisions', icon: 'bi bi-arrow-left-right' },
                { id: 'price-history', label: 'Price History', icon: 'bi bi-currency-exchange' },
                { id: 'logs', label: 'Logs', icon: 'bi bi-journal-text' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-3 font-medium text-sm inline-flex items-center whitespace-nowrap ${activeTab === tab.id 
                    ? 'border-b-2 border-blue-500 text-blue-500' 
                    : 'text-gray-400 hover:text-gray-300 hover:border-b-2 hover:border-gray-600'}`}
                >
                  <i className={`${tab.icon} mr-2`}></i>
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
          
          {/* Quick Actions */}
          <div className="bg-gray-800 rounded-md p-4">
            <h3 className="text-lg font-semibold mb-3">Quick Actions</h3>
            <div className="grid grid-cols-1 gap-3">
              <button
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md flex items-center justify-center"
                onClick={() => {
                  const stablecoin = window.confirm('Choose a stablecoin:\n- OK for USDT\n- Cancel for USDC') ? 'USDT' : 'USDC';
                  const amount = prompt(`Enter amount to sell (or 'max' for all):`, 'max');
                  if (amount) {
                    if (window.confirm(`Sell ${amount} ${bot.currentCoin || bot.initialCoin || 'current coin'} to ${stablecoin}?`)) {
                      sellToStablecoin(bot.id, bot.currentCoin || bot.initialCoin || '', amount, stablecoin)
                        .then(() => {
                          alert('Sell successful!');
                          window.location.reload();
                        })
                        .catch(err => alert(`Error: ${err.message || 'Unknown error'}`));
                    }
                  }
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
                Sell Current Coin
              </button>
              
              <button
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md flex items-center justify-center"
                onClick={() => alert('Force rebalance not implemented')}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Force Rebalance
              </button>
              
              <button
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md flex items-center justify-center"
                onClick={() => alert('View API credentials not implemented')}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                View API Credentials
              </button>
            </div>
          </div>
        </div>
        
        {/* Main Content based on selected tab */}
        <div className="bg-gray-800 rounded-md p-6">
          {activeTab === 'overview' && (
            <div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card  className="h-full">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-6">
                    <div>
                      <h4 className="text-gray-400 text-sm mb-1">ID</h4>
                      <p className="text-white font-medium">{bot.id}</p>
                    </div>
                    <div>
                      <h4 className="text-gray-400 text-sm mb-1">Current Coin</h4>
                      <p className="text-white font-medium text-lg">
                        {bot.currentCoin || bot.initialCoin || 'Not set'}
                      </p>
                    </div>
                    <div>
                      <h4 className="text-gray-400 text-sm mb-1">Account</h4>
                      <p className="text-white font-medium">
                        {bot.accountId ? `Account #${bot.accountId}` : 'Not set'}
                      </p>
                    </div>
                    <div>
                      <h4 className="text-gray-400 text-sm mb-1">Description</h4>
                      <p className="text-white font-medium">
                        {bot.description || 'No description'}
                      </p>
                    </div>
                    <div>
                      <h4 className="text-gray-400 text-sm mb-1">Budget</h4>
                      <p className="text-white font-medium">
                        {formatCurrency(bot.manualBudgetAmount)}
                      </p>
                    </div>
                    <div>
                      <h4 className="text-gray-400 text-sm mb-1">Current Value</h4>
                      <p className="text-white font-medium">
                        {formatCurrency(bot.state?.usdtValue || bot.manualBudgetAmount || 0)}
                      </p>
                    </div>
                    <div>
                      <h4 className="text-gray-400 text-sm mb-1">Profit/Loss</h4>
                      <p className={`font-medium ${getProfitLossClass(0)}`}>
                        N/A
                      </p>
                    </div>
                    <div>
                      <h4 className="text-gray-400 text-sm mb-1">Take Profit</h4>
                      <p className="text-white font-medium">
                        {bot.takeProfitPercentage !== null && bot.takeProfitPercentage !== undefined 
                          ? formatPercentage(bot.takeProfitPercentage) 
                          : 'Not set'}
                      </p>
                    </div>
                    <div>
                      <h4 className="text-gray-400 text-sm mb-1">Threshold Percentage</h4>
                      <p className="text-white font-medium">
                        {formatPercentage(bot.thresholdPercentage)}
                      </p>
                    </div>
                    <div>
                      <h4 className="text-gray-400 text-sm mb-1">Check Interval</h4>
                      <p className="text-white font-medium">
                        {bot.checkInterval ? `${bot.checkInterval} minutes` : 'Not set'}
                      </p>
                    </div>
                    <div>
                      <h4 className="text-gray-400 text-sm mb-1">Created At</h4>
                      <p className="text-white font-medium">
                        {bot.createdAt ? new Date(bot.createdAt).toLocaleString() : 'Unknown'}
                      </p>
                    </div>
                    <div>
                      <h4 className="text-gray-400 text-sm mb-1">Last Updated</h4>
                      <p className="text-white font-medium">
                        {bot.updatedAt ? new Date(bot.updatedAt).toLocaleString() : 'Never'}
                      </p>
                    </div>
                  </div>
                </Card>
            
                <Card  className="h-full">
                  <div>
                    <p className="text-gray-400 text-sm mb-3">
                      The bot will trade between these coins based on price movements:
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {bot.coins ? (
                        (Array.isArray(bot.coins) ? bot.coins : [bot.coins]).map((coin: string, index: number) => (
                          <div 
                            key={index} 
                            className={`bg-gray-700 rounded-md p-3 border-l-4 ${coin === (bot.currentCoin || bot.initialCoin) ? 'border-green-500' : 'border-blue-500'}`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-medium">{coin}</span>
                              {coin === (bot.currentCoin || bot.initialCoin) && (
                                <span className="bg-green-500/20 text-green-300 text-xs px-2 py-1 rounded-md">Current</span>
                              )}
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-gray-400 col-span-full">No coins being monitored</p>
                      )}
                    </div>
                  </div>
                </Card>

                <Card  className="h-full">
                  {bot.state ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {Object.entries(bot.state).map(([key, value]) => {
                        if (typeof value === 'object') return null; // Skip nested objects
                        
                        let formattedValue = value;
                        if (key.toLowerCase().includes('price') || key.toLowerCase().includes('value')) {
                          formattedValue = formatCurrency(value as number);
                        } else if (key.toLowerCase().includes('percentage') || key.toLowerCase().includes('percent')) {
                          formattedValue = formatPercentage(value as number);
                        }
                        
                        return (
                          <div key={key}>
                            <h4 className="text-gray-400 text-sm mb-1 capitalize">
                              {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                            </h4>
                            <p className="text-white font-medium">{formattedValue?.toString() || 'N/A'}</p>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center p-4">
                      <p className="text-gray-400">No state information available</p>
                    </div>
                  )}
                </Card>

                <Card  className="h-full">
                  <div className="grid grid-cols-1 gap-4">
                    <button
                      className="px-4 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center justify-center"
                      onClick={() => {
                        const stablecoin = window.confirm('Choose a stablecoin:\n- OK for USDT\n- Cancel for USDC') ? 'USDT' : 'USDC';
                        const amount = prompt(`Enter amount to sell (or 'max' for all):`, 'max');
                        if (amount) {
                          if (window.confirm(`Sell ${amount} ${bot.currentCoin || bot.initialCoin || 'current coin'} to ${stablecoin}?`)) {
                            sellToStablecoin(bot.id, bot.currentCoin || bot.initialCoin || '', amount, stablecoin)
                              .then(() => {
                                alert('Sell successful!');
                                window.location.reload();
                              })
                              .catch(err => alert(`Error: ${err.message || 'Unknown error'}`));
                          }
                        }
                      }}
                      disabled={actionLoading}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                      Sell Current Coin to Stablecoin
                    </button>
                    
                    <button
                      className="px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-md flex items-center justify-center"
                      onClick={() => alert('Force rebalance not implemented')}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Force Rebalance
                    </button>
                    
                    <button
                      className={`px-4 py-3 text-white rounded-md flex items-center justify-center ${bot.enabled ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}`}
                      onClick={() => {
                        if (window.confirm(`Are you sure you want to ${bot.enabled ? 'disable' : 'enable'} this bot?`)) {
                          toggleBotStatus(bot.id, !bot.enabled)
                            .then(() => {
                              alert(`Bot ${bot.enabled ? 'disabled' : 'enabled'} successfully!`);
                              window.location.reload();
                            })
                            .catch(err => alert(`Error: ${err.message || 'Unknown error'}`));
                        }
                      }}
                      disabled={actionLoading}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                      </svg>
                      {bot.enabled ? 'Disable Bot' : 'Enable Bot'}
                    </button>
                  </div>
                </Card>
              </div>
            </div>
          )}
        </div>
        
        {activeTab === 'trades' && (
          <div className="space-y-6">
            <Card className="p-6">
              <h2 className="text-xl font-bold mb-4">Trade History</h2>
              <TradeHistory botId={botId} />
            </Card>
          </div>
        )}
        
        {activeTab === 'deviation' && (
          <div className="space-y-6">
            <Card className="p-6">
              <DeviationChart botId={Number(botId)} />
            </Card>
          </div>
        )}
        
        {activeTab === 'price-movement' && (
          <div className="space-y-6">
            <Card className="p-6">
              <PriceComparisonChart botId={Number(botId)} />
            </Card>
          </div>
        )}
        
        {activeTab === 'trade-decisions' && (
          <div className="space-y-6">
            <Card className="p-6">
              <TradeDecisions botId={botId} />
            </Card>
          </div>
        )}
        
        {activeTab === 'swap-decisions' && (
          <div className="space-y-6">
            <Card className="p-6">
              <SwapDecisions botId={botId} />
            </Card>
          </div>
        )}
        
        {activeTab === 'assets' && (
          <div className="space-y-6">
            <Card className="p-6">
              <BotAssets botId={botId} />
            </Card>
          </div>
        )}
        
        {activeTab === 'logs' && (
          <div className="space-y-6">
            <Card className="p-6">
              <BotLogs botId={botId} />
            </Card>
          </div>
        )}
        
        {activeTab === 'deviation-calculator' && (
          <div className="space-y-6">
            <Card className="p-6">
              <DeviationCalculator botId={botId} />
            </Card>
          </div>
        )}
        
        {activeTab === 'state' && (
          <div className="space-y-6">
            <Card className="p-6">
              <BotState botId={botId} />
            </Card>
          </div>
        )}
        
        {activeTab === 'price-history' && (
          <div className="space-y-6">
            <Card className="p-6">
              <PriceHistory botId={botId} />
            </Card>
          </div>
        )}
        
        {activeTab === 'performance' && (
          <div className="space-y-6">
            <Card className="p-6">
              <h2 className="text-xl font-bold mb-4">Performance</h2>
              
              {/* Charts - To be implemented */}
              <div className="bg-gray-800 rounded-md p-6 text-center">
                <p className="text-gray-400">Performance charts will be displayed here</p>
                <p className="text-sm text-gray-500 mt-2">This feature is coming soon</p>
              </div>
              
              {/* Bot Performance Details */}
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="text-gray-400 text-sm mb-1">Bot Name</h4>
                  <p className="text-white font-medium">{bot.name}</p>
                </div>
                <div>
                  <h4 className="text-gray-400 text-sm mb-1">Status</h4>
                  <p className="text-white font-medium flex items-center">
                    <span className={`inline-block w-3 h-3 rounded-full mr-2 ${bot.enabled ? 'bg-green-500' : 'bg-red-500'}`}></span>
                    {bot.enabled ? 'Active' : 'Inactive'}
                  </p>
                </div>
                <div>
                  <h4 className="text-gray-400 text-sm mb-1">Exchange</h4>
                  <p className="text-white font-medium">{bot.exchangeName || 'N/A'}</p>
                </div>
                <div>
                  <h4 className="text-gray-400 text-sm mb-1">Account ID</h4>
                  <p className="text-white font-medium">{bot.accountId || 'N/A'}</p>
                </div>
                <div>
                  <h4 className="text-gray-400 text-sm mb-1">Initial Coin</h4>
                  <p className="text-white font-medium">{bot.initialCoin || 'N/A'}</p>
                </div>
                <div>
                  <h4 className="text-gray-400 text-sm mb-1">Current Coin</h4>
                  <p className="text-white font-medium">{bot.currentCoin || bot.initialCoin || 'N/A'}</p>
                </div>
                <div>
                  <h4 className="text-gray-400 text-sm mb-1">Threshold</h4>
                  <p className="text-white font-medium">{formatPercentage(bot.thresholdPercentage) || 'N/A'}</p>
                </div>
                <div>
                  <h4 className="text-gray-400 text-sm mb-1">Check Interval</h4>
                  <p className="text-white font-medium">{bot.checkInterval || 'N/A'} mins</p>
                </div>
                <div>
                  <h4 className="text-gray-400 text-sm mb-1">Created At</h4>
                  <p className="text-white font-medium">{bot.createdAt ? new Date(bot.createdAt).toLocaleString() : 'N/A'}</p>
                </div>
                <div>
                  <h4 className="text-gray-400 text-sm mb-1">Updated At</h4>
                  <p className="text-white font-medium">{bot.updatedAt ? new Date(bot.updatedAt).toLocaleString() : 'N/A'}</p>
                </div>
              </div>
              
              <div className="pt-6 border-t border-gray-700">
                <Link 
                  href={`/bots/${bot.id}/edit`}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 inline-flex items-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Edit Bot Settings
                </Link>
              </div>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
