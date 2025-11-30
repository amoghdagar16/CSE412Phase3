'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { GraduationCap, ArrowLeft, Check } from 'lucide-react';
import { api } from '@/lib/api';
import Link from 'next/link';

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    university_id: '',
    username: '',
    password: '',
    confirmPassword: '',
    name: '',
    email: '',
    requested_role: 'student' as 'student' | 'professor' | 'ta',
    reason: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      setLoading(false);
      return;
    }

    try {
      await api.register({
        university_id: formData.university_id,
        username: formData.username,
        password: formData.password,
        name: formData.name,
        email: formData.email,
        requested_role: formData.requested_role,
        reason: formData.reason || undefined,
      });

      setSuccess(true);
    } catch (err: any) {
      const detail = err.response?.data?.detail;

      // Handle both string errors and validation error arrays from FastAPI
      if (typeof detail === 'string') {
        setError(detail);
      } else if (Array.isArray(detail)) {
        const errorMessages = detail.map((error: any) => error.msg).join(', ');
        setError(errorMessages);
      } else {
        setError('Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-success-50 via-white to-success-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-3xl shadow-soft-lg p-8 lg:p-12 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-success-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="w-10 h-10 text-success-600" />
          </div>
          <h1 className="text-3xl font-bold text-neutral-900 mb-4">Registration Submitted!</h1>
          <p className="text-neutral-600 mb-6">
            Your registration request has been submitted successfully. An administrator will review your request and approve it shortly.
          </p>
          <p className="text-sm text-neutral-500 mb-8">
            You will be able to log in once your account is approved.
          </p>
          <Link
            href="/login"
            className="btn btn-primary w-full"
          >
            Back to Login
          </Link>
        </div>
      </div>
    );
  }

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
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-3xl shadow-soft-lg p-8 lg:p-12">
          <div className="mb-8">
            <Link
              href="/login"
              className="inline-flex items-center text-primary-600 hover:text-primary-700 mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Login
            </Link>
            <h2 className="text-3xl font-bold text-neutral-900">Request Account</h2>
            <p className="text-neutral-600 mt-2">
              Submit your information to request access to the University LMS. An administrator will review and approve your request.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* University ID */}
            <div>
              <label htmlFor="university_id" className="label">
                University ID *
              </label>
              <input
                id="university_id"
                type="text"
                className="input"
                placeholder="e.g., STUD001"
                value={formData.university_id}
                onChange={(e) => setFormData({ ...formData, university_id: e.target.value })}
                required
              />
              <p className="text-xs text-neutral-500 mt-1">Your unique university identification number</p>
            </div>

            {/* Username */}
            <div>
              <label htmlFor="username" className="label">
                Username *
              </label>
              <input
                id="username"
                type="text"
                className="input"
                placeholder="e.g., john_doe"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                required
              />
            </div>

            {/* Full Name */}
            <div>
              <label htmlFor="name" className="label">
                Full Name *
              </label>
              <input
                id="name"
                type="text"
                className="input"
                placeholder="e.g., John Doe"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="label">
                University Email *
              </label>
              <input
                id="email"
                type="email"
                className="input"
                placeholder="e.g., john@university.edu"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>

            {/* Password */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="password" className="label">
                  Password *
                </label>
                <input
                  id="password"
                  type="password"
                  className="input"
                  placeholder="Enter password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                />
              </div>
              <div>
                <label htmlFor="confirmPassword" className="label">
                  Confirm Password *
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  className="input"
                  placeholder="Confirm password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  required
                />
              </div>
            </div>

            {/* Role */}
            <div>
              <label htmlFor="requested_role" className="label">
                Requested Role *
              </label>
              <select
                id="requested_role"
                className="input"
                value={formData.requested_role}
                onChange={(e) => setFormData({ ...formData, requested_role: e.target.value as any })}
                required
              >
                <option value="student">Student</option>
                <option value="professor">Professor</option>
                <option value="ta">Teaching Assistant (TA)</option>
              </select>
              <p className="text-xs text-neutral-500 mt-1">Select the role that best describes your position</p>
            </div>

            {/* Reason (Optional) */}
            <div>
              <label htmlFor="reason" className="label">
                Reason for Request (Optional)
              </label>
              <textarea
                id="reason"
                className="input"
                rows={3}
                placeholder="Briefly explain why you need access to the LMS..."
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
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
              {loading ? 'Submitting Request...' : 'Submit Registration Request'}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-neutral-200">
            <p className="text-sm text-neutral-600 text-center">
              Already have an account?{' '}
              <Link href="/login" className="text-primary-600 hover:text-primary-700 font-semibold">
                Sign in here
              </Link>
            </p>
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
