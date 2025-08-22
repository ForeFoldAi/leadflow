# 🌍 Server Environment Variables

This document describes the environment variables used by the server application.

## 📋 Setup

1. Copy `.env.example` to `.env`
2. Fill in your specific values
3. Restart the server

```bash
cp .env.example .env
# Edit .env with your values
npm run dev
```

## 🔧 Environment Variables

### **Required Variables**

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@localhost:5432/db` |
| `SESSION_SECRET` | Session encryption key | `your-super-secret-key` |
| `JWT_SECRET` | JWT token secret | `your-jwt-secret` |

### **Server Configuration**

| Variable | Description | Default | Example |
|----------|-------------|---------|---------|
| `NODE_ENV` | Environment mode | `development` | `production` |
| `PORT` | Server port | `3000` | `3000` |
| `HOST` | Server host | `localhost` | `0.0.0.0` |
| `CORS_ORIGIN` | Allowed CORS origins | - | `http://localhost:5173` |

### **Database Configuration**

| Variable | Description | Default |
|----------|-------------|---------|
| `DB_POOL_MIN` | Min DB connections | `2` |
| `DB_POOL_MAX` | Max DB connections | `10` |
| `DB_POOL_IDLE_TIMEOUT` | Connection timeout | `30000` |

### **Email Configuration**

Choose one email service:

#### **SendGrid**
| Variable | Description |
|----------|-------------|
| `SENDGRID_API_KEY` | SendGrid API key |
| `FROM_EMAIL` | Sender email |
| `FROM_NAME` | Sender name |

#### **SMTP (Gmail, etc.)**
| Variable | Description |
|----------|-------------|
| `SMTP_HOST` | SMTP server host |
| `SMTP_PORT` | SMTP server port |
| `SMTP_USER` | SMTP username |
| `SMTP_PASS` | SMTP password |

### **Authentication**

| Variable | Description | Default |
|----------|-------------|---------|
| `SESSION_NAME` | Session cookie name | `leadconnect-session` |
| `JWT_EXPIRES_IN` | JWT expiration | `7d` |
| `BCRYPT_SALT_ROUNDS` | Password hashing rounds | `12` |

### **Two-Factor Authentication**

| Variable | Description | Default |
|----------|-------------|---------|
| `TWO_FACTOR_SERVICE_NAME` | 2FA service name | `LeadConnect` |
| `TWO_FACTOR_ISSUER` | 2FA issuer | `YourCompany` |

### **Payment Processing (Optional)**

| Variable | Description |
|----------|-------------|
| `STRIPE_SECRET_KEY` | Stripe secret key |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook secret |

### **AWS Configuration (Production)**

| Variable | Description |
|----------|-------------|
| `AWS_REGION` | AWS region |
| `AWS_ACCESS_KEY_ID` | AWS access key |
| `AWS_SECRET_ACCESS_KEY` | AWS secret key |
| `S3_BUCKET_NAME` | S3 bucket name |
| `S3_REGION` | S3 region |

### **Rate Limiting**

| Variable | Description | Default |
|----------|-------------|---------|
| `RATE_LIMIT_WINDOW_MS` | Rate limit window | `900000` (15 min) |
| `RATE_LIMIT_MAX_REQUESTS` | Max requests per window | `100` |

### **Feature Flags**

| Variable | Description | Default |
|----------|-------------|---------|
| `ENABLE_REGISTRATION` | Allow new registrations | `true` |
| `ENABLE_2FA` | Enable 2FA | `true` |
| `ENABLE_EMAIL_VERIFICATION` | Require email verification | `true` |
| `ENABLE_PASSWORD_RESET` | Allow password reset | `true` |
| `ENABLE_NOTIFICATIONS` | Enable notifications | `true` |

### **Logging & Debugging**

| Variable | Description | Default |
|----------|-------------|---------|
| `LOG_LEVEL` | Logging level | `info` |

## 🚀 Production Setup

For production deployment, ensure these are set:

```bash
NODE_ENV=production
DATABASE_URL=your-production-db-url
SESSION_SECRET=your-secure-session-secret
JWT_SECRET=your-secure-jwt-secret
SENDGRID_API_KEY=your-sendgrid-key
AWS_ACCESS_KEY_ID=your-aws-key
AWS_SECRET_ACCESS_KEY=your-aws-secret
CORS_ORIGIN=https://yourdomain.com
```

## ⚠️ Security Notes

- **Never commit `.env` files to version control**
- Use strong, unique secrets for production
- Rotate secrets regularly
- Use AWS Secrets Manager or similar for production secrets
- Limit CORS origins to your actual domains

## 🔄 Environment Loading

The server loads environment variables in this order:

1. System environment variables
2. `.env.local` (ignored by git)
3. `.env.production` or `.env.development`
4. `.env`

## 📝 Usage in Code

```typescript
// Access environment variables in your server code
const databaseUrl = process.env.DATABASE_URL;
const port = process.env.PORT || 3000;
const isProduction = process.env.NODE_ENV === 'production';
```

## 🔧 Database Setup

1. Install PostgreSQL
2. Create database: `createdb leadconnectdb`
3. Set `DATABASE_URL` in `.env`
4. Run migrations: `npm run db:push`
5. Initialize data: `npm run db:init`
