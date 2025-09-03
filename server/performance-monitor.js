#!/usr/bin/env node

/**
 * Performance Monitor for LeadsFlow
 * Run this script to diagnose database performance issues
 */

import dotenv from 'dotenv';
import pkg from 'pg';
const { Pool } = pkg;

// Load environment variables
dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

class PerformanceMonitor {
  constructor() {
    this.startTime = Date.now();
  }

  async checkDatabaseHealth() {
    console.log('🔍 Checking Database Health...\n');
    
    try {
      // Check active connections
      const connections = await pool.query(`
        SELECT 
          count(*) as active_connections,
          count(*) FILTER (WHERE state = 'active') as active_queries,
          count(*) FILTER (WHERE state = 'idle') as idle_connections
        FROM pg_stat_activity 
        WHERE datname = current_database()
      `);
      
      console.log('📊 Connection Status:');
      console.log(`  Active Connections: ${connections.rows[0].active_connections}`);
      console.log(`  Active Queries: ${connections.rows[0].active_queries}`);
      console.log(`  Idle Connections: ${connections.rows[0].idle_connections}\n`);

      // Check table sizes with correct column names
      const tableSizes = await pool.query(`
        SELECT 
          schemaname,
          tablename,
          pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
          pg_total_relation_size(schemaname||'.'||tablename) as size_bytes
        FROM pg_tables 
        WHERE schemaname = 'public' 
        ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
        LIMIT 10
      `);
      
      console.log('📈 Table Sizes:');
      tableSizes.rows.forEach(row => {
        console.log(`  ${row.tablename}: ${row.size}`);
      });
      console.log('');

      // Check slow queries (if pg_stat_statements is available)
      try {
        const slowQueries = await pool.query(`
          SELECT 
            query,
            round(mean_time::numeric, 2) as avg_time_ms,
            calls,
            round(total_time::numeric, 2) as total_time_ms
          FROM pg_stat_statements 
          WHERE mean_time > 100
          ORDER BY mean_time DESC 
          LIMIT 5
        `);
        
        if (slowQueries.rows.length > 0) {
          console.log('🐌 Slow Queries (>100ms):');
          slowQueries.rows.forEach((row, index) => {
            console.log(`  ${index + 1}. ${row.query.substring(0, 100)}...`);
            console.log(`     Avg Time: ${row.avg_time_ms}ms, Calls: ${row.calls}, Total: ${row.total_time_ms}ms\n`);
          });
        } else {
          console.log('✅ No slow queries detected (>100ms)\n');
        }
      } catch (error) {
        console.log('ℹ️  pg_stat_statements not available - slow query monitoring disabled\n');
      }

      // Check index usage with correct column names
      const indexUsage = await pool.query(`
        SELECT 
          schemaname,
          tablename,
          indexname,
          idx_scan as index_scans,
          idx_tup_read as tuples_read,
          idx_tup_fetch as tuples_fetched
        FROM pg_stat_user_indexes 
        WHERE schemaname = 'public'
        ORDER BY idx_scan DESC
        LIMIT 10
      `);
      
      console.log('🔍 Index Usage:');
      indexUsage.rows.forEach(row => {
        console.log(`  ${row.tablename}.${row.indexname}: ${row.index_scans} scans, ${row.tuples_read} tuples read`);
      });
      console.log('');

      // Check for missing indexes with correct column names
      const missingIndexes = await pool.query(`
        SELECT 
          schemaname,
          tablename,
          attname as column_name,
          n_distinct,
          correlation
        FROM pg_stats 
        WHERE schemaname = 'public' 
        AND n_distinct > 100
        AND correlation < 0.1
        ORDER BY n_distinct DESC
        LIMIT 10
      `);
      
      if (missingIndexes.rows.length > 0) {
        console.log('⚠️  Potential Missing Indexes (high cardinality, low correlation):');
        missingIndexes.rows.forEach(row => {
          console.log(`  ${row.tablename}.${row.column_name}: distinct values=${row.n_distinct}, correlation=${row.correlation}`);
        });
        console.log('');
      }

      // Check database locks
      const locks = await pool.query(`
        SELECT 
          l.mode,
          l.granted,
          t.relname as table_name,
          a.usename as username,
          a.application_name,
          a.query_start,
          a.state
        FROM pg_locks l
        JOIN pg_class t ON l.relation = t.oid
        JOIN pg_stat_activity a ON l.pid = a.pid
        WHERE t.relkind = 'r'
        AND l.mode != 'AccessShareLock'
        ORDER BY a.query_start
      `);
      
      if (locks.rows.length > 0) {
        console.log('🔒 Active Locks:');
        locks.rows.forEach(row => {
          console.log(`  ${row.table_name}: ${row.mode} by ${row.username} (${row.state})`);
        });
        console.log('');
      } else {
        console.log('✅ No active locks detected\n');
      }

      // Performance recommendations
      console.log('💡 Performance Recommendations:');
      
      if (connections.rows[0].active_connections > 20) {
        console.log('  ⚠️  High connection count - consider reducing connection pool size');
      }
      
      if (tableSizes.rows.some(row => row.size_bytes > 100000000)) { // >100MB
        console.log('  ⚠️  Large tables detected - consider partitioning or archiving');
      }
      
      if (missingIndexes.rows.length > 0) {
        console.log('  ⚠️  Missing indexes detected - run the performance migration');
      }
      
      console.log('  ✅ Run: npm run performance:indexes (to apply performance indexes)');
      console.log('  ✅ Check your .env file for database performance settings');
      console.log('  ✅ Monitor slow queries regularly');

    } catch (error) {
      console.error('❌ Error checking database health:', error.message);
    }
  }

  async runPerformanceTest() {
    console.log('🚀 Running Performance Test...\n');
    
    try {
      // Test basic operations
      const tests = [
        { name: 'Simple SELECT', query: 'SELECT 1' },
        { name: 'Users Count', query: 'SELECT COUNT(*) FROM users' },
        { name: 'Leads Count', query: 'SELECT COUNT(*) FROM leads' },
        { name: 'Recent Leads', query: 'SELECT id, name, created_at FROM leads ORDER BY created_at DESC LIMIT 10' },
        { name: 'User with Leads', query: 'SELECT u.email, COUNT(l.id) FROM users u LEFT JOIN leads l ON u.id = l.user_id GROUP BY u.id, u.email LIMIT 5' }
      ];

      for (const test of tests) {
        const start = Date.now();
        try {
          await pool.query(test.query);
          const duration = Date.now() - start;
          const status = duration < 100 ? '✅' : duration < 500 ? '⚠️' : '❌';
          console.log(`${status} ${test.name}: ${duration}ms`);
        } catch (error) {
          console.log(`❌ ${test.name}: Failed - ${error.message}`);
        }
      }

    } catch (error) {
      console.error('❌ Error running performance test:', error.message);
    }
  }

  async cleanup() {
    await pool.end();
    const totalTime = Date.now() - this.startTime;
    console.log(`\n⏱️  Performance check completed in ${totalTime}ms`);
  }
}

// Main execution
async function main() {
  const monitor = new PerformanceMonitor();
  
  try {
    await monitor.checkDatabaseHealth();
    await monitor.runPerformanceTest();
  } catch (error) {
    console.error('❌ Performance monitoring failed:', error.message);
  } finally {
    await monitor.cleanup();
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { PerformanceMonitor }; 