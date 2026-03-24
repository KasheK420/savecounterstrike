#!/bin/sh

echo "==> Running Prisma migrations..."
if ! npx prisma migrate deploy; then
  echo "==> ERROR: Prisma migration failed! Aborting startup."
  exit 1
fi
echo "==> Migrations completed successfully."

echo "==> Starting application..."
exec "$@"
