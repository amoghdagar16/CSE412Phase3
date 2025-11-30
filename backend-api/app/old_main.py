from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import auth, student, professor, ta, classes, admin
from app.database import engine, Base

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="University LMS API",
    description="Learning Management System API for Phase 3",
    version="2.0.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(student.router, prefix="/api/student", tags=["Students"])
app.include_router(professor.router, prefix="/api/professor", tags=["Professors"])
app.include_router(ta.router, prefix="/api/ta", tags=["TAs"])
app.include_router(classes.router, prefix="/api/class", tags=["Classes"])
app.include_router(admin.router, prefix="/api/admin", tags=["Admin"])

@app.get("/")
async def root():
    return {
        "message": "University LMS API",
        "version": "2.0.0",
        "docs": "/docs"
    }

@app.get("/api/health")
async def health():
    return {"status": "healthy"}
