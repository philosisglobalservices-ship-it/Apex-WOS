/**
 * Enterprise Warehouse Operating System (WOS)
 * Optimized PostgreSQL Connection Pool & Database Client
 * 
 * Features:
 * - High-concurrency connection pooling (pg.Pool)
 * - SSL support with graceful fallback
 * - Safe parameterized query execution
 * - Transaction wrapper with automatic ROLLBACK on failure
 * - Health check & connection tester
 */

const { Pool } = require('pg');

// Parse connection string or environment variables
const poolConfig = {
    connectionString: process.env.DATABASE_URL || undefined,
    host: process.env.PGHOST || 'localhost',
    port: parseInt(process.env.PGPORT || '5432', 10),
    database: process.env.PGDATABASE || 'wos_enterprise_db',
    user: process.env.PGUSER || 'postgres',
    password: process.env.PGPASSWORD || 'postgres',
    
    // Optimal connection pool settings for warehouse operations
    max: parseInt(process.env.PG_POOL_MAX || '20', 10), // Maximum concurrent connections
    min: parseInt(process.env.PG_POOL_MIN || '4', 10),  // Keep hot connections ready
    idleTimeoutMillis: 30000,                           // Close idle connections after 30s
    connectionTimeoutMillis: 5000,                      // Fail fast if database is unreachable
    
    ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false
};

const pool = new Pool(poolConfig);

// Pool error listener
pool.on('error', (err, client) => {
    console.error('⚠️ [WOS Database Pool Error]: Unexpected idle client failure', err);
});

/**
 * Execute parameterized query safely
 * @param {string} text - SQL query string
 * @param {Array} params - Query parameters
 * @returns {Promise<pg.QueryResult>}
 */
async function query(text, params) {
    const start = Date.now();
    try {
        const res = await pool.query(text, params);
        const duration = Date.now() - start;
        if (process.env.DEBUG_SQL === 'true') {
            console.log(`[SQL Query] (${duration}ms):`, text.substring(0, 100), params || '');
        }
        return res;
    } catch (error) {
        console.error('❌ [SQL Execution Error]:', error.message, '\nQuery:', text);
        throw error;
    }
}

/**
 * Transaction Execution Helper
 * Automatically handles BEGIN, COMMIT, and ROLLBACK
 * @param {Function} callback - Async function receiving the active transaction client
 * @returns {Promise<any>}
 */
async function withTransaction(callback) {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const result = await callback(client);
        await client.query('COMMIT');
        return result;
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('⚠️ [Transaction Rolled Back]:', error.message);
        throw error;
    } finally {
        client.release();
    }
}

/**
 * Database Connectivity Health Check
 * @returns {Promise<{ ok: boolean, version?: string, latencyMs?: number, error?: string }>}
 */
async function testConnection() {
    const start = Date.now();
    try {
        const res = await query('SELECT version(), NOW() AS server_time, current_database() AS db_name');
        const latencyMs = Date.now() - start;
        return {
            ok: true,
            database: res.rows[0].db_name,
            serverTime: res.rows[0].server_time,
            version: res.rows[0].version,
            latencyMs
        };
    } catch (err) {
        return {
            ok: false,
            error: err.message
        };
    }
}

module.exports = {
    pool,
    query,
    withTransaction,
    testConnection
};
