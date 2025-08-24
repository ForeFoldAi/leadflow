# 🔒 CORS Production Configuration Guide

## 🚨 **Critical Security Issue Fixed**

The production CORS configuration had a security vulnerability where `CORS_ORIGIN` was set to `"*"` (wildcard), which allows requests from any domain. This has been fixed.

## 📋 **Current CORS Configuration**

### **Server-Side Setup** (`server/index.ts`)

The CORS configuration supports multiple environment variables for flexibility:

```typescript
const allowedOrigins = [
  process.env.CORS_ORIGIN,        // Primary CORS origin
  process.env.FRONTEND_URL,       // Frontend URL
  ...(process.env.DEV_ORIGINS ? process.env.DEV_ORIGINS.split(',') : []),     // Development origins
  ...(process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : []) // Additional allowed origins
].filter((origin): origin is string => Boolean(origin));
```

### **Features:**
- ✅ **Credentials support** (`credentials: true`)
- ✅ **Multiple origins support**
- ✅ **Subdomain matching** (e.g., `https://app.domain.com` matches `https://*.domain.com`)
- ✅ **Development origins** (comma-separated)
- ✅ **Proper error logging** for blocked requests
- ✅ **Required headers** (`x-user-id`, `x-user-email`)

## 🚀 **Production Setup**

### **1. Update Terraform Configuration**

Replace the placeholder in `server/terraform/main.tf`:

```terraform
{
  name  = "CORS_ORIGIN"
  value = "https://your-actual-frontend-domain.com"
}
```

### **2. Set Environment Variables**

For production deployment, set these environment variables:

```bash
# Primary CORS origin (your frontend domain)
CORS_ORIGIN=https://your-frontend-domain.com

# Frontend URL (can be same as CORS_ORIGIN)
FRONTEND_URL=https://your-frontend-domain.com

# Additional allowed origins (comma-separated)
ALLOWED_ORIGINS=https://www.your-domain.com,https://app.your-domain.com

# Development origins (for staging/testing)
DEV_ORIGINS=https://staging.your-domain.com,https://test.your-domain.com
```

### **3. Client-Side Configuration**

Ensure your client has the correct API base URL:

```bash
# In client .env file
VITE_API_BASE_URL=https://your-api-domain.com
```

## 🔧 **Environment-Specific Configurations**

### **Development**
```bash
CORS_ORIGIN=http://localhost:5173
FRONTEND_URL=http://localhost:5173
DEV_ORIGINS=http://localhost:3000,http://localhost:5174
```

### **Staging**
```bash
CORS_ORIGIN=https://staging.your-domain.com
FRONTEND_URL=https://staging.your-domain.com
ALLOWED_ORIGINS=https://staging-api.your-domain.com
```

### **Production**
```bash
CORS_ORIGIN=https://your-domain.com
FRONTEND_URL=https://your-domain.com
ALLOWED_ORIGINS=https://www.your-domain.com,https://app.your-domain.com
```

## 🛡️ **Security Best Practices**

### **✅ Do's:**
- Use specific domains instead of wildcards
- Include only necessary origins
- Use HTTPS in production
- Log blocked CORS requests
- Regularly review allowed origins

### **❌ Don'ts:**
- Never use `"*"` in production
- Don't include unnecessary domains
- Don't forget to update when domains change
- Don't ignore CORS error logs

## 🔍 **Testing CORS Configuration**

### **1. Check CORS Headers**
```bash
curl -H "Origin: https://your-frontend-domain.com" \
     -H "Access-Control-Request-Method: POST" \
     -H "Access-Control-Request-Headers: Content-Type" \
     -X OPTIONS \
     https://your-api-domain.com/api/leads
```

### **2. Browser Console Check**
Open browser dev tools and check for CORS errors when making API requests.

### **3. CORS Preflight Test**
```javascript
fetch('https://your-api-domain.com/api/leads', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  credentials: 'include',
  body: JSON.stringify({ /* your data */ })
})
.then(response => response.json())
.catch(error => console.error('CORS Error:', error));
```

## 🚨 **Common CORS Issues & Solutions**

### **Issue 1: "No 'Access-Control-Allow-Origin' header"**
**Solution:** Ensure your domain is in the `CORS_ORIGIN` or `ALLOWED_ORIGINS` list.

### **Issue 2: "Credentials not supported"**
**Solution:** The server already has `credentials: true`, ensure client sends `credentials: 'include'`.

### **Issue 3: "Method not allowed"**
**Solution:** The server allows `['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']`. Add more if needed.

### **Issue 4: "Header not allowed"**
**Solution:** The server allows `['Content-Type', 'Authorization', 'x-user-id', 'x-user-email']`. Add more if needed.

## 📊 **Monitoring CORS**

### **Check CORS Logs**
The server logs blocked CORS requests:
```
CORS blocked request from origin: https://malicious-site.com
```

### **Monitor in CloudWatch**
If using AWS, check CloudWatch logs for CORS-related errors.

## 🔄 **Deployment Checklist**

- [ ] Update `CORS_ORIGIN` in Terraform configuration
- [ ] Set all required environment variables
- [ ] Test CORS with actual frontend domain
- [ ] Verify credentials work correctly
- [ ] Check browser console for errors
- [ ] Monitor logs for blocked requests
- [ ] Update documentation with actual domains

## 📞 **Support**

If you encounter CORS issues:
1. Check the server logs for blocked origins
2. Verify your domain is in the allowed origins list
3. Ensure HTTPS is used in production
4. Test with the curl command above
5. Check browser network tab for preflight requests 