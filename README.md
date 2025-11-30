# University Learning Management System

A modern, admin-controlled Learning Management System built with Next.js, FastAPI, and PostgreSQL. Designed for real-world university operations with proper role-based access control and administrative oversight.

## Features

- **Admin-Controlled System**: All users are created and managed by administrators
- **Self-Registration with Approval**: Students, professors, and TAs can request accounts
- **Role-Based Dashboards**: Separate interfaces for Admin, Professor, TA, and Student roles
- **Course Content Management**: Professors and TAs can create and manage course materials
- **Flexible Content Visibility**: Public, private, and enrolled-only content options
- **TA Assignment System**: Professors can assign teaching assistants from enrolled students
- **Cross-Class Learning**: Public content accessible across all classes

## Tech Stack

### Frontend
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **Axios** - HTTP client for API requests

### Backend
- **FastAPI** - Modern Python web framework
- **PostgreSQL** - Relational database
- **SQLAlchemy** - Database ORM
- **Pydantic** - Data validation

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Python 3.10+
- PostgreSQL 14+

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd university-lms
   ```

2. **Set up the database**
   ```bash
   # Create PostgreSQL database
   createdb university_db

   # Apply schema
   cd database
   psql -U <your-username> -d university_db -f schema.sql
   ```

3. **Set up the backend**
   ```bash
   cd backend-api
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt

   # Start the backend server
   uvicorn app.main:app --reload --port 8000
   ```

4. **Set up the frontend**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

5. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - API Docs: http://localhost:8000/docs

### Default Admin Account

- **University ID**: `ADMIN001`
- **Password**: `admin123`

**⚠️ Important**: Change the admin password immediately in production!

## User Roles

### Admin
- Approve/reject registration requests
- Create users (professors, students, TAs)
- Create classes and assign professors
- Enroll students in classes
- Monitor all content and system activity
- Reset user passwords

### Professor
- View assigned classes
- Create course content (lectures, assignments, materials)
- Set content visibility (public/private/enrolled)
- Assign TAs to classes
- View class rosters
- Manage own content

### Teaching Assistant (TA)
- View assigned classes
- Create and manage course content
- Access all class content including private materials
- View class rosters
- Same permissions as professors except student removal

### Student
- Self-register (requires admin approval)
- View enrolled classes
- Access public content from any class
- Access enrolled content from own classes
- View TA assignments if applicable

## API Documentation

Full API documentation is available at http://localhost:8000/docs when the backend is running.

### Key Endpoints

**Authentication**
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - Submit registration request

**Admin**
- `GET /api/admin/dashboard` - System statistics
- `GET /api/admin/pending-registrations` - View registration requests
- `POST /api/admin/approve-registration` - Approve/reject requests
- `POST /api/admin/users/create` - Create new user
- `POST /api/admin/classes/create` - Create new class

**Professor/TA**
- `GET /api/professor/my-classes` - View assigned classes
- `POST /api/professor/content/create` - Create course content

**Student**
- `GET /api/student/my-classes` - View enrolled classes
- `GET /api/student/content` - View accessible content

## Security Notes

**Development Mode**:
- Passwords stored in plain text
- Simplified JWT tokens
- Debug mode enabled

**For Production**:
- Implement bcrypt password hashing
- Use proper JWT with expiration
- Enable HTTPS
- Set secure CORS policies
- Add rate limiting

## License

MIT License - free to use for educational purposes.

---

**Version**: 3.0.0
