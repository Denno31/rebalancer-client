'use client';

import React, { useState } from 'react';
import { resetBot } from '@/utils/botApi';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import Modal from '../ui/Modal';
import { Select } from '@/components/ui/Select';

interface ResetBotModalProps {
  show: boolean;
  onHide: () => void;
  bot: {
    id: number;
    name: string;
    preferredStablecoin?: string;
  };
  onSuccess: () => void;
}

const ResetBotModal: React.FC<ResetBotModalProps> = ({ 
  show, 
  onHide, 
  bot, 
  onSuccess 
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetType, setResetType] = useState<'soft' | 'hard'>('soft');
  const [sellToStablecoin, setSellToStablecoin] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await resetBot(bot.id, { resetType, sellToStablecoin });
      onSuccess();
      onHide();
    } catch (err: any) {
      console.error('Error resetting bot:', err);
      setError(err.message || 'Failed to reset bot. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={show}
      onClose={loading ? undefined : onHide}
      title={
        <div className="flex items-center text-xl font-semibold text-white">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
          </svg>
          Reset Bot
        </div>
      }
    >
      <div className="space-y-4">
        {error && (
          <div className="p-4 bg-red-500/20 border border-red-500 rounded-md text-red-100">
            {error}
          </div>
        )}
        
        <div className="p-4 bg-amber-500/20 border border-amber-500 rounded-md text-amber-100 flex">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          <div>
            <strong>Warning:</strong> Resetting a bot will clear its current state, including global peak values and protection settings. 
            This action cannot be undone.
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Reset Type
            </label>
            <select 
              value={resetType} 
              onChange={(e) => setResetType(e.target.value as 'soft' | 'hard')}
              disabled={loading}
              className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
            >
              <option value="soft">Soft Reset (Keep current coin)</option>
              <option value="hard">Hard Reset (Return to initial coin)</option>
            </select>
            <p className="mt-1 text-sm text-gray-400">
              A soft reset maintains the current coin but resets state values. 
              A hard reset returns to the initial coin configuration.
            </p>
          </div>

          <div className="flex items-start">
            <input 
              type="checkbox"
              id="sell-to-stablecoin"
              checked={sellToStablecoin}
              onChange={(e) => setSellToStablecoin(e.target.checked)}
              disabled={loading}
              className="mt-1 h-4 w-4 border-gray-600 rounded bg-gray-700 focus:ring-yellow-500 text-yellow-500"
            />
            <label htmlFor="sell-to-stablecoin" className="ml-2 block text-sm">
              <span className="text-white">
                Sell all assets to {bot.preferredStablecoin || 'USDT'} before reset
              </span>
              <p className="mt-1 text-sm text-gray-400">
                This will execute a market sell of all current assets to your preferred stablecoin.
              </p>
            </label>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              variant="secondary"
              onClick={onHide}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="danger"
              disabled={loading}
              className="flex items-center"
            >
              {loading && (
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              Reset Bot
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default ResetBotModal;
