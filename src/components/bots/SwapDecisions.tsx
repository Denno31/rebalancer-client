'use client';

import React, { useState, useEffect } from 'react';

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
  const [sortBy, setSortBy] = useState<string>('createdAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    const loadSwapDecisions = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const numericBotId = typeof botId === 'string' ? parseInt(botId, 10) : botId;
        const response = await fetchSwapDecisions(numericBotId, page, pageSize);
        
        setSwaps(response.items || []);
        setTotalCount(response.total || 0);
      } catch (err) {
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
  
  // Handle sorting change
  const handleSortChange = (column: string) => {
    if (sortBy === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortDirection('desc'); // Default to descending when changing columns
    }
  };

  const getDeviationBadge = (deviation: number, triggered: boolean) => {
    // Format deviation as percentage with 2 decimal places
    const deviationStr = `${(deviation).toFixed(2)}%`;
    
    if (triggered) {
      return <Badge variant="outline" className="bg-green-900/20 text-green-400 border-green-800">{deviationStr}</Badge>;
    } else if (deviation > 0) {
      return <Badge variant="outline" className="bg-blue-900/20 text-blue-400 border-blue-800">{deviationStr}</Badge>;
    } else {
      return <Badge variant="outline" className="bg-red-900/20 text-red-400 border-red-800">{deviationStr}</Badge>;
    }
  };
  
  const getSwapStatusBadge = (swapPerformed: boolean) => {
    if (swapPerformed) {
      return <Badge variant="outline" className="bg-green-900/20 text-green-400 border-green-800">Swapped</Badge>;
    } else {
      return <Badge variant="outline" className="bg-gray-900/20 text-gray-400 border-gray-800">No Swap</Badge>;
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
          <div className="overflow-x-auto rounded-md border border-gray-700">
            <table className="w-full table-auto">
              <thead className="bg-gray-800">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-700" onClick={() => handleSortChange('id')}>
                    <div className="flex items-center">
                      ID
                      {sortBy === 'id' && (
                        <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={sortDirection === 'asc' ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"}></path>
                        </svg>
                      )}
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-700" onClick={() => handleSortChange('createdAt')}>
                    <div className="flex items-center">
                      Date
                      {sortBy === 'createdAt' && (
                        <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={sortDirection === 'asc' ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"}></path>
                        </svg>
                      )}
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-700" onClick={() => handleSortChange('fromCoin')}>
                    <div className="flex items-center">
                      From
                      {sortBy === 'fromCoin' && (
                        <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={sortDirection === 'asc' ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"}></path>
                        </svg>
                      )}
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-700" onClick={() => handleSortChange('toCoin')}>
                    <div className="flex items-center">
                      To
                      {sortBy === 'toCoin' && (
                        <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={sortDirection === 'asc' ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"}></path>
                        </svg>
                      )}
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-700" onClick={() => handleSortChange('priceDeviationPercent')}>
                    <div className="flex items-center">
                      Price Deviation
                      {sortBy === 'priceDeviationPercent' && (
                        <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={sortDirection === 'asc' ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"}></path>
                        </svg>
                      )}
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Threshold</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Unit Gain %</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Swap Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Reason</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700 bg-gray-900/50">
                {swaps.length > 0 ? swaps.map((swap) => (
                  <tr key={swap.id} className="hover:bg-gray-700/50 transition-colors duration-150">
                    <td className="px-4 py-3 text-sm text-gray-200">{swap.id}</td>
                    <td className="px-4 py-3 text-sm text-gray-200">{formatTimestamp(swap.createdAt)}</td>
                    <td className="px-4 py-3 text-sm font-medium text-blue-400">{swap.fromCoin}</td>
                    <td className="px-4 py-3 text-sm font-medium text-green-400">{swap.toCoin}</td>
                    <td className="px-4 py-3">{getDeviationBadge(swap.priceDeviationPercent, swap.deviationTriggered)}</td>
                    <td className="px-4 py-3 text-sm text-gray-200">{(swap.priceThreshold).toFixed(2)}%</td>
                    <td className="px-4 py-3 text-sm text-gray-200">{(swap.unitGainPercent).toFixed(2)}%</td>
                    <td className="px-4 py-3">{getSwapStatusBadge(swap.swapPerformed)}</td>
                    <td className="px-4 py-3 text-sm text-gray-200">{swap.reason}</td>
                    <td className="px-4 py-3">
                      <div className="text-xs">
                        {swap.tradeId ? (
                          <span className="text-blue-400">Trade ID: {swap.tradeId}</span>
                        ) : (
                          <span className="text-gray-400">No trade performed</span>
                        )}
                      </div>
                      <div className="text-xs mt-1">
                        <span className="text-gray-400">ETH Value: {formatCurrency(swap.ethEquivalentValue)}</span>
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={10} className="px-4 py-6 text-center text-gray-400">
                      No swap decisions match your filters
                    </td>
                  </tr>
                )}
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
              
              {/* Show page numbers, calculate total pages from totalCount */}
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
                disabled={page * pageSize >= totalCount}
                className={`px-3 py-2 rounded-md text-sm ${
                  page * pageSize >= totalCount 
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
