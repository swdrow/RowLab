#!/bin/bash
# RowLab PostgreSQL Setup Script
# Run with: bash scripts/setup-postgres.sh

set -e

echo "=== RowLab PostgreSQL Setup ==="

# Default values (override via environment variables)
DB_USER="${ROWLAB_DB_USER:-rowlab}"
DB_PASS="${ROWLAB_DB_PASS:-rowlab_dev_password}"
DB_NAME="${ROWLAB_DB_NAME:-rowlab_dev}"

echo "Creating database user: $DB_USER"
sudo -u postgres psql -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASS';" 2>/dev/null || echo "User $DB_USER already exists"

echo "Creating database: $DB_NAME"
sudo -u postgres psql -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;" 2>/dev/null || echo "Database $DB_NAME already exists"

echo "Granting privileges..."
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;"

echo "Testing connection..."
if psql "postgresql://$DB_USER:$DB_PASS@localhost:5432/$DB_NAME" -c "SELECT 1;" > /dev/null 2>&1; then
    echo "Connection successful!"
else
    echo "Connection failed. Check your PostgreSQL configuration."
    exit 1
fi

echo ""
echo "=== Setup Complete ==="
echo "Add this to your .env file:"
echo "DATABASE_URL=\"postgresql://$DB_USER:$DB_PASS@localhost:5432/$DB_NAME\""
