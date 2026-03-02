'use client';

import { useState } from 'react';
import {
    HelpCircle,
    MessageCircle,
    Book,
    Phone,
    Mail,
    ExternalLink,
    ChevronDown,
} from 'lucide-react';

const faqs = [
    {
        question: 'How do I add a new patient to the system?',
        answer:
            'Navigate to the Patients section from the sidebar and click "Add Patient." Fill in the required demographic and contact information, then click Save. The patient will appear in your patient list immediately.',
    },
    {
        question: 'How do I schedule an appointment?',
        answer:
            'Go to the Appointments module, select a date and time slot, choose the patient and provider, then confirm the booking. You can also set up recurring appointments from the same screen.',
    },
    {
        question: 'How are compliance and audit logs managed?',
        answer:
            'The Compliance & Audit page tracks all data access events automatically. Admins can review compliance records, view audit trails, and export reports. All actions are logged in accordance with HIPAA requirements.',
    },
    {
        question: 'Can I customize notification preferences?',
        answer:
            'Yes. Visit Settings > Notification Preferences to configure which alerts you receive via email, SMS, or in-app notifications. You can set preferences per module such as appointments, billing, and compliance.',
    },
    {
        question: 'How do I manage staff roles and permissions?',
        answer:
            'Organization admins can assign roles from the Staff Management section. Each role (admin, doctor, nurse, receptionist) has predefined permissions that control access to modules and patient data.',
    },
    {
        question: 'What should I do if I encounter a system error?',
        answer:
            'First, try refreshing the page. If the issue persists, note the error message and contact our support team via email or phone. Include your organization name and a screenshot if possible.',
    },
];

const quickLinks = [
    {
        title: 'Documentation',
        description: 'Comprehensive guides and API references',
        icon: Book,
        href: '#',
    },
    {
        title: 'API Reference',
        description: 'Technical documentation for integrations',
        icon: ExternalLink,
        href: '#',
    },
    {
        title: 'System Status',
        description: 'Check uptime and service health',
        icon: HelpCircle,
        href: '#',
    },
];

export default function HelpPage() {
    const [openIndex, setOpenIndex] = useState<number | null>(null);

    const toggle = (index: number) => {
        setOpenIndex(openIndex === index ? null : index);
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-10">
            <div>
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 font-display">
                    Help & Support
                </h1>
                <p className="mt-1 text-sm md:text-base text-slate-500">
                    Find answers, get in touch, and explore resources
                </p>
            </div>

            {/* FAQ Section */}
            <section className="card overflow-hidden !p-0 shadow-sm border-slate-200">
                <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
                    <div className="flex items-center gap-2">
                        <HelpCircle className="h-5 w-5 text-blue-600" />
                        <h2 className="font-bold text-slate-900">
                            Frequently Asked Questions
                        </h2>
                    </div>
                </div>
                <div className="divide-y divide-slate-100">
                    {faqs.map((faq, index) => (
                        <div key={index}>
                            <button
                                onClick={() => toggle(index)}
                                className="flex w-full items-center justify-between px-6 py-4 text-left hover:bg-slate-50 transition-colors"
                            >
                                <span className="font-medium text-sm md:text-base text-slate-900 pr-4">
                                    {faq.question}
                                </span>
                                <ChevronDown
                                    className={`h-5 w-5 flex-shrink-0 text-slate-400 transition-transform duration-200 ${
                                        openIndex === index ? 'rotate-180' : ''
                                    }`}
                                />
                            </button>
                            {openIndex === index && (
                                <div className="px-6 pb-4 text-sm text-slate-600 leading-relaxed animate-in fade-in slide-in-from-top-1 duration-200">
                                    {faq.answer}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </section>

            <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
                {/* Contact Support */}
                <section className="card p-6 shadow-sm border-slate-200 space-y-4">
                    <div className="flex items-center gap-2">
                        <MessageCircle className="h-5 w-5 text-blue-600" />
                        <h2 className="font-bold text-slate-900">
                            Contact Support
                        </h2>
                    </div>
                    <p className="text-sm text-slate-500">
                        Our support team is available Monday through Friday, 9
                        AM to 6 PM IST.
                    </p>
                    <div className="space-y-3">
                        <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3 border border-slate-100">
                            <div className="h-9 w-9 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                                <Mail size={18} />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                    Email
                                </p>
                                <p className="text-sm font-medium text-slate-900">
                                    support@aarogentix.com
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3 border border-slate-100">
                            <div className="h-9 w-9 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                                <Phone size={18} />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                    Phone
                                </p>
                                <p className="text-sm font-medium text-slate-900">
                                    +91 1800-XXX-XXXX
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* System Info */}
                <section className="card p-6 shadow-sm border-slate-200 space-y-4">
                    <div className="flex items-center gap-2">
                        <HelpCircle className="h-5 w-5 text-blue-600" />
                        <h2 className="font-bold text-slate-900">
                            System Information
                        </h2>
                    </div>
                    <div className="space-y-3">
                        <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3 border border-slate-100">
                            <span className="text-sm text-slate-500">
                                App Version
                            </span>
                            <span className="text-sm font-bold text-slate-900">
                                1.0.0
                            </span>
                        </div>
                        <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3 border border-slate-100">
                            <span className="text-sm text-slate-500">
                                Last Updated
                            </span>
                            <span className="text-sm font-bold text-slate-900">
                                March 2026
                            </span>
                        </div>
                        <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3 border border-slate-100">
                            <span className="text-sm text-slate-500">
                                Environment
                            </span>
                            <span className="text-sm font-bold text-slate-900">
                                Production
                            </span>
                        </div>
                        <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3 border border-slate-100">
                            <span className="text-sm text-slate-500">
                                Status
                            </span>
                            <span className="flex items-center gap-1.5 text-sm font-bold text-emerald-600">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                Operational
                            </span>
                        </div>
                    </div>
                </section>
            </div>

            {/* Quick Links */}
            <section>
                <h2 className="font-bold text-slate-900 mb-4">Quick Links</h2>
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                    {quickLinks.map((link) => (
                        <a
                            key={link.title}
                            href={link.href}
                            className="card p-5 shadow-sm border-slate-200 flex items-start gap-4 hover:shadow-md hover:border-blue-200 transition-all group"
                        >
                            <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 flex-shrink-0 group-hover:bg-blue-100 transition-colors">
                                <link.icon size={20} />
                            </div>
                            <div>
                                <p className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                                    {link.title}
                                </p>
                                <p className="text-sm text-slate-500 mt-0.5">
                                    {link.description}
                                </p>
                            </div>
                        </a>
                    ))}
                </div>
            </section>
        </div>
    );
}
