import { MailerService } from '@nestjs-modules/mailer';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MailService {
    private readonly logger = new Logger(MailService.name);

    constructor(
        private mailerService: MailerService,
        private configService: ConfigService,
    ) { }

    async sendWelcomeEmail(user: any, organization: any) {
        const url = `${this.configService.get('FRONTEND_URL')}/dashboard`;

        try {
            await this.mailerService.sendMail({
                to: user.email,
                subject: 'Welcome to Aarogentix!',
                template: './welcome', // `.hbs` extension is appended automatically
                context: {
                    name: `${user.firstName} ${user.lastName}`,
                    organizationName: organization.name,
                    url,
                },
            });
            this.logger.log(`Welcome email sent to ${user.email}`);
        } catch (error) {
            this.logger.error(`Failed to send welcome email to ${user.email}: ${error.message}`);
        }
    }

    async sendAppointmentConfirmation(appointment: any) {
        const patientEmail = appointment.patient?.user?.email;
        if (!patientEmail) return;

        try {
            await this.mailerService.sendMail({
                to: patientEmail,
                subject: 'Appointment Confirmed - Aarogentix',
                template: './appointment-confirmation',
                context: {
                    patientName: `${appointment.patient.user.firstName} ${appointment.patient.user.lastName}`,
                    doctorName: `Dr. ${appointment.doctor?.user?.firstName || 'Staff'}`,
                    date: appointment.appointmentDate,
                    time: appointment.appointmentTime,
                    isVirtual: appointment.isVirtual,
                    meetingLink: appointment.meetingLink,
                },
            });
            this.logger.log(`Appointment confirmation sent to ${patientEmail}`);
        } catch (error) {
            this.logger.error(`Failed to send appointment confirmation to ${patientEmail}: ${error.message}`);
        }
    }

    async sendInvoiceNotification(invoice: any) {
        const patientEmail = invoice.patient?.user?.email;
        if (!patientEmail) return;

        try {
            await this.mailerService.sendMail({
                to: patientEmail,
                subject: `New Invoice Issued - ${invoice.invoiceNumber}`,
                template: './invoice-notice',
                context: {
                    patientName: `${invoice.patient.user.firstName} ${invoice.patient.user.lastName}`,
                    invoiceNumber: invoice.invoiceNumber,
                    totalAmount: invoice.totalAmount,
                    dueDate: invoice.dueDate,
                    portalUrl: `${this.configService.get('FRONTEND_URL')}/billing`,
                },
            });
            this.logger.log(`Invoice notification sent to ${patientEmail}`);
        } catch (error) {
            this.logger.error(`Failed to send invoice notification to ${patientEmail}: ${error.message}`);
        }
    }

    async sendVerificationEmail(user: any, rawToken: string): Promise<void> {
        const verifyUrl =
            `${this.configService.get('FRONTEND_URL')}/auth/verify-email?token=${rawToken}`;

        try {
            await this.mailerService.sendMail({
                to: user.email,
                subject: 'Verify your Aarogentix account',
                template: './verify-email',
                context: {
                    name: `${user.firstName} ${user.lastName}`,
                    verifyUrl,
                    expiryHours: 24,
                },
            });
            this.logger.log(`Verification email sent to ${user.email}`);
        } catch (error) {
            this.logger.error(
                `Failed to send verification email to ${user.email}: ${error.message}`,
            );
        }
    }

    async sendPasswordResetEmail(user: any, rawToken: string): Promise<void> {
        const resetUrl =
            `${this.configService.get('FRONTEND_URL')}/auth/reset-password?token=${rawToken}`;

        try {
            await this.mailerService.sendMail({
                to: user.email,
                subject: 'Reset your Aarogentix password',
                template: './reset-password',
                context: {
                    name: `${user.firstName} ${user.lastName}`,
                    resetUrl,
                    expiryHours: 1,
                },
            });
            this.logger.log(`Password reset email sent to ${user.email}`);
        } catch (error) {
            this.logger.error(
                `Failed to send password reset email to ${user.email}: ${error.message}`,
            );
        }
    }

    async sendPaymentFailedNotification(adminUser: any, organization: any) {
        const billingUrl = `${this.configService.get('FRONTEND_URL')}/dashboard/billing`;

        try {
            await this.mailerService.sendMail({
                to: adminUser.email,
                subject: 'Action Required: Payment Failed for Your Subscription',
                template: './payment-failed',
                context: {
                    name: `${adminUser.firstName} ${adminUser.lastName}`,
                    organizationName: organization.name,
                    billingUrl,
                },
            });
            this.logger.log(`Payment failure notification sent to ${adminUser.email}`);
        } catch (error) {
            this.logger.error(`Failed to send payment failure notification to ${adminUser.email}: ${error.message}`);
        }
    }
}
