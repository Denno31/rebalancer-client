import React from 'react';
import Link from 'next/link';
import { Bot } from '@/types/botTypes';

interface BotCardProps {
  bot: Bot;
}

const BotCard: React.FC<BotCardProps> = ({ bot }) => {
  // Helper functions
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };
  
  const formatPercentage = (value: number) => {
    return `${value.toFixed(2)}%`;
  };
  
  const renderStatusBadge = () => {
    if (bot.enabled) {
      return <span className="px-2 py-1 text-xs font-medium rounded-md bg-green-700 text-white">Active</span>;
    } else {
      return <span className="px-2 py-1 text-xs font-medium rounded-md bg-gray-500 text-white">Inactive</span>;
    }
  };
  
  const getCoinsDisplay = () => {
    let coins = Array.isArray(bot.coins) ? bot.coins : bot.coins?.split(',').map(coin => coin.trim());
    const coinsList = coins || [];
    
    if (coinsList.length <= 5) {
      return (
        <div className="flex flex-wrap gap-1">
          {coinsList.map((coin, index) => (
            <span 
              key={`${coin}-${index}`}
              className="px-2 py-1 text-xs rounded-md bg-gray-700 text-white"
            >
              {coin}
            </span>
          ))}
        </div>
      );
    } else {
      return (
        <div>
          <div className="flex flex-wrap gap-1 mb-1">
            {coinsList.slice(0, 5).map((coin, index) => (
              <span 
                key={`${coin}-${index}`}
                className="px-2 py-1 text-xs rounded-md bg-gray-700 text-white"
              >
                {coin}
              </span>
            ))}
          </div>
          <span className="text-xs text-gray-400">
            +{coinsList.length - 5} more coins
          </span>
        </div>
      );
    }
  };
  
  const getProfitLossClass = (value?: number) => {
    if (!value) return 'text-gray-400';
    return value > 0 ? 'text-green-400' : value < 0 ? 'text-red-400' : 'text-gray-400';
  };

  return (
    <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden">
      {/* Card Header */}
      <div className="px-4 py-3 bg-gray-700 flex justify-between items-center">
        <h3 className="text-lg font-medium text-white truncate">{bot.name}</h3>
        {renderStatusBadge()}
      </div>
      
      {/* Card Content */}
      <div className="p-4">
        {/* Current Coin */}
        <div className="mb-4">
          <div className="text-sm font-medium text-gray-400">Current Coin</div>
          <div className="font-bold text-lg text-white">{bot.currentCoin || bot.initialCoin}</div>
        </div>
        
        {/* Trading Pairs */}
        <div className="mb-4">
          <div className="text-sm font-medium text-gray-400">Monitored Coins</div>
          <div className="mt-1">{getCoinsDisplay()}</div>
        </div>
        
        {/* Budget & Current Value */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <div className="text-sm font-medium text-gray-400">Budget</div>
            <div className="font-medium text-white">
              {formatCurrency(bot.manualBudgetAmount || 0)}
            </div>
          </div>
          <div>
            <div className="text-sm font-medium text-gray-400">Current Value</div>
            <div className="font-medium text-white">
              {formatCurrency(bot.currentValue || bot.manualBudgetAmount || 0)}
            </div>
          </div>
        </div>
        
        {/* Profit & Take Profit */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <div className="text-sm font-medium text-gray-400">Profit/Loss</div>
            <div className={`font-medium ${getProfitLossClass(bot.profitLoss)}`}>
              {bot.profitLoss ? formatCurrency(bot.profitLoss) : 'N/A'}
              {bot.profitLossPercentage && ` (${formatPercentage(bot.profitLossPercentage)})`}
            </div>
          </div>
          <div>
            <div className="text-sm font-medium text-gray-400">Take Profit</div>
            <div className="font-medium text-white">
              {bot.takeProfitPercentage ? formatPercentage(bot.takeProfitPercentage) : 'Not set'}
            </div>
          </div>
        </div>
        
        {/* Last Trade */}
        <div className="mb-4">
          <div className="text-sm font-medium text-gray-400">Last Trade</div>
          <div className="text-sm text-gray-300">
            {bot.lastTradeDate ? new Date(bot.lastTradeDate).toLocaleString() : 'No trades yet'}
          </div>
        </div>
        
        {/* Actions */}
        <div className="flex justify-between mt-4">
          <Link 
            href={`/bots/${bot.id}/edit`}
            className="px-3 py-2 rounded-md text-sm font-medium bg-blue-600 text-white hover:bg-blue-700"
          >
            Edit
          </Link>
          <Link 
            href={`/bots/${bot.id}`}
            className="px-3 py-2 rounded-md text-sm font-medium bg-gray-600 text-white hover:bg-gray-700"
          >
            Details
          </Link>
        </div>
      </div>
    </div>
  );
};

export default BotCard;
