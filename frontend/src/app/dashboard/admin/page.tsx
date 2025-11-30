'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Users, BookOpen, GraduationCap, FileText, TrendingUp, LogOut, Plus, Edit2, Trash2, Eye } from 'lucide-react';
import { api } from '@/lib/api';

interface DashboardStats {
  total_users: number;
  total_students: number;
  total_professors: number;
  total_classes: number;
  total_enrollments: number;
  total_content: number;
}

interface User {
  id: number;
  university_id: string;
  username: string;
  name: string;
  email: string;
  role: string;
  is_active: boolean;
  created_at: string;
}

interface Class {
  id: number;
  class_code: string;
  title: string;
  description?: string;
  professor_id: number;
  professor_name?: string;
  term?: string;
  schedule?: string;
  location?: string;
  max_students?: number;
  is_active: boolean;
  enrollment_count?: number;
}

interface Content {
  id: number;
  class_id: number;
  class_title?: string;
  title: string;
  content_type: string;
  visibility: string;
  created_by: number;
  professor_name?: string;
  created_at: string;
}

interface PendingRegistration {
  id: number;
  university_id: string;
  username: string;
  name: string;
  email: string;
  requested_role: string;
  reason?: string;
  status: string;
  requested_at: string;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'classes' | 'enrollments' | 'content' | 'pending'>('overview');
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [content, setContent] = useState<Content[]>([]);
  const [pendingRegistrations, setPendingRegistrations] = useState<PendingRegistration[]>([]);
  const [loading, setLoading] = useState(true);

  // User creation modal
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [newUser, setNewUser] = useState({
    university_id: '',
    username: '',
    password: '',
    name: '',
    email: '',
    role: 'student' as 'professor' | 'student',
  });

  // Class creation modal
  const [showCreateClassModal, setShowCreateClassModal] = useState(false);
  const [newClass, setNewClass] = useState({
    class_code: '',
    title: '',
    description: '',
    professor_id: '',
    term: 'Fall 2024',
    schedule: '',
    location: '',
    max_students: 30,
  });

  // Enrollment modal
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [enrollment, setEnrollment] = useState({
    class_id: '',
    student_id: '',
  });

  // Content visibility modal
  const [showContentModal, setShowContentModal] = useState(false);
  const [selectedContent, setSelectedContent] = useState<Content | null>(null);
  const [newVisibility, setNewVisibility] = useState<'public' | 'private' | 'enrolled'>('public');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const dashboardData = await api.getAdminDashboard();
      setStats(dashboardData);

      const [usersData, classesData, contentData, pendingData] = await Promise.all([
        api.getAllUsers(),
        api.getAllClasses(),
        api.getAllContent(),
        api.getPendingRegistrations('pending'),
      ]);

      setUsers(usersData.users || []);
      setClasses(classesData.classes || []);
      setContent(contentData.content || []);
      setPendingRegistrations(pendingData.registrations || []);
    } catch (error: any) {
      console.error('Error fetching dashboard data:', error);
      if (error.response?.status === 401) {
        router.push('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async () => {
    try {
      await api.createUser(newUser);
      setShowCreateUserModal(false);
      setNewUser({
        university_id: '',
        username: '',
        password: '',
        name: '',
        email: '',
        role: 'student',
      });
      fetchDashboardData();
    } catch (error) {
      console.error('Error creating user:', error);
    }
  };

  const handleCreateClass = async () => {
    try {
      await api.createClass({
        ...newClass,
        professor_id: parseInt(newClass.professor_id),
      });
      setShowCreateClassModal(false);
      setNewClass({
        class_code: '',
        title: '',
        description: '',
        professor_id: '',
        term: 'Fall 2024',
        schedule: '',
        location: '',
        max_students: 30,
      });
      fetchDashboardData();
    } catch (error) {
      console.error('Error creating class:', error);
    }
  };

  const handleEnrollStudent = async () => {
    try {
      await api.enrollStudent(parseInt(enrollment.class_id), parseInt(enrollment.student_id));
      setShowEnrollModal(false);
      setEnrollment({ class_id: '', student_id: '' });
      fetchDashboardData();
    } catch (error) {
      console.error('Error enrolling student:', error);
    }
  };

  const handleUpdateContentVisibility = async () => {
    if (!selectedContent) return;
    try {
      await api.updateContentVisibility(selectedContent.id, newVisibility);
      setShowContentModal(false);
      setSelectedContent(null);
      fetchDashboardData();
    } catch (error) {
      console.error('Error updating content visibility:', error);
    }
  };

  const handleApproveRegistration = async (registrationId: number, approved: boolean) => {
    try {
      await api.approveRegistration(registrationId, approved);
      fetchDashboardData();
    } catch (error) {
      console.error('Error processing registration:', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  const professors = users.filter(u => u.role === 'professor');
  const students = users.filter(u => u.role === 'student');

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-neutral-600">Loading admin dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-neutral-50">
      {/* Header */}
      <header className="bg-white border-b border-neutral-200 shadow-soft">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-neutral-900">Admin Dashboard</h1>
              <p className="text-sm text-neutral-600">Complete system management - create users, manage classes, and oversee content</p>
            </div>
            <button
              onClick={handleLogout}
              className="btn bg-neutral-600 hover:bg-neutral-700 text-white"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
            <div className="bg-white rounded-2xl shadow-soft p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-neutral-600">Total Users</p>
                  <p className="text-3xl font-bold text-neutral-900">{stats.total_users}</p>
                </div>
                <Users className="w-10 h-10 text-neutral-500" />
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-soft p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-neutral-600">Students</p>
                  <p className="text-3xl font-bold text-primary-600">{stats.total_students}</p>
                </div>
                <Users className="w-10 h-10 text-primary-500" />
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-soft p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-neutral-600">Professors</p>
                  <p className="text-3xl font-bold text-success-600">{stats.total_professors}</p>
                </div>
                <GraduationCap className="w-10 h-10 text-success-500" />
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-soft p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-neutral-600">Classes</p>
                  <p className="text-3xl font-bold text-warning-600">{stats.total_classes}</p>
                </div>
                <BookOpen className="w-10 h-10 text-warning-500" />
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-soft p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-neutral-600">Enrollments</p>
                  <p className="text-3xl font-bold text-error-600">{stats.total_enrollments}</p>
                </div>
                <TrendingUp className="w-10 h-10 text-error-500" />
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-soft p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-neutral-600">Content</p>
                  <p className="text-3xl font-bold text-purple-600">{stats.total_content}</p>
                </div>
                <FileText className="w-10 h-10 text-purple-500" />
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-soft mb-6">
          <div className="border-b border-neutral-200">
            <nav className="flex space-x-8 px-6">
              {[
                { id: 'overview', label: 'Overview' },
                { id: 'pending', label: `Pending (${pendingRegistrations.length})` },
                { id: 'users', label: 'Users' },
                { id: 'classes', label: 'Classes' },
                { id: 'enrollments', label: 'Enrollments' },
                { id: 'content', label: 'Content' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-neutral-600 hover:text-neutral-900 hover:border-neutral-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-neutral-900">System Overview</h2>
                <p className="text-neutral-600">
                  Welcome to the University LMS v3.0 admin dashboard. You have complete control over users, classes, and content.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                  <div className="bg-primary-50 p-6 rounded-xl">
                    <h3 className="font-semibold text-primary-900 mb-3">Admin Capabilities</h3>
                    <ul className="space-y-2 text-sm text-primary-700">
                      <li>✓ Create all users (professors and students) with initial passwords</li>
                      <li>✓ Create classes and assign professors</li>
                      <li>✓ Enroll students in classes</li>
                      <li>✓ View and manage all content</li>
                      <li>✓ Change content visibility settings</li>
                      <li>✓ Reset user passwords and manage accounts</li>
                    </ul>
                  </div>
                  <div className="bg-success-50 p-6 rounded-xl">
                    <h3 className="font-semibold text-success-900 mb-3">System Design</h3>
                    <ul className="space-y-2 text-sm text-success-700">
                      <li>• Admin creates all accounts (no self-registration)</li>
                      <li>• Professors create and manage content</li>
                      <li>• Professors assign TAs from enrolled students</li>
                      <li>• Students access public and enrolled content</li>
                      <li>• Public content enables cross-class learning</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Pending Registrations Tab */}
            {activeTab === 'pending' && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-neutral-900">
                    Pending Registration Requests ({pendingRegistrations.length})
                  </h2>
                </div>

                {pendingRegistrations.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-neutral-600">No pending registration requests</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pendingRegistrations.map((registration) => (
                      <div
                        key={registration.id}
                        className="border border-neutral-200 rounded-xl p-6 hover:shadow-md transition-shadow"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                              <h3 className="text-lg font-semibold text-neutral-900">
                                {registration.name}
                              </h3>
                              <span className={`badge ${
                                registration.requested_role === 'professor' ? 'badge-success' :
                                registration.requested_role === 'ta' ? 'badge-warning' :
                                'badge-primary'
                              }`}>
                                {registration.requested_role}
                              </span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                              <div>
                                <span className="text-neutral-600">University ID:</span>
                                <span className="ml-2 font-mono text-neutral-900">{registration.university_id}</span>
                              </div>
                              <div>
                                <span className="text-neutral-600">Username:</span>
                                <span className="ml-2 text-neutral-900">{registration.username}</span>
                              </div>
                              <div>
                                <span className="text-neutral-600">Email:</span>
                                <span className="ml-2 text-neutral-900">{registration.email}</span>
                              </div>
                              <div>
                                <span className="text-neutral-600">Requested:</span>
                                <span className="ml-2 text-neutral-900">
                                  {new Date(registration.requested_at).toLocaleString()}
                                </span>
                              </div>
                            </div>

                            {registration.reason && (
                              <div className="mt-3 p-3 bg-neutral-50 rounded-lg">
                                <p className="text-xs text-neutral-600 mb-1">Reason:</p>
                                <p className="text-sm text-neutral-900">{registration.reason}</p>
                              </div>
                            )}
                          </div>

                          <div className="flex gap-2 ml-4">
                            <button
                              onClick={() => handleApproveRegistration(registration.id, true)}
                              className="btn bg-success-600 hover:bg-success-700 text-white"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleApproveRegistration(registration.id, false)}
                              className="btn bg-error-600 hover:bg-error-700 text-white"
                            >
                              Reject
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Users Tab */}
            {activeTab === 'users' && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-neutral-900">All Users ({users.length})</h2>
                  <button
                    onClick={() => setShowCreateUserModal(true)}
                    className="btn btn-primary"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create New User
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-neutral-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-neutral-600">University ID</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-neutral-600">Name</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-neutral-600">Email</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-neutral-600">Role</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-neutral-600">Status</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-neutral-600">Created</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-200">
                      {users.map((user) => (
                        <tr key={user.id} className="hover:bg-neutral-50">
                          <td className="px-4 py-3 text-sm font-mono text-neutral-900">{user.university_id}</td>
                          <td className="px-4 py-3 text-sm text-neutral-900">{user.name}</td>
                          <td className="px-4 py-3 text-sm text-neutral-600">{user.email}</td>
                          <td className="px-4 py-3">
                            <span className={`badge ${
                              user.role === 'admin' ? 'badge-error' :
                              user.role === 'professor' ? 'badge-success' :
                              'badge-primary'
                            }`}>
                              {user.role}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`badge ${user.is_active ? 'badge-success' : 'bg-neutral-200 text-neutral-700'}`}>
                              {user.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-neutral-600">
                            {new Date(user.created_at).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Classes Tab */}
            {activeTab === 'classes' && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-neutral-900">All Classes ({classes.length})</h2>
                  <button
                    onClick={() => setShowCreateClassModal(true)}
                    className="btn btn-primary"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create New Class
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-neutral-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-neutral-600">Code</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-neutral-600">Title</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-neutral-600">Professor</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-neutral-600">Term</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-neutral-600">Schedule</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-neutral-600">Enrollment</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-neutral-600">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-200">
                      {classes.map((cls) => (
                        <tr key={cls.id} className="hover:bg-neutral-50">
                          <td className="px-4 py-3 text-sm font-mono text-neutral-900">{cls.class_code}</td>
                          <td className="px-4 py-3 text-sm text-neutral-900">{cls.title}</td>
                          <td className="px-4 py-3 text-sm text-neutral-600">{cls.professor_name || `ID: ${cls.professor_id}`}</td>
                          <td className="px-4 py-3 text-sm text-neutral-600">{cls.term || 'N/A'}</td>
                          <td className="px-4 py-3 text-sm text-neutral-600">{cls.schedule || 'N/A'}</td>
                          <td className="px-4 py-3 text-sm text-neutral-600">
                            {cls.enrollment_count || 0}/{cls.max_students || 'N/A'}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`badge ${cls.is_active ? 'badge-success' : 'bg-neutral-200 text-neutral-700'}`}>
                              {cls.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Enrollments Tab */}
            {activeTab === 'enrollments' && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-neutral-900">Manage Enrollments</h2>
                  <button
                    onClick={() => setShowEnrollModal(true)}
                    className="btn btn-primary"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Enroll Student
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-primary-50 p-6 rounded-xl">
                    <h3 className="font-semibold text-primary-900 mb-3">Enrollment Process</h3>
                    <ol className="space-y-2 text-sm text-primary-700 list-decimal list-inside">
                      <li>Admin creates student accounts</li>
                      <li>Admin creates classes and assigns professors</li>
                      <li>Admin enrolls students in appropriate classes</li>
                      <li>Students can access content from enrolled classes</li>
                    </ol>
                  </div>
                  <div className="bg-success-50 p-6 rounded-xl">
                    <h3 className="font-semibold text-success-900 mb-3">Current Stats</h3>
                    <div className="space-y-2 text-sm text-success-700">
                      <p>Total Students: {students.length}</p>
                      <p>Total Classes: {classes.length}</p>
                      <p>Total Enrollments: {stats?.total_enrollments || 0}</p>
                      <p>Average per Class: {classes.length > 0 ? Math.round((stats?.total_enrollments || 0) / classes.length) : 0}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Content Tab */}
            {activeTab === 'content' && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-neutral-900">All Course Content ({content.length})</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-neutral-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-neutral-600">Title</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-neutral-600">Class</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-neutral-600">Type</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-neutral-600">Professor</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-neutral-600">Visibility</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-neutral-600">Created</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-neutral-600">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-200">
                      {content.map((item) => (
                        <tr key={item.id} className="hover:bg-neutral-50">
                          <td className="px-4 py-3 text-sm text-neutral-900">{item.title}</td>
                          <td className="px-4 py-3 text-sm text-neutral-600">{item.class_title || `ID: ${item.class_id}`}</td>
                          <td className="px-4 py-3">
                            <span className="badge badge-primary">{item.content_type}</span>
                          </td>
                          <td className="px-4 py-3 text-sm text-neutral-600">{item.professor_name || `ID: ${item.created_by}`}</td>
                          <td className="px-4 py-3">
                            <span className={`badge ${
                              item.visibility === 'public' ? 'badge-success' :
                              item.visibility === 'private' ? 'badge-error' :
                              'bg-warning-100 text-warning-700'
                            }`}>
                              {item.visibility}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-neutral-600">
                            {new Date(item.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => {
                                setSelectedContent(item);
                                setNewVisibility(item.visibility as any);
                                setShowContentModal(true);
                              }}
                              className="text-primary-600 hover:text-primary-800"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Create User Modal */}
      {showCreateUserModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-soft-lg p-8 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-neutral-900 mb-4">Create New User</h3>

            <div className="space-y-4">
              <div>
                <label className="label">University ID</label>
                <input
                  type="text"
                  className="input"
                  value={newUser.university_id}
                  onChange={(e) => setNewUser({ ...newUser, university_id: e.target.value })}
                  placeholder="e.g., STUD001"
                />
              </div>

              <div>
                <label className="label">Username</label>
                <input
                  type="text"
                  className="input"
                  value={newUser.username}
                  onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                  placeholder="e.g., john_doe"
                />
              </div>

              <div>
                <label className="label">Full Name</label>
                <input
                  type="text"
                  className="input"
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  placeholder="e.g., John Doe"
                />
              </div>

              <div>
                <label className="label">Email</label>
                <input
                  type="email"
                  className="input"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  placeholder="e.g., john@university.edu"
                />
              </div>

              <div>
                <label className="label">Role</label>
                <select
                  className="input"
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value as 'professor' | 'student' })}
                >
                  <option value="student">Student</option>
                  <option value="professor">Professor</option>
                </select>
              </div>

              <div>
                <label className="label">Initial Password</label>
                <input
                  type="password"
                  className="input"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  placeholder="Set initial password"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowCreateUserModal(false)}
                  className="btn bg-neutral-200 text-neutral-700 hover:bg-neutral-300 flex-1"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateUser}
                  disabled={!newUser.university_id || !newUser.username || !newUser.name || !newUser.email || !newUser.password}
                  className="btn btn-primary flex-1"
                >
                  Create User
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Class Modal */}
      {showCreateClassModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-soft-lg p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-2xl font-bold text-neutral-900 mb-6">Create New Class</h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Class Code *</label>
                <input
                  type="text"
                  className="input"
                  value={newClass.class_code}
                  onChange={(e) => setNewClass({ ...newClass, class_code: e.target.value })}
                  placeholder="e.g., CSE412"
                />
              </div>

              <div>
                <label className="label">Title *</label>
                <input
                  type="text"
                  className="input"
                  value={newClass.title}
                  onChange={(e) => setNewClass({ ...newClass, title: e.target.value })}
                  placeholder="e.g., Database Management"
                />
              </div>

              <div className="col-span-2">
                <label className="label">Description</label>
                <textarea
                  className="input"
                  rows={3}
                  value={newClass.description}
                  onChange={(e) => setNewClass({ ...newClass, description: e.target.value })}
                  placeholder="Course description..."
                />
              </div>

              <div>
                <label className="label">Professor *</label>
                <select
                  className="input"
                  value={newClass.professor_id}
                  onChange={(e) => setNewClass({ ...newClass, professor_id: e.target.value })}
                >
                  <option value="">Select Professor</option>
                  {professors.map((prof) => (
                    <option key={prof.id} value={prof.id}>
                      {prof.name} ({prof.university_id})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Term</label>
                <input
                  type="text"
                  className="input"
                  value={newClass.term}
                  onChange={(e) => setNewClass({ ...newClass, term: e.target.value })}
                  placeholder="e.g., Fall 2024"
                />
              </div>

              <div>
                <label className="label">Schedule</label>
                <input
                  type="text"
                  className="input"
                  value={newClass.schedule}
                  onChange={(e) => setNewClass({ ...newClass, schedule: e.target.value })}
                  placeholder="e.g., MWF 10:00-11:00"
                />
              </div>

              <div>
                <label className="label">Location</label>
                <input
                  type="text"
                  className="input"
                  value={newClass.location}
                  onChange={(e) => setNewClass({ ...newClass, location: e.target.value })}
                  placeholder="e.g., BYENG 210"
                />
              </div>

              <div>
                <label className="label">Max Students</label>
                <input
                  type="number"
                  className="input"
                  value={newClass.max_students}
                  onChange={(e) => setNewClass({ ...newClass, max_students: parseInt(e.target.value) })}
                  placeholder="30"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-6">
              <button
                onClick={() => setShowCreateClassModal(false)}
                className="btn bg-neutral-200 text-neutral-700 hover:bg-neutral-300 flex-1"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateClass}
                disabled={!newClass.class_code || !newClass.title || !newClass.professor_id}
                className="btn btn-primary flex-1"
              >
                Create Class
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Enroll Student Modal */}
      {showEnrollModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-soft-lg p-8 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-neutral-900 mb-4">Enroll Student in Class</h3>

            <div className="space-y-4">
              <div>
                <label className="label">Student</label>
                <select
                  className="input"
                  value={enrollment.student_id}
                  onChange={(e) => setEnrollment({ ...enrollment, student_id: e.target.value })}
                >
                  <option value="">Select Student</option>
                  {students.map((student) => (
                    <option key={student.id} value={student.id}>
                      {student.name} ({student.university_id})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Class</label>
                <select
                  className="input"
                  value={enrollment.class_id}
                  onChange={(e) => setEnrollment({ ...enrollment, class_id: e.target.value })}
                >
                  <option value="">Select Class</option>
                  {classes.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.class_code} - {cls.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowEnrollModal(false)}
                  className="btn bg-neutral-200 text-neutral-700 hover:bg-neutral-300 flex-1"
                >
                  Cancel
                </button>
                <button
                  onClick={handleEnrollStudent}
                  disabled={!enrollment.class_id || !enrollment.student_id}
                  className="btn btn-primary flex-1"
                >
                  Enroll
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Content Visibility Modal */}
      {showContentModal && selectedContent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-soft-lg p-8 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-neutral-900 mb-4">Manage Content Visibility</h3>

            <div className="mb-4">
              <p className="text-sm text-neutral-600 mb-2">Content: <strong>{selectedContent.title}</strong></p>
              <p className="text-sm text-neutral-600">Current visibility: <strong>{selectedContent.visibility}</strong></p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="label">New Visibility</label>
                <select
                  className="input"
                  value={newVisibility}
                  onChange={(e) => setNewVisibility(e.target.value as any)}
                >
                  <option value="public">Public (All students can view)</option>
                  <option value="enrolled">Enrolled (Only enrolled students)</option>
                  <option value="private">Private (Professor only)</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    setShowContentModal(false);
                    setSelectedContent(null);
                  }}
                  className="btn bg-neutral-200 text-neutral-700 hover:bg-neutral-300 flex-1"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateContentVisibility}
                  className="btn btn-primary flex-1"
                >
                  Update Visibility
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
