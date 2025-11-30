from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session, sessionmaker
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
import os
import secrets

# Database setup
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://amoghdagar@localhost/university_db")
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

app = FastAPI(title="University LMS API v3.0", version="3.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==================== Pydantic Models ====================

class LoginRequest(BaseModel):
    university_id: str
    password: str

class UserResponse(BaseModel):
    id: int
    university_id: str
    username: str
    name: str
    email: str
    role: str
    is_active: bool

class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class DashboardStats(BaseModel):
    total_users: int
    total_students: int
    total_professors: int
    total_classes: int
    total_enrollments: int
    total_content: int

class CreateUserRequest(BaseModel):
    university_id: str
    username: str
    password: str
    name: str
    email: str
    role: str = Field(..., pattern="^(professor|student)$")

class UpdateUserRequest(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    is_active: Optional[bool] = None

class ResetPasswordRequest(BaseModel):
    new_password: str

class CreateClassRequest(BaseModel):
    class_code: str
    title: str
    description: Optional[str] = None
    professor_id: int
    term: Optional[str] = None
    schedule: Optional[str] = None
    location: Optional[str] = None
    max_students: Optional[int] = 30

class EnrollmentRequest(BaseModel):
    class_id: int
    student_id: int

class CreateContentRequest(BaseModel):
    class_id: int
    title: str
    content_type: str = Field(..., pattern="^(lecture|assignment|material|announcement)$")
    description: Optional[str] = None
    content: Optional[str] = None
    visibility: str = Field(default="private", pattern="^(public|private|enrolled)$")
    due_date: Optional[str] = None

class UpdateContentRequest(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    content: Optional[str] = None
    visibility: Optional[str] = None
    due_date: Optional[str] = None

class UpdateVisibilityRequest(BaseModel):
    visibility: str = Field(..., pattern="^(public|private|enrolled)$")

class AssignTARequest(BaseModel):
    class_id: int
    student_id: int

class RegistrationRequest(BaseModel):
    university_id: str
    username: str
    password: str
    name: str
    email: str
    requested_role: str = Field(..., pattern="^(student|professor|ta)$")
    reason: Optional[str] = None

class ApproveRegistrationRequest(BaseModel):
    registration_id: int
    approved: bool

# Helper function to generate JWT (simple token for now)
def create_access_token(user_id: int) -> str:
    return f"token_{user_id}_{secrets.token_urlsafe(32)}"

# Helper function to get current user from token (simplified)
def get_current_user(token: str, db: Session) -> dict:
    # In production, properly validate JWT
    if not token or not token.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    # For now, extract user_id from token
    # This is simplified - use proper JWT in production
    return {"id": 1, "role": "admin"}  # Placeholder

# ==================== Authentication Endpoints ====================

@app.post("/api/auth/login", response_model=LoginResponse)
async def login(request: LoginRequest, db: Session = Depends(get_db)):
    query = text("""
        SELECT id, university_id, username, password, name, email, role, is_active
        FROM users
        WHERE university_id = :university_id AND is_active = true
    """)
    user = db.execute(query, {"university_id": request.university_id}).first()

    if not user or user.password != request.password:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )

    # Update last login
    db.execute(
        text("UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = :id"),
        {"id": user.id}
    )
    db.commit()

    access_token = create_access_token(user.id)

    return LoginResponse(
        access_token=access_token,
        user=UserResponse(
            id=user.id,
            university_id=user.university_id,
            username=user.username,
            name=user.name,
            email=user.email,
            role=user.role,
            is_active=user.is_active
        )
    )

@app.post("/api/auth/logout")
async def logout():
    return {"message": "Logged out successfully"}

@app.post("/api/auth/register")
async def register(request: RegistrationRequest, db: Session = Depends(get_db)):
    """Submit a registration request for admin approval"""
    try:
        # Check if university_id or email already exists in users or pending_registrations
        existing_user = db.execute(
            text("SELECT id FROM users WHERE university_id = :uid OR email = :email"),
            {"uid": request.university_id, "email": request.email}
        ).first()

        if existing_user:
            raise HTTPException(status_code=400, detail="University ID or email already exists")

        existing_pending = db.execute(
            text("SELECT id FROM pending_registrations WHERE university_id = :uid OR email = :email AND status = 'pending'"),
            {"uid": request.university_id, "email": request.email}
        ).first()

        if existing_pending:
            raise HTTPException(status_code=400, detail="A pending registration with this ID or email already exists")

        # Insert registration request
        query = text("""
            INSERT INTO pending_registrations (university_id, username, password, name, email, requested_role, reason)
            VALUES (:university_id, :username, :password, :name, :email, :requested_role, :reason)
            RETURNING id
        """)
        result = db.execute(query, {
            "university_id": request.university_id,
            "username": request.username,
            "password": request.password,
            "name": request.name,
            "email": request.email,
            "requested_role": request.requested_role,
            "reason": request.reason
        }).first()
        db.commit()

        return {
            "message": "Registration request submitted successfully. Please wait for admin approval.",
            "registration_id": result.id
        }
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))

# ==================== Admin Endpoints ====================

@app.get("/api/admin/dashboard")
async def get_admin_dashboard(db: Session = Depends(get_db)):
    stats_query = text("""
        SELECT
            (SELECT COUNT(*) FROM users WHERE role != 'admin') as total_users,
            (SELECT COUNT(*) FROM users WHERE role = 'student') as total_students,
            (SELECT COUNT(*) FROM users WHERE role = 'professor') as total_professors,
            (SELECT COUNT(*) FROM classes) as total_classes,
            (SELECT COUNT(*) FROM enrollments) as total_enrollments,
            (SELECT COUNT(*) FROM course_content) as total_content
    """)
    stats = db.execute(stats_query).first()

    return DashboardStats(
        total_users=stats.total_users,
        total_students=stats.total_students,
        total_professors=stats.total_professors,
        total_classes=stats.total_classes,
        total_enrollments=stats.total_enrollments,
        total_content=stats.total_content
    )

@app.get("/api/admin/users")
async def get_all_users(role: Optional[str] = None, db: Session = Depends(get_db)):
    if role:
        query = text("SELECT * FROM users WHERE role = :role ORDER BY created_at DESC")
        users = db.execute(query, {"role": role}).fetchall()
    else:
        query = text("SELECT * FROM users ORDER BY created_at DESC")
        users = db.execute(query).fetchall()

    return {
        "users": [
            {
                "id": u.id,
                "university_id": u.university_id,
                "username": u.username,
                "name": u.name,
                "email": u.email,
                "role": u.role,
                "is_active": u.is_active,
                "created_at": u.created_at.isoformat() if u.created_at else None
            }
            for u in users
        ]
    }

@app.post("/api/admin/users/create")
async def create_user(request: CreateUserRequest, db: Session = Depends(get_db)):
    try:
        query = text("""
            INSERT INTO users (university_id, username, password, name, email, role, created_by)
            VALUES (:university_id, :username, :password, :name, :email, :role, :created_by)
            RETURNING id, university_id, username, name, email, role, is_active
        """)
        user = db.execute(query, {
            "university_id": request.university_id,
            "username": request.username,
            "password": request.password,
            "name": request.name,
            "email": request.email,
            "role": request.role,
            "created_by": 1  # Admin user
        }).first()
        db.commit()

        return {
            "id": user.id,
            "university_id": user.university_id,
            "username": user.username,
            "name": user.name,
            "email": user.email,
            "role": user.role,
            "is_active": user.is_active
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))

@app.patch("/api/admin/users/{user_id}")
async def update_user(user_id: int, request: UpdateUserRequest, db: Session = Depends(get_db)):
    updates = []
    params = {"user_id": user_id}

    if request.name is not None:
        updates.append("name = :name")
        params["name"] = request.name
    if request.email is not None:
        updates.append("email = :email")
        params["email"] = request.email
    if request.is_active is not None:
        updates.append("is_active = :is_active")
        params["is_active"] = request.is_active

    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update")

    query = text(f"UPDATE users SET {', '.join(updates)} WHERE id = :user_id RETURNING id")
    result = db.execute(query, params).first()

    if not result:
        raise HTTPException(status_code=404, detail="User not found")

    db.commit()
    return {"message": "User updated successfully"}

@app.post("/api/admin/users/{user_id}/reset-password")
async def reset_user_password(user_id: int, request: ResetPasswordRequest, db: Session = Depends(get_db)):
    query = text("UPDATE users SET password = :password WHERE id = :user_id RETURNING id")
    result = db.execute(query, {"password": request.new_password, "user_id": user_id}).first()

    if not result:
        raise HTTPException(status_code=404, detail="User not found")

    db.commit()
    return {"message": "Password reset successfully"}

@app.get("/api/admin/classes")
async def get_all_classes(db: Session = Depends(get_db)):
    query = text("""
        SELECT c.*, u.name as professor_name,
               (SELECT COUNT(*) FROM enrollments WHERE class_id = c.id) as enrollment_count
        FROM classes c
        LEFT JOIN users u ON c.professor_id = u.id
        ORDER BY c.created_at DESC
    """)
    classes = db.execute(query).fetchall()

    return {
        "classes": [
            {
                "id": c.id,
                "class_code": c.class_code,
                "title": c.title,
                "description": c.description,
                "professor_id": c.professor_id,
                "professor_name": c.professor_name,
                "term": c.term,
                "schedule": c.schedule,
                "location": c.location,
                "max_students": c.max_students,
                "is_active": c.is_active,
                "enrollment_count": c.enrollment_count
            }
            for c in classes
        ]
    }

@app.post("/api/admin/classes/create")
async def create_class(request: CreateClassRequest, db: Session = Depends(get_db)):
    try:
        query = text("""
            INSERT INTO classes (class_code, title, description, professor_id, term, schedule, location, max_students)
            VALUES (:class_code, :title, :description, :professor_id, :term, :schedule, :location, :max_students)
            RETURNING id, class_code, title
        """)
        cls = db.execute(query, {
            "class_code": request.class_code,
            "title": request.title,
            "description": request.description,
            "professor_id": request.professor_id,
            "term": request.term,
            "schedule": request.schedule,
            "location": request.location,
            "max_students": request.max_students
        }).first()
        db.commit()

        return {"id": cls.id, "class_code": cls.class_code, "title": cls.title}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/admin/enrollments/create")
async def enroll_student(request: EnrollmentRequest, db: Session = Depends(get_db)):
    try:
        query = text("""
            INSERT INTO enrollments (class_id, student_id)
            VALUES (:class_id, :student_id)
            RETURNING id
        """)
        enrollment = db.execute(query, {
            "class_id": request.class_id,
            "student_id": request.student_id
        }).first()
        db.commit()

        return {"id": enrollment.id, "message": "Student enrolled successfully"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/admin/classes/{class_id}/students")
async def get_class_students(class_id: int, db: Session = Depends(get_db)):
    query = text("""
        SELECT u.id, u.university_id, u.name, u.email, e.enrolled_at, e.status
        FROM enrollments e
        JOIN users u ON e.student_id = u.id
        WHERE e.class_id = :class_id
        ORDER BY u.name
    """)
    students = db.execute(query, {"class_id": class_id}).fetchall()

    return {
        "students": [
            {
                "id": s.id,
                "university_id": s.university_id,
                "name": s.name,
                "email": s.email,
                "enrolled_at": s.enrolled_at.isoformat() if s.enrolled_at else None,
                "status": s.status
            }
            for s in students
        ]
    }

@app.get("/api/admin/content")
async def get_all_content(
    class_id: Optional[int] = None,
    content_type: Optional[str] = None,
    visibility: Optional[str] = None,
    db: Session = Depends(get_db)
):
    conditions = []
    params = {}

    if class_id:
        conditions.append("cc.class_id = :class_id")
        params["class_id"] = class_id
    if content_type:
        conditions.append("cc.content_type = :content_type")
        params["content_type"] = content_type
    if visibility:
        conditions.append("cc.visibility = :visibility")
        params["visibility"] = visibility

    where_clause = " AND " + " AND ".join(conditions) if conditions else ""

    query = text(f"""
        SELECT cc.*, c.title as class_title, u.name as professor_name
        FROM course_content cc
        JOIN classes c ON cc.class_id = c.id
        JOIN users u ON cc.created_by = u.id
        WHERE 1=1 {where_clause}
        ORDER BY cc.created_at DESC
    """)
    content = db.execute(query, params).fetchall()

    return {
        "content": [
            {
                "id": item.id,
                "class_id": item.class_id,
                "class_title": item.class_title,
                "title": item.title,
                "content_type": item.content_type,
                "visibility": item.visibility,
                "created_by": item.created_by,
                "professor_name": item.professor_name,
                "created_at": item.created_at.isoformat() if item.created_at else None
            }
            for item in content
        ]
    }

@app.patch("/api/admin/content/{content_id}/visibility")
async def update_content_visibility(content_id: int, request: UpdateVisibilityRequest, db: Session = Depends(get_db)):
    query = text("UPDATE course_content SET visibility = :visibility WHERE id = :content_id RETURNING id")
    result = db.execute(query, {"visibility": request.visibility, "content_id": content_id}).first()

    if not result:
        raise HTTPException(status_code=404, detail="Content not found")

    db.commit()
    return {"message": "Visibility updated successfully"}

@app.get("/api/admin/pending-registrations")
async def get_pending_registrations(status: Optional[str] = None, db: Session = Depends(get_db)):
    """Get all pending registration requests"""
    if status:
        query = text("""
            SELECT * FROM pending_registrations
            WHERE status = :status
            ORDER BY requested_at DESC
        """)
        registrations = db.execute(query, {"status": status}).fetchall()
    else:
        query = text("SELECT * FROM pending_registrations ORDER BY requested_at DESC")
        registrations = db.execute(query).fetchall()

    return {
        "registrations": [
            {
                "id": r.id,
                "university_id": r.university_id,
                "username": r.username,
                "name": r.name,
                "email": r.email,
                "requested_role": r.requested_role,
                "reason": r.reason,
                "status": r.status,
                "requested_at": r.requested_at.isoformat() if r.requested_at else None,
                "reviewed_at": r.reviewed_at.isoformat() if r.reviewed_at else None
            }
            for r in registrations
        ]
    }

@app.post("/api/admin/approve-registration")
async def approve_registration(request: ApproveRegistrationRequest, db: Session = Depends(get_db)):
    """Approve or reject a registration request"""
    try:
        # Get the registration
        reg_query = text("SELECT * FROM pending_registrations WHERE id = :id AND status = 'pending'")
        registration = db.execute(reg_query, {"id": request.registration_id}).first()

        if not registration:
            raise HTTPException(status_code=404, detail="Registration not found or already processed")

        if request.approved:
            # Create the user account
            user_query = text("""
                INSERT INTO users (university_id, username, password, name, email, role, created_by)
                VALUES (:university_id, :username, :password, :name, :email, :role, :created_by)
                RETURNING id
            """)
            user = db.execute(user_query, {
                "university_id": registration.university_id,
                "username": registration.username,
                "password": registration.password,
                "name": registration.name,
                "email": registration.email,
                "role": registration.requested_role,
                "created_by": 1  # Admin
            }).first()

            # Update registration status
            update_query = text("""
                UPDATE pending_registrations
                SET status = 'approved', reviewed_by = :reviewed_by, reviewed_at = CURRENT_TIMESTAMP
                WHERE id = :id
            """)
            db.execute(update_query, {"reviewed_by": 1, "id": request.registration_id})
            db.commit()

            return {
                "message": "Registration approved and user account created",
                "user_id": user.id
            }
        else:
            # Reject the registration
            update_query = text("""
                UPDATE pending_registrations
                SET status = 'rejected', reviewed_by = :reviewed_by, reviewed_at = CURRENT_TIMESTAMP
                WHERE id = :id
            """)
            db.execute(update_query, {"reviewed_by": 1, "id": request.registration_id})
            db.commit()

            return {"message": "Registration rejected"}

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))

# ==================== Professor Endpoints ====================

@app.get("/api/professor/my-classes")
async def get_professor_classes(db: Session = Depends(get_db)):
    # In production, get professor_id from auth token
    # For now, return all classes
    query = text("""
        SELECT c.*,
               (SELECT COUNT(*) FROM enrollments WHERE class_id = c.id) as enrollment_count,
               (SELECT COUNT(*) FROM course_content WHERE class_id = c.id) as content_count
        FROM classes c
        ORDER BY c.created_at DESC
    """)
    classes = db.execute(query).fetchall()

    return {
        "classes": [
            {
                "id": c.id,
                "class_code": c.class_code,
                "title": c.title,
                "description": c.description,
                "term": c.term,
                "schedule": c.schedule,
                "location": c.location,
                "max_students": c.max_students,
                "enrollment_count": c.enrollment_count,
                "content_count": c.content_count
            }
            for c in classes
        ]
    }

@app.get("/api/professor/classes/{class_id}/roster")
async def get_professor_class_roster(class_id: int, db: Session = Depends(get_db)):
    query = text("""
        SELECT u.id, u.university_id, u.name, u.email
        FROM enrollments e
        JOIN users u ON e.student_id = u.id
        WHERE e.class_id = :class_id AND e.status = 'active'
        ORDER BY u.name
    """)
    students = db.execute(query, {"class_id": class_id}).fetchall()

    return {
        "students": [
            {"id": s.id, "university_id": s.university_id, "name": s.name, "email": s.email}
            for s in students
        ]
    }

@app.post("/api/professor/content/create")
async def create_content(request: CreateContentRequest, db: Session = Depends(get_db)):
    try:
        query = text("""
            INSERT INTO course_content (class_id, title, content_type, description, content, visibility, created_by, due_date)
            VALUES (:class_id, :title, :content_type, :description, :content, :visibility, :created_by, :due_date)
            RETURNING id, title
        """)
        content = db.execute(query, {
            "class_id": request.class_id,
            "title": request.title,
            "content_type": request.content_type,
            "description": request.description,
            "content": request.content,
            "visibility": request.visibility,
            "created_by": 1,  # In production, get from auth
            "due_date": request.due_date
        }).first()
        db.commit()

        return {"id": content.id, "title": content.title}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/professor/content")
async def get_professor_content(
    class_id: Optional[int] = None,
    content_type: Optional[str] = None,
    db: Session = Depends(get_db)
):
    conditions = []
    params = {}

    if class_id:
        conditions.append("cc.class_id = :class_id")
        params["class_id"] = class_id
    if content_type:
        conditions.append("cc.content_type = :content_type")
        params["content_type"] = content_type

    where_clause = " AND " + " AND ".join(conditions) if conditions else ""

    query = text(f"""
        SELECT cc.*, c.title as class_title, c.class_code
        FROM course_content cc
        JOIN classes c ON cc.class_id = c.id
        WHERE 1=1 {where_clause}
        ORDER BY cc.created_at DESC
    """)
    content = db.execute(query, params).fetchall()

    return {
        "content": [
            {
                "id": item.id,
                "class_id": item.class_id,
                "class_code": item.class_code,
                "class_title": item.class_title,
                "title": item.title,
                "content_type": item.content_type,
                "description": item.description,
                "visibility": item.visibility,
                "created_at": item.created_at.isoformat() if item.created_at else None,
                "due_date": item.due_date.isoformat() if item.due_date else None
            }
            for item in content
        ]
    }

@app.patch("/api/professor/content/{content_id}")
async def update_content(content_id: int, request: UpdateContentRequest, db: Session = Depends(get_db)):
    updates = []
    params = {"content_id": content_id}

    if request.title:
        updates.append("title = :title")
        params["title"] = request.title
    if request.description is not None:
        updates.append("description = :description")
        params["description"] = request.description
    if request.content is not None:
        updates.append("content = :content")
        params["content"] = request.content
    if request.visibility:
        updates.append("visibility = :visibility")
        params["visibility"] = request.visibility
    if request.due_date is not None:
        updates.append("due_date = :due_date")
        params["due_date"] = request.due_date

    if updates:
        updates.append("updated_at = CURRENT_TIMESTAMP")

    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update")

    query = text(f"UPDATE course_content SET {', '.join(updates)} WHERE id = :content_id RETURNING id")
    result = db.execute(query, params).first()

    if not result:
        raise HTTPException(status_code=404, detail="Content not found")

    db.commit()
    return {"message": "Content updated successfully"}

@app.delete("/api/professor/content/{content_id}")
async def delete_content(content_id: int, db: Session = Depends(get_db)):
    query = text("DELETE FROM course_content WHERE id = :content_id RETURNING id")
    result = db.execute(query, {"content_id": content_id}).first()

    if not result:
        raise HTTPException(status_code=404, detail="Content not found")

    db.commit()
    return {"message": "Content deleted successfully"}

@app.post("/api/professor/ta/assign")
async def assign_ta(request: AssignTARequest, db: Session = Depends(get_db)):
    try:
        query = text("""
            INSERT INTO ta_assignments (class_id, ta_id, assigned_by)
            VALUES (:class_id, :ta_id, :assigned_by)
            RETURNING id
        """)
        ta = db.execute(query, {
            "class_id": request.class_id,
            "ta_id": request.student_id,
            "assigned_by": 1  # In production, get from auth
        }).first()
        db.commit()

        return {"id": ta.id, "message": "TA assigned successfully"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))

@app.delete("/api/professor/ta/{ta_id}")
async def remove_ta(ta_id: int, db: Session = Depends(get_db)):
    query = text("DELETE FROM ta_assignments WHERE id = :ta_id RETURNING id")
    result = db.execute(query, {"ta_id": ta_id}).first()

    if not result:
        raise HTTPException(status_code=404, detail="TA assignment not found")

    db.commit()
    return {"message": "TA removed successfully"}

@app.get("/api/professor/classes/{class_id}/tas")
async def get_class_tas(class_id: int, db: Session = Depends(get_db)):
    query = text("""
        SELECT ta.id as assignment_id, u.id, u.university_id, u.name, u.email, ta.assigned_at
        FROM ta_assignments ta
        JOIN users u ON ta.ta_id = u.id
        WHERE ta.class_id = :class_id
        ORDER BY u.name
    """)
    tas = db.execute(query, {"class_id": class_id}).fetchall()

    return {
        "tas": [
            {
                "assignment_id": ta.assignment_id,
                "id": ta.id,
                "university_id": ta.university_id,
                "name": ta.name,
                "email": ta.email,
                "assigned_at": ta.assigned_at.isoformat() if ta.assigned_at else None
            }
            for ta in tas
        ]
    }

# ==================== Student Endpoints ====================

@app.get("/api/student/my-classes")
async def get_student_classes(db: Session = Depends(get_db)):
    # In production, get student_id from auth token
    # For now, return empty array
    return {"classes": []}

@app.get("/api/student/content")
async def get_accessible_content(
    class_id: Optional[int] = None,
    content_type: Optional[str] = None,
    visibility: Optional[str] = None,
    db: Session = Depends(get_db)
):
    # In production, filter based on student's enrolled classes
    # For now, return public content
    conditions = ["cc.visibility = 'public'"]
    params = {}

    if class_id:
        conditions.append("cc.class_id = :class_id")
        params["class_id"] = class_id
    if content_type:
        conditions.append("cc.content_type = :content_type")
        params["content_type"] = content_type

    where_clause = " AND ".join(conditions)

    query = text(f"""
        SELECT cc.*, c.title as class_title, c.class_code, u.name as professor_name
        FROM course_content cc
        JOIN classes c ON cc.class_id = c.id
        JOIN users u ON cc.created_by = u.id
        WHERE {where_clause}
        ORDER BY cc.created_at DESC
    """)
    content = db.execute(query, params).fetchall()

    return {
        "content": [
            {
                "id": item.id,
                "class_id": item.class_id,
                "class_code": item.class_code,
                "class_title": item.class_title,
                "title": item.title,
                "content_type": item.content_type,
                "description": item.description,
                "professor_name": item.professor_name,
                "created_at": item.created_at.isoformat() if item.created_at else None,
                "due_date": item.due_date.isoformat() if item.due_date else None
            }
            for item in content
        ]
    }

@app.get("/api/student/content/{content_id}")
async def get_content_details(content_id: int, db: Session = Depends(get_db)):
    query = text("""
        SELECT cc.*, c.title as class_title, c.class_code, u.name as professor_name
        FROM course_content cc
        JOIN classes c ON cc.class_id = c.id
        JOIN users u ON cc.created_by = u.id
        WHERE cc.id = :content_id
    """)
    content = db.execute(query, {"content_id": content_id}).first()

    if not content:
        raise HTTPException(status_code=404, detail="Content not found")

    return {
        "id": content.id,
        "class_id": content.class_id,
        "class_code": content.class_code,
        "class_title": content.class_title,
        "title": content.title,
        "content_type": content.content_type,
        "description": content.description,
        "content": content.content,
        "visibility": content.visibility,
        "professor_name": content.professor_name,
        "created_at": content.created_at.isoformat() if content.created_at else None,
        "due_date": content.due_date.isoformat() if content.due_date else None
    }

@app.get("/api/student/ta/my-assignments")
async def get_my_ta_assignments(db: Session = Depends(get_db)):
    # In production, get student_id from auth token
    return {"assignments": []}

@app.get("/api/student/dashboard")
async def get_student_dashboard(db: Session = Depends(get_db)):
    # In production, get student_id from auth token
    return {
        "enrolled_classes": 0,
        "ta_assignments": 0,
        "upcoming_assignments": 0
    }

# ==================== Health Check ====================

@app.get("/")
async def root():
    return {
        "message": "University LMS API v3.0",
        "version": "3.0.0",
        "docs": "/docs",
        "schema": "New admin-controlled system"
    }

@app.get("/api/health")
async def health():
    return {"status": "healthy", "version": "3.0.0"}
