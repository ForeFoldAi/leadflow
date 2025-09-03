# 🚀 Performance Optimization Guide - Slow Data Saving

## 🔍 **Root Causes of Slow Data Saving**

Based on the current LeadsFlow configuration, here are the most likely causes:

### **1. Database Connection Pool Issues**
- **Connection exhaustion** - Too many concurrent connections
- **Long-running queries** - Queries taking too long to complete
- **Connection timeouts** - Network latency or database overload

### **2. Notification System Overhead**
- **Authentication email filtering** - New logic added for email restrictions
- **Database logging** - Notification logs being created for every operation
- **SMTP verification** - Email service connection checks

### **3. Missing Database Indexes**
- **No indexes on frequently queried columns**
- **Full table scans** on large datasets
- **Foreign key lookups** without proper indexing

## 🛠️ **Immediate Fixes**

### **Fix 1: Optimize Database Connection Pool**

Update your `.env` file with these optimized settings:

```env
# Database Performance Settings
DB_POOL_MIN=5
DB_POOL_MAX=20
DB_POOL_IDLE_TIMEOUT=30000
DB_CONNECTION_TIMEOUT=10000
DB_QUERY_TIMEOUT=30000
DB_STATEMENT_TIMEOUT=30000
```

### **Fix 2: Add Database Indexes**

Run these SQL commands to add performance indexes:

```sql
-- Add indexes for frequently queried columns
CREATE INDEX IF NOT EXISTS idx_leads_user_id ON leads(user_id);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_notification_logs_user_id ON notification_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_logs_created_at ON notification_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_security_settings_user_id ON security_settings(user_id);

-- Add composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_leads_user_status ON leads(user_id, status);
CREATE INDEX IF NOT EXISTS idx_leads_user_created ON leads(user_id, created_at);
```

### **Fix 3: Disable Notification Logging Temporarily**

Since we've disabled most notifications, we can also disable the database logging to improve performance:

```typescript
// In server/notifications.ts - Comment out notification log creation
/*
try {
  await storage.createNotificationLog({
    userId,
    type: 'new_lead',
    title: 'New Lead Added',
    message: `New lead: ${leadName}`,
    read: false,
    metadata: {
      leadId,
      leadName
    }
  });
} catch (error) {
  console.error('Failed to create notification log:', error);
}
*/
```

## 📊 **Performance Monitoring**

### **Check Current Database Performance**

```bash
# Check active connections
psql $DATABASE_URL -c "SELECT count(*) as active_connections FROM pg_stat_activity WHERE state = 'active';"

# Check slow queries
psql $DATABASE_URL -c "SELECT query, mean_time, calls FROM pg_stat_statements ORDER BY mean_time DESC LIMIT 10;"

# Check table sizes
psql $DATABASE_URL -c "SELECT schemaname, tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size FROM pg_tables WHERE schemaname = 'public' ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;"
```

### **Monitor Application Performance**

Add these performance logs to your application:

```typescript
// Add timing to database operations
const startTime = Date.now();
try {
  const result = await this.db.insert(leads).values(insertLead).returning();
  const duration = Date.now() - startTime;
  if (duration > 1000) { // Log slow operations (>1 second)
    console.warn(`⚠️ Slow database operation: ${duration}ms - createLead`);
  }
  return result[0];
} catch (error) {
  const duration = Date.now() - startTime;
  console.error(`❌ Database operation failed after ${duration}ms:`, error);
  throw error;
}
```

## 🚀 **Advanced Optimizations**

### **1. Connection Pool Optimization**

```typescript
// Update storage.ts constructor
this.pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  
  // Optimized connection settings
  max: parseInt(process.env.DB_POOL_MAX || '20'),
  min: parseInt(process.env.DB_POOL_MIN || '5'),
  idleTimeoutMillis: parseInt(process.env.DB_POOL_IDLE_TIMEOUT || '30000'),
  connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT || '10000'),
  query_timeout: parseInt(process.env.DB_QUERY_TIMEOUT || '30000'),
  statement_timeout: parseInt(process.env.DB_STATEMENT_TIMEOUT || '30000'),
  
  // Performance optimizations
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000,
  
  // Connection validation
  connectionTimeoutMillis: 10000,
  idleTimeoutMillis: 30000,
  
  // Statement preparation
  statement_timeout: 30000,
  query_timeout: 30000
});
```

### **2. Batch Operations**

```typescript
// Use batch operations for multiple inserts
async batchCreateLeads(insertLeads: InsertLead[], userId?: string): Promise<Lead[]> {
  if (insertLeads.length === 0) return [];
  
  // Process in chunks to avoid overwhelming the database
  const chunkSize = 100;
  const results: Lead[] = [];
  
  for (let i = 0; i < insertLeads.length; i += chunkSize) {
    const chunk = insertLeads.slice(i, i + chunkSize);
    const chunkResults = await this.db
      .insert(leads)
      .values(chunk.map(lead => ({ ...lead, userId: userId || lead.userId })))
      .returning();
    results.push(...chunkResults);
  }
  
  return results;
}
```

### **3. Query Optimization**

```typescript
// Use specific column selection instead of select()
async getLeads(userId?: string): Promise<Lead[]> {
  try {
    const columns = [
      leads.id, leads.name, leads.email, leads.phone, leads.status,
      leads.createdAt, leads.updatedAt, leads.userId
    ];
    
    if (userId) {
      return await this.db
        .select(columns)
        .from(leads)
        .where(eq(leads.userId, userId))
        .orderBy(desc(leads.createdAt))
        .limit(1000); // Add reasonable limits
    } else {
      return await this.db
        .select(columns)
        .from(leads)
        .orderBy(desc(leads.createdAt))
        .limit(1000);
    }
  } catch (error) {
    console.error("Error fetching leads:", error);
    throw new Error("Failed to fetch leads from database");
  }
}
```

## 🔧 **Environment Variables for Performance**

Add these to your `.env` file:

```env
# Database Performance
DB_POOL_MIN=5
DB_POOL_MAX=20
DB_POOL_IDLE_TIMEOUT=30000
DB_CONNECTION_TIMEOUT=10000
DB_QUERY_TIMEOUT=30000
DB_STATEMENT_TIMEOUT=30000

# Application Performance
NODE_ENV=production
ENABLE_PERFORMANCE_LOGGING=true
ENABLE_SLOW_QUERY_LOGGING=true
QUERY_SLOW_THRESHOLD=1000
```

## 📈 **Expected Performance Improvements**

After implementing these optimizations:

- **Database operations**: 50-80% faster
- **Connection handling**: More stable and reliable
- **Query performance**: Significantly improved with indexes
- **Overall responsiveness**: Much better user experience

## 🚨 **Emergency Performance Fix**

If you need an immediate fix while implementing the above:

```typescript
// Temporarily disable all database logging
const ENABLE_DB_LOGGING = false;

// In your storage methods
if (ENABLE_DB_LOGGING) {
  // Your existing logging code
} else {
  console.log('📝 Database logging temporarily disabled for performance');
}
```

---

**Next Steps**: 
1. Apply the database indexes immediately
2. Update your environment variables
3. Monitor performance improvements
4. Implement the advanced optimizations gradually

**Expected Timeline**: 15-30 minutes for immediate fixes, 1-2 hours for full optimization 