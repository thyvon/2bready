#!/bin/sh
set -e

echo "==> 2bReady API entrypoint"

# Wait for PostgreSQL
echo "==> Waiting for PostgreSQL..."
until php -r "
    try {
        new PDO('pgsql:host=${DB_HOST:-2bready_postgres};port=${DB_PORT:-5432};dbname=${DB_DATABASE:-2bready}', '${DB_USERNAME:-2bready}', '${DB_PASSWORD:-secret}');
        echo 'Database is ready!' . PHP_EOL;
    } catch (PDOException \$e) {
        echo 'Database not ready, waiting...' . PHP_EOL;
        exit(1);
    }
" 2>/dev/null; do
    sleep 2
done

# Run migrations
echo "==> Running migrations..."
php artisan migrate --force

# Start supervisord (php-fpm, nginx, scheduler, horizon)
echo "==> Starting services..."
exec /usr/bin/supervisord -c /etc/supervisord.conf
