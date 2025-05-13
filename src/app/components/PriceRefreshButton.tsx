'use client';

import { useState } from 'react';

interface PriceRefreshButtonProps {
  onRefresh: () => Promise<void>;
}

export default function PriceRefreshButton({ onRefresh }: PriceRefreshButtonProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);

  const handleRefresh = async () => {
    if (isRefreshing) return;
    
    setIsRefreshing(true);
    try {
      await onRefresh();
      setLastRefreshed(new Date());
    } catch (error) {
      console.error('Failed to refresh prices:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="flex flex-col items-center">
      <button
        onClick={handleRefresh}
        disabled={isRefreshing}
        className={`flex items-center justify-center px-4 py-2 rounded-md ${
          isRefreshing 
            ? 'bg-gray-400 cursor-not-allowed' 
            : 'bg-amber-500 hover:bg-amber-600'
        } text-white font-medium transition-colors`}
      >
        {isRefreshing ? (
          <>
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Updating...
          </>
        ) : (
          <>
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
            </svg>
            Refresh Prices
          </>
        )}
      </button>
      {lastRefreshed && (
        <p className="text-xs text-gray-600 mt-1">
          Last refreshed: {lastRefreshed.toLocaleTimeString()}
        </p>
      )}
    </div>
  );
} 