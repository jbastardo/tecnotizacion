import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const session = request.cookies.get('session');
  const { pathname } = request.nextUrl;

  // Public routes
  const publicRoutes = ['/login', '/register', '/api/auth', '/api/health', '/api/tasas'];
  if (publicRoutes.some((r) => pathname.startsWith(r))) {
    return NextResponse.next();
  }

  // API routes need session
  if (pathname.startsWith('/api/')) {
    if (!session?.value) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    return NextResponse.next();
  }

  // App routes need session
  if (!session?.value) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
