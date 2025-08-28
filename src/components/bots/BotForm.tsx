'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { createBot, fetchAccounts, fetchAvailableCoins } from '@/utils/api';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/Alert';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { Switch } from '@/components/ui/Switch';
import { Badge } from '@/components/ui/Badge';
import availableCoinsData from '@/data/availableCoins.json';

// Types
interface ThreeCommasAccount {
  id: string;
  name: string;
  exchange: string;
}

interface CoinWithBalance {
  coin: string;
  amount: number;
}

interface FormData {
  name: string;
  initialCoin: string;
  coins: string;
  budget: string;
  thresholdPercentage: string;
  takeProfitPercentage: string;
  checkInterval: string;
  accountId: string;
  enabled: boolean;
  useTakeProfit: boolean;
  preferredStablecoin: string;
}

export default function BotForm() {
  const router = useRouter();
  
  // Form state
  const [formData, setFormData] = useState<FormData>({
    name: '',
    initialCoin: '',
    coins: '',
    budget: '',
    thresholdPercentage: '5',
    takeProfitPercentage: '',
    checkInterval: '10',
    accountId: '',
    enabled: true,
    useTakeProfit: false,
    preferredStablecoin: 'USDT',
  });

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  const [coinEntryMode, setCoinEntryMode] = useState<'select'|'all'|'manual'>('select');
  
  // Data state
  const [accounts, setAccounts] = useState<ThreeCommasAccount[]>([]);
  const [accountsLoading, setAccountsLoading] = useState(false);
  const [accountsError, setAccountsError] = useState('');
  const [coinList, setCoinList] = useState<CoinWithBalance[]>([]);
  const [coinsLoading, setCoinsLoading] = useState(false);
  const [selectedCoins, setSelectedCoins] = useState<string[]>([]);
  const [manualCoins, setManualCoins] = useState<string>('');
  const [allCoins, setAllCoins] = useState<string[]>(availableCoinsData.allCoins || []);

  // Fetch accounts on component mount
  useEffect(() => {
    fetchAccountsData();
  }, []);
  
  // Fetch available coins when account is selected
  useEffect(() => {
    const fetchCoins = async () => {
      if (!formData.accountId) {
        setCoinList([]);
        return;
      }
      
      try {
        setCoinsLoading(true);
        const coinsData = await fetchAvailableCoins(formData.accountId);
        console.log('Fetched coins data:', coinsData);
        // Only update state if we actually have data
        if (Array.isArray(coinsData) && coinsData.length > 0) {
          setCoinList(coinsData);
        } else {
          console.warn('No coins data returned from API or empty array');
          setCoinList([]);
        }
      } catch (error) {
        console.error('Failed to fetch available coins:', error);
        setError('Failed to load available coins. Please try again.');
        setCoinList([]);
      } finally {
        setCoinsLoading(false);
      }
    };
    
    // Reset selected coins when account changes to prevent hydration issues
    setSelectedCoins([]);
    
    fetchCoins();
  }, [formData.accountId]);

  // Fetch accounts from API
  const fetchAccountsData = async () => {
    try {
      setAccountsLoading(true);
      setAccountsError('');
      
      // Call the actual API
      const accountData = await fetchAccounts();
      
      setAccounts(accountData || []);
    } catch (error) {
      console.error('Error fetching accounts:', error);
      setAccountsError('Failed to load accounts');
    } finally {
      setAccountsLoading(false);
    }
  };

  // Update form data
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Toggle enabled status
  const handleEnabledChange = (checked: boolean) => {
    setFormData(prev => ({ ...prev, enabled: checked }));
  };

  // Handle coin selection
  const handleCoinSelect = (coin: string) => {
    if (selectedCoins.includes(coin)) {
      setSelectedCoins(selectedCoins.filter(c => c !== coin));
    } else {
      setSelectedCoins([...selectedCoins, coin]);
    }
  };
  
  // Format coin for display (with amount)
  const formatCoinWithBalance = (coinData: CoinWithBalance) => {
    return `${coinData.coin} (${coinData.amount.toFixed(4)})`;
  };

  // Update formData when selectedCoins changes
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      coins: selectedCoins.join(',')
    }));
  }, [selectedCoins]);

  // Form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);
    
    try {
      // Validate form
      if (!formData.name || !formData.initialCoin || !formData.coins || !formData.budget || !formData.accountId) {
        throw new Error('Please fill out all required fields');
      }
      
      // Validate coins list
      if (!formData.coins.includes(formData.initialCoin)) {
        throw new Error('Initial coin must be in the coins list');
      }
      
      // Prepare data for API
      const processedData = {
        name: formData.name,
        enabled: formData.enabled,
        coins: formData.coins,
        thresholdPercentage: parseFloat(formData.thresholdPercentage),
        checkInterval: parseInt(formData.checkInterval, 10),
        initialCoin: formData.initialCoin,
        currentCoin: formData.initialCoin, // Set current coin same as initial
        accountId: formData.accountId,
        useTakeProfit: formData.useTakeProfit,
        takeProfitPercentage: formData.useTakeProfit && formData.takeProfitPercentage ? parseFloat(formData.takeProfitPercentage) : undefined,
        preferredStablecoin: formData.preferredStablecoin,
        // Add budget field for backend compatibility
        manualBudgetAmount: parseFloat(formData.budget)
      };
      
      // Call the API to create the bot
      const response = await createBot(processedData);
      
      console.log('Bot created successfully:', response);
      
      setSuccess(true);
      
      // Redirect to dashboard after a short delay
      setTimeout(() => {
        router.push('/');
      }, 2000);

      
      console.log('Form submitted with:', processedData);
      
      // Show success message
      setSuccess(true);
      
      // Reset form after success
      setFormData({
        name: '',
        initialCoin: '',
        coins: '',
        budget: '',
        thresholdPercentage: '5',
        takeProfitPercentage: '',
        checkInterval: '10',
        accountId: '',
        enabled: true,
        useTakeProfit: false,
        preferredStablecoin: 'USDT',
      });
      setSelectedCoins([]);
      
      // Redirect to dashboard after short delay
      setTimeout(() => {
        router.push('/');
      }, 2000);
      
    } catch (err) {
      console.error('Error creating bot:', err);
      
      // More detailed error handling
      if (err instanceof Error) {
        // Handle specific API error messages
        if (err.message.includes('already exists')) {
          setError('A bot with this name already exists. Please choose a different name.');
        } else if (err.message.includes('account')) {
          setError('There was an issue with the selected trading account. Please verify your account settings.');
        } else if (err.message.includes('coin')) {
          setError('There was an issue with your coin selection. Make sure to select valid coins for trading.');
        } else {
          setError(err.message);
        }
      } else {
        setError('Failed to create bot. Please check your connection and try again.');
      }
    } finally {
      setLoading(false);
    }
  };
  {console.log(selectedCoins)}
  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold text-white mb-6">Bot Configuration</h2>
      
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {success && (
        <Alert variant="success" className="mb-4">
          <AlertTitle>Success</AlertTitle>
          <AlertDescription>Bot created successfully! Redirecting to dashboard...</AlertDescription>
        </Alert>
      )}
      
      <form onSubmit={handleSubmit}>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="basic">Basic Settings</TabsTrigger>
            <TabsTrigger value="advanced">Advanced Settings</TabsTrigger>
            <TabsTrigger value="coins">Coin Selection</TabsTrigger>
          </TabsList>
          
          {/* Basic Settings Tab */}
          <TabsContent value="basic" className="space-y-4">
            {/* Bot Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-300">Bot Name</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-600 bg-gray-700 text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>
            
            {/* Account Selection */}
            <div>
              <label htmlFor="accountId" className="block text-sm font-medium text-gray-300">Trading Account</label>
              <select
                id="accountId"
                name="accountId"
                value={formData.accountId}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-600 bg-gray-700 text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              >
                <option value="">Select an account</option>
                {accounts.map(account => (
                  <option key={account.id} value={account.id}>
                    {account.name} ({account.exchange})
                  </option>
                ))}
              </select>
              {accountsLoading && <p className="text-sm text-gray-400 mt-1">Loading accounts...</p>}
              {accountsError && <p className="text-sm text-red-500 mt-1">{accountsError}</p>}
            </div>
            
            {/* Budget */}
            <div>
              <label htmlFor="budget" className="block text-sm font-medium text-gray-300">Budget</label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <input
                  type="number"
                  id="budget"
                  name="budget"
                  value={formData.budget}
                  onChange={handleChange}
                  className="block w-full rounded-md border-gray-600 bg-gray-700 text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  required
                />
              </div>
              <p className="text-sm text-gray-400 mt-1">Total budget for this bot in USDT</p>
            </div>
            
            {/* Initial Coin */}
            <div>
              <label htmlFor="initialCoin" className="block text-sm font-medium text-gray-300">Initial Coin</label>
              <select
                id="initialCoin"
                name="initialCoin"
                value={formData.initialCoin}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-600 bg-gray-700 text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              >
                <option value="">Select initial coin</option>
                
                {coinList.length > 0 && coinList.map(coinData => (
                  <option key={coinData.coin} value={coinData.coin}>
                    {formatCoinWithBalance(coinData)}
                  </option>
                ))}
                {selectedCoins.length === 0 && (
                  <option value="" disabled>Please select coins first</option>
                )}
              </select>
              {selectedCoins.length > 0 && (
                <p className="text-sm text-gray-400 mt-1">The coin the bot will start with</p>
              )}
              {selectedCoins.length === 0 && (
                <p className="text-sm text-gray-400 mt-1">Please go to the Coin Selection tab to select coins first</p>
              )}
            </div>
          </TabsContent>
          
          {/* Advanced Settings Tab */}
          <TabsContent value="advanced" className="space-y-4">
            {/* Threshold Percentage */}
            <div>
              <label htmlFor="thresholdPercentage" className="block text-sm font-medium text-gray-300">
                Threshold Percentage
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <input
                  type="number"
                  id="thresholdPercentage"
                  name="thresholdPercentage"
                  value={formData.thresholdPercentage}
                  onChange={handleChange}
                  className="block w-full rounded-md border-gray-600 bg-gray-700 text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="5"
                  step="0.1"
                  min="0"
                  required
                />
              </div>
              <p className="text-sm text-gray-400 mt-1">
                Minimum price change required before executing a trade
              </p>
            </div>
            
            {/* Preferred Stablecoin */}
            <div>
              <label htmlFor="preferredStablecoin" className="block text-sm font-medium text-gray-300">
                Preferred Stablecoin
              </label>
              <select
                id="preferredStablecoin"
                name="preferredStablecoin"
                value={formData.preferredStablecoin}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-600 bg-gray-700 text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="USDT">USDT (Tether)</option>
                <option value="USDC">USDC (USD Coin)</option>
                <option value="BUSD">BUSD (Binance USD)</option>
                <option value="DAI">DAI</option>
                <option value="TUSD">TUSD (True USD)</option>
              </select>
              <p className="text-sm text-gray-400 mt-1">
                Stablecoin used for valuation and allocation calculations
              </p>
            </div>
            
            {/* Take Profit Toggle */}
            <div className="flex items-center space-x-3 mb-4">
              <Switch 
                id="useTakeProfit" 
                checked={formData.useTakeProfit}
                onCheckedChange={(checked) => {
                  setFormData(prev => ({ ...prev, useTakeProfit: checked }));
                }}
              />
              <label htmlFor="useTakeProfit" className="text-sm font-medium text-gray-300">
                Enable Take Profit
              </label>
            </div>
            
            {/* Take Profit Percentage */}
            <div>
              <label htmlFor="takeProfitPercentage" className="block text-sm font-medium text-gray-300">
                Take Profit Percentage {!formData.useTakeProfit && "(Disabled)"}
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <input
                  type="number"
                  id="takeProfitPercentage"
                  name="takeProfitPercentage"
                  value={formData.takeProfitPercentage}
                  onChange={handleChange}
                  className={`block w-full rounded-md border-gray-600 ${formData.useTakeProfit ? 'bg-gray-700' : 'bg-gray-800'} text-white shadow-sm focus:border-blue-500 focus:ring-blue-500`}
                  placeholder="0"
                  step="0.1"
                  min="0"
                  disabled={!formData.useTakeProfit}
                />
              </div>
              <p className="text-sm text-gray-400 mt-1">
                Percentage of profit at which to automatically sell to stablecoin
              </p>
            </div>
            
            {/* Check Interval */}
            <div>
              <label htmlFor="checkInterval" className="block text-sm font-medium text-gray-300">
                Check Interval (minutes)
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <input
                  type="number"
                  id="checkInterval"
                  name="checkInterval"
                  value={formData.checkInterval}
                  onChange={handleChange}
                  className="block w-full rounded-md border-gray-600 bg-gray-700 text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="10"
                  step="1"
                  min="1"
                  required
                />
              </div>
              <p className="text-sm text-gray-400 mt-1">
                How often the bot should check for trading opportunities
              </p>
            </div>
            
            {/* Enabled Switch */}
            <div className="flex items-center space-x-3">
              <Switch 
                id="enabled" 
                checked={formData.enabled}
                onCheckedChange={handleEnabledChange}
              />
              <label htmlFor="enabled" className="text-sm font-medium text-gray-300">
                Enable bot after creation
              </label>
            </div>
          </TabsContent>
          
          {/* Coins Selection Tab */}
          <TabsContent value="coins" className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Coins to Monitor (minimum 2)
              </label>
              <p className="text-sm text-gray-400 mb-4">
                Select or enter the coins that the bot will trade between. Must include at least one stablecoin.
              </p>
              
              {/* Entry mode toggle */}
              <div className="flex items-center space-x-4 mb-4">
                <div className="flex flex-wrap items-center space-x-2 gap-y-2">
                  <button 
                    type="button"
                    onClick={() => setCoinEntryMode('select')}
                    className={`px-3 py-1 rounded-md text-sm ${coinEntryMode === 'select' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-700 text-gray-300'}`}
                  >
                    Select from Account
                  </button>
                  <button 
                    type="button"
                    onClick={() => setCoinEntryMode('all')}
                    className={`px-3 py-1 rounded-md text-sm ${coinEntryMode === 'all' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-700 text-gray-300'}`}
                  >
                    All Available Coins
                  </button>
                  <button 
                    type="button"
                    onClick={() => setCoinEntryMode('manual')}
                    className={`px-3 py-1 rounded-md text-sm ${coinEntryMode === 'manual' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-700 text-gray-300'}`}
                  >
                    Manual Entry
                  </button>
                </div>
              </div>
              
              {/* Manual entry mode */}
              {coinEntryMode === 'manual' && (
                <div className="mb-4">
                  <input
                    type="text"
                    placeholder="Enter coin symbols separated by commas (BTC, ETH, USDT)"
                    className="w-full px-3 py-2 border rounded-md bg-gray-800 border-gray-700 text-gray-300"
                    value={manualCoins}
                    onChange={(e) => {
                      setManualCoins(e.target.value);
                      // Update selected coins based on manual input
                      const coins = e.target.value
                        .split(',')
                        .map(coin => coin.trim().toUpperCase())
                        .filter(coin => coin !== '');
                      setSelectedCoins(coins);
                    }}
                  />
                </div>
              )}
              
              {/* All available coins mode */}
              {coinEntryMode === 'all' && (
                <div className="mb-4">
                  <div className="mb-2">
                    <input
                      type="text"
                      placeholder="Search coins..."
                      className="w-full px-3 py-2 border rounded-md bg-gray-800 border-gray-700 text-gray-300"
                      onChange={(e) => {
                        const searchTerm = e.target.value.toUpperCase();
                        if (searchTerm === '') {
                          setAllCoins(availableCoinsData.allCoins || []);
                        } else {
                          setAllCoins(
                            (availableCoinsData.allCoins || []).filter(coin =>
                              coin.includes(searchTerm)
                            )
                          );
                        }
                      }}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2 max-h-60 overflow-y-auto">
                    {allCoins.map(coin => (
                      <div 
                        key={coin} 
                        onClick={() => handleCoinSelect(coin)}
                        className={`cursor-pointer p-2 rounded-md flex flex-col items-center justify-center ${
                          selectedCoins.includes(coin) 
                            ? 'bg-blue-600 text-white' 
                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        }`}
                      >
                        <div className="font-medium">{coin}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Selection from account mode */}
              {coinEntryMode === 'select' && (
                <div className="mb-4">
                  {/* Use key prop to force re-render when accountId changes */}
                  <div key={formData.accountId || 'no-account'}>
                    {coinsLoading ? (
                      <div className="flex items-center justify-center h-20">
                        <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
                        <span className="ml-2 text-sm text-gray-400">Loading available coins...</span>
                      </div>
                    ) : coinList.length > 0 ? (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                        {coinList.map(coinData => (
                          <div 
                            key={coinData.coin} 
                            onClick={() => handleCoinSelect(coinData.coin)}
                            className={`cursor-pointer p-3 rounded-md flex flex-col items-center justify-center ${
                              selectedCoins.includes(coinData.coin) 
                                ? 'bg-blue-600 text-white' 
                                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                            }`}
                          >
                            <div className="font-medium">{coinData.coin}</div>
                            <div className="text-xs opacity-80">{coinData.amount.toFixed(8)}</div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-400">
                        {!formData.accountId && 'Select an account to view available coins'}
                        {formData.accountId && 'No coins available for this account'}
                      </p>
                    )}
                  </div>
                </div>
              )}
              
              <div className="mt-4">
                <p className="text-sm font-medium text-gray-300 mb-2">Selected Coins:</p>
                <div className="flex flex-wrap gap-2">
                  {selectedCoins.length > 0 ? (
                    selectedCoins.map(coin => (
                      <Badge key={coin} onClick={() => handleCoinSelect(coin)} className="cursor-pointer">
                        {coin} &times;
                      </Badge>
                    ))
                  ) : (
                    <p className="text-sm text-gray-400">No coins selected</p>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
        
        {/* Submit Button */}
        <div className="pt-6">
          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            disabled={loading || selectedCoins.length < 2}
          >
            {loading ? 'Creating Bot...' : 'Create Bot'}
          </button>
        </div>
      </form>
    </Card>
  );
}
