import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, HttpStatus } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import * as request from 'supertest';
import { AuthModule } from '../src/modules/auth/auth.module';
import { CustomThrottlerGuard } from '../src/guards/throttler.guard';
import { APP_GUARD } from '@nestjs/core';

/**
 * Rate-limiting integration spec.
 *
 * Purpose: Verify that strict auth-route limits are enforced and that a
 * proper 429 JSON body with `Retry-After` is returned when the limit is hit.
 *
 * Run: npm run test -- rate-limiting.e2e-spec.ts
 */
describe('Rate Limiting (e2e)', () => {
    let app: INestApplication;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [
                // Use a very low limit to make the test deterministic
                ThrottlerModule.forRoot([
                    { name: 'global', ttl: 60_000, limit: 100 },
                    { name: 'auth-strict', ttl: 60_000, limit: 2 }, // low limit for test
                ]),
                AuthModule,
            ],
            providers: [
                {
                    provide: APP_GUARD,
                    useClass: CustomThrottlerGuard,
                },
            ],
        }).compile();

        app = moduleFixture.createNestApplication();
        await app.init();
    });

    afterAll(async () => await app.close());

    it('should block POST /auth/login after auth-strict threshold (429)', async () => {
        const payload = { email: 'abuse@test.com', password: 'wrong' };

        // First two attempts are allowed (even if 401 due to wrong creds)
        for (let i = 0; i < 2; i++) {
            const res = await request(app.getHttpServer())
                .post('/api/auth/login')
                .send(payload);
            expect(res.status).not.toBe(HttpStatus.TOO_MANY_REQUESTS);
        }

        // Third attempt should be blocked
        const blockedRes = await request(app.getHttpServer())
            .post('/api/auth/login')
            .send(payload);

        expect(blockedRes.status).toBe(HttpStatus.TOO_MANY_REQUESTS);
        expect(blockedRes.headers['retry-after']).toBe('60');
        expect(blockedRes.body).toMatchObject({
            statusCode: 429,
            error: 'Too Many Requests',
            retryAfter: 60,
        });
    });

    it('should NOT throttle Swagger docs routes', async () => {
        const res = await request(app.getHttpServer()).get('/api/docs-json');
        // Should not be 429 regardless of prior requests
        expect(res.status).not.toBe(HttpStatus.TOO_MANY_REQUESTS);
    });
});
