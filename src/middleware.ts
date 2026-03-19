import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const sessionToken = request.cookies.get('kanban_admin_session')?.value;
    const validToken = process.env.ADMIN_SECRET_TOKEN;

    if (!sessionToken || !validToken || sessionToken !== validToken) {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/admin/:path*'],
};
