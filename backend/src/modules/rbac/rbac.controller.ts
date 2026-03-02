import { Controller, Get, Post, Body, UseGuards, Param } from '@nestjs/common';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { RolesGuard, Roles } from '../../guards/roles.guard';
import { UserRole } from '../users/entities/user.entity';
import { RbacService } from './rbac.service';
import { OrganizationId } from '../../common/decorators/organization-id.decorator';

@Controller('rbac')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RbacController {
    constructor(private readonly rbacService: RbacService) { }

    @Get('permissions')
    @Roles([UserRole.ADMIN])
    async getPermissions() {
        return this.rbacService.getAllPermissions();
    }

    @Get('roles')
    @Roles([UserRole.ADMIN])
    async getRoles(@OrganizationId() organizationId: string) {
        return this.rbacService.getOrganizationRoles(organizationId);
    }

    @Post('permissions')
    @Roles([UserRole.ADMIN])
    async createPermission(@Body() data: { name: string; category: string; description?: string }) {
        return this.rbacService.createPermission(data.name, data.category, data.description);
    }

    @Post('roles')
    @Roles([UserRole.ADMIN])
    async createRole(
        @OrganizationId() organizationId: string,
        @Body() data: { name: string; permissionNames: string[]; isSystemRole?: boolean },
    ) {
        return this.rbacService.createRole(data.name, organizationId, data.permissionNames, data.isSystemRole);
    }
}
