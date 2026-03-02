import {
    Injectable,
    CanActivate,
    ExecutionContext,
    ForbiddenException,
} from '@nestjs/common';

@Injectable()
export class TenantGuard implements CanActivate {
    canActivate(context: ExecutionContext): boolean {
        const request = context.switchToHttp().getRequest();
        const user = request.user;

        // Skip strict mismatch check for unauthenticated requests.
        // Public routes will use TenantInterceptor for limited header resolution.
        if (!user) {
            return true;
        }

        const jwtOrgId = user.organizationId;
        if (!jwtOrgId) {
            // If we're here, it means we have a user but no organizationId in the JWT.
            // This is usually handled by other guards/interceptors but we check here too.
            return true;
        }

        // 1. Check for Tenant Mismatch in HEADERS
        const headerOrgId = request.headers['x-tenant-id'] || request.headers['x-organization-id'];
        if (headerOrgId && headerOrgId !== jwtOrgId) {
            throw new ForbiddenException(
                `Tenant Security Violation: Header origin (${headerOrgId}) does not match JWT context (${jwtOrgId}).`,
            );
        }

        // 2. Check for Tenant Mismatch in BODY
        const bodyOrgId = request.body?.organizationId || request.body?.tenantId;
        if (bodyOrgId && bodyOrgId !== jwtOrgId) {
            throw new ForbiddenException(
                `Tenant Security Violation: Request body field (${bodyOrgId}) does not match JWT context (${jwtOrgId}).`,
            );
        }

        // 3. Ensure organizationId is set on request object from JWT only
        request.organizationId = jwtOrgId;
        request.tenantId = jwtOrgId;

        return true;
    }
}
