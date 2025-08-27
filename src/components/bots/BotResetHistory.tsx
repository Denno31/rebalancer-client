'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { Spinner } from '../ui/Spinner';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { API_URL } from '@/utils/config';
import { getAuthHeader } from '@/utils/api';

// Interface for bot reset event data
interface BotResetEvent {
  id: number;
  botId: number;
  resetType: string;
  previousCoin: string;
  previousGlobalPeak: number | null;
  timestamp: string;
  createdAt: string;
  updatedAt: string;
}

// Interface for pagination metadata
interface PaginationInfo {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

interface BotResetHistoryProps {
  botId: number | string;
}

const BotResetHistory: React.FC<BotResetHistoryProps> = ({ botId }) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [resetEvents, setResetEvents] = useState<BotResetEvent[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    total: 0,
    page: 1,
    limit: 10,
    pages: 0
  });
  const [sortColumn, setSortColumn] = useState<string>('timestamp');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Fetch reset events data with pagination
  const fetchResetEvents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const url = new URL(`${API_URL}/api/bots/${botId}/reset-events`, window.location.origin);
      url.searchParams.append('page', String(pagination.page));
      url.searchParams.append('limit', String(pagination.limit));
      
      const response = await fetch(url,{
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              ...getAuthHeader()
            }
          });
      const data = await response.json();
      
      if (data) {
        setResetEvents(data.resetEvents || []);
        setPagination(data.pagination || {
          total: 0,
          page: 1,
          limit: 10,
          pages: 0
        });
      } else {
        setResetEvents([]);
        setError('No data received from server');
      }
    } catch (err: any) {
      console.error('Failed to fetch reset events:', err);
      setError(`Failed to load reset events: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [botId, pagination.page, pagination.limit]);

  useEffect(() => {
    fetchResetEvents();
  }, [fetchResetEvents]);

  const handleSortChange = useCallback((column: string) => {
    setSortColumn(prev => {
      if (prev === column) {
        setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
        return column;
      }
      setSortDirection('asc');
      return column;
    });
  }, []);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.pages) {
      setPagination(prev => ({
        ...prev,
        page: newPage
      }));
    }
  };

  const handleLimitChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setPagination(prev => ({
      ...prev,
      limit: parseInt(e.target.value, 10),
      page: 1 // Reset to first page when changing limit
    }));
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatCurrency = (value: number | null) => {
    if (value === null || value === undefined) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 6,
    }).format(value);
  };

  // Get reset type badge color
  const getResetTypeBadge = (resetType: string) => {
    switch (resetType.toLowerCase()) {
      case 'manual':
        return <Badge className="bg-blue-500 text-white">Manual</Badge>;
      case 'automatic':
        return <Badge className="bg-green-500 text-white">Automatic</Badge>;
      case 'take_profit':
        return <Badge className="bg-purple-500 text-white">Take Profit</Badge>;
      case 'sell_to_stablecoin':
        return <Badge className="bg-yellow-500 text-black">Sell to Stablecoin</Badge>;
      default:
        return <Badge className="bg-gray-500">{resetType}</Badge>;
    }
  };

  // Sort the reset events based on the current sort column and direction
  const sortedResetEvents = [...resetEvents].sort((a, b) => {
    const aValue = a[sortColumn as keyof BotResetEvent];
    const bValue = b[sortColumn as keyof BotResetEvent];
    
    if (!aValue && !bValue) return 0;
    if (!aValue) return 1;
    if (!bValue) return -1;
    
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortDirection === 'asc' 
        ? aValue.localeCompare(bValue) 
        : bValue.localeCompare(aValue);
    } else {
      return sortDirection === 'asc' 
        ? (aValue < bValue ? -1 : 1) 
        : (bValue < aValue ? -1 : 1);
    }
  });

  if (loading && resetEvents.length === 0) {
    return (
      <div className="flex justify-center items-center h-48">
        <Spinner size="lg" />
        <span className="ml-3 text-gray-400">Loading reset events...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
        <h2 className="text-xl font-bold">Bot Reset History</h2>
      </div>

      {error && (
        <div className="bg-red-900/20 border border-red-800 text-red-300 p-4 rounded-md mb-6">
          <p>{error}</p>
        </div>
      )}

      {resetEvents.length === 0 && !loading ? (
        <div className="text-center py-10 text-gray-400">
          No reset events found for this bot
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full table-auto">
              <thead className="bg-gray-800">
                <tr>
                  <th 
                    className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-700"
                    onClick={() => handleSortChange('timestamp')}
                  >
                    <div className="flex items-center">
                      <span>Time</span>
                      {sortColumn === 'timestamp' && (
                        <span className="ml-1">
                          {sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </span>
                      )}
                    </div>
                  </th>
                  <th 
                    className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-700"
                    onClick={() => handleSortChange('resetType')}
                  >
                    <div className="flex items-center">
                      <span>Reset Type</span>
                      {sortColumn === 'resetType' && (
                        <span className="ml-1">
                          {sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </span>
                      )}
                    </div>
                  </th>
                  <th 
                    className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-700"
                    onClick={() => handleSortChange('previousCoin')}
                  >
                    <div className="flex items-center">
                      <span>Previous Coin</span>
                      {sortColumn === 'previousCoin' && (
                        <span className="ml-1">
                          {sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </span>
                      )}
                    </div>
                  </th>
                  <th 
                    className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-700"
                    onClick={() => handleSortChange('previousGlobalPeak')}
                  >
                    <div className="flex items-center">
                      <span>Previous Global Peak</span>
                      {sortColumn === 'previousGlobalPeak' && (
                        <span className="ml-1">
                          {sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </span>
                      )}
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-gray-900 divide-y divide-gray-800">
                {sortedResetEvents.map((event) => (
                  <tr key={event.id} className="hover:bg-gray-800/50 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap">{formatTimestamp(event.timestamp)}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{getResetTypeBadge(event.resetType)}</td>
                    <td className="px-4 py-3 whitespace-nowrap font-medium">{event.previousCoin}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{formatCurrency(event.previousGlobalPeak)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Pagination Controls */}
          <div className="mt-4 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-400">Rows per page:</span>
              <select
                value={pagination.limit}
                onChange={handleLimitChange}
                className="bg-gray-800 border border-gray-700 rounded-md px-2 py-1 text-sm"
              >
                {[5, 10, 25, 50].map(limit => (
                  <option key={limit} value={limit}>{limit}</option>
                ))}
              </select>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-400">
                {pagination.total === 0 ? '0' : `${(pagination.page - 1) * pagination.limit + 1}-${Math.min(pagination.page * pagination.limit, pagination.total)}`} of {pagination.total}
              </span>
              
              <div className="flex items-center">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page <= 1}
                  onClick={() => handlePageChange(1)}
                  className="h-8 w-8 p-0 flex items-center justify-center"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <ChevronLeft className="h-4 w-4 -ml-2" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page <= 1}
                  onClick={() => handlePageChange(pagination.page - 1)}
                  className="h-8 w-8 p-0 flex items-center justify-center"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                
                <div className="px-2">
                  <span className="text-sm">Page {pagination.page} of {pagination.pages || 1}</span>
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page >= pagination.pages}
                  onClick={() => handlePageChange(pagination.page + 1)}
                  className="h-8 w-8 p-0 flex items-center justify-center"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page >= pagination.pages}
                  onClick={() => handlePageChange(pagination.pages)}
                  className="h-8 w-8 p-0 flex items-center justify-center"
                >
                  <ChevronRight className="h-4 w-4" />
                  <ChevronRight className="h-4 w-4 -ml-2" />
                </Button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default BotResetHistory;
