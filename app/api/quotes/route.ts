import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const result = await query(
      'SELECT id, client_name, client_phone, client_email, payment_method, status, total_usd, total_bs, notes, created_at, updated_at FROM quotes ORDER BY created_at DESC'
    );
    return NextResponse.json(result.rows.map((row: any) => ({
      id: row.id,
      clientName: row.client_name,
      clientPhone: row.client_phone,
      clientEmail: row.client_email,
      clientRif: '',
      paymentMethod: row.payment_method,
      status: row.status,
      totalUsd: parseFloat(row.total_usd) || 0,
      totalBs: parseFloat(row.total_bs) || 0,
      notes: row.notes,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    })));
  } catch (error) {
    console.error('Error fetching quotes:', error);
    return NextResponse.json([]);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { clientName, clientPhone, clientEmail, paymentMethod, totalUsd, totalBs, notes, items } = body;

    const quoteResult = await query(
      `INSERT INTO quotes (client_name, client_phone, client_email, payment_method, total_usd, total_bs, notes, data)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, client_name, client_phone, client_email, payment_method, status, total_usd, total_bs, notes, data, created_at, updated_at`,
      [clientName, clientPhone || null, clientEmail || null, paymentMethod, totalUsd || 0, totalBs || 0, notes || null, JSON.stringify(body)]
    );

    const quote = {
      ...quoteResult.rows[0],
      items: quoteResult.rows[0].data?.items || [],
      rates: quoteResult.rows[0].data?.rates,
      totals: { usd: totalUsd || 0, bs: totalBs || 0 },
      clientName: quoteResult.rows[0].client_name,
      clientPhone: quoteResult.rows[0].client_phone,
      clientEmail: quoteResult.rows[0].client_email,
      paymentMethod: quoteResult.rows[0].payment_method,
      totalUsd: parseFloat(quoteResult.rows[0].total_usd) || 0,
      totalBs: parseFloat(quoteResult.rows[0].total_bs) || 0,
      createdAt: quoteResult.rows[0].created_at,
      updatedAt: quoteResult.rows[0].updated_at,
    };

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
       RETURNING id, client_name, client_phone, client_email, payment_method, status, total_usd, total_bs, notes, created_at, updated_at`,
      [status, id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Quote not found' }, { status: 404 });
    }

    return NextResponse.json({
      id: result.rows[0].id,
      clientName: result.rows[0].client_name,
      clientPhone: result.rows[0].client_phone,
      clientEmail: result.rows[0].client_email,
      clientRif: '',
      paymentMethod: result.rows[0].payment_method,
      status: result.rows[0].status,
      totalUsd: parseFloat(result.rows[0].total_usd) || 0,
      totalBs: parseFloat(result.rows[0].total_bs) || 0,
      notes: result.rows[0].notes,
      createdAt: result.rows[0].created_at,
      updatedAt: result.rows[0].updated_at,
    });
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
