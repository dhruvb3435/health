import {
    Injectable,
    NotFoundException,
    Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OnboardingProgress, OnboardingStep } from './entities/onboarding-progress.entity';
import { Organization, OrganizationStatus } from '../organizations/entities/organization.entity';
import { User } from '../users/entities/user.entity';
import { DemoDataService } from './demo-data.service';
import { MailService } from '../mail/mail.service';
import { UpdateOnboardingStepDto } from './dto/update-onboarding.dto';

const STEP_ORDER: OnboardingStep[] = ['profile', 'team', 'demo', 'modules', 'complete'];

@Injectable()
export class OnboardingService {
    private readonly logger = new Logger(OnboardingService.name);

    constructor(
        @InjectRepository(OnboardingProgress)
        private progressRepo: Repository<OnboardingProgress>,
        @InjectRepository(Organization)
        private orgRepo: Repository<Organization>,
        @InjectRepository(User)
        private userRepo: Repository<User>,
        private demoDataService: DemoDataService,
        private mailService: MailService,
    ) { }

    async getProgress(organizationId: string): Promise<OnboardingProgress> {
        let progress = await this.progressRepo.findOne({ where: { organizationId } });

        if (!progress) {
            // First time: create initial progress
            progress = this.progressRepo.create({
                organizationId,
                currentStep: 1,
                completedSteps: [],
                isCompleted: false,
            });
            await this.progressRepo.save(progress);
        }

        return progress;
    }

    async updateStep(organizationId: string, dto: UpdateOnboardingStepDto): Promise<OnboardingProgress> {
        const progress = await this.getProgress(organizationId);
        const step = dto.step as OnboardingStep;

        if (!STEP_ORDER.includes(step)) {
            throw new NotFoundException(`Invalid step: ${step}`);
        }

        // Add step to completed if not already there
        if (!progress.completedSteps.includes(step)) {
            progress.completedSteps = [...progress.completedSteps, step];
        }

        // Advance step index
        const stepIndex = STEP_ORDER.indexOf(step);
        progress.currentStep = Math.max(progress.currentStep, stepIndex + 2); // next step (1-indexed)

        // Merge metadata
        if (dto.metadata) {
            progress.metadata = { ...(progress.metadata || {}), ...dto.metadata };
        }

        // Apply organization profile updates if provided
        if (step === 'profile' && dto.metadata) {
            await this.updateOrgProfile(organizationId, dto.metadata);
        }

        return this.progressRepo.save(progress);
    }

    async generateDemoData(organizationId: string) {
        const result = await this.demoDataService.generate(organizationId);
        // Mark demo step as complete
        await this.updateStep(organizationId, { step: 'demo', metadata: { demoGenerated: true } });
        return result;
    }

    async completeOnboarding(organizationId: string, userId?: string): Promise<{ success: boolean }> {
        const progress = await this.getProgress(organizationId);
        progress.isCompleted = true;
        progress.currentStep = 5;
        if (!progress.completedSteps.includes('complete')) {
            progress.completedSteps = [...progress.completedSteps, 'complete'];
        }
        await this.progressRepo.save(progress);

        // Activate the organization using save() to avoid TypeORM type issues with JSONB
        const org = await this.orgRepo.findOne({ where: { id: organizationId } });
        if (org) {
            org.status = OrganizationStatus.ACTIVE;
            org.settings = {
                ...(org.settings || {}),
                onboardingCompleted: true,
                onboardingCompletedAt: new Date().toISOString(),
            };
            await this.orgRepo.save(org);

            // Send Welcome Email
            if (userId) {
                const user = await this.userRepo.findOne({ where: { id: userId } });
                if (user) {
                    await this.mailService.sendWelcomeEmail(user, org);
                }
            } else {
                // Fallback: find first admin user
                const user = await this.userRepo.findOne({ where: { organizationId } });
                if (user) {
                    await this.mailService.sendWelcomeEmail(user, org);
                }
            }
        }

        this.logger.log(`Organization ${organizationId} completed onboarding and is now ACTIVE`);
        return { success: true };
    }

    private async updateOrgProfile(organizationId: string, metadata: Record<string, any>) {
        const updates: any = {};
        if (metadata.name) updates.name = metadata.name;
        if (metadata.phone) updates.settings = { ...(await this.orgRepo.findOne({ where: { id: organizationId } }))?.settings, phone: metadata.phone };
        if (metadata.address) updates.settings = { ...(await this.orgRepo.findOne({ where: { id: organizationId } }))?.settings, address: metadata.address };
        if (Object.keys(updates).length > 0) {
            await this.orgRepo.update(organizationId, updates);
        }
    }
}
