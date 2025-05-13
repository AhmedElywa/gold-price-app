'use client';

import { useEffect, useState } from 'react';
import Script from 'next/script';
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
          <Script src="/register-sw.js" strategy="lazyOnload" />
        </>
      )}
    </>
  );
} 