# ApexHR Enterprise — Complete Deployment Guide

This document provides step-by-step production deployment instructions for **ApexHR Enterprise**.

You can deploy ApexHR in two ways:
1. **Option A: Node.js / Docker / Cloud Run Full-Stack Deployment** (Recommended for modern cloud servers, VPS, Render, Railway, or Google Cloud Run).
2. **Option B: Standard PHP 8.2 + Apache/Nginx + MySQL Deployment** (For cPanel, Hostinger, DigitalOcean LAMP/LEMP droplet, or traditional web hosting).

---

## ⚠️ Critical Prerequisite: HTTPS (SSL/TLS) Requirement
Browser-based facial recognition uses the HTML5 `navigator.mediaDevices.getUserMedia` API. **Modern web browsers block camera access on non-secure HTTP connections** (except `localhost`). 
You **must** configure an SSL/TLS certificate (e.g., Free Let's Encrypt or Cloudflare) for your production domain.

---

## Option A: Deploying as a Full-Stack Node.js Application

### 1. Requirements
- Node.js 20.x or 22.x LTS
- npm 9+ or yarn
- Linux VPS (Ubuntu 22.04+), Docker, or Cloud platform (Cloud Run, Railway, Render)

### 2. Build the Application
In your project directory, install dependencies and compile the production bundle:
```bash
# 1. Install dependencies
npm install

# 2. Build the production React frontend
npm run build
```
This generates the optimized production build in the `dist/` directory.

### 3. Configure Environment Variables
Create a `.env` file in the root:
```env
PORT=3000
NODE_ENV=production
APP_URL=https://your-domain.com
```

### 4. Running with PM2 (Process Manager) on Ubuntu / VPS
```bash
# Install PM2 globally
npm install -g pm2

# Start the application with PM2
pm2 start server.ts --name apex-hr --interpreter tsx

# Configure PM2 to auto-start on system boot
pm2 startup
pm2 save
```

### 5. Nginx Reverse Proxy Configuration (with Free SSL)
Create `/etc/nginx/sites-available/apexhr.conf`:
```nginx
server {
    listen 80;
    server_name hr.yourcompany.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```
Enable the site and obtain SSL with Certbot:
```bash
sudo ln -s /etc/nginx/sites-available/apexhr.conf /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# Install free SSL certificate
sudo certbot --nginx -d hr.yourcompany.com
```

### 6. Docker Deployment (Alternative)
Create a `Dockerfile`:
```dockerfile
FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```
Build and run:
```bash
docker build -t apexhr:latest .
docker run -d -p 3000:3000 --name apexhr-app --restart always apexhr:latest
```

---

## Option B: Deploying with PHP 8.2 + MySQL (cPanel / Apache / Nginx)

If deploying to standard PHP/MySQL hosting or cPanel:

### 1. Database Setup (MySQL 8.0+)
1. Log in to your MySQL server or open **phpMyAdmin** in cPanel.
2. Create a new database:
   ```sql
   CREATE DATABASE apex_hr_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```
3. Import the provided schema file:
   - Command line:
     ```bash
     mysql -u your_db_user -p apex_hr_db < database/schema.sql
     ```
   - In phpMyAdmin: Click **Import**, choose `database/schema.sql`, and click **Go**.

### 2. Configure Database Credentials
Edit `php-mvc/config/database.php` (or set environment variables):
```php
$host = $_ENV['DB_HOST'] ?? '127.0.0.1';
$port = $_ENV['DB_PORT'] ?? '3306';
$dbName = $_ENV['DB_NAME'] ?? 'apex_hr_db';
$username = $_ENV['DB_USER'] ?? 'your_db_username';
$password = $_ENV['DB_PASS'] ?? 'your_db_password';
```

### 3. Upload Code & Static Assets
1. Upload the files from `php-mvc/` and the built frontend files from `dist/` to your web server document root (e.g. `public_html/`).
2. Ensure file permissions:
   ```bash
   chmod -R 755 public_html/
   ```

### 4. Apache `.htaccess` Configuration
Ensure mod_rewrite is enabled. Place this `.htaccess` in your root:
```apache
<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteRule ^ api/index.php [QSA,L]
</IfModule>
```

---

## Post-Deployment Checklist

- [ ] **HTTPS Active:** Verify your URL starts with `https://` (green padlock icon).
- [ ] **Camera Test:** Open the app on a smartphone, tablet, or laptop and click **Face Clock-In / Out**. Verify that browser prompts for camera permission and the face oval guide tracks movement.
- [ ] **Database Connectivity:** Verify employee list, shifts, and attendance logs load properly.
- [ ] **Admin Account:** Default admin email: `admin@apexhr.com`
- [ ] **Timezone Sync:** Verify the timezone in `src/data/seedData.ts` or database `system_settings` matches your organization's local timezone (e.g., `Africa/Kampala`).
