'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { BookOpen, FileText, Users, LogOut, Plus, Edit2, Trash2 } from 'lucide-react';
import { api } from '@/lib/api';

export default function ProfessorDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'classes' | 'content' | 'tas'>('classes');
  const [classes, setClasses] = useState<any[]>([]);
  const [content, setContent] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Content creation modal
  const [showCreateContentModal, setShowCreateContentModal] = useState(false);
  const [newContent, setNewContent] = useState({
    class_id: '',
    title: '',
    content_type: 'lecture' as 'lecture' | 'assignment' | 'material' | 'announcement',
    description: '',
    content: '',
    visibility: 'private' as 'public' | 'private' | 'enrolled',
    due_date: '',
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [classesData, contentData] = await Promise.all([
        api.getProfessorClasses(),
        api.getProfessorContent(),
      ]);

      setClasses(classesData.classes || []);
      setContent(contentData.content || []);
    } catch (error: any) {
      console.error('Error fetching dashboard data:', error);
      if (error.response?.status === 401) {
        router.push('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreateContent = async () => {
    try {
      await api.createContent({
        ...newContent,
        class_id: parseInt(newContent.class_id),
      });
      setShowCreateContentModal(false);
      setNewContent({
        class_id: '',
        title: '',
        content_type: 'lecture',
        description: '',
        content: '',
        visibility: 'private',
        due_date: '',
      });
      fetchDashboardData();
    } catch (error) {
      console.error('Error creating content:', error);
    }
  };

  const handleDeleteContent = async (contentId: number) => {
    if (confirm('Are you sure you want to delete this content?')) {
      try {
        await api.deleteContent(contentId);
        fetchDashboardData();
      } catch (error) {
        console.error('Error deleting content:', error);
      }
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-neutral-600">Loading professor dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-success-50 via-white to-neutral-50">
      {/* Header */}
      <header className="bg-white border-b border-neutral-200 shadow-soft">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-neutral-900">Professor Dashboard</h1>
              <p className="text-sm text-neutral-600">Manage your classes and course content</p>
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
        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-soft mb-6">
          <div className="border-b border-neutral-200">
            <nav className="flex space-x-8 px-6">
              {[
                { id: 'classes', label: 'My Classes' },
                { id: 'content', label: 'Course Content' },
                { id: 'tas', label: 'Teaching Assistants' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-success-500 text-success-600'
                      : 'border-transparent text-neutral-600 hover:text-neutral-900 hover:border-neutral-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {/* Classes Tab */}
            {activeTab === 'classes' && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-neutral-900">
                    My Classes ({classes.length})
                  </h2>
                </div>

                {classes.length === 0 ? (
                  <div className="text-center py-12">
                    <BookOpen className="w-16 h-16 text-neutral-400 mx-auto mb-4" />
                    <p className="text-neutral-600">No classes assigned yet</p>
                    <p className="text-sm text-neutral-500 mt-2">
                      Contact your administrator to be assigned to classes
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {classes.map((cls) => (
                      <div
                        key={cls.id}
                        className="border border-neutral-200 rounded-xl p-6 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <h3 className="text-lg font-semibold text-neutral-900">{cls.title}</h3>
                          <span className="badge badge-success">{cls.class_code}</span>
                        </div>
                        <p className="text-sm text-neutral-600 mb-4">{cls.description || 'No description'}</p>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <span className="text-neutral-600">Term:</span>
                            <p className="font-medium text-neutral-900">{cls.term || 'N/A'}</p>
                          </div>
                          <div>
                            <span className="text-neutral-600">Students:</span>
                            <p className="font-medium text-neutral-900">{cls.enrollment_count || 0}</p>
                          </div>
                          <div className="col-span-2">
                            <span className="text-neutral-600">Schedule:</span>
                            <p className="font-medium text-neutral-900">{cls.schedule || 'N/A'}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Content Tab */}
            {activeTab === 'content' && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-neutral-900">
                    Course Content ({content.length})
                  </h2>
                  <button
                    onClick={() => setShowCreateContentModal(true)}
                    className="btn btn-primary"
                    disabled={classes.length === 0}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create Content
                  </button>
                </div>

                {content.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="w-16 h-16 text-neutral-400 mx-auto mb-4" />
                    <p className="text-neutral-600">No content created yet</p>
                    <p className="text-sm text-neutral-500 mt-2">
                      Create lectures, assignments, and materials for your classes
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-neutral-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-neutral-600">Title</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-neutral-600">Class</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-neutral-600">Type</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-neutral-600">Visibility</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-neutral-600">Due Date</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-neutral-600">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-200">
                        {content.map((item) => (
                          <tr key={item.id} className="hover:bg-neutral-50">
                            <td className="px-4 py-3 text-sm text-neutral-900">{item.title}</td>
                            <td className="px-4 py-3 text-sm text-neutral-600">
                              {item.class_code} - {item.class_title}
                            </td>
                            <td className="px-4 py-3">
                              <span className="badge badge-primary">{item.content_type}</span>
                            </td>
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
                              {item.due_date ? new Date(item.due_date).toLocaleDateString() : 'N/A'}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleDeleteContent(item.id)}
                                  className="text-error-600 hover:text-error-800"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* TAs Tab */}
            {activeTab === 'tas' && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-neutral-900">Teaching Assistants</h2>
                </div>
                <div className="text-center py-12">
                  <Users className="w-16 h-16 text-neutral-400 mx-auto mb-4" />
                  <p className="text-neutral-600">TA management coming soon</p>
                  <p className="text-sm text-neutral-500 mt-2">
                    You'll be able to assign TAs to your classes here
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Create Content Modal */}
      {showCreateContentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-soft-lg p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-2xl font-bold text-neutral-900 mb-6">Create Course Content</h3>

            <div className="space-y-4">
              <div>
                <label className="label">Class *</label>
                <select
                  className="input"
                  value={newContent.class_id}
                  onChange={(e) => setNewContent({ ...newContent, class_id: e.target.value })}
                >
                  <option value="">Select Class</option>
                  {classes.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.class_code} - {cls.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Title *</label>
                <input
                  type="text"
                  className="input"
                  value={newContent.title}
                  onChange={(e) => setNewContent({ ...newContent, title: e.target.value })}
                  placeholder="e.g., Week 1 Lecture - Introduction"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Content Type *</label>
                  <select
                    className="input"
                    value={newContent.content_type}
                    onChange={(e) => setNewContent({ ...newContent, content_type: e.target.value as any })}
                  >
                    <option value="lecture">Lecture</option>
                    <option value="assignment">Assignment</option>
                    <option value="material">Material</option>
                    <option value="announcement">Announcement</option>
                  </select>
                </div>

                <div>
                  <label className="label">Visibility *</label>
                  <select
                    className="input"
                    value={newContent.visibility}
                    onChange={(e) => setNewContent({ ...newContent, visibility: e.target.value as any })}
                  >
                    <option value="public">Public (All students)</option>
                    <option value="enrolled">Enrolled (Class only)</option>
                    <option value="private">Private (TAs & Professor)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="label">Description</label>
                <textarea
                  className="input"
                  rows={3}
                  value={newContent.description}
                  onChange={(e) => setNewContent({ ...newContent, description: e.target.value })}
                  placeholder="Brief description..."
                />
              </div>

              <div>
                <label className="label">Content</label>
                <textarea
                  className="input"
                  rows={5}
                  value={newContent.content}
                  onChange={(e) => setNewContent({ ...newContent, content: e.target.value })}
                  placeholder="Full content here..."
                />
              </div>

              {newContent.content_type === 'assignment' && (
                <div>
                  <label className="label">Due Date</label>
                  <input
                    type="datetime-local"
                    className="input"
                    value={newContent.due_date}
                    onChange={(e) => setNewContent({ ...newContent, due_date: e.target.value })}
                  />
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowCreateContentModal(false)}
                  className="btn bg-neutral-200 text-neutral-700 hover:bg-neutral-300 flex-1"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateContent}
                  disabled={!newContent.class_id || !newContent.title}
                  className="btn btn-primary flex-1"
                >
                  Create Content
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
