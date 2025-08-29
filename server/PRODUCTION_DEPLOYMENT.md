# Production Deployment Guide

## 🚀 Production Optimizations Made

### 1. **Security Enhancements**
- ✅ Security headers (HSTS, XSS Protection, Content Type Options)
- ✅ Rate limiting (100 requests per 15 minutes)
- ✅ CORS configuration with strict origin validation
- ✅ Session security with strict cookie settings
- ✅ Production error handling (no internal error exposure)

### 2. **Performance Optimizations**
- ✅ Database connection pooling (50 connections in production)
- ✅ Optimized timeouts for production workloads
- ✅ Selective logging (errors and important operations only)
- ✅ Memory management with connection cleanup

### 3. **Monitoring & Health Checks**
- ✅ Health check endpoint (`/health`)
- ✅ Database connection monitoring
- ✅ Uptime tracking
- ✅ Environment validation

### 4. **Environment Configuration**
- ✅ Required environment variable validation
- ✅ Production-specific database settings
- ✅ Optimized session configuration

## 📋 Required Environment Variables

```bash
# Server Configuration
NODE_ENV=production
PORT=3000

# Database Configuration
DATABASE_URL=postgresql://username:password@host:port/database

# Session Configuration
SESSION_SECRET=your-super-secure-session-secret-here
SESSION_NAME=leadflow-session

# CORS Configuration
CORS_ORIGIN=https://leadsflowforefoldai.com
FRONTEND_URL=https://leadsflowforefoldai.com
ALLOWED_ORIGINS=https://leadsflowforefoldai.com,https://www.leadsflowforefoldai.com
DEV_ORIGINS=http://localhost:5173,http://127.0.0.1:5173

# Email Configuration (if using SendGrid)
SENDGRID_API_KEY=your-sendgrid-api-key
SENDGRID_FROM_EMAIL=noreply@leadsflowforefoldai.com

# Security Configuration
JWT_SECRET=your-jwt-secret-here
API_KEY_SECRET=your-api-key-secret-here
```

## 🔧 Deployment Commands

### 1. **Build for Production**
```bash
npm run prod:build
```

### 2. **Start Production Server**
```bash
npm run prod:start
```

### 3. **PM2 Production Deployment**
```bash
# Build the application
npm run build

# Start with PM2
pm2 start dist/index.js --name "leadflow-server" --env production

# Save PM2 configuration
pm2 save

# Setup PM2 startup script
pm2 startup
```

## 📊 Monitoring Endpoints

### Health Check
```bash
GET /health
```
Returns server and database health status.

### Response Format
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "environment": "production",
  "uptime": 3600,
  "database": "connected"
}
```

## 🔒 Security Features

### Rate Limiting
- **Window**: 15 minutes
- **Max Requests**: 100 per IP
- **Cleanup**: Automatic cleanup of old entries

### Security Headers
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Strict-Transport-Security: max-age=31536000; includeSubDomains`

### Session Security
- Secure cookies in production
- Strict same-site policy
- Domain-specific cookies
- 24-hour session timeout

## 🗄️ Database Optimizations

### Connection Pool Settings
- **Max Connections**: 50 (production)
- **Idle Timeout**: 60 seconds (production)
- **Connection Timeout**: 15 seconds (production)
- **Query Timeout**: 60 seconds (production)
- **Keep Alive**: Enabled in production

## 📝 Logging Configuration

### Production Logging
- Only logs errors and important operations
- Structured error logging
- Database error tracking
- Performance monitoring

### Log Levels
- **Development**: Verbose logging
- **Production**: Error and important operations only

## 🚨 Error Handling

### Production Error Responses
- No internal error exposure
- Generic error messages for 500 errors
- Specific error messages for client errors
- Structured error logging

## 🔍 Troubleshooting

### Common Issues

1. **Database Connection Issues**
   - Check `DATABASE_URL` environment variable
   - Verify SSL configuration for RDS
   - Check connection pool settings

2. **CORS Issues**
   - Verify `CORS_ORIGIN` and `FRONTEND_URL` settings
   - Check allowed origins configuration

3. **Session Issues**
   - Verify `SESSION_SECRET` is set
   - Check cookie domain configuration
   - Ensure HTTPS in production

4. **Rate Limiting**
   - Monitor `/health` endpoint for rate limit status
   - Check client IP detection

### Debug Commands
```bash
# Check server status
pm2 status

# View logs
pm2 logs

# Check health
curl http://localhost:3000/health

# Test database connection
npm run db:check
```

## 📈 Performance Monitoring

### Key Metrics
- Response times
- Database connection status
- Memory usage
- Error rates
- Rate limiting hits

### Monitoring Tools
- PM2 monitoring
- Health check endpoint
- Database connection monitoring
- Application logs

## 🔄 Update Process

### 1. Pull Latest Changes
```bash
git pull origin main
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Build Application
```bash
npm run build
```

### 4. Restart Server
```bash
pm2 restart leadflow-server
```

### 5. Verify Deployment
```bash
curl http://localhost:3000/health
```

## ✅ Production Checklist

- [ ] Environment variables configured
- [ ] Database connection tested
- [ ] Security headers enabled
- [ ] Rate limiting configured
- [ ] Health check endpoint working
- [ ] PM2 process running
- [ ] SSL certificate configured
- [ ] CORS settings correct
- [ ] Session configuration secure
- [ ] Error handling tested
- [ ] Monitoring setup complete 