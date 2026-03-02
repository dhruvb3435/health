'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import { Mail, ArrowLeft } from 'lucide-react';
import apiClient from '@/lib/api-client';

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [email, setEmail] = useState('');

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await apiClient.post('/auth/forgot-password', { email });
      setIsSubmitted(true);
    } catch (error: any) {
      // Always show the same message to avoid email enumeration
      setIsSubmitted(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary-50 to-secondary-50 p-4">
      <div className="card w-full max-w-md">
        <div className="mb-6 flex items-center justify-center">
          <img src="/logo.svg" alt="Aarogentix logo" className="h-20 w-auto" />
        </div>
        <h1 className="mb-2 text-2xl font-bold text-primary-600 sm:text-3xl">Forgot Password</h1>
        <p className="mb-6 text-sm text-slate-600 sm:text-base">
          Enter your email address and we'll send you a reset link.
        </p>

        {isSubmitted ? (
          <div className="space-y-4">
            <div className="flex items-start gap-3 rounded-xl border border-green-100 bg-green-50 p-4">
              <Mail className="mt-0.5 h-5 w-5 shrink-0 text-green-600" />
              <div>
                <p className="font-medium text-green-900">Check your email</p>
                <p className="mt-1 text-sm text-green-700">
                  If an account exists for <strong>{email}</strong>, we've sent a password reset link.
                </p>
              </div>
            </div>

            <div className="border-t border-slate-200 pt-4 text-center">
              <Link
                href="/auth/login"
                className="inline-flex items-center gap-1.5 font-medium text-primary-600 hover:underline"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Sign In
              </Link>
            </div>
          </div>
        ) : (
          <>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="mb-2 block font-medium">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  name="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input w-full"
                  placeholder="your@email.com"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="btn btn-primary w-full py-2 text-lg"
              >
                {isLoading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </form>

            <div className="mt-4 border-t border-slate-200 pt-4 text-center">
              <Link
                href="/auth/login"
                className="inline-flex items-center gap-1.5 font-medium text-primary-600 hover:underline"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Sign In
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
