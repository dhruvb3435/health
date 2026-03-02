'use client';

import { useState, FormEvent, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Eye, EyeOff, ArrowLeft, CheckCircle2 } from 'lucide-react';
import apiClient from '@/lib/api-client';
import toast from 'react-hot-toast';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';

  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (formData.newPassword !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (!token) {
      toast.error('Invalid or missing reset token');
      return;
    }

    setIsLoading(true);

    try {
      await apiClient.post('/auth/reset-password', {
        token,
        newPassword: formData.newPassword,
      });
      setIsSuccess(true);
      toast.success('Password reset successfully!');
      setTimeout(() => {
        router.push('/auth/login');
      }, 3000);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to reset password. The link may have expired.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="space-y-4 text-center">
        <p className="text-slate-600">
          Invalid or expired reset link. Please request a new one.
        </p>
        <Link
          href="/auth/forgot-password"
          className="inline-flex items-center gap-1.5 font-medium text-primary-600 hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Request New Link
        </Link>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="space-y-4 text-center">
        <div className="flex justify-center">
          <CheckCircle2 className="h-16 w-16 text-green-500" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Password Reset!</h2>
        <p className="text-sm text-slate-600">
          Your password has been updated. Redirecting to login...
        </p>
        <Link
          href="/auth/login"
          className="inline-flex items-center gap-1.5 font-medium text-primary-600 hover:underline"
        >
          Go to Sign In
        </Link>
      </div>
    );
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="newPassword" className="mb-2 block font-medium">
            New Password
          </label>
          <div className="relative">
            <input
              id="newPassword"
              type={showPassword ? 'text' : 'password'}
              name="newPassword"
              value={formData.newPassword}
              onChange={handleInputChange}
              className="input w-full pr-10"
              placeholder="Enter new password"
              minLength={8}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        <div>
          <label htmlFor="confirmPassword" className="mb-2 block font-medium">
            Confirm Password
          </label>
          <div className="relative">
            <input
              id="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              className="input w-full pr-10"
              placeholder="Confirm new password"
              minLength={8}
              required
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
            >
              {showConfirmPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="btn btn-primary w-full py-2 text-lg"
        >
          {isLoading ? 'Resetting...' : 'Reset Password'}
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
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary-50 to-secondary-50 p-4">
      <div className="card w-full max-w-md">
        <div className="mb-6 flex items-center justify-center">
          <img src="/logo.svg" alt="Aarogentix logo" className="h-20 w-auto" />
        </div>
        <h1 className="mb-2 text-2xl font-bold text-primary-600 sm:text-3xl">Reset Password</h1>
        <p className="mb-6 text-sm text-slate-600 sm:text-base">
          Enter your new password below.
        </p>

        <Suspense fallback={<div className="flex justify-center py-8"><div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" /></div>}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
