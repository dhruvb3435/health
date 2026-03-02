'use client';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-primary-50 to-secondary-50 p-4">
      <div className="card max-w-2xl text-center">
        <div className="mb-8 flex items-center justify-center">
          <img src="/logo.svg" alt="Aarogentix logo" className="h-32 w-auto" />
        </div>
        <h1 className="mb-4 text-4xl font-bold text-primary-600">
          Aarogentix Management System
        </h1>
        <p className="mb-8 text-lg text-slate-600">
          A production-ready hospital and clinic management platform
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <a
            href="/auth/login"
            className="btn btn-primary px-6 py-3 text-lg"
          >
            Login
          </a>
          <a
            href="/auth/register"
            className="btn btn-secondary px-6 py-3 text-lg"
          >
            Register
          </a>
        </div>
      </div>
    </main>
  );
}
