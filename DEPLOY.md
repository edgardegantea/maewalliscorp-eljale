# Guía de Despliegue — El Jale
**VPS Ubuntu 24.04 · Sin Plesk**

- Backend API : https://eljaleback.maewalliscorp.org  
- Frontend SPA : https://eljale.maewalliscorp.org  

---

## 1. Preparar el servidor

```bash
apt update && apt upgrade -y
apt install -y nginx postgresql postgresql-contrib \
  php8.3 php8.3-fpm php8.3-pgsql php8.3-mbstring php8.3-xml \
  php8.3-curl php8.3-zip php8.3-gd php8.3-intl \
  curl git unzip supervisor certbot python3-certbot-nginx

# Node.js 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Composer
curl -sS https://getcomposer.org/installer | php
mv composer.phar /usr/local/bin/composer
```

---

## 2. Configurar PostgreSQL

```bash
su - postgres
psql

CREATE DATABASE el_jale_db;
CREATE USER el_jale_user WITH ENCRYPTED PASSWORD 'CAMBIA_ESTA_CLAVE';
GRANT ALL PRIVILEGES ON DATABASE el_jale_db TO el_jale_user;
\q
exit
```

---

## 3. Subir el código

```bash
mkdir -p /var/www
cd /var/www

git clone <TU_REPO> eljale
# — o sube los archivos vía SCP/SFTP —
```

---

## 4. Desplegar el Backend (Laravel)

```bash
cd /var/www/eljale/el-jale-api

composer install --no-dev --optimize-autoloader

cp .env.example .env
# Edita .env con los valores reales (ver sección 4.1)
nano .env

php artisan key:generate
php artisan migrate --force
php artisan db:seed --class=TestUsersSeeder   # solo si quieres los usuarios de prueba
php artisan storage:link

# Permisos
chown -R www-data:www-data /var/www/eljale/el-jale-api
chmod -R 755 /var/www/eljale/el-jale-api/storage
chmod -R 755 /var/www/eljale/el-jale-api/bootstrap/cache
```

### 4.1 Variables de entorno del backend (.env)

```ini
APP_NAME="El Jale"
APP_ENV=production
APP_DEBUG=false
APP_URL=https://eljaleback.maewalliscorp.org
FRONTEND_URL=https://eljale.maewalliscorp.org

DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=el_jale_db
DB_USERNAME=el_jale_user
DB_PASSWORD=CAMBIA_ESTA_CLAVE

# CORS — permite peticiones desde el frontend
SANCTUM_STATEFUL_DOMAINS=eljale.maewalliscorp.org

SESSION_DRIVER=database
SESSION_DOMAIN=.maewalliscorp.org

FILESYSTEM_DISK=public

MAIL_MAILER=smtp          # o "log" para seguir en modo prueba
MAIL_HOST=smtp.tu-proveedor.com
MAIL_PORT=587
MAIL_USERNAME=noreply@maewalliscorp.org
MAIL_PASSWORD=TU_PASSWORD_SMTP
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=noreply@eljale.mx
MAIL_FROM_NAME="El Jale"
```

---

## 5. Desplegar el Frontend (React/Vite)

```bash
cd /var/www/eljale/el-jale-frontend

# Crear el archivo de entorno de producción
cat > .env.production << 'EOF'
VITE_API_URL=https://eljaleback.maewalliscorp.org/api
VITE_STORAGE_URL=https://eljaleback.maewalliscorp.org/storage
EOF

npm install
npm run build
# El build queda en /var/www/eljale/el-jale-frontend/dist

chown -R www-data:www-data /var/www/eljale/el-jale-frontend/dist
```

---

## 6. Configurar Nginx

### 6.1 Backend API

```bash
nano /etc/nginx/sites-available/eljaleback
```

```nginx
server {
    listen 80;
    server_name eljaleback.maewalliscorp.org;
    root /var/www/eljale/el-jale-api/public;
    index index.php;

    # Permitir uploads de hasta 10MB (fotos)
    client_max_body_size 10M;

    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-Content-Type-Options "nosniff";

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location ~ \.php$ {
        fastcgi_pass unix:/run/php/php8.3-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include fastcgi_params;
    }

    location ~ /\.(?!well-known).* {
        deny all;
    }
}
```

### 6.2 Frontend SPA

```bash
nano /etc/nginx/sites-available/eljale
```

```nginx
server {
    listen 80;
    server_name eljale.maewalliscorp.org;
    root /var/www/eljale/el-jale-frontend/dist;
    index index.html;

    location / {
        # Necesario para React Router — devuelve index.html en todas las rutas
        try_files $uri $uri/ /index.html;
    }

    # Cache de assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff2?)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### 6.3 Activar los sitios

```bash
ln -s /etc/nginx/sites-available/eljaleback /etc/nginx/sites-enabled/
ln -s /etc/nginx/sites-available/eljale     /etc/nginx/sites-enabled/

nginx -t && systemctl reload nginx
```

---

## 7. SSL con Let's Encrypt (Certbot)

```bash
certbot --nginx -d eljaleback.maewalliscorp.org -d eljale.maewalliscorp.org
```

Certbot modifica los archivos de Nginx automáticamente y programa la renovación automática.

---

## 8. CORS en Laravel

Laravel usa el paquete `fruitcake/laravel-cors` integrado. Publica y edita la config:

```bash
php artisan config:publish cors   # crea config/cors.php si no existe
```

Edita `/var/www/eljale/el-jale-api/config/cors.php`:

```php
return [
    'paths'               => ['api/*', 'sanctum/csrf-cookie'],
    'allowed_methods'     => ['*'],
    'allowed_origins'     => ['https://eljale.maewalliscorp.org'],
    'allowed_headers'     => ['*'],
    'exposed_headers'     => [],
    'max_age'             => 0,
    'supports_credentials'=> false,
];
```

---

## 9. Supervisor — Worker de colas (para emails)

```bash
nano /etc/supervisor/conf.d/eljale-worker.conf
```

```ini
[program:eljale-worker]
process_name=%(program_name)s_%(process_num)02d
command=php /var/www/eljale/el-jale-api/artisan queue:work --sleep=3 --tries=3 --timeout=90
autostart=true
autorestart=true
stopasgroup=true
killasgroup=true
user=www-data
numprocs=2
redirect_stderr=true
stdout_logfile=/var/www/eljale/el-jale-api/storage/logs/worker.log
stopwaitsecs=3600
```

```bash
supervisorctl reread
supervisorctl update
supervisorctl start eljale-worker:*
```

> **Nota:** Si usas emails con `Mail::send()` (síncrono, driver log), el worker no es necesario todavía. Actívalo cuando cambies a `Mail::queue()` con driver SMTP real.

---

## 10. Optimización de Laravel para producción

```bash
cd /var/www/eljale/el-jale-api

php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan event:cache
```

---

## 11. Flujo de actualizaciones

Cada vez que hagas cambios en el código:

```bash
# Backend
cd /var/www/eljale/el-jale-api
git pull
composer install --no-dev --optimize-autoloader
php artisan migrate --force
php artisan config:cache && php artisan route:cache && php artisan view:cache
supervisorctl restart eljale-worker:*

# Frontend
cd /var/www/eljale/el-jale-frontend
git pull
npm install
npm run build
# El dist se reemplaza automáticamente — Nginx sirve los nuevos archivos
```

---

## 12. Verificación final

| Check | Comando |
|-------|---------|
| Nginx corriendo | `systemctl status nginx` |
| PHP-FPM corriendo | `systemctl status php8.3-fpm` |
| PostgreSQL corriendo | `systemctl status postgresql` |
| Supervisor workers | `supervisorctl status` |
| SSL válido | `curl -I https://eljaleback.maewalliscorp.org/api/categories` |
| API responde | `curl https://eljaleback.maewalliscorp.org/api/categories` |
| Frontend carga | Abrir https://eljale.maewalliscorp.org en el navegador |
| Emails (log) | `tail -f /var/www/eljale/el-jale-api/storage/logs/laravel.log` |

---

## Resumen de puertos y procesos

| Servicio | Puerto / Socket |
|----------|----------------|
| Nginx | 80, 443 |
| PHP-FPM | `/run/php/php8.3-fpm.sock` |
| PostgreSQL | 5432 (solo localhost) |
| Supervisor worker | proceso interno |
