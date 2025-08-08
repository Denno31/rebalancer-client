'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/layout/DashboardLayout';
import BotCard from '@/components/bots/BotCard';
import { fetchBots } from '@/utils/api';
import { Bot } from '@/types/botTypes';

export default function AllBotsPage() {
  const [bots, setBots] = useState<Bot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadBots = async () => {
      try {
        setLoading(true);
        const data = await fetchBots();
        setBots(data);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch bots:', err);
        setError('Failed to load bots. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    loadBots();
  }, []);

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">All Bots</h1>
          <Link 
            href="/bots/create" 
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Create New Bot
          </Link>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-300 text-red-800 rounded-md">
            {error}
          </div>
        )}
        
        {/* Loading state */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : bots.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {bots.map((bot) => (
              <BotCard key={bot.id} bot={bot} />
            ))}
          </div>
        ) : (
          <div className="text-center p-8 bg-gray-800 rounded-md">
            <h3 className="text-xl font-medium text-gray-300 mb-2">No bots found</h3>
            <p className="text-gray-400 mb-6">You haven't created any bots yet.</p>
            <Link 
              href="/bots/create" 
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Create Your First Bot
            </Link>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
