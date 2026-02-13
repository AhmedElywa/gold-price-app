'use client';

import { useSearchParams } from 'next/navigation';

export function useSelectedCurrency(defaultCurrency = 'EGP'): string {
  const searchParams = useSearchParams();
  return searchParams.get('currency')?.toUpperCase() || defaultCurrency;
}
