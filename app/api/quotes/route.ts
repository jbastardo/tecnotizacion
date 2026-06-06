import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

function mapQuote(row: any) {
  return {
    id: row.id,
    clientName: row.client_name,
    clientPhone: row.client_phone,
    clientEmail: row.client_email,
    clientRif: row.client_rif,
    paymentMethod: row.payment_method,
    status: row.status,
    totalUsd: parseFloat(row.total_usd) || 0,
    totalBs: parseFloat(row.total_bs) || 0,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function GET() {
  try {
    const result = await query(
      'SELECT id, client_name, client_phone, client_email, client_rif, payment_method, status, total_usd, total_bs, notes, created_at, updated_at FROM quotes ORDER BY created_at DESC'
    );
    return NextResponse.json(result.rows.map(mapQuote));
  } catch (error) {
    console.error('Error fetching quotes:', error);
    return NextResponse.json({ error: 'Failed to fetch quotes' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { clientName, clientPhone, clientEmail, clientRif, paymentMethod, totalUsd, totalBs, notes, items } = body;

    const quoteResult = await query(
      `INSERT INTO quotes (client_name, client_phone, client_email, client_rif, payment_method, total_usd, total_bs, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, client_name, client_phone, client_email, client_rif, payment_method, status, total_usd, total_bs, notes, created_at, updated_at`,
      [clientName, clientPhone || null, clientEmail || null, clientRif || null, paymentMethod, totalUsd || 0, totalBs || 0, notes || null]
    );

    const quote = mapQuote(quoteResult.rows[0]);

    if (items && items.length > 0) {
      for (const item of items) {
        await query(
          `INSERT INTO quote_items (quote_id, product_id, product_name, quantity, cost_usd, sale_price_usd, sale_price_bs, subtotal_usd, subtotal_bs)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [quote.id, item.product?.id || null, item.product?.name || item.productName || '', item.quantity, item.pricing?.costUsd || item.costUsd || 0, item.pricing?.salePriceUsd || item.salePriceUsd || 0, item.pricing?.salePriceBs || item.salePriceBs || 0, item.pricing?.subtotalUsd || item.subtotalUsd || 0, item.pricing?.subtotalBs || item.subtotalBs || 0]
        );
      }
    }

    return NextResponse.json(quote, { status: 201 });
  } catch (error) {
    console.error('Error creating quote:', error);
    return NextResponse.json({ error: 'Failed to create quote' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, status } = body;

    const result = await query(
      `UPDATE quotes SET status = $1 WHERE id = $2
       RETURNING id, client_name, client_phone, client_email, client_rif, payment_method, status, total_usd, total_bs, notes, created_at, updated_at`,
      [status, id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Quote not found' }, { status: 404 });
    }

    return NextResponse.json(mapQuote(result.rows[0]));
  } catch (error) {
    console.error('Error updating quote:', error);
    return NextResponse.json({ error: 'Failed to update quote' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const body = await request.json();
    const { id } = body;

    await query('DELETE FROM quotes WHERE id = $1', [id]);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting quote:', error);
    return NextResponse.json({ error: 'Failed to delete quote' }, { status: 500 });
  }
}
