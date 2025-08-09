'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { fetchBotAssets, Asset, BotAsset } from '@/utils/botApi';

// Using BotAsset interface from botApi.ts

interface BotAssetsProps {
  botId: number | string;
}

const BotAssets: React.FC<BotAssetsProps> = ({ botId }) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [assets, setAssets] = useState<BotAsset[]>([]);
  const [totalValue, setTotalValue] = useState<number>(0);

  useEffect(() => {
    const loadBotAssets = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const numericBotId = typeof botId === 'string' ? parseInt(botId, 10) : botId;
        const apiData = await fetchBotAssets(numericBotId);
        
        if (apiData && apiData.length > 0) {
          // Transform API Asset[] to BotAsset[] format
          const transformedAssets: BotAsset[] = apiData.map(asset => {
            // Calculate the total value for percentage calculation
            const totalBalance = apiData.reduce((sum, a) => sum + a.balance, 0);
            
            return {
              coin: asset.coin,
              amount: asset.balance,
              usdtValue: asset.balance * 1, // Assuming 1:1 for simplicity, would need actual rates
              percentage: (asset.balance / totalBalance) * 100,
              lastUpdate: new Date().toISOString()
            };
          });
          
          setAssets(transformedAssets);
          const total = transformedAssets.reduce((sum, asset) => sum + asset.usdtValue, 0);
          setTotalValue(total);
        } else {
          setAssets([]);
          setTotalValue(0);
        }
      } catch (err: any) {
        console.error('Failed to fetch bot assets:', err);
        setError('Failed to load bot assets. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    loadBotAssets();
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
    return `${value.toFixed(2)}%`;
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
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
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Bot Assets</h2>
        <div className="text-lg font-medium">
          Total Value: <span className="text-blue-400">{formatCurrency(totalValue)}</span>
        </div>
      </div>

      {assets.length === 0 ? (
        <div className="text-center py-10 text-gray-400">
          No assets found for this bot
        </div>
      ) : (
        <>
          {/* Assets Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {assets.map((asset) => (
              <div key={asset.coin} className="bg-gray-800 rounded-md p-4">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-bold text-white flex items-center">
                    <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center mr-2">
                      {asset.coin.substring(0, 1)}
                    </div>
                    {asset.coin}
                  </h3>
                  <Badge variant="outline" className="bg-blue-900/20 text-blue-400 border-blue-800">
                    {formatPercentage(asset.percentage)}
                  </Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Amount:</span>
                  <span className="font-medium">{formatCryptoAmount(asset.amount, asset.coin)}</span>
                </div>
                <div className="flex justify-between text-sm mt-1">
                  <span className="text-gray-400">Value:</span>
                  <span className="font-medium">{formatCurrency(asset.usdtValue)}</span>
                </div>
                <div className="text-xs text-gray-500 mt-3">
                  Last updated: {formatTimestamp(asset.lastUpdate)}
                </div>
              </div>
            ))}
          </div>

          {/* Assets Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="py-3 px-4 text-gray-400 font-medium">Coin</th>
                  <th className="py-3 px-4 text-gray-400 font-medium">Amount</th>
                  <th className="py-3 px-4 text-gray-400 font-medium">Value (USDT)</th>
                  <th className="py-3 px-4 text-gray-400 font-medium">Portfolio %</th>
                  <th className="py-3 px-4 text-gray-400 font-medium">Last Updated</th>
                </tr>
              </thead>
              <tbody>
                {assets.map((asset) => (
                  <tr key={asset.coin} className="border-b border-gray-800">
                    <td className="py-3 px-4 font-medium">{asset.coin}</td>
                    <td className="py-3 px-4">{formatCryptoAmount(asset.amount, asset.coin)}</td>
                    <td className="py-3 px-4">{formatCurrency(asset.usdtValue)}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center">
                        <div className="w-16 h-2 bg-gray-700 rounded-full overflow-hidden mr-2">
                          <div 
                            className="h-full bg-blue-500" 
                            style={{ width: `${asset.percentage}%` }}
                          ></div>
                        </div>
                        {formatPercentage(asset.percentage)}
                      </div>
                    </td>
                    <td className="py-3 px-4">{formatTimestamp(asset.lastUpdate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

export default BotAssets;
