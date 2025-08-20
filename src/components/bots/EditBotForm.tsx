import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '../ui/Card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { fetchAccounts, fetchAvailableCoins, getBot, updateBot } from '@/utils/api';
import { Badge } from '@/components/ui/Badge';
import availableCoinsData from '@/data/availableCoins.json';

// Types
import { Bot } from '@/types/botTypes';

// Types for account and coin data
interface ThreeCommasAccount {
  id: string;
  name: string;
  exchange: string;
}

type CoinData = {
  coin: string;
  amount: number;
};

interface FormData {
  name: string;
  budget: string;
  thresholdPercentage: string;
  takeProfitPercentage: string;
  checkInterval: string;
  accountId: string;
  enabled: boolean;
  initialCoin: string;
  priceSource: string;
  preferredStablecoin: string;
  useTakeProfit: boolean;
}

interface EditBotFormProps {
  botId: number;
  onSubmit?: (data: Bot) => void;
}

const EditBotForm: React.FC<EditBotFormProps> = ({ botId, onSubmit }) => {
  // State for form data
  const [formData, setFormData] = useState<FormData>({
    name: '',
    budget: '',
    thresholdPercentage: '',
    takeProfitPercentage: '',
    checkInterval: '',
    accountId: '',
    enabled: true,
    initialCoin: '',
    priceSource: 'binance',
    preferredStablecoin: 'USDT',
    useTakeProfit: false
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
  const [coinList, setCoinList] = useState<CoinData[]>([]);
  const [coinsLoading, setCoinsLoading] = useState(false);
  const [selectedCoins, setSelectedCoins] = useState<string[]>([]);
  const [manualCoins, setManualCoins] = useState<string>('');
  const [allCoins, setAllCoins] = useState<string[]>(availableCoinsData.allCoins || []);
  
  const router = useRouter();

  // Fetch bot data on component mount
  useEffect(() => {
    const fetchBotData = async () => {
      setLoading(true);
      try {
        const bot = await getBot(botId);
        
        // Parse coins string to array
        const coinsArray = Array.isArray(bot.coins) ? bot.coins : 
          typeof bot.coins === 'string' ? bot.coins.split(',').map(coin => coin.trim()) : 
          [];

        setFormData({
          name: bot.name || '',
          budget: bot.manualBudgetAmount?.toString() || '',
          thresholdPercentage: bot.thresholdPercentage?.toString() || '',
          takeProfitPercentage: bot.takeProfitPercentage?.toString() || '',
          checkInterval: bot.checkInterval?.toString() || '',
          accountId: bot.accountId || '',
          enabled: bot.enabled !== false,
          initialCoin: bot.initialCoin || '',
          priceSource: bot.priceSource || 'binance',
          preferredStablecoin: bot.preferredStablecoin || 'USDT',
          useTakeProfit: bot.useTakeProfit === true
        });

        // Set selected coins
        setSelectedCoins(coinsArray);
        if (coinsArray.length > 0) {
          setManualCoins(coinsArray.join(', '));
        }
      } catch (err) {
        console.error('Failed to fetch bot:', err);
        setError('Failed to fetch bot data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchBotData();
  }, [botId]);

  // Fetch accounts on component mount
  useEffect(() => {
    const getAccounts = async () => {
      setAccountsLoading(true);
      try {
        const data = await fetchAccounts();
        setAccounts(data);
      } catch (err) {
        console.error('Failed to fetch accounts:', err);
        setAccountsError('Failed to fetch accounts. Please try again.');
      } finally {
        setAccountsLoading(false);
      }
    };

    getAccounts();
  }, []);

  // Fetch coins when account changes
  useEffect(() => {
    const fetchCoins = async () => {
      if (!formData.accountId) {
        setCoinList([]);
        return;
      }

      setCoinsLoading(true);
      try {
        const coins = await fetchAvailableCoins(formData.accountId);
        setCoinList(coins);
      } catch (err) {
        console.error('Failed to fetch coins:', err);
      } finally {
        setCoinsLoading(false);
      }
    };

    fetchCoins();
  }, [formData.accountId]);

  // Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handle checkbox changes
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: checked }));
  };

  // Handle coin selection
  const handleCoinSelect = (coin: string) => {
    setSelectedCoins(prev => {
      if (prev.includes(coin)) {
        return prev.filter(c => c !== coin);
      } else {
        return [...prev, coin];
      }
    });
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedCoins.length < 2) {
      setError('Please select at least 2 coins');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      // Prepare data for API
      const processedData: Partial<Bot> = {
        ...formData,
        coins: selectedCoins,
        thresholdPercentage: parseFloat(formData.thresholdPercentage) || 5,
        checkInterval: parseInt(formData.checkInterval) || 10,
        manualBudgetAmount: formData.budget ? parseFloat(formData.budget) : undefined,
        useTakeProfit: formData.useTakeProfit,
        takeProfitPercentage: formData.useTakeProfit && formData.takeProfitPercentage ? 
          parseFloat(formData.takeProfitPercentage) : 
          undefined
      };
      
      // Call API
      await updateBot(botId, processedData);
      
      setSuccess(true);
      
      // Call onSubmit callback if provided
      if (onSubmit && 'id' in processedData) {
        // Only call onSubmit if we have a proper Bot object with id
        onSubmit(processedData as Bot);
      }
      
      // Redirect to dashboard after success
      setTimeout(() => {
        router.push('/');
      }, 2000);
      
    } catch (err) {
      console.error('Form submission error:', err);
      setError('Failed to update the bot. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto p-6">
      {/* Success message */}
      {success && (
        <div className="mb-4 p-3 bg-green-100 border border-green-300 text-green-800 rounded-md">
          Bot updated successfully! Redirecting to dashboard...
        </div>
      )}
      
      {/* Error message */}
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-800 rounded-md">
          {error}
        </div>
      )}
      
      <h1 className="text-2xl font-bold mb-6">Edit Bot</h1>
      
      <form onSubmit={handleSubmit}>
        <Tabs 
          defaultValue="basic" 
          className="w-full" 
          value={activeTab}
          onValueChange={setActiveTab}
        >
          <TabsList className="grid grid-cols-3 mb-6">
            <TabsTrigger value="basic">Basic Settings</TabsTrigger>
            <TabsTrigger value="advanced">Advanced Settings</TabsTrigger>
            <TabsTrigger value="coins">Coins</TabsTrigger>
          </TabsList>
          
          {/* Basic Settings Tab */}
          <TabsContent value="basic" className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2" htmlFor="name">
                Bot Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full p-2 rounded-md border border-gray-600 bg-gray-700 text-white"
                required
              />
            </div>
            

            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2" htmlFor="accountId">
                Trading Account
              </label>
              <select
                id="accountId"
                name="accountId"
                value={formData.accountId}
                onChange={handleChange}
                className="w-full p-2 rounded-md border border-gray-600 bg-gray-700 text-white"
                required
                disabled={accountsLoading}
              >
                <option value="">Select an account</option>
                {accounts.map(account => (
                  <option key={account.id} value={account.id}>
                    {account.name} ({account.exchange})
                  </option>
                ))}
              </select>
              {accountsLoading && (
                <span className="text-xs text-gray-400">Loading accounts...</span>
              )}
              {accountsError && (
                <span className="text-xs text-red-400">{accountsError}</span>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2" htmlFor="budget">
                Budget Amount (USDT)
              </label>
              <input
                type="number"
                id="budget"
                name="budget"
                value={formData.budget}
                onChange={handleChange}
                step="0.01"
                min="0"
                className="w-full p-2 rounded-md border border-gray-600 bg-gray-700 text-white"
              />
            </div>
          </TabsContent>
          
          {/* Advanced Settings Tab */}
          <TabsContent value="advanced" className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2" htmlFor="thresholdPercentage">
                Threshold Percentage
              </label>
              <input
                type="number"
                id="thresholdPercentage"
                name="thresholdPercentage"
                value={formData.thresholdPercentage}
                onChange={handleChange}
                step="0.1"
                min="0.1"
                className="w-full p-2 rounded-md border border-gray-600 bg-gray-700 text-white"
              />
              <p className="text-xs text-gray-400 mt-1">
                Minimum price movement percentage required before trading
              </p>
            </div>
            
            {/* Take Profit Toggle */}
            <div className="flex items-center mb-4">
              <input
                type="checkbox"
                id="useTakeProfit"
                name="useTakeProfit"
                checked={formData.useTakeProfit}
                onChange={handleCheckboxChange}
                className="mr-2"
              />
              <label htmlFor="useTakeProfit" className="text-sm font-medium text-gray-300">
                Enable Take Profit
              </label>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2" htmlFor="takeProfitPercentage">
                Take Profit Percentage {!formData.useTakeProfit && "(Disabled)"}
              </label>
              <input
                type="number"
                id="takeProfitPercentage"
                name="takeProfitPercentage"
                value={formData.takeProfitPercentage}
                onChange={handleChange}
                step="0.1"
                min="0"
                disabled={!formData.useTakeProfit}
                className={`w-full p-2 rounded-md border border-gray-600 ${formData.useTakeProfit ? 'bg-gray-700' : 'bg-gray-800'} text-white`}
              />
              <p className="text-xs text-gray-400 mt-1">
                Percentage gain at which to take profit
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2" htmlFor="checkInterval">
                Check Interval (minutes)
              </label>
              <input
                type="number"
                id="checkInterval"
                name="checkInterval"
                value={formData.checkInterval}
                onChange={handleChange}
                min="1"
                className="w-full p-2 rounded-md border border-gray-600 bg-gray-700 text-white"
              />
              <p className="text-xs text-gray-400 mt-1">
                How often the bot checks for price movements
              </p>
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="enabled"
                name="enabled"
                checked={formData.enabled}
                onChange={handleCheckboxChange}
                className="mr-2"
              />
              <label htmlFor="enabled" className="text-sm font-medium text-gray-300">
                Enable bot
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
                <div className="flex flex-wrap items-center gap-2">
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
              
              {/* Manual entry */}
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
                        const availableCoins = availableCoinsData.allCoins || [];
                        setAllCoins(
                          searchTerm === '' ? 
                            availableCoins : 
                            availableCoins.filter(coin => coin.includes(searchTerm))
                        );
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
            {loading ? 'Updating Bot...' : 'Update Bot'}
          </button>
        </div>
      </form>
    </Card>
  );
};

export default EditBotForm;
