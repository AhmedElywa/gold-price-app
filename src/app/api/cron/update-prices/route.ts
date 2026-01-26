import { NextResponse } from 'next/server';

/**
 * This endpoint is meant to be called by a CRON service every 30 minutes
 * to trigger a price update and send notifications if needed.
 *
 * You can set up a free cron service like Upstash or use Vercel Cron (for paid plans)
 * to hit this endpoint regularly.
 */
export async function GET(request: Request) {
  // Only allow specified sources to trigger this endpoint
  // Add your cron service's IP or authentication method here for production
  const isAuthorized = true; // Replace with actual authentication logic in production

  if (!isAuthorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Trigger the gold price API endpoint to update prices and send notifications if needed
    const response = await fetch(new URL('/api/gold-prices-egp', request.url), {
      cache: 'no-store', // Force fresh data
    });

    if (!response.ok) {
      throw new Error(`Gold price update failed: ${response.status}`);
    }

    const data = await response.json();

    return NextResponse.json({
      success: true,
      message: 'Gold price update triggered',
      timestamp: new Date().toISOString(),
      currentPrice: data.source_data.market_data.current_price,
    });
  } catch (error) {
    console.error('Scheduled price update failed:', error);
    return NextResponse.json({ error: 'Failed to update gold prices', details: String(error) }, { status: 500 });
  }
}
