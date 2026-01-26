declare module 'web-push' {
  export interface PushSubscription {
    endpoint: string;
    keys: {
      p256dh: string;
      auth: string;
    };
  }

  export function setVapidDetails(subject: string, publicKey: string, privateKey: string): void;

  export function sendNotification(
    subscription: PushSubscription,
    payload: string | Buffer,
    options?: {
      TTL?: number;
      vapidDetails?: {
        subject: string;
        publicKey: string;
        privateKey: string;
      };
      gcmAPIKey?: string;
      urgency?: 'very-low' | 'low' | 'normal' | 'high';
      topic?: string;
    },
  ): Promise<{
    statusCode: number;
    body: string;
    headers: Record<string, string>;
  }>;

  export class WebPushError extends Error {
    constructor(message: string, statusCode: number, headers: Record<string, string>, body: string);
    statusCode: number;
    headers: Record<string, string>;
    body: string;
  }
}
