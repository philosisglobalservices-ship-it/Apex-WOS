/**
 * Enterprise Warehouse Operating System (WOS)
 * Supabase Database Client & Cloud Synchronizer
 * 
 * Configured Endpoint:
 * Project URL: https://rywfmocrdpygovckkarv.supabase.co
 * Publishable / Anon Key: sb_publishable_RnXmOfUXRS7D0kWz1jEJIQ_svXPD_JV
 */

const WOS_Supabase = (function () {
    const SUPABASE_URL = 'https://rywfmocrdpygovckkarv.supabase.co';
    const SUPABASE_KEY = 'sb_publishable_RnXmOfUXRS7D0kWz1jEJIQ_svXPD_JV';

    let client = null;
    let connectionStatus = 'idle'; // 'idle' | 'checking' | 'connected' | 'unreachable' | 'tables_missing'
    let lastCheckedTime = null;
    let errorMessage = null;

    /**
     * Initialize Supabase client
     */
    function init() {
        if (typeof window !== 'undefined' && window.supabase && window.supabase.createClient) {
            try {
                client = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
                    auth: {
                        persistSession: true,
                        autoRefreshToken: true
                    },
                    db: {
                        schema: 'public'
                    }
                });
                console.log('⚡ [WOS Supabase]: Client successfully initialized for', SUPABASE_URL);
            } catch (err) {
                console.error('❌ [WOS Supabase]: Failed to initialize client:', err);
                connectionStatus = 'unreachable';
                errorMessage = err.message;
            }
        } else {
            console.warn('⚠️ [WOS Supabase]: Supabase JS SDK not loaded in window scope.');
        }
    }

    /**
     * Check live connectivity to Supabase
     */
    async function testConnection() {
        if (!client) init();
        if (!client) {
            connectionStatus = 'unreachable';
            errorMessage = 'Supabase client library (@supabase/supabase-js) is not loaded.';
            return { success: false, status: connectionStatus, error: errorMessage };
        }

        connectionStatus = 'checking';
        try {
            // Attempt to query products or a lightweight probe
            const { data, error, status } = await client
                .from('products')
                .select('sku, name')
                .limit(1);

            lastCheckedTime = new Date().toISOString();

            if (error) {
                // If table doesn't exist yet (404/42P01), connection is alive but schema needs to be run
                if (error.code === '42P01' || error.message?.includes('relation "public.products" does not exist')) {
                    connectionStatus = 'tables_missing';
                    errorMessage = 'Database connected, but tables have not been created yet. Please execute schema.sql in Supabase SQL Editor.';
                    return { success: true, status: connectionStatus, tablesExist: false, message: errorMessage };
                }
                connectionStatus = 'error';
                errorMessage = error.message;
                return { success: false, status: connectionStatus, error: error.message };
            }

            connectionStatus = 'connected';
            errorMessage = null;
            return {
                success: true,
                status: 'connected',
                tablesExist: true,
                sampleCount: data ? data.length : 0,
                message: 'Successfully connected to Supabase PostgreSQL database!'
            };
        } catch (netErr) {
            connectionStatus = 'unreachable';
            errorMessage = netErr.message || 'Network error connecting to Supabase endpoint.';
            return { success: false, status: connectionStatus, error: errorMessage };
        }
    }

    /**
     * Push initial seed data or local changes to Supabase tables
     */
    async function pushAllToSupabase(state) {
        if (!client) init();
        if (!client) throw new Error('Supabase client not initialized');

        const results = {
            warehouses: 0,
            products: 0,
            inventoryBalances: 0,
            orders: 0,
            purchaseOrders: 0,
            auditTrail: 0,
            errors: []
        };

        try {
            // 1. Products
            if (state.products && state.products.length > 0) {
                const productRows = state.products.map(p => ({
                    sku: p.sku,
                    barcode: p.barcode,
                    name: p.name,
                    category: p.category,
                    storage_requirement: p.storageRequirement || 'Standard',
                    cost_price: p.costPrice || 0,
                    selling_price: p.sellingPrice || 0,
                    unit_of_measure: p.unitOfMeasure || 'Units',
                    weight_kg: p.weightKg || 1.0,
                    min_reorder_level: p.reorderLevel || 10,
                    is_active: true
                }));

                const { error: prodErr } = await client
                    .from('products')
                    .upsert(productRows, { onConflict: 'sku' });
                
                if (prodErr) results.errors.push(`Products: ${prodErr.message}`);
                else results.products = productRows.length;
            }

            // 2. Audit Trail
            if (state.auditTrail && state.auditTrail.length > 0) {
                const auditRows = state.auditTrail.slice(-50).map(a => ({
                    timestamp: a.timestamp,
                    user_id: a.userId || 'USR-001',
                    role_snapshot: a.role || 'Officer',
                    severity: a.severity || 'INFO',
                    action_type: a.actionType || 'GENERIC',
                    description: a.message,
                    metadata_json: a.details || {},
                    prev_hash: a.prevHash || 'GENESIS',
                    hash: a.hash
                }));

                const { error: auditErr } = await client
                    .from('audit_trail')
                    .upsert(auditRows, { onConflict: 'hash' });

                if (auditErr) results.errors.push(`Audit Trail: ${auditErr.message}`);
                else results.auditTrail = auditRows.length;
            }

            return { success: results.errors.length === 0, results };
        } catch (err) {
            console.error('Error pushing data to Supabase:', err);
            return { success: false, error: err.message, results };
        }
    }

    /**
     * Pull remote data from Supabase and synchronize local state
     */
    async function pullFromSupabase() {
        if (!client) init();
        if (!client) throw new Error('Supabase client not initialized');

        const remoteData = {};

        try {
            // Fetch Products
            const { data: prods, error: prodErr } = await client
                .from('products')
                .select('*');
            if (!prodErr && prods && prods.length > 0) {
                remoteData.products = prods.map(p => ({
                    sku: p.sku,
                    barcode: p.barcode,
                    name: p.name,
                    category: p.category,
                    storageRequirement: p.storage_requirement,
                    costPrice: Number(p.cost_price),
                    sellingPrice: Number(p.selling_price),
                    unitOfMeasure: p.unit_of_measure,
                    weightKg: Number(p.weight_kg),
                    reorderLevel: p.min_reorder_level
                }));
            }

            // Fetch Audit Trail
            const { data: audits, error: auditErr } = await client
                .from('audit_trail')
                .select('*')
                .order('timestamp', { ascending: true })
                .limit(100);
            if (!auditErr && audits && audits.length > 0) {
                remoteData.auditTrail = audits.map((a, idx) => ({
                    id: idx + 1,
                    timestamp: a.timestamp,
                    userId: a.user_id,
                    role: a.role_snapshot,
                    severity: a.severity,
                    actionType: a.action_type,
                    message: a.description,
                    details: a.metadata_json,
                    prevHash: a.prev_hash,
                    hash: a.hash
                }));
            }

            return { success: true, remoteData };
        } catch (err) {
            console.error('Failed to pull from Supabase:', err);
            return { success: false, error: err.message };
        }
    }

    /**
     * Insert a single audit record into Supabase in real-time
     */
    async function recordAuditAsync(logEntry) {
        if (!client) return;
        try {
            await client.from('audit_trail').insert({
                timestamp: logEntry.timestamp,
                user_id: logEntry.userId,
                role_snapshot: logEntry.role,
                severity: logEntry.severity,
                action_type: logEntry.actionType,
                description: logEntry.message,
                metadata_json: logEntry.details || {},
                prev_hash: logEntry.prevHash,
                hash: logEntry.hash
            });
        } catch (e) {
            console.warn('Background Supabase audit write skipped/failed:', e.message);
        }
    }

    return {
        init,
        getClient: () => client,
        testConnection,
        pushAllToSupabase,
        pullFromSupabase,
        recordAuditAsync,
        getStatus: () => ({
            status: connectionStatus,
            url: SUPABASE_URL,
            keyMasked: SUPABASE_KEY.substring(0, 15) + '...' + SUPABASE_KEY.substring(SUPABASE_KEY.length - 8),
            lastChecked: lastCheckedTime,
            error: errorMessage
        })
    };
})();

if (typeof window !== 'undefined') {
    window.WOS_Supabase = WOS_Supabase;
}
