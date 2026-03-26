import { fetchAllLeads } from '@/lib/leads-fetcher';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Cron endpoint — called by Vercel Cron daily at 06:00 UTC.
 * It forces a fresh fetch (bypassing cache) and returns the count.
 * Protected by CRON_SECRET env var.
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  const secret = process.env.CRON_SECRET;

  if (secret && authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const leads = await fetchAllLeads();
    console.log(`[cron/leads] Refreshed ${leads.length} leads at ${new Date().toISOString()}`);
    return NextResponse.json({
      ok: true,
      count: leads.length,
      refreshedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[cron/leads] Error:', err);
    return NextResponse.json({ error: 'Cron refresh failed' }, { status: 500 });
  }
}
