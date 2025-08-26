import React, { useState, useEffect, useMemo } from 'react';
import { Trade } from '@/types/tradeTypes';
import { fetchBotTrades, TradeResponse, PaginationInfo } from '@/utils/api';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface TradeHistoryProps {
  botId: number;
  fetchTrades?: (page?: number, limit?: number) => Promise<TradeResponse>;
}

const TradeHistory: React.FC<TradeHistoryProps> = ({ botId, fetchTrades }) => {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('executedAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [rowsPerPage, setRowsPerPage] = useState<number>(10);
  const [totalCount, setTotalCount] = useState<number>(0);

  useEffect(() => {
    const loadTrades = async () => {
      try {
        setLoading(true);
        if (fetchTrades) {
          const response = await fetchTrades(currentPage, rowsPerPage);
          setTrades(response.trades);
          setTotalCount(response.pagination.total);
        } else {
          // Use the built-in fetch function
          const response = await fetchBotTrades(botId, currentPage, rowsPerPage, filterStatus || undefined);
          setTrades(response.trades);
          setTotalCount(response.pagination.total);
        }
        setError(null);
      } catch (err) {
        console.error('Failed to fetch trades:', err);
        setError('Failed to load trade history. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    loadTrades();
  }, [botId, fetchTrades, currentPage, rowsPerPage, filterStatus]);  // Add pagination dependencies

  // Helper functions
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const formatCurrency = (value?: number) => {
    if (value === undefined || value === null) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  const getTradeTypeLabel = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return <span className="px-2 py-1 text-xs rounded-md bg-green-800 text-white">Completed</span>;
      case 'pending':
        return <span className="px-2 py-1 text-xs rounded-md bg-yellow-800 text-white">Pending</span>;
      case 'failed':
        return <span className="px-2 py-1 text-xs rounded-md bg-red-800 text-white">Failed</span>;
      case 'manual':
        return <span className="px-2 py-1 text-xs rounded-md bg-blue-800 text-white">Manual</span>;
      default:
        return <span className="px-2 py-1 text-xs rounded-md bg-gray-700 text-white">{status}</span>;
    }
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

  // Filter trades - only apply client-side filtering for search queries
  // Note: status filtering is handled server-side through the API
  const filteredTrades = useMemo(() => {
    return trades
      .filter((trade) => {
        // Search query filter (search in multiple fields)
        if (searchQuery) {
          const query = searchQuery.toLowerCase();
          return (
            trade.fromCoin.toLowerCase().includes(query) ||
            trade.toCoin.toLowerCase().includes(query) ||
            (trade.status && trade.status.toLowerCase().includes(query))
          );
        }
        return true;
      })
      .sort((a, b) => {
        let valA: any = a[sortBy as keyof Trade];
        let valB: any = b[sortBy as keyof Trade];

        // Handle date sorting
        if (sortBy === 'executedAt') {
          valA = new Date(valA).getTime();
          valB = new Date(valB).getTime();
        }

        // Handle numeric sorting
        if (typeof valA === 'number' && typeof valB === 'number') {
          return sortDirection === 'asc' ? valA - valB : valB - valA;
        }

        // Handle string sorting
        if (typeof valA === 'string' && typeof valB === 'string') {
          return sortDirection === 'asc' ? 
            valA.localeCompare(valB) : 
            valB.localeCompare(valA);
        }

        return 0;
      });
  }, [trades, filterStatus, searchQuery, sortBy, sortDirection]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-40">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        <span className="ml-3 text-sm text-gray-400">Loading trade history...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-900/20 border border-red-800 rounded-md text-red-400">
        {error}
      </div>
    );
  }

  if (trades.length === 0) {
    return (
      <div className="text-center p-8">
        <p className="text-gray-400">No trade history available</p>
        <p className="text-sm text-gray-500 mt-2">This bot hasn&apos;t made any trades yet</p>
      </div>
    );
  }

  // Get unique statuses for filter dropdown
  const statuses = [...new Set(trades.map(trade => trade.status.toLowerCase()))];

  return (
    <div>
      {/* Filters and controls */}
      <div className="flex flex-col md:flex-row justify-between mb-4 gap-4">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
              </svg>
            </div>
            <input 
              type="text" 
              className="pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent" 
              placeholder="Search trades..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          {/* Status filter dropdown */}
          <select
            className="py-2 px-4 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
            value={filterStatus || ''}
            onChange={(e) => setFilterStatus(e.target.value || null)}
          >
            <option value="">All Statuses</option>
            {statuses.map(status => (
              <option key={status} value={status}>{status.charAt(0).toUpperCase() + status.slice(1)}</option>
            ))}
          </select>
        </div>

        {/* Total count */}
        <div className="text-gray-400 text-sm flex items-center">
          Showing {filteredTrades.length} of {trades.length} trades
          {filterStatus && (
            <span className="ml-2 bg-blue-900/30 text-blue-300 px-2 py-1 rounded text-xs">
              Filtered by: {filterStatus}
              <button 
                className="ml-1 text-blue-300 hover:text-white"
                onClick={() => setFilterStatus(null)}
                title="Clear filter"
              >
                ✕
              </button>
            </span>
          )}
        </div>
      </div>

      {/* Data table */}
      <div className="overflow-x-auto rounded-md border border-gray-700">
        <table className="w-full table-auto">
          <thead className="bg-gray-800">
            <tr>
              <th 
                className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-700" 
                onClick={() => handleSortChange('executedAt')}
              >
                <div className="flex items-center">
                  Date
                  {sortBy === 'executedAt' && (
                    <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={sortDirection === 'asc' ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"}></path>
                    </svg>
                  )}
                </div>
              </th>
              <th 
                className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-700"
                onClick={() => handleSortChange('status')}
              >
                <div className="flex items-center">
                  Type
                  {sortBy === 'status' && (
                    <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={sortDirection === 'asc' ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"}></path>
                    </svg>
                  )}
                </div>
              </th>
              <th 
                className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-700"
                onClick={() => handleSortChange('fromCoin')}
              >
                <div className="flex items-center">
                  From Coin
                  {sortBy === 'fromCoin' && (
                    <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={sortDirection === 'asc' ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"}></path>
                    </svg>
                  )}
                </div>
              </th>
              <th 
                className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-700"
                onClick={() => handleSortChange('toCoin')}
              >
                <div className="flex items-center">
                  To Coin
                  {sortBy === 'toCoin' && (
                    <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={sortDirection === 'asc' ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"}></path>
                    </svg>
                  )}
                </div>
              </th>
              <th 
                className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-700"
                onClick={() => handleSortChange('fromAmount')}
              >
                <div className="flex items-center">
                  Amount
                  {sortBy === 'fromAmount' && (
                    <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={sortDirection === 'asc' ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"}></path>
                    </svg>
                  )}
                </div>
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Value
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700 bg-gray-900/50">
            {filteredTrades.length > 0 ? filteredTrades.map((trade) => (
              <tr key={trade.id} className="hover:bg-gray-700/50 transition-colors duration-150">
                <td className="px-4 py-3 text-sm text-gray-200">
                  {formatDate(trade.executedAt)}
                </td>
                <td className="px-4 py-3">
                  {getTradeTypeLabel(trade.status)}
                </td>
                <td className="px-4 py-3 text-sm font-medium text-blue-400">
                  {trade.fromCoin}
                </td>
                <td className="px-4 py-3 text-sm font-medium text-green-400">
                  {trade.toCoin}
                </td>
                <td className="px-4 py-3 text-sm text-gray-200">
                  {trade.fromAmount && trade.fromAmount.toFixed(8)} {trade.fromCoin}
                </td>
                <td className="px-4 py-3 text-sm text-gray-200">
                  {trade.fromAmount && trade.fromPrice ? formatCurrency(trade.fromAmount * trade.fromPrice) : 'N/A'}
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-gray-400">
                  No trades match your filters
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination controls */}
      <div className="flex flex-col sm:flex-row justify-between items-center mt-4 text-sm text-gray-400 gap-4">
        <div className="flex items-center space-x-2">
          <span>Rows per page:</span>
          <select 
            value={rowsPerPage}
            onChange={(e) => {
              setRowsPerPage(Number(e.target.value));
              setCurrentPage(1); // Reset to first page when changing rows per page
            }}
            className="bg-gray-800 border border-gray-700 rounded-md text-white px-2 py-1 text-sm"
          >
            {[5, 10, 25, 50].map(pageSize => (
              <option key={pageSize} value={pageSize}>
                {pageSize}
              </option>
            ))}
          </select>
        </div>
        
        <div>
          Showing {Math.min((currentPage - 1) * rowsPerPage + 1, totalCount)} - {Math.min(currentPage * rowsPerPage, totalCount)} of {totalCount} trades
        </div>
        
        <div className="flex space-x-1">
          <button 
            className="px-3 py-1 bg-gray-800 border border-gray-700 rounded-md hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1 || loading}
          >
            <ChevronLeft size={16} className="mr-1" /> Previous
          </button>
          <button 
            className="px-3 py-1 bg-gray-800 border border-gray-700 rounded-md hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            onClick={() => setCurrentPage(prev => prev + 1)}
            disabled={currentPage * rowsPerPage >= totalCount || loading}
          >
            Next <ChevronRight size={16} className="ml-1" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default TradeHistory;
