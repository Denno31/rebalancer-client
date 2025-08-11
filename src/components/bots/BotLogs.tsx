'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { fetchBotLogs, LogEntry } from '@/utils/botApi';

// Using LogEntry interface from botApi.ts

interface BotLogsProps {
  botId: number | string;
}

const BotLogs: React.FC<BotLogsProps> = ({ botId }) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [filterLevel, setFilterLevel] = useState<string>('ALL');

  useEffect(() => {
    const loadBotLogs = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const numericBotId = typeof botId === 'string' ? parseInt(botId, 10) : botId;
        const { data, count } = await fetchBotLogs(
          numericBotId, 
          page, 
          pageSize, 
          filterLevel
        );
        console.log(data)
        setLogs(data);
        setTotalCount(count);
      } catch (err: any) {
        console.error('Failed to fetch bot logs:', err);
        setError('Failed to load bot logs. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    loadBotLogs();
  }, [botId, page, pageSize, filterLevel]);

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handleFilterChange = (level: string) => {
    setFilterLevel(level);
    setPage(1); // Reset to first page when filter changes
  };

  const getLevelBadge = (level: string) => {
    switch (level) {
      case 'INFO':
        return <Badge variant="outline" className="bg-blue-900/20 text-blue-400 border-blue-800">INFO</Badge>;
      case 'WARNING':
        return <Badge variant="outline" className="bg-yellow-900/20 text-yellow-400 border-yellow-800">WARNING</Badge>;
      case 'ERROR':
        return <Badge variant="destructive">ERROR</Badge>;
      case 'DEBUG':
        return <Badge variant="outline" className="bg-purple-900/20 text-purple-400 border-purple-800">DEBUG</Badge>;
      default:
        return <Badge variant="secondary">{level}</Badge>;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
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
        <h2 className="text-xl font-bold">Bot Logs</h2>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-400">Filter:</span>
          <select
            className="bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-sm"
            value={filterLevel}
            onChange={(e) => handleFilterChange(e.target.value)}
          >
            <option value="ALL">All Levels</option>
            <option value="INFO">INFO</option>
            <option value="WARNING">WARNING</option>
            <option value="ERROR">ERROR</option>
            <option value="DEBUG">DEBUG</option>
          </select>
        </div>
      </div>

      {logs.length === 0 ? (
        <div className="text-center py-10 text-gray-400">
          No logs found for this bot
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {logs.map((log) => (
              <div key={log.id} className="bg-gray-800 rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div className="flex items-center space-x-2">
                    {getLevelBadge(log.level)}
                    <span className="text-sm text-gray-400">{formatTimestamp(log.timestamp)}</span>
                  </div>
                  <div className="text-xs text-gray-500">ID: {log.id}</div>
                </div>
                <div className="mt-2 font-medium">{log.message}</div>
                
                {log.metadata && (
                  <div className="mt-3 bg-gray-700/30 rounded p-2 text-sm">
                    <div className="font-medium text-gray-400 mb-1">Additional Information:</div>
                    <pre className="text-xs overflow-x-auto">
                      {JSON.stringify(log.metadata, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            ))}
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
            
            <div className="text-sm text-gray-400">
              Showing {(page - 1) * pageSize + 1}-{Math.min(page * pageSize, totalCount)} of {totalCount} logs
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

export default BotLogs;
