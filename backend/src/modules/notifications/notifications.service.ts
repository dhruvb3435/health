import {
    Injectable,
    Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification, NotificationType } from './entities/notification.entity';

export interface CreateNotificationDto {
    organizationId: string;
    userId?: string;
    type: NotificationType;
    title: string;
    message: string;
    data?: Record<string, any>;
}

@Injectable()
export class NotificationsService {
    private readonly logger = new Logger(NotificationsService.name);

    constructor(
        @InjectRepository(Notification)
        private notificationRepo: Repository<Notification>,
    ) { }

    async create(dto: CreateNotificationDto): Promise<Notification> {
        const notification = this.notificationRepo.create({
            organizationId: dto.organizationId,
            userId: dto.userId,
            type: dto.type,
            title: dto.title,
            message: dto.message,
            data: dto.data,
            isRead: false,
        });
        return this.notificationRepo.save(notification);
    }

    async findAll(organizationId: string, userId?: string, limit = 20, offset = 0): Promise<Notification[]> {
        const query = this.notificationRepo.createQueryBuilder('n')
            .where('n.organizationId = :organizationId', { organizationId })
            .andWhere('(n.userId IS NULL OR n.userId = :userId)', { userId: userId || null })
            .orderBy('n.createdAt', 'DESC')
            .take(limit)
            .skip(offset);

        return query.getMany();
    }

    async getUnreadCount(organizationId: string, userId?: string): Promise<number> {
        const query = this.notificationRepo.createQueryBuilder('n')
            .where('n.organizationId = :organizationId', { organizationId })
            .andWhere('n.isRead = false')
            .andWhere('(n.userId IS NULL OR n.userId = :userId)', { userId: userId || null });

        return query.getCount();
    }

    async markAsRead(id: string, organizationId: string): Promise<Notification> {
        await this.notificationRepo.update(
            { id, organizationId },
            { isRead: true },
        );
        return this.notificationRepo.findOne({ where: { id } });
    }

    async markAllAsRead(organizationId: string, userId?: string): Promise<{ affected: number }> {
        const query = this.notificationRepo.createQueryBuilder()
            .update(Notification)
            .set({ isRead: true })
            .where('organizationId = :organizationId', { organizationId })
            .andWhere('isRead = false');

        if (userId) {
            query.andWhere('(userId IS NULL OR userId = :userId)', { userId });
        }

        const result = await query.execute();
        return { affected: result.affected || 0 };
    }

    // Called from event listeners in other modules
    async createFromEvent(event: any): Promise<void> {
        try {
            await this.create(event);
        } catch (error) {
            this.logger.error('Failed to create notification from event:', error.message);
        }
    }
}
