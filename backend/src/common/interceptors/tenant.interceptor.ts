import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
    UnauthorizedException,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { ModuleRef, ContextIdFactory } from '@nestjs/core';
import { TenantService } from '../services/tenant.service';

/**
 * TenantInterceptor — Organization Context Resolution
 *
 * Security policy:
 * - For AUTHENTICATED requests (request.user present): organization_id is read
 *   EXCLUSIVELY from the validated JWT payload (request.user.organizationId).
 *   Any x-tenant-id / x-organization-id header is IGNORED.
 * - For PUBLIC routes (no JWT user): the x-tenant-id header is accepted only
 *   for slug lookups and org-check endpoints. These routes are enumerated in
 *   the publicOrgRoutes list below and do not access any tenanted data.
 * - If a request is to a protected route and the JWT carries no organizationId,
 *   an UnauthorizedException is thrown immediately.
 */
@Injectable()
export class TenantInterceptor implements NestInterceptor {
    constructor(private readonly moduleRef: ModuleRef) { }

    async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
        const request = context.switchToHttp().getRequest();
        const user = request.user;

        let organizationId: string | undefined;

        if (user) {
            // ── Authenticated request ─────────────────────────────────────────
            // MUST derive org context from the validated JWT only.
            // Headers are untrusted and explicitly ignored here.
            organizationId = user.organizationId;

            if (!organizationId) {
                throw new UnauthorizedException(
                    'Your session does not contain a valid organization context. Please log in again.',
                );
            }
        } else {
            // ── Public / pre-auth request ──────────────────────────────────────
            // Only allowed for explicitly listed routes that need org context
            // without authentication (e.g. slug check, org lookup by domain).
            if (this.isPublicOrgRoute(request)) {
                organizationId =
                    (request.headers['x-tenant-id'] as string) ||
                    (request.headers['x-organization-id'] as string);
            }
            // All other unauthenticated routes proceed without a tenant context.
            // Controllers on protected routes will fail at the JwtAuthGuard stage.
        }

        if (organizationId) {
            const contextId = ContextIdFactory.getByRequest(request);
            const tenantService = await this.moduleRef.resolve(TenantService, contextId, { strict: false });
            tenantService.setTenantId(organizationId);
            request.organizationId = organizationId;
            request.tenantId = organizationId;
        }

        return next.handle();
    }

    /**
     * Routes that legitimately need org context headers without a JWT.
     * Keep this list minimal and precise.
     */
    private isPublicOrgRoute(request: any): boolean {
        const publicOrgRoutes = [
            '/api/organizations/slug/',
            '/api/organizations/check-slug',
        ];
        return publicOrgRoutes.some(route => request.url.includes(route));
    }
}
