import { Injectable, ExecutionContext } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

/**
 * CustomThrottlerGuard — Enterprise-grade rate limiting guard.
 *
 * - Bypasses throttling for Swagger documentation routes (/api/docs).
 * - Tracks by IP address from the forwarded header (Vercel / Railway proxy-aware).
 * - Adds X-RateLimit-Limit and X-RateLimit-Remaining headers to responses.
 */
@Injectable()
export class CustomThrottlerGuard extends ThrottlerGuard {
    /**
     * Skip throttle check for Swagger UI and its JSON spec.
     */
    protected skipIf(context: ExecutionContext): boolean {
        const req = context.switchToHttp().getRequest();
        const url: string = req.url || '';
        return url.startsWith('/api/docs') || url === '/api-json';
    }

    /**
     * Use the real client IP even behind a reverse proxy.
     * Falls back to `req.ip` when no proxy header is present (local dev).
     */
    protected getTracker(req: Record<string, any>): Promise<string> {
        const forwarded = req.headers['x-forwarded-for'];
        const ip = Array.isArray(forwarded)
            ? forwarded[0]
            : (forwarded as string)?.split(',')[0]?.trim() ?? req.ip;
        return Promise.resolve(ip);
    }
}
