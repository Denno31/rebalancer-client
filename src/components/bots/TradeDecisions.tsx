'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { fetchTradeDecisions, TradeDecision } from '@/utils/botApi';

// TradeDecision interface is slightly different than in botApi.ts
// Need to map API response to component's expected structure
interface LocalTradeDecision {
  id: number;
  timestamp: string;
  botId: number;
  coin: string;
  targetCoin: string;
  reason: string;
  priceChange: number;
  deviation: number;
  decision: string; // 'HOLD', 'BUY', 'SELL'
  executed: boolean;
  executedAt?: string;
}

interface TradeDecisionsProps {
  botId: number | string;
}

const TradeDecisions: React.FC<TradeDecisionsProps> = ({ botId }) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [decisions, setDecisions] = useState<LocalTradeDecision[]>([]);
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [totalCount, setTotalCount] = useState<number>(0);

  useEffect(() => {
    const loadTradeDecisions = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const numericBotId = typeof botId === 'string' ? parseInt(botId, 10) : botId;
        const { data, count } = await fetchTradeDecisions(numericBotId, page, pageSize);
        
        // Transform API response to match component's expected structure
        const transformedData: LocalTradeDecision[] = data.map(apiDecision => ({
          id: apiDecision.id,
          timestamp: apiDecision.timestamp,
          botId: apiDecision.botId,
          coin: apiDecision.coin,
          targetCoin: apiDecision.coin, // API might not have targetCoin
          reason: apiDecision.reason,
          priceChange: apiDecision.priceChange,
          deviation: apiDecision.deviation,
          decision: apiDecision.decision,
          executed: apiDecision.executionStatus === 'Executed',
          executedAt: apiDecision.executionStatus === 'Executed' ? apiDecision.timestamp : undefined,
        }));
        
        setDecisions(transformedData);
        setTotalCount(count);
      } catch (err: any) {
        console.error('Failed to fetch trade decisions:', err);
        setError('Failed to load trade decisions. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    loadTradeDecisions();
  }, [botId, page, pageSize]);

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const getDecisionBadge = (decision: string) => {
    switch (decision) {
      case 'BUY':
        return <Badge variant="outline" className="bg-green-900/20 text-green-400 border-green-800">BUY</Badge>;
      case 'SELL':
        return <Badge variant="destructive">SELL</Badge>;
      case 'HOLD':
        return <Badge variant="outline">HOLD</Badge>;
      default:
        return <Badge variant="secondary">{decision}</Badge>;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const formatPercentage = (value?: number) => {
    if (value === undefined || value === null) return 'N/A';
    const prefix = value > 0 ? '+' : '';
    return `${prefix}${value.toFixed(2)}%`;
  };

  const getPercentageClass = (value?: number) => {
    if (value === undefined || value === null) return 'text-gray-400';
    return value > 0 ? 'text-green-400' : value < 0 ? 'text-red-400' : 'text-gray-400';
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
        <h2 className="text-xl font-bold">Trade Decisions</h2>
        <div className="text-sm text-gray-400">
          Showing {(page - 1) * pageSize + 1}-{Math.min(page * pageSize, totalCount)} of {totalCount} decisions
        </div>
      </div>

      {decisions.length === 0 ? (
        <div className="text-center py-10 text-gray-400">
          No trade decisions found for this bot
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
                  <th className="py-3 px-4 text-gray-400 font-medium">Decision</th>
                  <th className="py-3 px-4 text-gray-400 font-medium">Price Change</th>
                  <th className="py-3 px-4 text-gray-400 font-medium">Deviation</th>
                  <th className="py-3 px-4 text-gray-400 font-medium">Reason</th>
                  <th className="py-3 px-4 text-gray-400 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {decisions.map((decision) => (
                  <tr key={decision.id} className="border-b border-gray-800">
                    <td className="py-3 px-4">{formatTimestamp(decision.timestamp)}</td>
                    <td className="py-3 px-4">{decision.coin}</td>
                    <td className="py-3 px-4">{decision.targetCoin}</td>
                    <td className="py-3 px-4">{getDecisionBadge(decision.decision)}</td>
                    <td className={`py-3 px-4 ${getPercentageClass(decision.priceChange)}`}>
                      {formatPercentage(decision.priceChange)}
                    </td>
                    <td className={`py-3 px-4 ${getPercentageClass(decision.deviation)}`}>
                      {formatPercentage(decision.deviation)}
                    </td>
                    <td className="py-3 px-4">{decision.reason}</td>
                    <td className="py-3 px-4">
                      {decision.executed ? (
                        <Badge variant="outline" className="bg-green-900/20 text-green-400 border-green-800">
                          Executed {decision.executedAt ? `at ${formatTimestamp(decision.executedAt)}` : ''}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-yellow-900/20 text-yellow-400 border-yellow-800">
                          Pending
                        </Badge>
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

export default TradeDecisions;
