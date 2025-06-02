"use client";

import { useState, useEffect } from "react";
import { sendNotification } from "../actions";

export function TestNotification() {
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<{
    success?: boolean;
    message?: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  async function handleSendNotification() {
    if (!message.trim()) {
      setStatus({ success: false, message: "Please enter a message" });
      return;
    }

    setLoading(true);
    setStatus(null);

    try {
      const result = await sendNotification(message);
      setStatus(result);
    } catch (error) {
      console.error("Error sending notification:", error);
      setStatus({
        success: false,
        message:
          error instanceof Error ? error.message : "Unknown error occurred",
      });
    } finally {
      setLoading(false);
    }
  }

  // Don't render during SSR
  if (!isMounted) {
    return null;
  }

  return (
    <div className="fixed top-4 min-w-80 end-4 z-50 bg-white bg-opacity-90 shadow-lg rounded-lg p-4 border border-gray-200 max-w-xs">
      <h3 className="font-bold text-gray-800 mb-2">Test Push Notification</h3>
      <div className="mb-3">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Enter notification message"
          className="w-full text-gray-700 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
        />
      </div>
      <button
        onClick={handleSendNotification}
        disabled={loading}
        className={`w-full py-2 rounded-md ${
          loading
            ? "bg-gray-400 cursor-not-allowed"
            : "bg-yellow-500 hover:bg-yellow-600"
        } text-white font-medium`}
      >
        {loading ? "Sending..." : "Send Notification"}
      </button>

      {status && (
        <div
          className={`mt-3 p-2 rounded-md text-sm ${
            status.success
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {status.message}
        </div>
      )}
    </div>
  );
}
