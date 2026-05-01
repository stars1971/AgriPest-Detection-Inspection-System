# 农眸系统部署指南

## 概述

本指南用于指导将农眸系统部署到生产服务器。

## 服务器环境要求

- Python 3.8+
- Node.js 20+
- MySQL 5.7+ 或 MariaDB 10.2+
- Nginx (用于反向代理前端)

## 部署架构

```
前端 (8621端口) → Nginx → 后端 (8001端口) → MySQL
```

## 一、后端部署

### 1. 上传代码到服务器

将整个项目文件夹上传到服务器，例如：`/www/wwwroot/agri-vision/`

### 2. 配置后端环境

进入后端目录：
```bash
cd /www/wwwroot/agri-vision/backend
```

复制环境配置模板并修改：
```bash
cp .env.example .env
nano .env
```

根据你的服务器配置修改以下内容：
```env
# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USER=partial          # 根据你的数据库用户名修改
DB_PASSWORD=f5611818     # 根据你的数据库密码修改
DB_NAME=agri_vision       # 根据你的数据库名修改

# JWT Configuration (生产环境请修改为随机字符串)
SECRET_KEY=your-secret-key-here-change-this-in-production

# Server Configuration
HOST=0.0.0.0
PORT=8001
```

### 3. 安装 Python 依赖

```bash
# 创建虚拟环境（推荐）
python3 -m venv venv
source venv/bin/activate  # Linux/Mac
# 或
venv\Scripts\activate     # Windows

# 安装依赖
pip install -r requirements.txt
```

### 4. 初始化数据库

确保 MySQL 服务已启动，并且数据库已创建。后端会自动创建所需的表。

### 5. 启动后端服务

使用 uvicorn 启动：
```bash
uvicorn backend.main:app --host 0.0.0.0 --port 8001
```

**生产环境推荐使用 systemd 或 supervisor 管理进程：**

创建 systemd 服务文件 `/etc/systemd/system/agri-vision-backend.service`：
```ini
[Unit]
Description=Agri-Vision Backend
After=network.target mysql.service

[Service]
Type=simple
User=www-data
WorkingDirectory=/www/wwwroot/agri-vision
Environment="PATH=/www/wwwroot/agri-vision/backend/venv/bin"
ExecStart=/www/wwwroot/agri-vision/backend/venv/bin/uvicorn backend.main:app --host 0.0.0.0 --port 8001
Restart=always

[Install]
WantedBy=multi-user.target
```

启动服务：
```bash
systemctl daemon-reload
systemctl enable agri-vision-backend
systemctl start agri-vision-backend
systemctl status agri-vision-backend
```

## 二、前端部署

### 1. 构建前端

在本地或服务器上构建前端：

```bash
cd /www/wwwroot/agri-vision
npm install
npm run build
```

构建完成后，会生成 `dist` 文件夹。

### 2. 配置 Nginx

创建 Nginx 配置文件 `/etc/nginx/sites-available/agri-vision`：

```nginx
server {
    listen 8621;
    server_name 101.43.67.104;

    root /www/wwwroot/agri-vision/dist;
    index index.html;

    # 前端静态文件
    location / {
        try_files $uri $uri/ /index.html;
    }

    # 后端 API 代理
    location /api/ {
        proxy_pass http://127.0.0.1:8001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # WebSocket 代理
    location /ws {
        proxy_pass http://127.0.0.1:8001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # 上传文件
    location /uploads/ {
        proxy_pass http://127.0.0.1:8001;
        proxy_set_header Host $host;
    }

    # 启用 gzip 压缩
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json application/javascript;
}
```

启用配置：
```bash
ln -s /etc/nginx/sites-available/agri-vision /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
```

## 三、防火墙配置

确保服务器开放以下端口：
- 8621 (前端)
- 8001 (后端，如果需要直接访问)

```bash
# 如果使用 ufw
ufw allow 8621/tcp
ufw allow 8001/tcp

# 如果使用 firewalld
firewall-cmd --permanent --add-port=8621/tcp
firewall-cmd --permanent --add-port=8001/tcp
firewall-cmd --reload
```

## 四、验证部署

1. 检查后端服务：
```bash
curl http://127.0.0.1:8001/
curl http://127.0.0.1:8001/health
```

2. 检查前端访问：
在浏览器中访问 `http://101.43.67.104:8621/`

3. 测试注册功能：
尝试注册一个新用户，验证功能是否正常。

## 五、日志查看

- 后端日志：`/www/wwwroot/agri-vision/backend/app.log`
- Nginx 访问日志：`/var/log/nginx/agri-vision-access.log`
- Nginx 错误日志：`/var/log/nginx/agri-vision-error.log`
- systemd 日志：`journalctl -u agri-vision-backend -f`

## 六、常见问题

### 1. 注册失败
- 检查后端日志 `app.log`
- 确认数据库连接正常
- 检查数据库表是否正确创建

### 2. 前端无法连接后端
- 确认 Nginx 配置正确
- 检查后端服务是否在 8001 端口运行
- 检查防火墙设置

### 3. 数据库连接失败
- 确认 `.env` 中的数据库配置正确
- 确认 MySQL 服务正在运行
- 确认数据库用户有足够权限

### 4. 端口被占用
```bash
# 查看端口占用
netstat -tulpn | grep 8001
netstat -tulpn | grep 8621

# 或者使用 lsof
lsof -i :8001
lsof -i :8621
```

## 七、更新代码

当代码有更新时：

1. 拉取/上传新代码
2. 后端：
   ```bash
   cd /www/wwwroot/agri-vision/backend
   source venv/bin/activate
   pip install -r requirements.txt
   systemctl restart agri-vision-backend
   ```
3. 前端：
   ```bash
   cd /www/wwwroot/agri-vision
   npm install
   npm run build
   systemctl reload nginx
   ```

## 八、安全建议

1. 修改默认的 SECRET_KEY
2. 使用 HTTPS (配置 SSL 证书)
3. 定期备份数据库
4. 限制数据库用户权限
5. 启用防火墙
6. 定期更新依赖包
