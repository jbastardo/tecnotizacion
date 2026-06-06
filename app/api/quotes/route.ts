import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const result = await query(
      `SELECT id, client_name, client_phone, client_email, payment_method,
       status, total_usd, total_bs, notes, created_at, updated_at
       FROM quotes ORDER BY created_at DESC`
    );
    return NextResponse.json(result.rows.map((row: any) => ({
      id: row.id,
      clientName: row.client_name,
      clientPhone: row.client_phone,
      clientEmail: row.client_email,
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
    const { clientName, clientPhone, clientEmail, paymentMethod, totalUsd, totalBs, notes } = body;

    const result = await query(
      `INSERT INTO quotes (client_name, client_phone, client_email, payment_method, total_usd, total_bs, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, client_name, client_phone, client_email, payment_method, status, total_usd, total_bs, notes, created_at, updated_at`,
      [clientName, clientPhone || null, clientEmail || null, paymentMethod, totalUsd || 0, totalBs || 0, notes || null]
    );

    const row = result.rows[0];
    return NextResponse.json({
      id: row.id,
      clientName: row.client_name,
      clientPhone: row.client_phone,
      clientEmail: row.client_email,
      paymentMethod: row.payment_method,
      status: row.status,
      totalUsd: parseFloat(row.total_usd) || 0,
      totalBs: parseFloat(row.total_bs) || 0,
      notes: row.notes,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }, { status: 201 });
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
      `UPDATE quotes SET status = $1, updated_at = NOW() WHERE id = $2
       RETURNING id, client_name, client_phone, client_email, payment_method, status, total_usd, total_bs, notes, created_at, updated_at`,
      [status, id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Quote not found' }, { status: 404 });
    }

    const row = result.rows[0];
    return NextResponse.json({
      id: row.id,
      clientName: row.client_name,
      clientPhone: row.client_phone,
      clientEmail: row.client_email,
      paymentMethod: row.payment_method,
      status: row.status,
      totalUsd: parseFloat(row.total_usd) || 0,
      totalBs: parseFloat(row.total_bs) || 0,
      notes: row.notes,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
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
