import { cookies } from 'next/headers';
import { query } from '@/lib/db';

export interface SessionData {
  userId: string;
  tenantId: string;
  email: string;
  name: string;
  role: string;
}

export async function getSession(): Promise<SessionData | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('session')?.value;
    if (!token) return null;

    const result = await query(
      `SELECT u.id as user_id, s.tenant_id, u.email, u.name, u.role
       FROM sessions s JOIN users u ON s.user_id = u.id
       WHERE s.token = $1 AND s.expires_at > NOW()`,
      [token]
    );

    if (result.rows.length === 0) return null;

    const row = result.rows[0];
    return {
      userId: row.user_id,
      tenantId: row.tenant_id,
      email: row.email,
      name: row.name,
      role: row.role,
    };
  } catch {
    return null;
  }
}
