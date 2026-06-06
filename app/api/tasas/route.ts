import { NextResponse } from 'next/server';
import { fetchExchangeRates } from '@/lib/exchange-rates';

export async function GET() {
  try {
    const rates = await fetchExchangeRates();
    return NextResponse.json(rates);
  } catch (error) {
    console.error('Error in rates API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch exchange rates', bcv: 0, promedio: 0 },
      { status: 500 }
    );
  }
}
