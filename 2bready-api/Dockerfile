# Build context is the project root (2bready/), not this directory —
# devops/ configs live at the project root, not inside 2bready-api/.
# See docker-compose.prod.yml.

# ---- Build stage ----
FROM php:8.3-cli-alpine AS builder

WORKDIR /app

RUN apk add --no-cache git unzip libpq-dev \
    && docker-php-ext-install pdo pdo_pgsql opcache pcntl

COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

COPY 2bready-api/composer.json 2bready-api/composer.lock ./
RUN composer install --no-dev --no-interaction --prefer-dist --optimize-autoloader --no-scripts

COPY 2bready-api/ .
RUN composer dump-autoload --optimize --no-dev


# ---- Production stage ----
FROM php:8.3-fpm-alpine AS production

WORKDIR /var/www/html

RUN apk add --no-cache libpq-dev nginx supervisor \
    && docker-php-ext-install pdo pdo_pgsql opcache pcntl

# Configs from project-root devops/ (not inside 2bready-api/)
COPY devops/php/php.ini /usr/local/etc/php/conf.d/custom.ini
COPY devops/php/www.conf /usr/local/etc/php-fpm.d/www.conf
COPY devops/nginx/api.conf /etc/nginx/http.d/default.conf
COPY devops/supervisor/supervisord.conf /etc/supervisord.conf

COPY --from=builder /app .

RUN chown -R www-data:www-data storage bootstrap/cache \
    && chmod -R 775 storage bootstrap/cache

EXPOSE 80

CMD ["/usr/bin/supervisord", "-c", "/etc/supervisord.conf"]
