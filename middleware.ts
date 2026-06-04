import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('access_token')?.value;
  const { pathname } = request.nextUrl;

  // 1. Proteger rutas que inician con /app
  if (pathname.startsWith('/app')) {
    if (!token) {
      // Si no hay token, redirigir a login
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // 2. Redirigir a inicio si ya está logueado e intenta entrar a login
  if (pathname === '/login') {
    if (token) {
      return NextResponse.redirect(new URL('/app/inicio', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/app/:path*', '/login'],
};
