import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Reflector } from '@nestjs/core';
import { AUDIT_KEY, AuditOptions } from '../decorators/audit.decorator';
import { ComplianceService } from '../../modules/compliance/compliance.service';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
    constructor(
        private readonly reflector: Reflector,
        private readonly complianceService: ComplianceService,
    ) { }

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const auditOptions = this.reflector.getAllAndOverride<AuditOptions>(AUDIT_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        if (!auditOptions) {
            return next.handle();
        }

        const request = context.switchToHttp().getRequest();
        const user = request.user;
        const method = request.method;
        const url = request.url;

        return next.handle().pipe(
            tap(async (data) => {
                if (user) {
                    const action = auditOptions.action || `${method} ${url}`;
                    const entityType = auditOptions.entityType || 'unknown';

                    // Extract entityId from params or returned data
                    const entityId = request.params.id || (data && data.id) || 'N/A';

                    await this.complianceService.logDataAccess(
                        user.id,
                        user.organizationId,
                        action,
                        entityType,
                        entityId,
                        `Accessed through API: ${method} ${url}`
                    );
                }
            }),
        );
    }
}
