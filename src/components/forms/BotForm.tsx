"use client";

import React, { useState, useEffect } from 'react';
import { Bot } from '@/types/botTypes';
import { fetchAccounts, fetchAvailableCoins, createBot, updateBot } from '@/utils/api';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Label } from '@/components/ui/Label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { Switch } from '@/components/ui/Switch';
import { Alert, AlertDescription } from '@/components/ui/Alert';
import { Badge } from '@/components/ui/Badge';

interface Account {
  id: string;
  name: string;
  type: string;
}

interface CoinInfo {
  coin?: string;
  currency?: string;
  symbol?: string;
  amount?: number;
  balance?: number;
  amountInUsd?: number;
  usd_value?: number;
  usd?: number;
}

interface BotFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (botData: Partial<Bot>) => void;
  editBot?: Bot | null;
}

const BotForm: React.FC<BotFormProps> = ({ isOpen, onClose, onSubmit, editBot = null }) => {
  const [formData, setFormData] = useState<{
    name: string;
    coins: string;
    threshold_percentage: string;
    check_interval: string;
    account_id: string;
    initial_coin: string;
    price_source: string;
    preferred_stablecoin: string;
    allocation_percentage: string;
    manual_budget_amount: string;
    take_profit_percentage: string;
    commission_rate: string;
    enabled: boolean;
  }>({
    name: '',
    coins: '',
    threshold_percentage: '',
    check_interval: '',
    account_id: '',
    initial_coin: '',
    price_source: 'three_commas',
    preferred_stablecoin: 'USDT',
    allocation_percentage: '',
    manual_budget_amount: '',
    take_profit_percentage: '',
    commission_rate: '0.2',
    enabled: true
  });

  const [selectedCoins, setSelectedCoins] = useState<string[]>([]);
  const [coinSelectionMode, setCoinSelectionMode] = useState<'manual' | '3commas' | 'cached'>('manual');
  const [availableCoins, setAvailableCoins] = useState<CoinInfo[]>([]);

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      loadAccounts();
      if (editBot) {
        // Convert array to comma-separated string if needed
        const coinsList = Array.isArray(editBot.coins) 
          ? editBot.coins 
          : (typeof editBot.coins === 'string' ? editBot.coins.split(',').map(c => c.trim()) : []);
        
        setFormData({
          name: editBot.name,
          coins: Array.isArray(editBot.coins) ? editBot.coins.join(',') : editBot.coins,
          threshold_percentage: editBot.thresholdPercentage?.toString() || '',
          check_interval: editBot.checkInterval?.toString() || '',
          account_id: editBot.accountId || '',
          initial_coin: editBot.initialCoin || '',
          price_source: editBot.priceSource || 'three_commas',
          preferred_stablecoin: editBot.preferredStablecoin || 'USDT',
          allocation_percentage: editBot.allocationPercentage?.toString() || '',
          manual_budget_amount: editBot.manualBudgetAmount?.toString() || '',
          take_profit_percentage: editBot.takeProfitPercentage?.toString() || '',
          commission_rate: editBot.commissionRate?.toString() || '0.2',
          enabled: editBot.enabled ?? true
        });
        
        // Initialize selected coins array
        setSelectedCoins(coinsList);
        
        // Fetch available coins for the selected account
        if (editBot.accountId) {
          loadAvailableCoinsForAccount(editBot.accountId);
        }
      } else {
        // Reset coin selection for new bot
        setSelectedCoins([]);
        setAvailableCoins([]);
      }
    }
  }, [isOpen, editBot]);

  const loadAccounts = async () => {
    try {
      setLoading(true);
      const data = await fetchAccounts();
      setAccounts(Array.isArray(data) ? data : []);
      setError(null);
    } catch (error) {
      console.error('Error fetching accounts:', error);
      setError('Failed to load trading accounts');
      setAccounts([]);
    } finally {
      setLoading(false);
    }
  };
  
  // Function to fetch available coins when account is selected
  const loadAvailableCoinsForAccount = async (accountId: string) => {
    try {
      if (!accountId) return;
      
      setLoading(true);
      console.log('Fetching coins for account:', accountId);
      
      const data = await fetchAvailableCoins(accountId);
      console.log('Fetched coins:', data);
      setAvailableCoins(data || []);
    } catch (error) {
      console.error('Error fetching available coins:', error);
      setAvailableCoins([]);
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const errors: string[] = [];
    
    // Handle case when coins might be an array or string
    const coinsArray = Array.isArray(formData.coins) 
      ? formData.coins 
      : (typeof formData.coins === 'string' ? formData.coins.split(',').map(c => c.trim()) : []);
    
    if (!formData.name.match(/^[a-zA-Z0-9_-]+$/)) {
      errors.push('Bot name can only contain letters, numbers, underscores, and hyphens');
    }
    
    if (!coinsArray.every(coin => coin.match(/^[A-Z0-9]+$/))) {
      errors.push('Coins must be uppercase letters and numbers only');
    }
    
    const threshold = parseFloat(formData.threshold_percentage);
    if (isNaN(threshold) || threshold < 0.1 || threshold > 100) {
      errors.push('Threshold must be between 0.1 and 100');
    }
    
    const checkInterval = parseInt(formData.check_interval);
    if (isNaN(checkInterval) || checkInterval < 1 || checkInterval > 1440) {
      errors.push('Check interval must be between 1 and 1440 minutes');
    }
    
    if (!formData.account_id) {
      errors.push('Trading account is required');
    }
    
    if (formData.initial_coin && !coinsArray.includes(formData.initial_coin)) {
      errors.push('Initial coin must be one of the trading pairs');
    }
    
    return errors;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      setError(validationErrors.join('\n'));
      return;
    }

    // Convert form data to bot data structure
    const processedData: Partial<Bot> = {
      ...(editBot && { id: editBot.id }),
      name: formData.name,
      coins: Array.isArray(formData.coins) 
        ? formData.coins 
        : formData.coins.split(',').map(c => c.trim()),
      thresholdPercentage: parseFloat(formData.threshold_percentage),
      checkInterval: parseInt(formData.check_interval),
      initialCoin: formData.initial_coin,
      accountId: formData.account_id,
      priceSource: formData.price_source,
      preferredStablecoin: formData.preferred_stablecoin,
      allocationPercentage: formData.allocation_percentage ? parseFloat(formData.allocation_percentage) : undefined,
      manualBudgetAmount: formData.manual_budget_amount ? parseFloat(formData.manual_budget_amount) : undefined,
      takeProfitPercentage: formData.take_profit_percentage ? parseFloat(formData.take_profit_percentage) : undefined,
      commissionRate: parseFloat(formData.commission_rate),
      enabled: formData.enabled
    };
    
    onSubmit(processedData);
    
    if (!editBot) {
      // Reset form for new bot creation
      setFormData({
        name: '',
        coins: '',
        threshold_percentage: '',
        check_interval: '',
        account_id: '',
        initial_coin: '',
        price_source: 'three_commas',
        preferred_stablecoin: 'USDT',
        allocation_percentage: '',
        manual_budget_amount: '',
        take_profit_percentage: '',
        commission_rate: '0.2',
        enabled: true
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] bg-gray-800 text-white">
        <DialogHeader>
          <DialogTitle>{editBot ? 'Edit Bot' : 'Create New Bot'}</DialogTitle>
        </DialogHeader>
        
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription className="whitespace-pre-line">{error}</AlertDescription>
          </Alert>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Bot Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="Enter bot name (letters, numbers, underscores, hyphens)"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                disabled={!!editBot}
                required
                className="bg-gray-700 border-gray-600 text-white"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="account">Trading Account</Label>
              <Select
                id="account"
                value={formData.account_id}
                onValueChange={(value) => {
                  setFormData({ ...formData, account_id: value });
                  if (value) {
                    loadAvailableCoinsForAccount(value);
                  } else {
                    setAvailableCoins([]);
                  }
                }}
                placeholder="Select a trading account"
                className="bg-gray-700 border-gray-600 text-white"
                required
              >
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name} ({account.type})
                  </option>
                ))}
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Coins</Label>
              <Tabs defaultValue={coinSelectionMode} onValueChange={(value) => setCoinSelectionMode(value as any)} className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="manual">Manual Entry</TabsTrigger>
                  <TabsTrigger value="3commas">Select from 3Commas</TabsTrigger>
                  <TabsTrigger value="cached">All Available Coins</TabsTrigger>
                </TabsList>
                
                <TabsContent value="manual" className="space-y-2">
                  <Input
                    type="text"
                    placeholder="Comma-separated list of coins (e.g. BTC,ETH,ADA)"
                    value={formData.coins}
                    onChange={(e) => {
                      setFormData({ ...formData, coins: e.target.value });
                      setSelectedCoins(e.target.value.split(',').map(c => c.trim()).filter(c => c));
                    }}
                    required
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                  <p className="text-xs text-gray-400">Enter coin symbols separated by commas</p>
                </TabsContent>
                
                <TabsContent value="3commas" className="space-y-4">
                  {formData.account_id ? (
                    <>
                      {selectedCoins.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-sm font-medium">Selected coins:</p>
                          <div className="flex flex-wrap gap-2">
                            {selectedCoins.map(coin => (
                              <Badge key={coin} variant="outline" className="bg-blue-900 text-white py-1 px-2">
                                {coin}
                                <button 
                                  type="button"
                                  className="ml-1 text-xs hover:text-gray-400"
                                  onClick={() => {
                                    const newSelected = selectedCoins.filter(c => c !== coin);
                                    setSelectedCoins(newSelected);
                                    setFormData({ ...formData, coins: newSelected.join(',') });
                                  }}
                                >
                                  ×
                                </button>
                              </Badge>
                            ))}
                          </div>
                          <p className="text-xs text-gray-400">{selectedCoins.length} coin(s) selected</p>
                        </div>
                      )}
                      
                      {loading ? (
                        <p className="text-sm">Loading available coins...</p>
                      ) : (
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                          <p className="text-sm font-medium">Available coins:</p>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                            {availableCoins.map(coin => {
                              const coinSymbol = coin.coin || coin.currency || coin.symbol || '';
                              const isSelected = selectedCoins.includes(coinSymbol);
                              
                              return (
                                <button
                                  key={coinSymbol}
                                  type="button"
                                  onClick={() => {
                                    if (!isSelected) {
                                      const newSelected = [...selectedCoins, coinSymbol];
                                      setSelectedCoins(newSelected);
                                      setFormData({ ...formData, coins: newSelected.join(',') });
                                    }
                                  }}
                                  className={`p-2 text-sm rounded-md ${
                                    isSelected ? 'bg-blue-800 text-white' : 'bg-gray-700 hover:bg-gray-600'
                                  }`}
                                >
                                  {coinSymbol}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="bg-yellow-900/20 border border-yellow-900 text-yellow-200 p-4 rounded-md">
                      Please select a 3Commas account first to view available coins.
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="cached">
                  <p className="text-sm text-gray-400 mb-2">Select from common coin pairs</p>
                  <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                    {['BTC', 'ETH', 'BNB', 'SOL', 'ADA', 'DOT', 'AVAX', 'MATIC', 'LINK', 'UNI', 'DOGE', 'XRP'].map(coin => (
                      <button
                        key={coin}
                        type="button"
                        onClick={() => {
                          const isSelected = selectedCoins.includes(coin);
                          let newSelected: string[];
                          
                          if (isSelected) {
                            newSelected = selectedCoins.filter(c => c !== coin);
                          } else {
                            newSelected = [...selectedCoins, coin];
                          }
                          
                          setSelectedCoins(newSelected);
                          setFormData({ ...formData, coins: newSelected.join(',') });
                        }}
                        className={`p-2 text-sm rounded-md ${
                          selectedCoins.includes(coin) ? 'bg-blue-800 text-white' : 'bg-gray-700 hover:bg-gray-600'
                        }`}
                      >
                        {coin}
                      </button>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="initial_coin">Initial Coin</Label>
              {formData.account_id && availableCoins.length > 0 ? (
                <Select
                  id="initial_coin"
                  value={formData.initial_coin}
                  onValueChange={(value) => setFormData({ ...formData, initial_coin: value })}
                  placeholder="Select an initial coin"
                  className="bg-gray-700 border-gray-600 text-white"
                >
                  {availableCoins
                    .filter(coin => {
                      const coinSymbol = coin.coin || coin.currency || coin.symbol;
                      const coinAmount = coin.amount || coin.balance || 0;
                      return coinAmount > 0;
                    })
                    .sort((a, b) => {
                      const aUsd = a.amountInUsd || a.usd_value || a.usd || 0;
                      const bUsd = b.amountInUsd || b.usd_value || b.usd || 0;
                      return bUsd - aUsd;
                    })
                    .map(coin => {
                      const coinSymbol = coin.coin || coin.currency || coin.symbol || '';
                      const coinAmount = coin.amount || coin.balance || 0;
                      const coinUsdValue = coin.amountInUsd || coin.usd_value || coin.usd || 0;
                      
                      return (
                        <option key={coinSymbol} value={coinSymbol}>
                          {coinSymbol} - Balance: {Number(coinAmount).toFixed(8)} (${Number(coinUsdValue).toFixed(2)})
                        </option>
                      );
                    })}
                </Select>
              ) : (
                <Input
                  type="text"
                  placeholder="Initial coin (optional)"
                  value={formData.initial_coin}
                  onChange={(e) => setFormData({ ...formData, initial_coin: e.target.value.toUpperCase() })}
                  className="bg-gray-700 border-gray-600 text-white"
                />
              )}
              <p className="text-xs text-gray-400">
                {formData.account_id 
                  ? (loading ? "Loading available coins..." : "Select from available coins with balance") 
                  : "Select an account to see available coins"}
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="threshold">Threshold Percentage</Label>
              <Input
                id="threshold"
                type="number"
                step="0.1"
                min="0.1"
                max="100"
                placeholder="Enter threshold percentage (0.1-100)"
                value={formData.threshold_percentage}
                onChange={(e) => setFormData({ ...formData, threshold_percentage: e.target.value })}
                required
                className="bg-gray-700 border-gray-600 text-white"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="check_interval">Check Interval (minutes)</Label>
              <Input
                id="check_interval"
                type="number"
                min="1"
                max="1440"
                placeholder="Enter check interval (1-1440)"
                value={formData.check_interval}
                onChange={(e) => setFormData({ ...formData, check_interval: e.target.value })}
                required
                className="bg-gray-700 border-gray-600 text-white"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="price_source">Price Source</Label>
              <Select
                id="price_source"
                value={formData.price_source}
                onValueChange={(value) => setFormData({ ...formData, price_source: value })}
                className="bg-gray-700 border-gray-600 text-white"
              >
                <option value="three_commas">Three Commas</option>
                <option value="coingecko">CoinGecko</option>
              </Select>
              <p className="text-xs text-gray-400">Will fall back to alternative source if primary source fails</p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="preferred_stablecoin">Preferred Stablecoin</Label>
              <Select
                id="preferred_stablecoin"
                value={formData.preferred_stablecoin}
                onValueChange={(value) => setFormData({ ...formData, preferred_stablecoin: value })}
                className="bg-gray-700 border-gray-600 text-white"
              >
                <option value="USDT">USDT (Tether)</option>
                <option value="USDC">USDC (USD Coin)</option>
                <option value="BUSD">BUSD (Binance USD)</option>
                <option value="DAI">DAI</option>
                <option value="TUSD">TUSD (True USD)</option>
              </Select>
              <p className="text-xs text-gray-400">Stablecoin used for valuation and allocation calculations</p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="manual_budget_amount">Manual Budget Amount</Label>
              <Input
                id="manual_budget_amount"
                type="number"
                step="0.01"
                min="0"
                placeholder={`Amount in ${formData.preferred_stablecoin}`}
                value={formData.manual_budget_amount}
                onChange={(e) => setFormData({ ...formData, manual_budget_amount: e.target.value })}
                className="bg-gray-700 border-gray-600 text-white"
              />
              <p className="text-xs text-gray-400">Optional: Set a specific budget amount in your preferred stablecoin</p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="take_profit_percentage">Take Profit Percentage (%)</Label>
              <Input
                id="take_profit_percentage"
                type="number"
                step="0.1"
                min="0"
                max="100"
                placeholder="Enter take profit percentage (0-100)"
                value={formData.take_profit_percentage}
                onChange={(e) => setFormData({ ...formData, take_profit_percentage: e.target.value })}
                className="bg-gray-700 border-gray-600 text-white"
              />
              <p className="text-xs text-gray-400">Optional: Set a percentage at which the bot will sell to take profit</p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="commission_rate">Commission Rate (%)</Label>
              <Input
                id="commission_rate"
                type="number"
                step="0.01"
                min="0"
                max="10"
                placeholder="Commission rate percentage (e.g., 0.2 for 0.2%)"
                value={formData.commission_rate}
                onChange={(e) => setFormData({ ...formData, commission_rate: e.target.value })}
                required
                className="bg-gray-700 border-gray-600 text-white"
              />
              <p className="text-xs text-gray-400">Exchange commission rate for trades (typically 0.1% to 0.5%)</p>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="enabled"
                checked={formData.enabled}
                onCheckedChange={(checked) => setFormData({ ...formData, enabled: checked })}
              />
              <Label htmlFor="enabled">Enable bot after creation</Label>
            </div>
          </div>
          
          <DialogFooter className="flex space-x-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              {editBot ? 'Save Changes' : 'Create Bot'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default BotForm;
