-- University LMS Database Schema
-- Admin-controlled system with TA role support

-- Drop old tables if they exist
DROP TABLE IF EXISTS student_doubts CASCADE;
DROP TABLE IF EXISTS ta_assignments CASCADE;
DROP TABLE IF EXISTS course_content CASCADE;
DROP TABLE IF EXISTS enrollments CASCADE;
DROP TABLE IF EXISTS classes CASCADE;
DROP TABLE IF EXISTS pending_registrations CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Users table (admin, professor, ta, student)
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    university_id VARCHAR(20) UNIQUE NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'professor', 'ta', 'student')),
    office_hours VARCHAR(255),
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP,
    is_active BOOLEAN DEFAULT true
);

-- Pending registrations table (for self-registration with admin approval)
CREATE TABLE pending_registrations (
    id SERIAL PRIMARY KEY,
    university_id VARCHAR(20) NOT NULL,
    username VARCHAR(100) NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    requested_role VARCHAR(20) NOT NULL CHECK (requested_role IN ('student', 'professor', 'ta')),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    reason TEXT,
    requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reviewed_by INTEGER REFERENCES users(id),
    reviewed_at TIMESTAMP,
    UNIQUE(university_id, email)
);

-- Classes table
CREATE TABLE classes (
    id SERIAL PRIMARY KEY,
    class_code VARCHAR(20) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    professor_id INTEGER REFERENCES users(id),
    term VARCHAR(50),
    schedule VARCHAR(100),
    location VARCHAR(100),
    max_students INTEGER DEFAULT 30,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Enrollments table (for students)
CREATE TABLE enrollments (
    id SERIAL PRIMARY KEY,
    class_id INTEGER REFERENCES classes(id) ON DELETE CASCADE,
    student_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'dropped', 'completed')),
    grade VARCHAR(5),
    UNIQUE(class_id, student_id)
);

-- TA assignments table (TAs assigned to classes)
CREATE TABLE ta_assignments (
    id SERIAL PRIMARY KEY,
    class_id INTEGER REFERENCES classes(id) ON DELETE CASCADE,
    ta_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    assigned_by INTEGER REFERENCES users(id),
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(class_id, ta_id)
);

-- Course content table
CREATE TABLE course_content (
    id SERIAL PRIMARY KEY,
    class_id INTEGER REFERENCES classes(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    content_type VARCHAR(50) CHECK (content_type IN ('lecture', 'assignment', 'material', 'announcement')),
    description TEXT,
    content TEXT,
    visibility VARCHAR(20) DEFAULT 'private' CHECK (visibility IN ('public', 'private', 'enrolled')),
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    due_date TIMESTAMP
);

-- Student doubts/questions for TAs
CREATE TABLE student_doubts (
    id SERIAL PRIMARY KEY,
    class_id INTEGER REFERENCES classes(id) ON DELETE CASCADE,
    student_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    ta_id INTEGER REFERENCES users(id),
    question TEXT NOT NULL,
    answer TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'answered', 'closed')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    answered_at TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_university_id ON users(university_id);
CREATE INDEX idx_classes_professor ON classes(professor_id);
CREATE INDEX idx_enrollments_student ON enrollments(student_id);
CREATE INDEX idx_enrollments_class ON enrollments(class_id);
CREATE INDEX idx_content_class ON course_content(class_id);
CREATE INDEX idx_content_visibility ON course_content(visibility);
CREATE INDEX idx_ta_assignments_ta ON ta_assignments(ta_id);
CREATE INDEX idx_ta_assignments_class ON ta_assignments(class_id);
CREATE INDEX idx_doubts_ta ON student_doubts(ta_id);
CREATE INDEX idx_doubts_student ON student_doubts(student_id);

-- Insert default admin account
INSERT INTO users (university_id, username, password, name, email, role, created_by, is_active)
VALUES ('ADMIN001', 'admin', 'admin123', 'System Administrator', 'admin@university.edu', 'admin', NULL, true);

SELECT 'Schema created successfully with TA role!' as message;
