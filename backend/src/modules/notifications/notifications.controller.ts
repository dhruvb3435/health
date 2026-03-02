import {
    Controller,
    Get,
    Patch,
    Param,
    Query,
    Request,
    UseGuards,
    HttpCode,
    HttpStatus,
    ParseIntPipe,
    DefaultValuePipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { NotificationsService } from './notifications.service';

interface AuthRequest extends Request {
    user: { organizationId: string; sub: string; };
}

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
    constructor(private readonly notificationsService: NotificationsService) { }

    @Get()
    async findAll(
        @Request() req: AuthRequest,
        @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
        @Query('offset', new DefaultValuePipe(0), ParseIntPipe) offset: number,
    ) {
        return this.notificationsService.findAll(
            req.user.organizationId,
            req.user.sub,
            limit,
            offset,
        );
    }

    @Get('count')
    async getCount(@Request() req: AuthRequest) {
        const count = await this.notificationsService.getUnreadCount(
            req.user.organizationId,
            req.user.sub,
        );
        return { count };
    }

    @Patch(':id/read')
    @HttpCode(HttpStatus.OK)
    async markAsRead(@Param('id') id: string, @Request() req: AuthRequest) {
        return this.notificationsService.markAsRead(id, req.user.organizationId);
    }

    @Patch('read-all')
    @HttpCode(HttpStatus.OK)
    async markAllAsRead(@Request() req: AuthRequest) {
        return this.notificationsService.markAllAsRead(
            req.user.organizationId,
            req.user.sub,
        );
    }
}
