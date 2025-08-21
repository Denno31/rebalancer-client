import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Bot } from '@/types/botTypes';
import { Trade } from '@/types/tradeTypes';
import { COLORS } from '@/utils/theme';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { fetchBotTrades } from '@/utils/api';

interface BotCardProps {
  bot: Bot;
}

interface BotAsset {
  coin: string;
  amount: number;
  usdtEquivalent: number;
  realTimePrice?: number;
}

interface BotExtended extends Bot {
  botAssets?: BotAsset[];
  trades?: Trade[];
  realTimePrice?: number;
}

const BotCard: React.FC<BotCardProps> = ({ bot: initialBot }) => {
  const [bot, setBot] = useState<BotExtended>(initialBot as BotExtended);
  const [loading, setLoading] = useState<boolean>(false);
  
  useEffect(() => {
    const fetchBotData = async () => {
      setLoading(true);
      try {
        // Fetch bot trades
        const trades = await fetchBotTrades(bot.id);
        
        // Handle bot assets data
        let botAssets: BotAsset[] = [];
        
        // If bot already has assets data, use it
        if (bot.botAssets && Array.isArray(bot.botAssets)) {
          botAssets = bot.botAssets;
        } 
        // Otherwise create a reasonable placeholder for current coin
        else if (bot.currentCoin) {
          // For stablecoins, use price of 1
          // For other coins, estimate a reasonable price based on budget
          const estimatedPrice = bot.currentCoin === 'USDT' || bot.currentCoin === 'USDC' ? 
            1 : bot.manualBudgetAmount ? (bot.manualBudgetAmount / 10) : 1000; // Reasonable fallback price
          
          // Estimate a reasonable amount based on budget and price
          const estimatedAmount = bot.manualBudgetAmount ? bot.manualBudgetAmount / estimatedPrice : 0;
          
          botAssets = [{
            coin: bot.currentCoin,
            amount: estimatedAmount,
            usdtEquivalent: bot.manualBudgetAmount || 0,
            realTimePrice: estimatedPrice
          }];
        }
        
        setBot({
          ...bot,
          trades: Array.isArray(trades) ? trades : [],  // Ensure trades is always an array
          botAssets,
          realTimePrice: botAssets[0]?.realTimePrice
        });
      } catch (error) {
        console.error('Error fetching bot data:', error);
        // Even on error, set some default data so UI doesn't break
        setBot({
          ...bot,
          trades: [],
          botAssets: bot.currentCoin ? [{
            coin: bot.currentCoin,
            amount: 0,
            usdtEquivalent: 0,
            realTimePrice: 0
          }] : []
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchBotData();
  }, [bot.id]);
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
  
  // Calculate the current value of holdings using real-time price
  const calculateCurrentValue = () => {
    if (!bot.botAssets || !bot.currentCoin) return bot.manualBudgetAmount || 0;
    
    const currentCoinAsset = bot.botAssets.find(asset => asset.coin === bot.currentCoin);
    if (!currentCoinAsset || !currentCoinAsset.realTimePrice) return bot.manualBudgetAmount || 0;
    
    return currentCoinAsset.amount * currentCoinAsset.realTimePrice;
  };
  
  // Calculate profit (current value - budget)
  const calculateProfit = () => {
    if (!bot.manualBudgetAmount) return 0;
    
    const currentValue = calculateCurrentValue();
    return currentValue - bot.manualBudgetAmount;
  };
  
  // Calculate profit percentage
  const calculateProfitPercentage = () => {
    if (!bot.manualBudgetAmount || bot.manualBudgetAmount === 0) return 0;
    
    const profit = calculateProfit();
    return (profit / bot.manualBudgetAmount) * 100;
  };
  
  // Calculate success rate from trades
  const calculateSuccessRate = () => {
    if (!bot.trades || bot.trades.length === 0) return 0;
    
    // Only count 'completed' trades as successful
    const successfulTrades = bot.trades.filter(trade => 
      trade.status === 'completed'
    ).length;
    
    return (successfulTrades / bot.trades.length) * 100;
  };
  
  const renderStatusBadge = () => {
    if (bot.enabled) {
      return <span className="px-2 py-1 text-xs font-medium rounded-md bg-green-700 text-white">Active</span>;
    } else {
      return <span className="px-2 py-1 text-xs font-medium rounded-md bg-gray-500 text-white">Inactive</span>;
    }
  };
  
  const getCoinsDisplay = () => {

    const coinsList: string[] = bot.coins as string[];
    
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
    <Card className="overflow-hidden p-0">
      {/* Card Header */}
      <div className="px-4 py-3 bg-[#2A2E37] flex justify-between items-center">
        <h3 className="text-lg font-medium text-white truncate">{bot.name}</h3>
        {renderStatusBadge()}
      </div>
      
      {/* Card Content */}
      <div className="p-4">
        {/* Current Coin */}
        <div className="mb-4">
          <div className="text-sm font-medium text-gray-400">Current Coin</div>
          <div className="font-bold text-lg text-white flex justify-between items-center">
            <div>{bot.currentCoin || bot.initialCoin}</div>
            {bot.botAssets && bot.botAssets.some(asset => asset.coin === bot.currentCoin) && (
              <span className="text-sm px-2 py-1 bg-gray-700 rounded-md">
                {Number(bot.botAssets.find(asset => asset.coin === bot.currentCoin)?.amount || 0).toLocaleString(undefined, { maximumFractionDigits: 8 })} units
              </span>
            )}
          </div>
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
              {loading ? (
                <span className="text-gray-500">Loading...</span>
              ) : (
                formatCurrency(calculateCurrentValue())
              )}
            </div>
          </div>
        </div>
        
        {/* Profit & Take Profit */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <div className="text-sm font-medium text-gray-400">Profit/Loss</div>
            {loading ? (
              <div className="font-medium text-gray-500">Loading...</div>
            ) : (
              <div className={`font-medium ${getProfitLossClass(calculateProfit())}`}>
                {formatCurrency(calculateProfit())}
                <span className="ml-1 text-xs px-2 py-0.5 rounded-full bg-opacity-20 inline-block"
                  style={{
                    backgroundColor: calculateProfitPercentage() >= 0 ? 'rgba(28, 200, 138, 0.2)' : 'rgba(231, 74, 59, 0.2)'
                  }}>
                  {calculateProfitPercentage() >= 0 ? '+' : ''}{formatPercentage(calculateProfitPercentage())}
                </span>
              </div>
            )}
          </div>
          <div>
            <div className="text-sm font-medium text-gray-400">Take Profit</div>
            <div className="font-medium text-white">
              {bot.takeProfitPercentage ? formatPercentage(bot.takeProfitPercentage) : 'Not set'}
            </div>
          </div>
        </div>
        
        {/* Trade Stats */}
        <div className="mb-4 pt-3 border-t border-gray-700">
          <div className="text-sm font-medium text-gray-400 mb-1">Trade Statistics</div>
          {loading ? (
            <div className="text-gray-500">Loading trade data...</div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="text-xs text-gray-400">Total Trades</div>
                <div className="font-medium text-white">
                  {bot.trades?.length || 0}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-400">Success Rate</div>
                <div className="flex items-center">
                  <div className="w-16 h-2 bg-gray-700 rounded-full mr-2 overflow-hidden">
                    <div 
                      className="h-full bg-green-500" 
                      style={{ width: `${calculateSuccessRate()}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium text-white">
                    {formatPercentage(calculateSuccessRate())}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Actions */}
        <div className="flex justify-between mt-4">
          <Link href={`/bots/${bot.id}/edit`}>
            <Button variant="primary" size="sm">
              Edit
            </Button>
          </Link>
          <Link href={`/bots/${bot.id}`}>
            <Button variant="secondary" size="sm">
              Details
            </Button>
          </Link>
        </div>
      </div>
    </Card>
  );
};

export default BotCard;
