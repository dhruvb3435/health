import { Injectable, Scope } from '@nestjs/common';

@Injectable({ scope: Scope.REQUEST })
export class TenantService {
    private organizationId: string;

    setTenantId(id: string) {
        this.organizationId = id;
    }

    getTenantId(): string {
        return this.organizationId;
    }
}
