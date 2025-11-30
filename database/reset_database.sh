#!/bin/bash

# Database Reset Script for University LMS
# This script drops and recreates the database with fresh schema and data

DB_NAME="university_db"
DB_USER="amoghdagar"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PSQL="/opt/homebrew/opt/postgresql@14/bin/psql"

echo "=========================================="
echo "University LMS Database Reset Script"
echo "=========================================="
echo ""
echo "WARNING: This will delete ALL data in the database!"
echo "Database: $DB_NAME"
echo "User: $DB_USER"
echo ""
read -p "Are you sure you want to continue? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "Database reset cancelled."
    exit 0
fi

echo ""
echo "Step 1: Dropping existing database..."
$PSQL -U $DB_USER -d postgres -c "DROP DATABASE IF EXISTS $DB_NAME;" 2>&1 | grep -v "NOTICE"

if [ $? -eq 0 ]; then
    echo "✓ Database dropped successfully"
else
    echo "✗ Failed to drop database"
    exit 1
fi

echo ""
echo "Step 2: Creating fresh database..."
$PSQL -U $DB_USER -d postgres -c "CREATE DATABASE $DB_NAME;" 2>&1

if [ $? -eq 0 ]; then
    echo "✓ Database created successfully"
else
    echo "✗ Failed to create database"
    exit 1
fi

echo ""
echo "Step 3: Loading schema..."
$PSQL -U $DB_USER -d $DB_NAME -f "$SCRIPT_DIR/schema.sql" 2>&1 | grep -v "NOTICE"

if [ $? -eq 0 ]; then
    echo "✓ Schema loaded successfully"
else
    echo "✗ Failed to load schema"
    exit 1
fi

echo ""
echo "Step 4: Loading sample data..."
$PSQL -U $DB_USER -d $DB_NAME -f "$SCRIPT_DIR/data.sql" 2>&1 | grep -v "NOTICE"

if [ $? -eq 0 ]; then
    echo "✓ Sample data loaded successfully"
else
    echo "✗ Failed to load sample data"
    exit 1
fi

echo ""
echo "Step 5: Verifying data..."
echo ""
echo "Record counts:"
$PSQL -U $DB_USER -d $DB_NAME -c "
SELECT
    'Members' as table_name, COUNT(*) as count FROM member
UNION ALL
SELECT 'Students', COUNT(*) FROM student
UNION ALL
SELECT 'Professors', COUNT(*) FROM professor
UNION ALL
SELECT 'TAs', COUNT(*) FROM ta
UNION ALL
SELECT 'Classes', COUNT(*) FROM class
UNION ALL
SELECT 'Classrooms', COUNT(*) FROM classroom
ORDER BY table_name;
" 2>&1

echo ""
echo "=========================================="
echo "✓ Database reset completed successfully!"
echo "=========================================="
echo ""
echo "You can now:"
echo "  1. Start the backend server: cd backend-api && uvicorn app.main:app --reload"
echo "  2. Start the frontend: cd frontend && npm run dev"
echo "  3. Login with demo credentials (see PRODUCT_DOCUMENTATION.md)"
echo ""
