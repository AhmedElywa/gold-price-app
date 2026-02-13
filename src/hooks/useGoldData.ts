'use client';

import { useCallback, useEffect, useState } from 'react';
import type { ApiResponseData } from '@/types/api';

type GoldDataState = {
  data: ApiResponseData | null;
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
};

type Subscriber = (nextState: GoldDataState) => void;

const REFRESH_INTERVAL_MS = 60 * 1000;

const initialState: GoldDataState = {
  data: null,
  loading: true,
  error: null,
  lastUpdated: null,
};

let sharedState: GoldDataState = initialState;
let refreshInterval: ReturnType<typeof setInterval> | null = null;
let inFlightRequest: Promise<void> | null = null;
let visibilityHandler: (() => void) | null = null;
const subscribers = new Set<Subscriber>();

function broadcast() {
  for (const subscriber of subscribers) {
    subscriber(sharedState);
  }
}

function setSharedState(partial: Partial<GoldDataState>) {
  sharedState = { ...sharedState, ...partial };
  broadcast();
}

async function fetchSharedData(options: { showLoading?: boolean } = {}) {
  if (inFlightRequest) {
    return inFlightRequest;
  }

  const shouldShowLoading = options.showLoading === true || sharedState.data === null;
  if (shouldShowLoading) {
    setSharedState({ loading: true });
  }

  inFlightRequest = (async () => {
    try {
      setSharedState({ error: null });

      const response = await fetch('/api/gold-prices-egp', {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const apiData: ApiResponseData = await response.json();
      setSharedState({
        data: apiData,
        loading: false,
        error: null,
        lastUpdated: new Date(),
      });
    } catch (err) {
      console.error('Error fetching gold data:', err);
      setSharedState({
        loading: false,
        error: err instanceof Error ? err.message : 'Failed to fetch data',
      });
    } finally {
      inFlightRequest = null;
    }
  })();

  return inFlightRequest;
}

function ensureRefreshLoop() {
  if (refreshInterval) {
    return;
  }

  void fetchSharedData({ showLoading: sharedState.data === null });
  refreshInterval = setInterval(() => {
    void fetchSharedData();
  }, REFRESH_INTERVAL_MS);

  // Visibility-aware polling: pause when tab is hidden, resume when visible
  if (!visibilityHandler && typeof document !== 'undefined') {
    visibilityHandler = () => {
      if (subscribers.size === 0) {
        return;
      }

      if (document.hidden) {
        if (refreshInterval) {
          clearInterval(refreshInterval);
          refreshInterval = null;
        }
      } else {
        void fetchSharedData(); // immediate fetch on return
        if (!refreshInterval) {
          refreshInterval = setInterval(() => {
            void fetchSharedData();
          }, REFRESH_INTERVAL_MS);
        }
      }
    };
    document.addEventListener('visibilitychange', visibilityHandler);
  }
}

function subscribe(listener: Subscriber) {
  subscribers.add(listener);
  listener(sharedState);
  ensureRefreshLoop();

  return () => {
    subscribers.delete(listener);

    if (subscribers.size === 0) {
      if (refreshInterval) {
        clearInterval(refreshInterval);
        refreshInterval = null;
      }
      if (visibilityHandler) {
        document.removeEventListener('visibilitychange', visibilityHandler);
        visibilityHandler = null;
      }
    }
  };
}

export function useGoldData(initialData?: ApiResponseData | null) {
  // Seed shared state from server-fetched data on first render
  if (initialData && sharedState.data === null) {
    sharedState.data = initialData;
    sharedState.loading = false;
  }

  const [state, setState] = useState<GoldDataState>(sharedState);

  useEffect(() => {
    return subscribe(setState);
  }, []);

  const refresh = useCallback(() => {
    return fetchSharedData({ showLoading: true });
  }, []);

  return {
    data: state.data,
    loading: state.loading,
    error: state.error,
    lastUpdated: state.lastUpdated,
    refresh,
  };
}
