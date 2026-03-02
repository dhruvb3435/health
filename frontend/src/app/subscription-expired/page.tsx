'use client';

import Link from 'next/link';
import { CreditCard, ArrowRight, ShieldAlert, LifeBuoy } from 'lucide-react';

export default function SubscriptionExpiredPage() {
    return (
        <div className="min-h-screen bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-50 via-slate-50 to-white flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8 text-center">
                <div className="relative mx-auto w-24 h-24 mb-10">
                    <div className="absolute inset-0 bg-rose-100 rounded-3xl rotate-6 animate-pulse"></div>
                    <div className="absolute inset-0 bg-white rounded-3xl shadow-xl border border-rose-100 flex items-center justify-center -rotate-3 transition-transform hover:rotate-0 duration-300">
                        <ShieldAlert size={48} className="text-rose-500" />
                    </div>
                </div>

                <div className="space-y-4">
                    <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight font-display">
                        Subscription Expired
                    </h1>
                    <p className="text-lg text-slate-500 max-w-sm mx-auto leading-relaxed">
                        Your access to the portal has been suspended because your subscription has ended or a payment failed.
                    </p>
                </div>

                <div className="mt-10 space-y-4 pt-6">
                    <Link
                        href="/billing"
                        className="group relative w-full flex items-center justify-center py-4 px-6 border border-transparent text-base font-bold rounded-2xl text-white bg-indigo-600 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 hover:shadow-indigo-300 transform hover:-translate-y-0.5 active:translate-y-0"
                    >
                        <CreditCard className="mr-3 h-5 w-5" />
                        Upgrade Plan
                        <ArrowRight className="ml-2 h-4 w-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                    </Link>

                    <Link
                        href="/billing"
                        className="w-full flex items-center justify-center py-4 px-6 border-2 border-slate-200 text-base font-bold rounded-2xl text-slate-700 bg-white hover:bg-slate-50 hover:border-slate-300 transition-all"
                    >
                        Go to Billing Records
                    </Link>
                </div>

                <div className="mt-12 pt-8 border-t border-slate-100">
                    <div className="flex items-center justify-center gap-2 text-sm text-slate-400 font-medium">
                        <LifeBuoy size={16} />
                        <span>Need help? Contact our support team.</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
