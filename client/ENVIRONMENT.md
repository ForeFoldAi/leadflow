# 🌍 Client Environment Variables

This document describes the environment variables used by the client application.

## 📋 Setup

1. Copy `.env.example` to `.env`
2. Fill in your specific values
3. Restart the development server

```bash
cp .env.example .env
# Edit .env with your values
npm run dev
```

## ❓ **Why VITE_API_BASE_URL is Required**

The client application needs `VITE_API_BASE_URL` because:

1. **API Communication**: All frontend components make HTTP requests to the backend API
2. **Separate Deployments**: Client (S3/CloudFront) and server (ECS) are deployed separately
3. **Different Domains**: Client and server run on different URLs in production
4. **Dynamic Configuration**: Allows same code to work in development and production

### **Examples:**
- **Development**: `VITE_API_BASE_URL=http://localhost:3000`
- **Production**: `VITE_API_BASE_URL=https://api.yourdomain.com`
- **Staging**: `VITE_API_BASE_URL=https://staging-api.yourdomain.com`

## 🔧 Environment Variables

### **Required Variables**

| Variable | Description | Example | Notes |
|----------|-------------|---------|-------|
| `VITE_API_BASE_URL` | Backend API URL | `http://localhost:3000` | **Required for all API calls** |
| `VITE_NODE_ENV` | Environment mode | `development` | |
| `VITE_APP_NAME` | Application name | `LeadConnect` | |

### **Optional Variables**

| Variable | Description | Default | Example |
|----------|-------------|---------|---------|
| `VITE_APP_VERSION` | App version | `1.0.0` | `1.0.0` |
| `VITE_CLOUDFRONT_DOMAIN` | CloudFront domain | - | `d123456789.cloudfront.net` |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Stripe public key | - | `pk_test_...` |
| `VITE_GOOGLE_ANALYTICS_ID` | GA tracking ID | - | `GA-123456789-1` |

### **Feature Flags**

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_ENABLE_2FA` | Enable 2FA features | `true` |
| `VITE_ENABLE_NOTIFICATIONS` | Enable notifications | `true` |
| `VITE_ENABLE_EXPORT` | Enable data export | `true` |
| `VITE_ENABLE_IMPORT` | Enable data import | `true` |
| `VITE_DEBUG` | Enable debug mode | `false` |

## 🚀 Production Setup

For production deployment, set these additional variables:

```bash
VITE_NODE_ENV=production
VITE_API_BASE_URL=https://api.yourdomain.com
VITE_CLOUDFRONT_DOMAIN=your-cloudfront-domain.cloudfront.net
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_your_live_key
VITE_DEBUG=false
```

## ⚠️ Security Notes

- All `VITE_` prefixed variables are exposed to the browser
- Never put sensitive information in client environment variables
- API keys should be public/publishable keys only
- Use server-side environment variables for sensitive data

## 🔄 Environment Loading

Vite loads environment variables in this order:

1. `.env.local` (ignored by git)
2. `.env.[NODE_ENV].local`
3. `.env.[NODE_ENV]`
4. `.env`

## 📝 Usage in Code

```typescript
// Access environment variables in your React components
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
const appName = import.meta.env.VITE_APP_NAME;
const is2FAEnabled = import.meta.env.VITE_ENABLE_2FA === 'true';
```
