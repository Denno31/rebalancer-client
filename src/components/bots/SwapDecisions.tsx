'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { fetchSwapDecisions, SwapDecision } from '@/utils/botApi';

// Using SwapDecision interface from botApi.ts

interface SwapDecisionsProps {
  botId: number | string;
}

const SwapDecisions: React.FC<SwapDecisionsProps> = ({ botId }) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [swaps, setSwaps] = useState<SwapDecision[]>([]);
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [totalCount, setTotalCount] = useState<number>(0);

  useEffect(() => {
    const loadSwapDecisions = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const numericBotId = typeof botId === 'string' ? parseInt(botId, 10) : botId;
        const { data, count } = await fetchSwapDecisions(numericBotId, page, pageSize);
        
        setSwaps(data);
        setTotalCount(count);
      } catch (err: any) {
        console.error('Failed to fetch swap decisions:', err);
        setError('Failed to load swap decisions. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    loadSwapDecisions();
  }, [botId, page, pageSize]);

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <Badge variant="outline" className="bg-green-900/20 text-green-400 border-green-800">Completed</Badge>;
      case 'PENDING':
        return <Badge variant="outline" className="bg-yellow-900/20 text-yellow-400 border-yellow-800">Pending</Badge>;
      case 'FAILED':
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

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
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Swap Decisions</h2>
        <div className="text-sm text-gray-400">
          Showing {(page - 1) * pageSize + 1}-{Math.min(page * pageSize, totalCount)} of {totalCount} swaps
        </div>
      </div>

      {swaps.length === 0 ? (
        <div className="text-center py-10 text-gray-400">
          No swap decisions found for this bot
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="py-3 px-4 text-gray-400 font-medium">Time</th>
                  <th className="py-3 px-4 text-gray-400 font-medium">From</th>
                  <th className="py-3 px-4 text-gray-400 font-medium">To</th>
                  <th className="py-3 px-4 text-gray-400 font-medium">Amount</th>
                  <th className="py-3 px-4 text-gray-400 font-medium">Received</th>
                  <th className="py-3 px-4 text-gray-400 font-medium">Rate</th>
                  <th className="py-3 px-4 text-gray-400 font-medium">Fee</th>
                  <th className="py-3 px-4 text-gray-400 font-medium">Reason</th>
                  <th className="py-3 px-4 text-gray-400 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {swaps.map((swap) => (
                  <tr key={swap.id} className="border-b border-gray-800">
                    <td className="py-3 px-4">{formatTimestamp(swap.timestamp)}</td>
                    <td className="py-3 px-4">{swap.fromCoin}</td>
                    <td className="py-3 px-4">{swap.toCoin}</td>
                    <td className="py-3 px-4">{formatCryptoAmount(swap.fromAmount, swap.fromCoin)}</td>
                    <td className="py-3 px-4">{formatCryptoAmount(swap.toAmount, swap.toCoin)}</td>
                    <td className="py-3 px-4">{formatCurrency(swap.exchangeRate)}</td>
                    <td className="py-3 px-4">{swap.fee ? formatCurrency(swap.fee) : 'N/A'}</td>
                    <td className="py-3 px-4">{swap.reason}</td>
                    <td className="py-3 px-4">
                      {getStatusBadge(swap.status)}
                      {swap.transactionId && (
                        <div className="text-xs text-gray-400 mt-1">
                          TX: {swap.transactionId.substring(0, 6)}...
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex justify-between items-center pt-4">
            <div className="flex space-x-2">
              <select 
                className="bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-sm"
                value={pageSize}
                onChange={(e) => setPageSize(parseInt(e.target.value, 10))}
              >
                {[5, 10, 25, 50].map(size => (
                  <option key={size} value={size}>{size} per page</option>
                ))}
              </select>
            </div>
            
            <div className="flex space-x-2">
              <button
                onClick={() => handlePageChange(page - 1)}
                disabled={page === 1}
                className={`px-3 py-2 rounded-md text-sm ${
                  page === 1 
                    ? 'bg-gray-800 text-gray-500 cursor-not-allowed' 
                    : 'bg-gray-700 text-white hover:bg-gray-600'
                }`}
              >
                Previous
              </button>
              
              {Array.from({ length: Math.min(5, Math.ceil(totalCount / pageSize)) }, (_, i) => {
                const pageNum = i + 1;
                return (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    className={`px-3 py-2 rounded-md text-sm ${
                      pageNum === page 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-700 text-white hover:bg-gray-600'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              
              <button
                onClick={() => handlePageChange(page + 1)}
                disabled={page >= Math.ceil(totalCount / pageSize)}
                className={`px-3 py-2 rounded-md text-sm ${
                  page >= Math.ceil(totalCount / pageSize)
                    ? 'bg-gray-800 text-gray-500 cursor-not-allowed' 
                    : 'bg-gray-700 text-white hover:bg-gray-600'
                }`}
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default SwapDecisions;
