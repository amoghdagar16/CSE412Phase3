'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Book, GraduationCap, Users } from 'lucide-react';
import { api } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [credentials, setCredentials] = useState({
    university_id: '',
    password: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const data = await api.login(credentials.university_id, credentials.password);

      if (data.access_token) {
        localStorage.setItem('token', data.access_token);
        localStorage.setItem('user', JSON.stringify(data.user));
        router.push(`/dashboard/${data.user.role}`);
      } else {
        setError('Login failed. Please check your credentials.');
      }
    } catch (err: any) {
      const detail = err.response?.data?.detail;

      // Handle both string errors and validation error arrays from FastAPI
      if (typeof detail === 'string') {
        setError(detail);
      } else if (Array.isArray(detail)) {
        // Extract error messages from validation errors
        const errorMessages = detail.map((error: any) => error.msg).join(', ');
        setError(errorMessages);
      } else {
        setError('Login failed. Please check your credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-50">
      {/* Header */}
      <header className="border-b border-neutral-200 bg-white/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-8 h-8 text-primary-500" />
            <span className="text-2xl font-bold text-neutral-900">University LMS v3.0</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left side - Hero */}
          <div className="space-y-8">
            <div className="space-y-4">
              <h1 className="text-5xl font-bold text-neutral-900 text-balance">
                Admin-Controlled Learning System
              </h1>
              <p className="text-xl text-neutral-600 text-balance">
                A realistic university LMS where administrators manage all users, professors create content, and students learn.
              </p>
            </div>

            <div className="grid sm:grid-cols-3 gap-6 pt-4">
              <div className="flex flex-col items-center text-center p-6 bg-white rounded-2xl shadow-soft">
                <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mb-3">
                  <Book className="w-6 h-6 text-primary-600" />
                </div>
                <h3 className="font-semibold text-neutral-900">Public Content</h3>
                <p className="text-sm text-neutral-600 mt-1">Cross-class learning materials</p>
              </div>

              <div className="flex flex-col items-center text-center p-6 bg-white rounded-2xl shadow-soft">
                <div className="w-12 h-12 bg-success-100 rounded-full flex items-center justify-center mb-3">
                  <GraduationCap className="w-6 h-6 text-success-600" />
                </div>
                <h3 className="font-semibold text-neutral-900">Admin Control</h3>
                <p className="text-sm text-neutral-600 mt-1">Centralized user management</p>
              </div>

              <div className="flex flex-col items-center text-center p-6 bg-white rounded-2xl shadow-soft">
                <div className="w-12 h-12 bg-warning-100 rounded-full flex items-center justify-center mb-3">
                  <Users className="w-6 h-6 text-warning-600" />
                </div>
                <h3 className="font-semibold text-neutral-900">TA System</h3>
                <p className="text-sm text-neutral-600 mt-1">Professors assign TAs</p>
              </div>
            </div>
          </div>

          {/* Right side - Login Form */}
          <div className="bg-white rounded-3xl shadow-soft-lg p-8 lg:p-12">
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-neutral-900">Sign in</h2>
              <p className="text-neutral-600 mt-2">Enter your university credentials to access your account</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="university_id" className="label">
                  University ID
                </label>
                <input
                  id="university_id"
                  type="text"
                  className="input"
                  placeholder="Enter your university ID (e.g., ADMIN001)"
                  value={credentials.university_id}
                  onChange={(e) =>
                    setCredentials({ ...credentials, university_id: e.target.value })
                  }
                  required
                />
              </div>

              <div>
                <label htmlFor="password" className="label">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  className="input"
                  placeholder="Enter your password"
                  value={credentials.password}
                  onChange={(e) =>
                    setCredentials({ ...credentials, password: e.target.value })
                  }
                  required
                />
              </div>

              {error && (
                <div className="bg-error-50 border border-error-200 text-error-700 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary w-full text-lg py-3"
              >
                {loading ? 'Signing in...' : 'Sign in'}
              </button>
            </form>

            <div className="mt-8 pt-6 border-t border-neutral-200 space-y-4">
              <p className="text-sm text-neutral-600 text-center">
                Don't have an account?{' '}
                <a href="/register" className="text-primary-600 hover:text-primary-700 font-semibold">
                  Request Access
                </a>
              </p>

              <div className="pt-4 border-t border-neutral-200">
                <p className="text-sm text-neutral-600 text-center font-semibold">
                  Default Admin Account:
                </p>
                <div className="mt-3 text-center space-y-1 text-sm">
                  <p className="font-mono bg-primary-50 px-4 py-2 rounded-lg">
                    ID: <code className="px-2 py-1 bg-white rounded font-bold">ADMIN001</code>
                  </p>
                  <p className="font-mono bg-primary-50 px-4 py-2 rounded-lg">
                    Password: <code className="px-2 py-1 bg-white rounded font-bold">admin123</code>
                  </p>
                </div>
                <p className="text-xs text-neutral-500 text-center mt-4">
                  Users can self-register and wait for admin approval
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-neutral-200 bg-white mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-center text-sm text-neutral-500">
            © 2025 University LMS v3.0 - Admin-Controlled Learning Management System
          </p>
        </div>
      </footer>
    </div>
  );
}
