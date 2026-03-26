import { fetchAllLeads } from '@/lib/leads-fetcher';
import { NextResponse } from 'next/server';

// Cache this route for 24 hours at the Next.js layer
export const revalidate = 86400;

export async function GET() {
  try {
    const leads = await fetchAllLeads();
    return NextResponse.json(
      { leads, fetchedAt: new Date().toISOString(), count: leads.length },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=3600',
        },
      }
    );
  } catch (err) {
    console.error('Leads fetch error:', err);
    return NextResponse.json({ error: 'Failed to fetch leads' }, { status: 500 });
  }
}
