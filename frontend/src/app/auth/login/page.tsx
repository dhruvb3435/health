'use client';

import { useState, FormEvent } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import apiClient from '@/lib/api-client';
import { useAuthStore } from '@/lib/store';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const router = useRouter();
  const { setUser, setAccessToken } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
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
    setIsLoading(true);

    try {
      const response = await apiClient.post('/auth/login', formData);
      const { accessToken, refreshToken, user } = response.data;

      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);

      setAccessToken(accessToken);
      setUser(user);

      toast.success('Login successful!');
      router.push('/dashboard');
    } catch (error: any) {
      // Diagnostic: show exact failure reason to help debug mobile issues
      const isNetworkError = !error.response;
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api (fallback)';
      const statusCode = error.response?.status;
      const serverMessage = error.response?.data?.message;

      if (isNetworkError) {
        toast.error(`Network error: cannot reach API (${apiUrl}). Check your connection.`, { duration: 6000 });
      } else {
        toast.error(serverMessage || `Server error ${statusCode || ''}: Login failed`, { duration: 5000 });
      }
      console.error('[Login] Error:', { isNetworkError, apiUrl, statusCode, message: error.message, serverMessage });
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
        <h1 className="mb-2 text-2xl font-bold text-primary-600 sm:text-3xl">Welcome Back</h1>
        <p className="mb-6 text-slate-600">Sign in to your Aarogentix account</p>

        <form onSubmit={handleSubmit} className="space-y-4">
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
              placeholder="your@email.com"
              required
            />
          </div>

          <div className="relative">
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
                placeholder="••••••••"
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

          <button
            type="submit"
            disabled={isLoading}
            className="btn btn-primary w-full py-2 text-lg"
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-4 border-t border-slate-200 pt-4 text-center">
          <p className="mb-2">
            <Link href="/auth/forgot-password" className="text-sm font-medium text-primary-600 hover:underline">
              Forgot your password?
            </Link>
          </p>
          <p className="text-slate-600">
            Don't have an account?{' '}
            <Link href="/auth/register" className="font-medium text-primary-600 hover:underline">
              Register here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
