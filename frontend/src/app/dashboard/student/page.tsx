'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { BookOpen, Calendar, GraduationCap, LogOut, Search, TrendingUp, Users } from 'lucide-react';
import api from '@/lib/api';

interface Student {
  universityID: number;
  totalGPA: number;
  year: string;
  classes: string[];
  estimatedGradTerm: string;
  inGradSchool: boolean;
}

interface User {
  universityID: number;
  name: string;
  universityEmail: string;
  role: string;
  college: string;
}

interface ClassInfo {
  classid: number;
  title: string;
  professorid: number;
  size: number;
  session: string;
  time: string;
  days: string;
  location: string;
  ishonors: boolean;
  term: string;
  professor_name?: string;
}

export default function StudentDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [student, setStudent] = useState<Student | null>(null);
  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [availableClasses, setAvailableClasses] = useState<ClassInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [enrolling, setEnrolling] = useState<number | null>(null);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    const token = localStorage.getItem('token');

    if (!userData || !token) {
      router.push('/login');
      return;
    }

    const parsedUser = JSON.parse(userData);
    setUser(parsedUser);
    loadStudentData(parsedUser.universityID);
  }, [router]);

  const loadStudentData = async (id: number) => {
    try {
      const [profileRes, scheduleRes, availableRes] = await Promise.all([
        api.getStudentProfile(id),
        api.getStudentSchedule(id),
        api.browseClasses({ term: 'Fall 2024' })
      ]);

      setStudent(profileRes);
      setClasses(scheduleRes);
      setAvailableClasses(availableRes);
    } catch (error) {
      console.error('Error loading student data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  const handleEnroll = async (classCode: string) => {
    if (!user) return;

    setEnrolling(parseInt(classCode));
    try {
      await api.enrollInClass(user.universityID, classCode);
      await loadStudentData(user.universityID);
    } catch (error) {
      console.error('Error enrolling:', error);
      alert('Failed to enroll in class');
    } finally {
      setEnrolling(null);
    }
  };

  const handleDrop = async (classCode: string) => {
    if (!user || !confirm('Are you sure you want to drop this class?')) return;

    try {
      await api.dropClass(user.universityID, classCode);
      await loadStudentData(user.universityID);
    } catch (error) {
      console.error('Error dropping class:', error);
      alert('Failed to drop class');
    }
  };

  const filteredAvailableClasses = availableClasses.filter(c =>
    !student?.classes.includes(c.classid.toString()) &&
    (c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
     c.classid.toString().includes(searchTerm))
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
          <p className="mt-4 text-neutral-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-50">
      {/* Header */}
      <header className="border-b border-neutral-200 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <GraduationCap className="w-8 h-8 text-primary-500" />
              <div>
                <h1 className="text-2xl font-bold text-neutral-900">Student Dashboard</h1>
                <p className="text-sm text-neutral-600">{user?.name}</p>
              </div>
            </div>
            <button onClick={handleLogout} className="btn btn-ghost">
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="stat-card">
            <div className="stat-label">GPA</div>
            <div className="stat-value">{student?.totalGPA.toFixed(2)}</div>
            <div className="flex items-center gap-1 mt-2">
              <TrendingUp className="w-4 h-4 text-success-600" />
              <span className="stat-delta stat-delta-positive">
                {student?.totalGPA && student.totalGPA >= 3.5 ? 'Dean\'s List' : 'Good Standing'}
              </span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-label">Year</div>
            <div className="stat-value">{student?.year}</div>
            <p className="text-sm text-neutral-600 mt-2">{student?.college}</p>
          </div>

          <div className="stat-card">
            <div className="stat-label">Enrolled Classes</div>
            <div className="stat-value">{student?.classes.length || 0}</div>
            <p className="text-sm text-neutral-600 mt-2">This semester</p>
          </div>

          <div className="stat-card">
            <div className="stat-label">Graduation</div>
            <div className="stat-value text-2xl">{student?.estimatedGradTerm}</div>
            <p className="text-sm text-neutral-600 mt-2">
              {student?.inGradSchool ? 'Graduate School' : 'Undergraduate'}
            </p>
          </div>
        </div>

        {/* My Schedule */}
        <div className="card mb-8">
          <div className="card-body">
            <div className="flex items-center gap-2 mb-6">
              <Calendar className="w-5 h-5 text-primary-500" />
              <h2 className="text-xl font-bold text-neutral-900">My Schedule</h2>
            </div>

            {classes.length === 0 ? (
              <div className="text-center py-8">
                <BookOpen className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
                <p className="text-neutral-600">No classes enrolled yet</p>
                <p className="text-sm text-neutral-500 mt-1">Browse available classes below to enroll</p>
              </div>
            ) : (
              <div className="space-y-3">
                {classes.map((cls) => (
                  <div
                    key={cls.classid}
                    className="flex items-center justify-between p-4 rounded-lg border border-neutral-200 hover:border-primary-300 hover:bg-primary-50/50 transition-all"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-neutral-900">{cls.title}</h3>
                        {cls.ishonors && (
                          <span className="badge badge-warning">Honors</span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-neutral-600">
                        <span className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          Class {cls.classid}
                        </span>
                        <span>{cls.days} {cls.time}</span>
                        <span>{cls.location}</span>
                        <span className="badge badge-primary">Session {cls.session}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDrop(cls.classid.toString())}
                      className="btn btn-ghost text-error-600 hover:bg-error-50"
                    >
                      Drop
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Browse Classes */}
        <div className="card">
          <div className="card-body">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Search className="w-5 h-5 text-primary-500" />
                <h2 className="text-xl font-bold text-neutral-900">Browse Classes</h2>
              </div>
            </div>

            {/* Search */}
            <div className="mb-6">
              <input
                type="text"
                placeholder="Search by class name or ID..."
                className="input"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Available Classes */}
            <div className="space-y-3">
              {filteredAvailableClasses.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-neutral-600">No available classes found</p>
                </div>
              ) : (
                filteredAvailableClasses.map((cls) => (
                  <div
                    key={cls.classid}
                    className="flex items-center justify-between p-4 rounded-lg border border-neutral-200 hover:border-primary-300 hover:bg-primary-50/50 transition-all"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-neutral-900">{cls.title}</h3>
                        {cls.ishonors && (
                          <span className="badge badge-warning">Honors</span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-neutral-600">
                        <span className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          Class {cls.classid}
                        </span>
                        <span>{cls.days} {cls.time}</span>
                        <span>{cls.location}</span>
                        <span className="badge badge-primary">Session {cls.session}</span>
                        <span className="text-neutral-500">{cls.size} seats</span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleEnroll(cls.classid.toString())}
                      disabled={enrolling === cls.classid}
                      className="btn btn-primary"
                    >
                      {enrolling === cls.classid ? 'Enrolling...' : 'Enroll'}
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
