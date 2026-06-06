import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

function mapClient(row: any) {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    email: row.email,
    createdAt: row.created_at,
  };
}

export async function GET() {
  try {
    const result = await query(
      'SELECT id, name, phone, email, created_at FROM clients ORDER BY name ASC'
    );
    return NextResponse.json(result.rows.map(mapClient));
  } catch (error) {
    console.error('Error fetching clients:', error);
    return NextResponse.json({ error: 'Failed to fetch clients' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, phone, email } = body;

    const existing = await query('SELECT id FROM clients WHERE phone = $1 AND phone IS NOT NULL', [phone || '']);
    if (existing.rows.length > 0 && phone) {
      const result = await query(
        'UPDATE clients SET name = $1, email = $2 WHERE phone = $3 RETURNING id, name, phone, email, created_at',
        [name, email || null, phone]
      );
      return NextResponse.json(mapClient(result.rows[0]));
    }

    const result = await query(
      `INSERT INTO clients (name, phone, email)
       VALUES ($1, $2, $3)
       RETURNING id, name, phone, email, created_at`,
      [name, phone || null, email || null]
    );

    return NextResponse.json(mapClient(result.rows[0]), { status: 201 });
  } catch (error) {
    console.error('Error creating client:', error);
    return NextResponse.json({ error: 'Failed to create client' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, name, phone, email } = body;

    const result = await query(
      `UPDATE clients SET name = $1, phone = $2, email = $3 WHERE id = $4
       RETURNING id, name, phone, email, created_at`,
      [name, phone || null, email || null, id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    return NextResponse.json(mapClient(result.rows[0]));
  } catch (error) {
    console.error('Error updating client:', error);
    return NextResponse.json({ error: 'Failed to update client' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const body = await request.json();
    const { id } = body;

    await query('DELETE FROM clients WHERE id = $1', [id]);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting client:', error);
    return NextResponse.json({ error: 'Failed to delete client' }, { status: 500 });
  }
}
