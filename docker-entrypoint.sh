#!/bin/sh
set -e

echo "==> Running Prisma migrations..."
npx prisma migrate deploy 2>/dev/null || echo "==> Migrations skipped (no pending migrations or DB not ready)"

echo "==> Starting application..."
exec "$@"
