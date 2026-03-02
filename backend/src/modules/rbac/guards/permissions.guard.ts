import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { RbacService } from '../rbac.service';

@Injectable()
export class PermissionsGuard implements CanActivate {
    constructor(
        private reflector: Reflector,
        private rbacService: RbacService,
    ) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const requiredPermissions = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        if (!requiredPermissions || requiredPermissions.length === 0) {
            return true;
        }

        const { user } = context.switchToHttp().getRequest();

        if (!user || !user.roles || !user.organizationId) {
            throw new ForbiddenException('User session invalid or organization context missing');
        }

        const userPermissions = await this.rbacService.getPermissionsForRoles(
            user.roles.map((r: string) => r.toLowerCase()),
            user.organizationId,
        );

        const hasPermission = requiredPermissions.every((permission) =>
            userPermissions.includes(permission),
        );

        if (!hasPermission) {
            throw new ForbiddenException('Insufficient permissions to access this resource');
        }

        return true;
    }
}
