'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { COLORS } from '@/utils/theme';
import {
  fetchSystemConfig,
  updateSystemConfig,
  fetchApiConfigs,
  updateApiConfig,
  downloadDatabaseBackup,
  SystemConfig as SystemConfigType,
  ApiConfigs
} from '@/utils/api';

export default function SystemConfig() {
  // State for configs
  const [systemConfig, setSystemConfig] = useState<SystemConfigType>({
    pricing_source: '3commas',
    fallback_source: 'coingecko',
    update_interval: 1,
    websocket_enabled: true,
    analytics_enabled: true,
    analytics_save_interval: 60
  });

  const [apiConfigs, setApiConfigs] = useState<ApiConfigs>({
    '3commas': {
      api_key: '',
      api_secret: '',
      mode: 'paper'
    }
  });

  // State for UI feedback
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [loading, setLoading] = useState(true);

  // Load configs on mount
  useEffect(() => {
    loadConfigs();
  }, []);

  const loadConfigs = async () => {
    try {
      setLoading(true);
      const [sysConfig, apiConfig] = await Promise.all([
        fetchSystemConfig(),
        fetchApiConfigs()
      ]);
      
      setSystemConfig(sysConfig);
      setApiConfigs(apiConfig || {
        '3commas': {
          api_key: '',
          api_secret: '',
          mode: 'paper'
        }
      });
      setMessage(null);
    } catch (err) {
      console.error('Error loading configurations:', err);
      setMessage({ type: 'error', text: 'Failed to load configurations. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleSystemConfigSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateSystemConfig(systemConfig);
      setMessage({ type: 'success', text: 'System configuration updated successfully' });
    } catch (err) {
      console.error('Error updating system config:', err);
      setMessage({ type: 'error', text: 'Failed to update system configuration' });
    }
  };

  const handleApiConfigSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const config = apiConfigs['3commas'];
      await updateApiConfig('3commas', {
        api_key: config.api_key,
        api_secret: config.api_secret,
        mode: config.mode || 'paper'
      });
      setMessage({ type: 'success', text: 'API configuration updated successfully' });
    } catch (err) {
      console.error('Error updating API config:', err);
      setMessage({ type: 'error', text: 'Failed to update API configuration' });
    }
  };

  const handleBackupDatabase = async () => {
    try {
      const blob = await downloadDatabaseBackup();
      // Create a download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `rebalancer_backup_${new Date().toISOString().split('T')[0]}.db`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      setMessage({ type: 'success', text: 'Database backup downloaded successfully' });
    } catch (err) {
      console.error('Error downloading backup:', err);
      setMessage({ type: 'error', text: 'Failed to download database backup' });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-500"></div>
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">System Configuration</h1>
      
      {message && (
        <div 
          className={`mb-4 p-4 rounded-md ${
            message.type === 'success' ? 'bg-green-700 text-green-50' : 'bg-red-700 text-red-50'
          }`}
        >
          <p>{message.text}</p>
          <button 
            className="text-sm underline mt-1" 
            onClick={() => setMessage(null)}
          >
            Dismiss
          </button>
        </div>
      )}

      <Card className="mb-6 p-6">
        <h2 className="text-xl font-semibold mb-4">System Configuration</h2>
        <form onSubmit={handleSystemConfigSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-1">Primary Price Source</label>
              <select
                value={systemConfig.pricing_source}
                onChange={e => setSystemConfig({ ...systemConfig, pricing_source: e.target.value })}
                className="w-full p-2 bg-[#1E2329] border border-[#2A2E37] rounded-md focus:outline-none focus:border-yellow-500"
              >
                <option value="3commas">3Commas</option>
                <option value="coingecko">CoinGecko</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Fallback Price Source</label>
              <select
                value={systemConfig.fallback_source}
                onChange={e => setSystemConfig({ ...systemConfig, fallback_source: e.target.value })}
                className="w-full p-2 bg-[#1E2329] border border-[#2A2E37] rounded-md focus:outline-none focus:border-yellow-500"
              >
                <option value="coingecko">CoinGecko</option>
                <option value="3commas">3Commas</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-1">Update Interval (minutes)</label>
              <input
                type="number"
                min="1"
                value={systemConfig.update_interval}
                onChange={e => setSystemConfig({ ...systemConfig, update_interval: parseInt(e.target.value) })}
                className="w-full p-2 bg-[#1E2329] border border-[#2A2E37] rounded-md focus:outline-none focus:border-yellow-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Analytics Save Interval (minutes)</label>
              <input
                type="number"
                min="1"
                value={systemConfig.analytics_save_interval}
                onChange={e => setSystemConfig({ ...systemConfig, analytics_save_interval: parseInt(e.target.value) })}
                className="w-full p-2 bg-[#1E2329] border border-[#2A2E37] rounded-md focus:outline-none focus:border-yellow-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="websocket-toggle"
                checked={systemConfig.websocket_enabled}
                onChange={e => setSystemConfig({ ...systemConfig, websocket_enabled: e.target.checked })}
                className="w-5 h-5 mr-2 accent-yellow-500"
              />
              <label htmlFor="websocket-toggle" className="text-sm font-medium">Enable WebSocket Updates</label>
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="analytics-toggle"
                checked={systemConfig.analytics_enabled}
                onChange={e => setSystemConfig({ ...systemConfig, analytics_enabled: e.target.checked })}
                className="w-5 h-5 mr-2 accent-yellow-500"
              />
              <label htmlFor="analytics-toggle" className="text-sm font-medium">Enable Analytics</label>
            </div>
          </div>

          <div className="flex justify-end mt-4">
            <Button 
              type="submit" 
              variant="primary" 
              className="px-6"
            >
              Save System Configuration
            </Button>
          </div>
        </form>
      </Card>

      <Card className="mb-6 p-6">
        <h2 className="text-xl font-semibold mb-4">API Configuration</h2>
        <form onSubmit={handleApiConfigSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-1">3Commas API Key</label>
              <input
                type="password"
                value={apiConfigs['3commas']?.api_key}
                onChange={e => setApiConfigs({
                  ...apiConfigs,
                  '3commas': { ...apiConfigs['3commas'], api_key: e.target.value }
                })}
                className="w-full p-2 bg-[#1E2329] border border-[#2A2E37] rounded-md focus:outline-none focus:border-yellow-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">3Commas API Secret</label>
              <input
                type="password"
                value={apiConfigs['3commas']?.api_secret}
                onChange={e => setApiConfigs({
                  ...apiConfigs,
                  '3commas': { ...apiConfigs['3commas'], api_secret: e.target.value }
                })}
                className="w-full p-2 bg-[#1E2329] border border-[#2A2E37] rounded-md focus:outline-none focus:border-yellow-500"
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Trading Mode</label>
            <select
              value={apiConfigs['3commas']?.mode}
              onChange={e => setApiConfigs({
                ...apiConfigs,
                '3commas': { ...apiConfigs['3commas'], mode: e.target.value }
              })}
              className="w-full p-2 bg-[#1E2329] border border-[#2A2E37] rounded-md focus:outline-none focus:border-yellow-500"
            >
              <option value="paper">Paper Trading</option>
              <option value="real">Real Trading</option>
            </select>
          </div>

          <div className="flex justify-end mt-4">
            <Button 
              type="submit" 
              variant="primary" 
              className="px-6"
            >
              Save API Configuration
            </Button>
          </div>
        </form>
      </Card>

      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Database Management</h2>
        <Button 
          variant="secondary" 
          onClick={handleBackupDatabase}
          className="px-6"
        >
          Download Database Backup
        </Button>
      </Card>
      </div>
    </DashboardLayout>
  );
}
