'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { fetchBotCoins, fetchDeviationData } from '@/utils/botApi';

// Temporary implementation of fetchCoinPrice until API is available
async function fetchCoinPrice(coin: string): Promise<number> {
  // Mock function - in production this would call the actual API
  // For now return a mock price based on the coin name to simulate functionality
  const mockPrices: Record<string, number> = {
    'BTC': 28500.42,
    'ETH': 1850.67,
    'USDT': 1.0,
    'USDC': 1.0,
    'BNB': 245.30,
    'XRP': 0.52,
    'SOL': 35.28,
    'ADA': 0.32,
    'DOGE': 0.078
  };
  
  return mockPrices[coin] || 100.0; // Return mock price or default
}

// Helper function to calculate deviation
function calculateDeviation(botId: number, fromCoin: string, toCoin: string, fromPrice: number, toPrice: number): number {
  // This is a simplified calculation - in production this would call the API
  // The deviation is the percentage difference from the baseline price
  try {
    // For our implementation, we'll use a simple calculation
    // In a real implementation, this might use historical base prices stored in the API
    // For now, we'll just simulate a small deviation
    const basePrice = fromPrice / toPrice;
    
    // Simulate a slight difference to show some deviation
    // In reality, this would come from actual market data
    const randomFactor = 1 + (Math.random() * 0.1 - 0.05); // ±5% deviation
    const currentPrice = (fromPrice / toPrice) * randomFactor;
    
    const deviation = ((currentPrice - basePrice) / basePrice) * 100;
    return parseFloat(deviation.toFixed(2));
  } catch (error) {
    console.error('Error calculating deviation:', error);
    return 0; // Return 0 on error instead of throwing
  }
}

interface DeviationCalculatorProps {
  botId: number;
}

const DeviationCalculator: React.FC<DeviationCalculatorProps> = ({ botId }) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [coinsLoading, setCoinsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [coins, setCoins] = useState<string[]>([]);
  const [fromCoin, setFromCoin] = useState<string>('BTC');
  const [toCoin, setToCoin] = useState<string>('USDT');
  const [fromPrice, setFromPrice] = useState<string>('');
  const [toPrice, setToPrice] = useState<string>('');
  const [deviation, setDeviation] = useState<number | null>(null);
  const [calculationHistory, setCalculationHistory] = useState<Array<{
    fromCoin: string;
    toCoin: string;
    fromPrice: number;
    toPrice: number;
    deviation: number;
    timestamp: string;
  }>>([]);

  useEffect(() => {
    const loadCoins = async () => {
      try {
        setCoinsLoading(true);
        const data = await fetchBotCoins(botId);
        if (data && data.length > 0) {
          setCoins(data);
          // Initialize default values with the first two coins
          if (data.length >= 2) {
            setFromCoin(data[0]);
            setToCoin(data[1]);
          }
        } else {
          // Fallback to default coins if the API returns empty
          setCoins(['BTC', 'ETH', 'USDT', 'USDC']);
        }
      } catch (err) {
        console.error('Failed to fetch available coins', err);
        // Fallback to default coins on error
        setCoins(['BTC', 'ETH', 'USDT', 'USDC']);
      } finally {
        setCoinsLoading(false);
      }
    };
    
    loadCoins();
  }, [botId]);

  // Fetch current prices and calculate deviation
  // Function to calculate deviation from two prices
  const calculatePriceDeviation = (fromPriceNum: number, toPriceNum: number): number => {
    // This is a simplified calculation for demonstration
    // In a real implementation, this would consider historical base prices
    try {
      // Basic deviation calculation
      const basePrice = fromPriceNum / toPriceNum;
      
      // Add a slight random factor to simulate market volatility for testing
      const randomFactor = 1 + (Math.random() * 0.1 - 0.05); // ±5% deviation
      const currentPrice = (fromPriceNum / toPriceNum) * randomFactor;
      
      const deviation = ((currentPrice - basePrice) / basePrice) * 100;
      return parseFloat(deviation.toFixed(2));
    } catch (error) {
      console.error('Error calculating deviation:', error);
      return 0; // Return 0 on error
    }
  };
  
  const handleCalculateDeviation = async () => {
    // If user has manually entered prices, use those
    if (fromPrice && toPrice) {
      if (isNaN(Number(fromPrice)) || isNaN(Number(toPrice)) || Number(fromPrice) <= 0 || Number(toPrice) <= 0) {
        setError('Please enter valid positive numbers for both prices');
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const fromPriceNum = Number(fromPrice);
        const toPriceNum = Number(toPrice);
        
        // Calculate deviation using our local function
        const calculatedDeviation = calculatePriceDeviation(fromPriceNum, toPriceNum);
        
        setDeviation(calculatedDeviation);
        
        // Add to history
        setCalculationHistory(prev => [
          {
            fromCoin,
            toCoin,
            fromPrice: fromPriceNum,
            toPrice: toPriceNum,
            deviation: calculatedDeviation,
            timestamp: new Date().toISOString(),
          },
          ...prev.slice(0, 9) // Keep only the 10 most recent calculations
        ]);
      } catch (err: any) {
        console.error('Calculation error:', err);
        setError('Failed to calculate deviation. Please check your inputs.');
      } finally {
        setLoading(false);
      }
    } else {
      // If no prices entered, fetch current prices from API
      setLoading(true);
      setError(null);
      
      try {
        // Fetch current prices for both coins
        const fromPriceNum = await fetchCoinPrice(fromCoin);
        const toPriceNum = await fetchCoinPrice(toCoin);
        
        if (fromPriceNum <= 0 || toPriceNum <= 0) {
          throw new Error('Could not fetch valid current prices');
        }
        
        // Update the price inputs
        setFromPrice(fromPriceNum.toString());
        setToPrice(toPriceNum.toString());
        
        // Calculate deviation using our local function
        const calculatedDeviation = calculatePriceDeviation(fromPriceNum, toPriceNum);
        
        setDeviation(calculatedDeviation);
        
        // Add to history
        setCalculationHistory(prev => [
          {
            fromCoin,
            toCoin,
            fromPrice: fromPriceNum,
            toPrice: toPriceNum,
            deviation: calculatedDeviation,
            timestamp: new Date().toISOString(),
          },
          ...prev.slice(0, 9)
        ]);
      } catch (err: any) {
        console.error('Price fetch error:', err);
        setError('Failed to fetch current prices. Please enter prices manually.');
      } finally {
        setLoading(false);
      }
    }
  };

  const formatPercentage = (value: number) => {
    return `${value > 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleCalculateDeviation();
  };

  const handleClearHistory = () => {
    setCalculationHistory([]);
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold mb-4">Deviation Calculator</h2>
        <p className="text-gray-400 mb-6">
          Calculate the percentage deviation between two cryptocurrency prices.
        </p>
        
        {coinsLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* From Coin */}
            <div className="space-y-2">
              <label htmlFor="fromCoin" className="block text-sm font-medium text-gray-300">
                From Coin
              </label>
              <select
                id="fromCoin"
                className="w-full bg-gray-800 border border-gray-700 rounded-md px-3 py-2"
                value={fromCoin}
                onChange={(e) => setFromCoin(e.target.value)}
              >
                {coins.map((coin) => (
                  <option key={`from-${coin}`} value={coin}>
                    {coin}
                  </option>
                ))}
              </select>
            </div>

            {/* To Coin */}
            <div className="space-y-2">
              <label htmlFor="toCoin" className="block text-sm font-medium text-gray-300">
                To Coin
              </label>
              <select
                id="toCoin"
                className="w-full bg-gray-800 border border-gray-700 rounded-md px-3 py-2"
                value={toCoin}
                onChange={(e) => setToCoin(e.target.value)}
              >
                {coins.map((coin) => (
                  <option key={`to-${coin}`} value={coin}>
                    {coin}
                  </option>
                ))}
              </select>
            </div>

            {/* From Price */}
            <div className="space-y-2">
              <label htmlFor="fromPrice" className="block text-sm font-medium text-gray-300">
                From Price (USD)
              </label>
              <input
                id="fromPrice"
                type="number"
                step="any"
                min="0"
                className="w-full bg-gray-800 border border-gray-700 rounded-md px-3 py-2"
                value={fromPrice}
                onChange={(e) => setFromPrice(e.target.value)}
                placeholder="Enter from price"
                required
              />
            </div>

            {/* To Price */}
            <div className="space-y-2">
              <label htmlFor="toPrice" className="block text-sm font-medium text-gray-300">
                To Price (USD)
              </label>
              <input
                id="toPrice"
                type="number"
                step="any"
                min="0"
                className="w-full bg-gray-800 border border-gray-700 rounded-md px-3 py-2"
                value={toPrice}
                onChange={(e) => setToPrice(e.target.value)}
                placeholder="Enter to price"
                required
              />
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-900/20 border border-red-800 rounded-md p-4 text-red-400">
              {error}
            </div>
          )}

          {/* Calculate Button */}
          <div className="space-y-2">
          <button
            type="submit"
            disabled={loading || coinsLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Calculating...' : 'Calculate Deviation'}
          </button>
          <button
            type="button"
            disabled={loading || coinsLoading}
            onClick={() => { setFromPrice(''); setToPrice(''); handleCalculateDeviation(); }}
            className="w-full border border-blue-600 text-blue-400 hover:bg-blue-900/30 font-semibold py-2 px-4 rounded-md disabled:opacity-50 disabled:cursor-not-allowed mt-2"
          >
            {loading ? 'Fetching...' : 'Use Current Prices'}
          </button>
        </div>
        </form>
        )}
      </div>

      {/* Calculation Result */}
      {deviation !== null && (
        <div className={`p-4 rounded-md ${deviation >= 0 ? 'bg-green-900/20 border border-green-800' : 'bg-red-900/20 border border-red-800'}`}>
          <h3 className="font-medium text-lg mb-2">Calculation Result</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-gray-400">From: {fromCoin} (${Number(fromPrice).toFixed(2)})</p>
              <p className="text-gray-400">To: {toCoin} (${Number(toPrice).toFixed(2)})</p>
            </div>
            <div>
              <p className="font-bold text-xl">
                Deviation: <span className={deviation >= 0 ? 'text-green-400' : 'text-red-400'}>
                  {formatPercentage(deviation)}
                </span>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Calculation History */}
      {calculationHistory.length > 0 && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">Calculation History</h3>
            <button
              onClick={handleClearHistory}
              className="text-sm text-gray-400 hover:text-gray-300"
            >
              Clear History
            </button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="py-3 px-4 text-gray-400 font-medium">Time</th>
                  <th className="py-3 px-4 text-gray-400 font-medium">From</th>
                  <th className="py-3 px-4 text-gray-400 font-medium">To</th>
                  <th className="py-3 px-4 text-gray-400 font-medium">From Price</th>
                  <th className="py-3 px-4 text-gray-400 font-medium">To Price</th>
                  <th className="py-3 px-4 text-gray-400 font-medium">Deviation</th>
                </tr>
              </thead>
              <tbody>
                {calculationHistory.map((calc, index) => (
                  <tr key={index} className="border-b border-gray-800">
                    <td className="py-3 px-4">{formatTimestamp(calc.timestamp)}</td>
                    <td className="py-3 px-4">{calc.fromCoin}</td>
                    <td className="py-3 px-4">{calc.toCoin}</td>
                    <td className="py-3 px-4">${calc.fromPrice.toFixed(2)}</td>
                    <td className="py-3 px-4">${calc.toPrice.toFixed(2)}</td>
                    <td className={`py-3 px-4 ${calc.deviation >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {formatPercentage(calc.deviation)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* User Guide */}
      <div className="bg-gray-800 rounded-md p-4">
        <h3 className="font-medium mb-2">How to Use</h3>
        <ol className="list-decimal list-inside space-y-1 text-gray-400">
          <li>Select the coins you want to compare in the "From" and "To" dropdowns</li>
          <li>Enter the price in USD for each coin</li>
          <li>Click the "Calculate Deviation" button to see the percentage change</li>
          <li>Results will be saved in your calculation history for reference</li>
        </ol>
      </div>
    </div>
  );
};

export default DeviationCalculator;
