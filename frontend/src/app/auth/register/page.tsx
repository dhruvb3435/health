'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Check, X as XIcon } from 'lucide-react';
import apiClient from '@/lib/api-client';
import toast from 'react-hot-toast';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export default function RegisterPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    organizationName: '',
    organizationSlug: '',
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  // Slug is auto-generated in handleInputChange

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const updated = { ...prev, [name]: value };
      // Auto-generate slug when organization name changes
      if (name === 'organizationName') {
        updated.organizationSlug = slugify(value);
      }
      return updated;
    });
  };

  // Password validation
  const passwordChecks = {
    minLength: formData.password.length >= 8,
    hasUppercase: /[A-Z]/.test(formData.password),
    hasNumber: /\d/.test(formData.password),
    hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(formData.password),
  };
  const allPasswordChecksPassed = Object.values(passwordChecks).every(Boolean);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (!allPasswordChecksPassed) {
      toast.error('Password does not meet all requirements');
      return;
    }

    setIsLoading(true);

    try {
      await apiClient.post('/auth/register-organization', {
        organizationName: formData.organizationName,
        organizationSlug: formData.organizationSlug,
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
      });

      toast.success('Registration successful! Redirecting to login...');
      setTimeout(() => {
        router.push('/auth/login');
      }, 1500);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  const PasswordCheck = ({ passed, label }: { passed: boolean; label: string }) => (
    <div className="flex items-center gap-2 text-xs">
      {passed ? (
        <Check className="h-3.5 w-3.5 text-emerald-500" />
      ) : (
        <XIcon className="h-3.5 w-3.5 text-slate-300" />
      )}
      <span className={passed ? 'text-emerald-600 font-medium' : 'text-slate-400'}>
        {label}
      </span>
    </div>
  );

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary-50 to-secondary-50 p-4">
      <div className="card w-full max-w-md">
        <div className="mb-6 flex items-center justify-center">
          <img src="/logo.svg" alt="Aarogentix logo" className="h-20 w-auto" />
        </div>
        <h1 className="mb-2 text-2xl font-bold text-primary-600 sm:text-3xl">Create Account</h1>
        <p className="mb-6 text-slate-600">Register your organization on Aarogentix</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Organization Fields */}
          <div>
            <label htmlFor="organizationName" className="mb-2 block font-medium">
              Organization Name
            </label>
            <input
              id="organizationName"
              type="text"
              name="organizationName"
              value={formData.organizationName}
              onChange={handleInputChange}
              className="input w-full"
              placeholder="e.g. City General Hospital"
              required
            />
          </div>

          <div>
            <label htmlFor="organizationSlug" className="mb-2 block font-medium">
              Organization Slug
            </label>
            <div className="flex">
              <span className="inline-flex items-center rounded-l-xl border border-r-0 border-slate-200 bg-slate-100 px-3 text-sm text-slate-500">
                aarogentix.com/
              </span>
              <input
                id="organizationSlug"
                type="text"
                name="organizationSlug"
                value={formData.organizationSlug}
                className="input w-full rounded-l-none bg-slate-50"
                readOnly
              />
            </div>
            <p className="mt-1 text-xs text-slate-400">Auto-generated from organization name</p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="firstName" className="mb-2 block font-medium">
                First Name
              </label>
              <input
                id="firstName"
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
                className="input w-full"
                placeholder="e.g. Dhruv"
                required
              />
            </div>
            <div>
              <label htmlFor="lastName" className="mb-2 block font-medium">
                Last Name
              </label>
              <input
                id="lastName"
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleInputChange}
                className="input w-full"
                placeholder="e.g. Bagadiya"
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="email" className="mb-2 block font-medium">
              Email
            </label>
            <input
              id="email"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className="input w-full"
              placeholder="admin@hospital.com"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-2 block font-medium">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className="input w-full pr-10"
                placeholder="Create a strong password"
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
            {/* Password Requirements */}
            {formData.password.length > 0 && (
              <div className="mt-2 space-y-1 rounded-xl bg-slate-50 p-3 border border-slate-100">
                <PasswordCheck passed={passwordChecks.minLength} label="At least 8 characters" />
                <PasswordCheck passed={passwordChecks.hasUppercase} label="One uppercase letter" />
                <PasswordCheck passed={passwordChecks.hasNumber} label="One number" />
                <PasswordCheck passed={passwordChecks.hasSpecial} label="One special character" />
              </div>
            )}
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
                placeholder="Re-enter your password"
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
            {formData.confirmPassword.length > 0 && formData.password !== formData.confirmPassword && (
              <p className="mt-1 text-xs text-rose-500 font-medium">Passwords do not match</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="btn btn-primary w-full py-2 text-lg"
          >
            {isLoading ? 'Creating account...' : 'Register'}
          </button>
        </form>

        <div className="mt-4 border-t border-slate-200 pt-4 text-center">
          <p className="text-slate-600">
            Already have an account?{' '}
            <Link href="/auth/login" className="font-medium text-primary-600 hover:underline">
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
