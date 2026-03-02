import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // 1. Skip paths that don't need subscription check (auth, public, api, static)
    const isPublicPath =
        pathname.startsWith('/auth') ||
        pathname.startsWith('/api') ||
        pathname.startsWith('/_next') ||
        pathname === '/favicon.ico' ||
        pathname === '/subscription-expired';

    if (isPublicPath) {
        return NextResponse.next();
    }

    // 2. Check subscription status from cookies
    const subscriptionStatus = request.cookies.get('subscription-status')?.value;

    // 3. If expired, redirect to /subscription-expired
    if (subscriptionStatus === 'expired') {
        return NextResponse.redirect(new URL('/subscription-expired', request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        '/((?!api|_next/static|_next/image|favicon.ico).*)',
    ],
};
