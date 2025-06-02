"use client";

import { useState, useEffect } from "react";
import {
  ServiceWorkerRegistration,
  PushNotificationManager,
  InstallPrompt,
} from "./PwaComponents";
import { TestNotification } from "./TestNotification";

export default function PwaClientWrapper() {
  // Use state to track when component is mounted (client-side only)
  const [isMounted, setIsMounted] = useState(false);
  // This will only be set after component mounts on client
  const [isDevelopment, setIsDevelopment] = useState(false);

  useEffect(() => {
    // Now we're safely on the client
    setIsMounted(true);
    setIsDevelopment(process.env.TEST_NOTIFICATIONS === "true");
  }, []);

  // Don't render anything during SSR or initial client render
  // This prevents hydration mismatch
  if (!isMounted) {
    return null;
  }

  return (
    <>
      <ServiceWorkerRegistration />
      <PushNotificationManager />
      <InstallPrompt />
      {isDevelopment && <TestNotification />}
    </>
  );
}
