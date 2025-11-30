# University LMS v3.0 - Complete System Guide

## 🎯 System Overview

This is a **realistic, admin-controlled Learning Management System** designed for actual university use. The system eliminates unrealistic self-registration and implements proper administrative control over all users and content.

## 🔑 Default Login

**Admin Account:**
- University ID: `ADMIN001`
- Password: `admin123`

## 📊 New Database Schema

The system uses a completely redesigned database with 5 main tables:

### 1. users
- Single table for all users (replaces member, student, professor, ta tables)
- Roles: `admin`, `professor`, `student`
- All users created by admin with initial passwords

### 2. classes
- Simplified class structure
- Direct professor assignment
- Track max students and active status

### 3. enrollments
- Student enrollment records
- Status tracking (active, dropped, completed)

### 4. course_content
- Professors create lectures, assignments, materials, announcements
- Visibility: `public`, `private`, `enrolled`
- Public content viewable by all students

### 5. ta_assignments
- TA is NOT a role, it's a relationship
- Professors assign TAs from enrolled students
- TAs get additional permissions for the class

## 🎭 User Roles & Capabilities

### Admin (Single Authority)

**Can:**
- Approve/reject registration requests
- Create users manually (professors, students, TAs)
- Create classes and assign professors
- Enroll students in classes
- View all system activity
- Change content visibility
- Reset any user's password
- Deactivate users
- Monitor all content

**Cannot:**
- Create course content (professor/TA's job)

### Professor

**Can:**
- View assigned classes
- Create course content (lectures, assignments, etc.)
- Set content visibility (public/private/enrolled)
- Assign TAs to classes (admin assigns TA role, professor assigns to classes)
- View class rosters
- Manage own content
- Remove students from class

**Cannot:**
- Create users
- Enroll students (admin's job)
- Edit other professors' content

### Teaching Assistant (TA)

**Can:**
- View assigned classes (assigned by professor)
- Create course content (lectures, assignments, etc.)
- Set content visibility (public/private/enrolled)
- View ALL content including professor's private content
- View class rosters
- Manage own content
- Access all professor features EXCEPT removing students

**Cannot:**
- Remove/unenroll students from classes
- Create users
- Assign other TAs

### Student

**Can:**
- Self-register (requires admin approval)
- View enrolled classes
- Access public content from ANY class
- Access enrolled content from OWN classes
- View schedule

**Cannot:**
- Self-enroll in classes (admin enrolls them)
- Create content
- View private content (professor/TA only)

## 🔄 Complete Workflows

### 1. Admin Creates System

```
Admin logs in
→ Creates professors (sets university_id, name, email, password)
→ Creates students (sets university_id, name, email, password)
→ Creates classes (sets code, title, schedule, assigns professor)
→ Enrolls students in classes
→ System is ready for use
```

### 2. Professor Creates Content

```
Professor logs in
→ Views assigned classes
→ Creates content (lecture/assignment/material)
→ Sets visibility:
   - Public: All students can view
   - Enrolled: Only students in this class
   - Private: Only TAs and professor
→ Assigns TAs from enrolled students
→ Students can now access content
```

### 3. Student Accesses Content

```
Student logs in
→ Views enrolled classes
→ Sees schedule and TA status
→ Browses content:
   - Public content from ALL classes
   - Private/Enrolled content from ENROLLED classes
→ Completes assignments
```

## 🎯 API Endpoints

### Authentication
- `POST /api/auth/login` - Login with university_id + password
- `POST /api/auth/logout` - Logout

### Admin Endpoints
- `GET /api/admin/dashboard` - System statistics
- `GET /api/admin/users` - List all users (filter by role)
- `POST /api/admin/users/create` - Create new user
- `PATCH /api/admin/users/{id}` - Update user
- `POST /api/admin/users/{id}/reset-password` - Reset password
- `GET /api/admin/classes` - List all classes
- `POST /api/admin/classes/create` - Create class
- `POST /api/admin/enrollments/create` - Enroll student
- `GET /api/admin/classes/{id}/students` - View roster
- `GET /api/admin/content` - View all content
- `PATCH /api/admin/content/{id}/visibility` - Change visibility

### Professor Endpoints
- `GET /api/professor/my-classes` - View assigned classes
- `GET /api/professor/classes/{id}/roster` - View class roster
- `POST /api/professor/content/create` - Create content
- `GET /api/professor/content` - View own content
- `PATCH /api/professor/content/{id}` - Update content
- `DELETE /api/professor/content/{id}` - Delete content
- `POST /api/professor/ta/assign` - Assign TA
- `DELETE /api/professor/ta/{id}` - Remove TA
- `GET /api/professor/classes/{id}/tas` - View class TAs

### Student Endpoints
- `GET /api/student/my-classes` - View enrolled classes
- `GET /api/student/content` - View accessible content
- `GET /api/student/content/{id}` - View content details
- `GET /api/student/ta/my-assignments` - View TA assignments
- `GET /api/student/dashboard` - Dashboard stats

## 🚀 Next Steps for Frontend

### 1. Update Login Page
- Single input for University ID
- Single input for Password
- Remove role selection (role comes from database)
- Show default admin credentials

### 2. Rebuild Admin Dashboard

**Tabs:**
- Overview (statistics)
- Users (create, list, edit, reset passwords)
- Classes (create, list, assign professors)
- Enrollments (enroll students, view rosters)
- Content (view all, change visibility)

### 3. Rebuild Professor Dashboard

**Tabs:**
- My Classes (list with stats)
- Course Content (create, manage)
- TAs (assign from students, remove)
- Rosters (view enrolled students)

### 4. Rebuild Student Dashboard

**Tabs:**
- My Classes (enrolled classes)
- Browse Content (public + enrolled content)
- TA Assignments (if applicable)

## 🎨 Design Principles

1. **Admin Controls Everything**
   - No self-registration
   - No self-enrollment
   - Admin creates all accounts

2. **Professors Create Content**
   - Full content management
   - Visibility control
   - TA assignment from students

3. **Students Consume Content**
   - Public content (cross-class learning)
   - Enrolled content (class-specific)
   - TA role (additional permissions)

4. **Clear Separation**
   - Admin: System management
   - Professor: Content & pedagogy
   - Student: Learning & participation

## 📝 Migration Notes

The old schema has been preserved in backup tables. The new schema is active and ready to use. All old endpoints in `/api/auth`, `/api/student`, `/api/professor`, `/api/ta`, `/api/admin` have been replaced with new implementations.

## 🔒 Security Notes

- Passwords are currently stored in plain text for development
- In production, implement bcrypt hashing
- JWT tokens used for session management
- Role-based access control on all endpoints
- Professors can only modify their own content
- Students can only access appropriate content

## 🎓 Real-World Benefits

1. **Matches University Processes**: Admin creates accounts, just like real registrars
2. **Content Sharing**: Public content allows cross-class learning
3. **TA Management**: Professors assign TAs from their students
4. **Proper Oversight**: Admin can monitor all content
5. **Scalable**: Easy to add new features (grading, assignments, etc.)

---

**System Version**: 3.0.0
**Last Updated**: 2025
**Status**: ✅ Backend Complete, Frontend In Progress
