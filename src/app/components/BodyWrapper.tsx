'use client';

import { useEffect, useState } from 'react';
import { Toaster } from '@/components/ui/toaster';
import PwaClientWrapper from './PwaClientWrapper';

interface BodyWrapperProps {
  children: React.ReactNode;
}

export default function BodyWrapper({ children }: BodyWrapperProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // During SSR, render the children as-is
  // After hydration, render the fully interactive version
  return (
    <>
      {children}
      {isMounted && (
        <>
          <PwaClientWrapper />
          {/* ServiceWorkerRegistration component already handles SW registration. */}
          <Toaster />
        </>
      )}
    </>
  );
}
