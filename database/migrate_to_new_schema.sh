#!/bin/bash

# Migration Script - Move to New LMS Schema
# This script creates the new schema and migrates data

DB_NAME="university_db"
DB_USER="amoghdagar"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PSQL="/opt/homebrew/opt/postgresql@14/bin/psql"

echo "=========================================="
echo "LMS Schema Migration Script"
echo "=========================================="
echo ""
echo "This will migrate to the new admin-controlled schema"
echo "Database: $DB_NAME"
echo "User: $DB_USER"
echo ""
read -p "Continue? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "Migration cancelled."
    exit 0
fi

echo ""
echo "Step 1: Applying new schema..."
$PSQL -U $DB_USER -d $DB_NAME -f "$SCRIPT_DIR/new_schema.sql" 2>&1 | grep -v "NOTICE"

if [ $? -eq 0 ]; then
    echo "✓ New schema applied successfully"
else
    echo "✗ Failed to apply new schema"
    exit 1
fi

echo ""
echo "=========================================="
echo "✓ Migration completed successfully!"
echo "=========================================="
echo ""
echo "Default Admin Account:"
echo "  University ID: ADMIN001"
echo "  Username: admin"
echo "  Password: admin123"
echo ""
echo "Next steps:"
echo "  1. Restart the backend server"
echo "  2. Login as admin"
echo "  3. Create users (professors, students)"
echo "  4. Create classes and assign professors"
echo "  5. Enroll students in classes"
echo ""
