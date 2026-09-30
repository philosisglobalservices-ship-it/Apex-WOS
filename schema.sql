-- =========================================================================
-- WAREHOUSE OPERATING SYSTEM (WOS) / ENTERPRISE WMS
-- Optimized Production Relational Schema Definition
-- Recommended Target Database: PostgreSQL 14+ / 16+
-- Architecture: Multi-Tenant, Zero-Trust RBAC, Separation of Duties (SoD),
--               Cryptographic Tamper-Resistant Audit, and Immutable Ledger
-- =========================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Clean drop in reverse dependency order
DROP VIEW IF EXISTS vw_daily_throughput CASCADE;
DROP VIEW IF EXISTS vw_pending_approvals CASCADE;
DROP VIEW IF EXISTS vw_bin_utilization CASCADE;
DROP VIEW IF EXISTS vw_inventory_valuation CASCADE;

DROP TABLE IF EXISTS audit_trail CASCADE;
DROP TABLE IF EXISTS invoices CASCADE;
DROP TABLE IF EXISTS saas_subscriptions CASCADE;
DROP TABLE IF EXISTS billing_rules CASCADE;
DROP TABLE IF EXISTS stock_adjustments CASCADE;
DROP TABLE IF EXISTS returned_orders CASCADE;
DROP TABLE IF EXISTS dispatch_records CASCADE;
DROP TABLE IF EXISTS packing_records CASCADE;
DROP TABLE IF EXISTS picking_tasks CASCADE;
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS putaway_tasks CASCADE;
DROP TABLE IF EXISTS po_items CASCADE;
DROP TABLE IF EXISTS purchase_orders CASCADE;
DROP TABLE IF EXISTS inventory_balances CASCADE;
DROP TABLE IF EXISTS inventory_ledger CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS locations CASCADE;
DROP TABLE IF EXISTS zones CASCADE;
DROP TABLE IF EXISTS warehouses CASCADE;
DROP TABLE IF EXISTS branches CASCADE;
DROP TABLE IF EXISTS temporary_delegations CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS role_permissions CASCADE;
DROP TABLE IF EXISTS permissions CASCADE;
DROP TABLE IF EXISTS roles CASCADE;
DROP TABLE IF EXISTS companies CASCADE;

-- =========================================================================
-- 1. TENANCY & ORGANIZATIONAL HIERARCHY
-- =========================================================================

-- 1.1 Parent Enterprise Company (Tenant Master)
CREATE TABLE companies (
    company_id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    legal_entity VARCHAR(200) NOT NULL,
    tax_id VARCHAR(100) NOT NULL UNIQUE,
    default_currency VARCHAR(10) NOT NULL DEFAULT 'NGN', -- 'NGN', 'USD', 'EUR', 'GBP'
    currency_symbol VARCHAR(5) NOT NULL DEFAULT '₦',
    industry VARCHAR(150) NOT NULL DEFAULT 'Third-Party Logistics (3PL) & Distribution',
    address TEXT NOT NULL,
    contact_email VARCHAR(255) NOT NULL,
    subscription_tier VARCHAR(50) NOT NULL DEFAULT 'Enterprise Tier'
        CHECK (subscription_tier IN ('Starter Tier', 'Growth Tier', 'Enterprise Tier', 'Custom')),
    max_warehouses INT NOT NULL DEFAULT 10 CHECK (max_warehouses > 0),
    max_users INT NOT NULL DEFAULT 50 CHECK (max_users > 0),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 1.2 Regional Distribution Branches (Geographic Hubs)
CREATE TABLE branches (
    branch_id VARCHAR(50) PRIMARY KEY,
    company_id VARCHAR(50) NOT NULL REFERENCES companies(company_id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    code VARCHAR(30) NOT NULL UNIQUE,
    region VARCHAR(100) NOT NULL,
    city VARCHAR(100) NOT NULL,
    manager_name VARCHAR(150),
    phone VARCHAR(50),
    address TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 1.3 Physical Warehouses & Distribution Centers
CREATE TABLE warehouses (
    warehouse_id VARCHAR(50) PRIMARY KEY,
    company_id VARCHAR(50) NOT NULL REFERENCES companies(company_id) ON DELETE CASCADE,
    branch_id VARCHAR(50) NOT NULL REFERENCES branches(branch_id) ON DELETE RESTRICT,
    name VARCHAR(150) NOT NULL,
    facility_type VARCHAR(60) NOT NULL DEFAULT 'Regional Distribution Center'
        CHECK (facility_type IN ('Regional Distribution Center', 'Cold Storage & Reefer Facility', 'Hazardous & Chemical Depot', 'Cross-Dock Staging Hub', 'E-Commerce Depot')),
    address TEXT NOT NULL,
    total_capacity_units INT NOT NULL DEFAULT 5000 CHECK (total_capacity_units > 0),
    status VARCHAR(30) NOT NULL DEFAULT 'Active'
        CHECK (status IN ('Active', 'Maintenance', 'Decommissioned')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 1.4 Dedicated Storage Temperature & Hazard Zones
CREATE TABLE zones (
    zone_id VARCHAR(50) PRIMARY KEY,
    warehouse_id VARCHAR(50) NOT NULL REFERENCES warehouses(warehouse_id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    zone_type VARCHAR(30) NOT NULL DEFAULT 'Standard'
        CHECK (zone_type IN ('Standard', 'Cold', 'Hazardous', 'Quarantine', 'Staging', 'Returns')),
    temperature_range VARCHAR(50) NOT NULL DEFAULT '18°C - 25°C',
    capacity_units INT NOT NULL DEFAULT 1000 CHECK (capacity_units > 0),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT unique_wh_zone UNIQUE (warehouse_id, name)
);

-- 1.5 Fine-Grained Storage Bins (WH01-Z02-A01-R01-S01-B01)
CREATE TABLE locations (
    location_id VARCHAR(100) PRIMARY KEY,
    warehouse_id VARCHAR(50) NOT NULL REFERENCES warehouses(warehouse_id) ON DELETE CASCADE,
    zone_id VARCHAR(50) NOT NULL REFERENCES zones(zone_id) ON DELETE CASCADE,
    aisle VARCHAR(20) NOT NULL,
    rack VARCHAR(20) NOT NULL,
    shelf VARCHAR(20) NOT NULL,
    bin VARCHAR(20) NOT NULL,
    barcode VARCHAR(120) NOT NULL UNIQUE,
    capacity_units INT NOT NULL DEFAULT 100 CHECK (capacity_units > 0),
    occupied_units INT NOT NULL DEFAULT 0 CHECK (occupied_units >= 0),
    status VARCHAR(20) NOT NULL DEFAULT 'Active'
        CHECK (status IN ('Active', 'Frozen', 'Maintenance', 'Decommissioned')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT check_occupied_cap CHECK (occupied_units <= capacity_units)
);

-- =========================================================================
-- 2. ZERO-TRUST IDENTITY, RBAC & SEPARATION OF DUTIES (SoD)
-- =========================================================================

-- 2.1 System Roles
CREATE TABLE roles (
    role_id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    badge_label VARCHAR(50) NOT NULL,
    color_theme VARCHAR(30) NOT NULL DEFAULT 'indigo',
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 2.2 Granular Permissions Matrix
CREATE TABLE permissions (
    permission_id VARCHAR(100) PRIMARY KEY,
    module VARCHAR(50) NOT NULL,
    action VARCHAR(50) NOT NULL,
    description TEXT,
    CONSTRAINT unique_permission_action UNIQUE (module, action)
);

-- 2.3 Role-Permission Mapping
CREATE TABLE role_permissions (
    role_id VARCHAR(50) NOT NULL REFERENCES roles(role_id) ON DELETE CASCADE,
    permission_id VARCHAR(100) NOT NULL REFERENCES permissions(permission_id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

-- 2.4 User Accounts
CREATE TABLE users (
    user_id VARCHAR(50) PRIMARY KEY,
    company_id VARCHAR(50) NOT NULL REFERENCES companies(company_id) ON DELETE CASCADE,
    branch_id VARCHAR(50) REFERENCES branches(branch_id) ON DELETE SET NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(150) NOT NULL,
    title VARCHAR(150),
    role_id VARCHAR(50) NOT NULL REFERENCES roles(role_id) ON DELETE RESTRICT,
    warehouse_scope VARCHAR(50) NOT NULL DEFAULT 'ALL', -- 'ALL' or specific warehouse_id
    approval_limit NUMERIC(15, 2) NOT NULL DEFAULT 0.00 CHECK (approval_limit >= 0.00), -- ₦ limit for stock write-offs
    status VARCHAR(30) NOT NULL DEFAULT 'Active'
        CHECK (status IN ('Invited', 'Active', 'Suspended', 'Locked', 'Deactivated')),
    avatar_text VARCHAR(10),
    mfa_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    last_login_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 2.5 Temporary Acting Privilege Delegation
CREATE TABLE temporary_delegations (
    delegation_id VARCHAR(50) PRIMARY KEY,
    delegator_id VARCHAR(50) NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    delegatee_id VARCHAR(50) NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    acting_role_id VARCHAR(50) NOT NULL REFERENCES roles(role_id) ON DELETE RESTRICT,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Expired', 'Revoked')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT check_delegation_dates CHECK (start_time < end_time),
    CONSTRAINT check_self_delegation CHECK (delegator_id <> delegatee_id)
);

-- =========================================================================
-- 3. PRODUCT CATALOG MASTER DATA
-- =========================================================================

CREATE TABLE products (
    sku VARCHAR(100) PRIMARY KEY,
    company_id VARCHAR(50) NOT NULL REFERENCES companies(company_id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    barcode VARCHAR(100) NOT NULL UNIQUE,
    storage_requirement VARCHAR(30) NOT NULL DEFAULT 'Standard'
        CHECK (storage_requirement IN ('Standard', 'Cold', 'Hazardous', 'Quarantine')),
    target_zone_type VARCHAR(30) NOT NULL DEFAULT 'Standard',
    weight_kg NUMERIC(10, 3) NOT NULL DEFAULT 1.000 CHECK (weight_kg > 0),
    unit_of_measure VARCHAR(30) NOT NULL DEFAULT 'Units',
    min_stock_level INT NOT NULL DEFAULT 10 CHECK (min_stock_level >= 0),
    max_stock_level INT NOT NULL DEFAULT 1000 CHECK (max_stock_level >= min_stock_level),
    cost_price NUMERIC(15, 2) NOT NULL CHECK (cost_price >= 0.00), -- ₦
    selling_price NUMERIC(15, 2) NOT NULL CHECK (selling_price >= 0.00),
    description TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Discontinued', 'Recalled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- =========================================================================
-- 4. INVENTORY BALANCES & IMMUTABLE PHYSICAL LEDGER
-- =========================================================================

-- 4.1 Live Physical Stock Quantities per Storage Bin
CREATE TABLE inventory_balances (
    balance_id BIGSERIAL PRIMARY KEY,
    warehouse_id VARCHAR(50) NOT NULL REFERENCES warehouses(warehouse_id) ON DELETE CASCADE,
    location_id VARCHAR(100) NOT NULL REFERENCES locations(location_id) ON DELETE CASCADE,
    product_sku VARCHAR(100) NOT NULL REFERENCES products(sku) ON DELETE RESTRICT,
    qty_available INT NOT NULL DEFAULT 0 CHECK (qty_available >= 0),
    qty_reserved INT NOT NULL DEFAULT 0 CHECK (qty_reserved >= 0),
    qty_allocated INT NOT NULL DEFAULT 0 CHECK (qty_allocated >= 0),
    qty_picked INT NOT NULL DEFAULT 0 CHECK (qty_picked >= 0),
    qty_packed INT NOT NULL DEFAULT 0 CHECK (qty_packed >= 0),
    qty_damaged INT NOT NULL DEFAULT 0 CHECK (qty_damaged >= 0),
    qty_quarantined INT NOT NULL DEFAULT 0 CHECK (qty_quarantined >= 0),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT unique_sku_warehouse_bin UNIQUE (warehouse_id, location_id, product_sku)
);

-- 4.2 Append-Only Physical Inventory Movement Ledger
-- ENFORCED BY TRIGGER: Strictly write-only. No UPDATE or DELETE allowed.
CREATE TABLE inventory_ledger (
    entry_id BIGSERIAL PRIMARY KEY,
    transaction_uuid UUID DEFAULT gen_random_uuid() NOT NULL,
    company_id VARCHAR(50) NOT NULL REFERENCES companies(company_id) ON DELETE RESTRICT,
    warehouse_id VARCHAR(50) NOT NULL REFERENCES warehouses(warehouse_id) ON DELETE RESTRICT,
    location_id VARCHAR(100) NOT NULL REFERENCES locations(location_id) ON DELETE RESTRICT,
    product_sku VARCHAR(100) NOT NULL REFERENCES products(sku) ON DELETE RESTRICT,
    prev_qty INT NOT NULL CHECK (prev_qty >= 0),
    change_qty INT NOT NULL,
    new_qty INT NOT NULL CHECK (new_qty >= 0),
    transaction_type VARCHAR(40) NOT NULL
        CHECK (transaction_type IN ('Receiving', 'Put-away', 'Pick', 'Pack', 'Dispatch', 'Return', 'Adjustment', 'Transfer')),
    user_id VARCHAR(50) NOT NULL REFERENCES users(user_id) ON DELETE RESTRICT,
    reference_doc_id VARCHAR(100) NOT NULL, -- PO ID, Order ID, Adjustment ID, RMA ID
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    device_info TEXT
);

-- =========================================================================
-- 5. INBOUND OPERATIONS: RECEIVING & SMART PUT-AWAY
-- =========================================================================

-- 5.1 Inbound Purchase Orders (POs)
CREATE TABLE purchase_orders (
    po_id VARCHAR(100) PRIMARY KEY,
    company_id VARCHAR(50) NOT NULL REFERENCES companies(company_id) ON DELETE CASCADE,
    warehouse_id VARCHAR(50) NOT NULL REFERENCES warehouses(warehouse_id) ON DELETE RESTRICT,
    supplier_name VARCHAR(200) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'Expected'
        CHECK (status IN ('Expected', 'Receiving', 'Completed', 'Cancelled')),
    eta_date DATE NOT NULL,
    created_by VARCHAR(50) REFERENCES users(user_id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 5.2 PO Line Items
CREATE TABLE po_items (
    po_item_id BIGSERIAL PRIMARY KEY,
    po_id VARCHAR(100) NOT NULL REFERENCES purchase_orders(po_id) ON DELETE CASCADE,
    product_sku VARCHAR(100) NOT NULL REFERENCES products(sku) ON DELETE RESTRICT,
    expected_qty INT NOT NULL CHECK (expected_qty > 0),
    received_qty INT NOT NULL DEFAULT 0 CHECK (received_qty >= 0),
    damaged_qty INT NOT NULL DEFAULT 0 CHECK (damaged_qty >= 0),
    unit_cost NUMERIC(15, 2) NOT NULL CHECK (unit_cost >= 0.00),
    CONSTRAINT check_po_receipt_sum CHECK (received_qty + damaged_qty <= expected_qty + 500)
);

-- 5.3 Put-Away Tasks
CREATE TABLE putaway_tasks (
    task_id VARCHAR(50) PRIMARY KEY,
    po_id VARCHAR(100) NOT NULL REFERENCES purchase_orders(po_id) ON DELETE CASCADE,
    product_sku VARCHAR(100) NOT NULL REFERENCES products(sku) ON DELETE RESTRICT,
    qty INT NOT NULL CHECK (qty > 0),
    source_location_id VARCHAR(100) NOT NULL REFERENCES locations(location_id),
    recommended_location_id VARCHAR(100) NOT NULL REFERENCES locations(location_id),
    actual_location_id VARCHAR(100) REFERENCES locations(location_id),
    assigned_user_id VARCHAR(50) REFERENCES users(user_id),
    priority VARCHAR(20) NOT NULL DEFAULT 'Normal' CHECK (priority IN ('Low', 'Normal', 'High', 'Urgent')),
    status VARCHAR(20) NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Processing', 'Completed', 'Failed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE
);

-- =========================================================================
-- 6. OUTBOUND OPERATIONS: ORDERS, PICKING & DISPATCH
-- =========================================================================

-- 6.1 Customer Outbound Orders
CREATE TABLE orders (
    order_id VARCHAR(100) PRIMARY KEY,
    company_id VARCHAR(50) NOT NULL REFERENCES companies(company_id) ON DELETE CASCADE,
    warehouse_id VARCHAR(50) NOT NULL REFERENCES warehouses(warehouse_id) ON DELETE RESTRICT,
    customer_name VARCHAR(200) NOT NULL,
    destination_address TEXT NOT NULL,
    courier_name VARCHAR(150),
    tracking_number VARCHAR(100),
    priority VARCHAR(20) NOT NULL DEFAULT 'Normal' CHECK (priority IN ('Low', 'Normal', 'High', 'Urgent')),
    status VARCHAR(30) NOT NULL DEFAULT 'Allocated'
        CHECK (status IN ('Created', 'Allocated', 'Picking', 'Picked', 'Packing', 'Packed', 'Dispatched', 'Delivered', 'Cancelled', 'Returned')),
    created_by VARCHAR(50) REFERENCES users(user_id),
    authorized_by VARCHAR(50) REFERENCES users(user_id),
    dispatched_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 6.2 Order Line Items
CREATE TABLE order_items (
    order_item_id BIGSERIAL PRIMARY KEY,
    order_id VARCHAR(100) NOT NULL REFERENCES orders(order_id) ON DELETE CASCADE,
    product_sku VARCHAR(100) NOT NULL REFERENCES products(sku) ON DELETE RESTRICT,
    qty INT NOT NULL CHECK (qty > 0),
    picked_qty INT NOT NULL DEFAULT 0 CHECK (picked_qty >= 0),
    packed_qty INT NOT NULL DEFAULT 0 CHECK (packed_qty >= 0),
    allocated_location_id VARCHAR(100) REFERENCES locations(location_id),
    CONSTRAINT check_order_pick_limit CHECK (picked_qty <= qty),
    CONSTRAINT check_order_pack_limit CHECK (packed_qty <= picked_qty)
);

-- 6.3 Wave / Batch Picking Tasks
CREATE TABLE picking_tasks (
    picking_task_id VARCHAR(50) PRIMARY KEY,
    order_id VARCHAR(100) NOT NULL REFERENCES orders(order_id) ON DELETE CASCADE,
    product_sku VARCHAR(100) NOT NULL REFERENCES products(sku) ON DELETE RESTRICT,
    source_location_id VARCHAR(100) NOT NULL REFERENCES locations(location_id) ON DELETE RESTRICT,
    qty INT NOT NULL CHECK (qty > 0),
    picked_qty INT NOT NULL DEFAULT 0 CHECK (picked_qty >= 0),
    assigned_picker_id VARCHAR(50) REFERENCES users(user_id),
    status VARCHAR(20) NOT NULL DEFAULT 'Assigned' CHECK (status IN ('Assigned', 'In Progress', 'Completed', 'Exception')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE
);

-- 6.4 Packing Records
CREATE TABLE packing_records (
    packing_id VARCHAR(50) PRIMARY KEY,
    order_id VARCHAR(100) NOT NULL REFERENCES orders(order_id) ON DELETE CASCADE,
    box_type VARCHAR(100) NOT NULL,
    gross_weight_kg NUMERIC(8, 2) NOT NULL CHECK (gross_weight_kg > 0.0),
    packer_user_id VARCHAR(50) NOT NULL REFERENCES users(user_id),
    verified_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 6.5 Dispatch Gate Release Records
CREATE TABLE dispatch_records (
    dispatch_id VARCHAR(50) PRIMARY KEY,
    order_id VARCHAR(100) NOT NULL REFERENCES orders(order_id) ON DELETE CASCADE,
    courier_carrier VARCHAR(150) NOT NULL,
    waybill_tracking_no VARCHAR(100) NOT NULL,
    driver_name VARCHAR(150),
    vehicle_plate VARCHAR(50),
    authorized_by_supervisor_id VARCHAR(50) NOT NULL REFERENCES users(user_id),
    gate_released_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- =========================================================================
-- 7. REVERSE LOGISTICS: RETURNS & QUALITY TRIAGE
-- =========================================================================

CREATE TABLE returned_orders (
    return_id VARCHAR(50) PRIMARY KEY,
    order_id VARCHAR(100) NOT NULL REFERENCES orders(order_id) ON DELETE CASCADE,
    product_sku VARCHAR(100) NOT NULL REFERENCES products(sku) ON DELETE RESTRICT,
    qty INT NOT NULL CHECK (qty > 0),
    customer_name VARCHAR(200) NOT NULL,
    reason_code VARCHAR(150) NOT NULL,
    triage_disposition VARCHAR(30) NOT NULL DEFAULT 'Quarantined'
        CHECK (triage_disposition IN ('Restocked', 'Quarantined', 'Disposed')),
    routed_zone_id VARCHAR(50) NOT NULL REFERENCES zones(zone_id),
    routed_location_id VARCHAR(100) NOT NULL REFERENCES locations(location_id),
    inspected_by_user_id VARCHAR(50) NOT NULL REFERENCES users(user_id),
    inspector_notes TEXT,
    status VARCHAR(30) NOT NULL DEFAULT 'Processed' CHECK (status IN ('Pending Inspection', 'Processed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- =========================================================================
-- 8. GOVERNANCE: STOCK ADJUSTMENTS & STRICT SEPARATION OF DUTIES
-- =========================================================================

-- Strict SoD Policy:
-- 1. Requester CANNOT be the approver (Prevents self-approval collusion)
-- 2. Status 'Approved' requires valid non-null approved_by
CREATE TABLE stock_adjustments (
    adjustment_id VARCHAR(50) PRIMARY KEY,
    company_id VARCHAR(50) NOT NULL REFERENCES companies(company_id) ON DELETE CASCADE,
    warehouse_id VARCHAR(50) NOT NULL REFERENCES warehouses(warehouse_id) ON DELETE RESTRICT,
    location_id VARCHAR(100) NOT NULL REFERENCES locations(location_id) ON DELETE RESTRICT,
    product_sku VARCHAR(100) NOT NULL REFERENCES products(sku) ON DELETE RESTRICT,
    prev_qty INT NOT NULL CHECK (prev_qty >= 0),
    target_qty INT NOT NULL CHECK (target_qty >= 0),
    variance INT NOT NULL,
    cost_variance NUMERIC(15, 2) NOT NULL, -- in company default currency
    requested_by VARCHAR(50) NOT NULL REFERENCES users(user_id),
    approved_by VARCHAR(50) REFERENCES users(user_id),
    reason_code VARCHAR(100) NOT NULL
        CHECK (reason_code IN ('Physical count discrepancy', 'Damaged goods discovered', 'Expired inventory removal', 'Data entry correction')),
    evidence_notes TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    approved_at TIMESTAMP WITH TIME ZONE,
    
    -- DATABASE CONSTRAINT: Separation of Duties (Self-approval strictly forbidden!)
    CONSTRAINT check_sod_prevent_self_approval CHECK (
        status <> 'Approved' OR (requested_by <> approved_by AND approved_by IS NOT NULL)
    )
);

-- =========================================================================
-- 9. MULTI-TENANT SAAS SUBSCRIPTION & BILLING
-- =========================================================================

CREATE TABLE saas_subscriptions (
    subscription_id VARCHAR(50) PRIMARY KEY,
    company_id VARCHAR(50) NOT NULL UNIQUE REFERENCES companies(company_id) ON DELETE CASCADE,
    plan_name VARCHAR(100) NOT NULL DEFAULT 'Enterprise Tier'
        CHECK (plan_name IN ('Starter Tier', 'Growth Tier', 'Enterprise Tier', 'Custom')),
    billing_interval VARCHAR(20) NOT NULL DEFAULT 'Monthly' CHECK (billing_interval IN ('Monthly', 'Annual')),
    base_rate_usd NUMERIC(10, 2) NOT NULL DEFAULT 499.00 CHECK (base_rate_usd >= 0.00),
    rate_per_warehouse_usd NUMERIC(10, 2) NOT NULL DEFAULT 39.00,
    rate_per_user_usd NUMERIC(10, 2) NOT NULL DEFAULT 12.00,
    annual_discount_pct NUMERIC(5, 2) NOT NULL DEFAULT 20.00 CHECK (annual_discount_pct >= 0.00),
    status VARCHAR(20) NOT NULL DEFAULT 'Active' CHECK (status IN ('Trial', 'Active', 'Past Due', 'Cancelled')),
    current_cycle_start DATE NOT NULL,
    current_cycle_end DATE NOT NULL,
    payment_method VARCHAR(150),
    next_invoice_amount_usd NUMERIC(10, 2) NOT NULL CHECK (next_invoice_amount_usd >= 0.00),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE invoices (
    invoice_id VARCHAR(50) PRIMARY KEY,
    company_id VARCHAR(50) NOT NULL REFERENCES companies(company_id) ON DELETE CASCADE,
    billing_period_start DATE NOT NULL,
    billing_period_end DATE NOT NULL,
    active_warehouses INT NOT NULL CHECK (active_warehouses > 0),
    active_users INT NOT NULL CHECK (active_users > 0),
    base_amount NUMERIC(15, 2) NOT NULL CHECK (base_amount >= 0.00),
    warehouse_addon_amount NUMERIC(15, 2) NOT NULL CHECK (warehouse_addon_amount >= 0.00),
    user_addon_amount NUMERIC(15, 2) NOT NULL CHECK (user_addon_amount >= 0.00),
    discount_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    total_amount NUMERIC(15, 2) NOT NULL CHECK (total_amount >= 0.00),
    currency VARCHAR(10) NOT NULL DEFAULT 'USD',
    status VARCHAR(20) NOT NULL DEFAULT 'Paid' CHECK (status IN ('Draft', 'Unpaid', 'Paid', 'Cancelled')),
    paid_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- =========================================================================
-- 10. IMMUTABLE CRYPTOGRAPHIC AUDIT TRAIL
-- =========================================================================

-- ENFORCED BY TRIGGER: Append-Only. No UPDATE or DELETE allowed.
CREATE TABLE audit_trail (
    log_id BIGSERIAL PRIMARY KEY,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    user_id VARCHAR(50) NOT NULL,
    role_id VARCHAR(50) NOT NULL,
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('info', 'success', 'warning', 'critical')),
    action_type VARCHAR(100) NOT NULL,
    message TEXT NOT NULL,
    prev_hash VARCHAR(64) NOT NULL,
    hash VARCHAR(64) NOT NULL, -- SHA-256 block signature
    ip_address VARCHAR(45) NOT NULL DEFAULT '127.0.0.1',
    device_info TEXT,
    state_snapshot JSONB
);

-- =========================================================================
-- 11. DATABASE-LEVEL IMMUTABILITY TRIGGERS
-- =========================================================================

-- Prevent modification or deletion of Audit Trail
CREATE OR REPLACE FUNCTION trg_prevent_audit_tampering()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'SECURITY VIOLATION [SEC-01]: Audit trail records are cryptographically immutable and cannot be updated or deleted.';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER prevent_audit_update_delete
BEFORE UPDATE OR DELETE ON audit_trail
FOR EACH ROW EXECUTE FUNCTION trg_prevent_audit_tampering();

-- Prevent modification or deletion of Physical Stock Ledger
CREATE OR REPLACE FUNCTION trg_prevent_ledger_tampering()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'SECURITY VIOLATION [SEC-02]: Physical inventory ledger entries are write-only. Corrections must be applied via authorized adjustments.';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER prevent_ledger_update_delete
BEFORE UPDATE OR DELETE ON inventory_ledger
FOR EACH ROW EXECUTE FUNCTION trg_prevent_ledger_tampering();

-- Generic updated_at auto-timestamp trigger
CREATE OR REPLACE FUNCTION trg_update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_companies_timestamp BEFORE UPDATE ON companies FOR EACH ROW EXECUTE FUNCTION trg_update_timestamp();
CREATE TRIGGER update_branches_timestamp BEFORE UPDATE ON branches FOR EACH ROW EXECUTE FUNCTION trg_update_timestamp();
CREATE TRIGGER update_warehouses_timestamp BEFORE UPDATE ON warehouses FOR EACH ROW EXECUTE FUNCTION trg_update_timestamp();
CREATE TRIGGER update_locations_timestamp BEFORE UPDATE ON locations FOR EACH ROW EXECUTE FUNCTION trg_update_timestamp();
CREATE TRIGGER update_users_timestamp BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION trg_update_timestamp();
CREATE TRIGGER update_products_timestamp BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION trg_update_timestamp();
CREATE TRIGGER update_inventory_balances_timestamp BEFORE UPDATE ON inventory_balances FOR EACH ROW EXECUTE FUNCTION trg_update_timestamp();
CREATE TRIGGER update_purchase_orders_timestamp BEFORE UPDATE ON purchase_orders FOR EACH ROW EXECUTE FUNCTION trg_update_timestamp();
CREATE TRIGGER update_orders_timestamp BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION trg_update_timestamp();

-- =========================================================================
-- 12. HIGH-PERFORMANCE OPERATIONAL INDEXES
-- =========================================================================

-- Multi-Tenant & Organizational Foreign Key Indexes
CREATE INDEX idx_branches_company ON branches(company_id);
CREATE INDEX idx_warehouses_branch ON warehouses(branch_id);
CREATE INDEX idx_warehouses_company ON warehouses(company_id);
CREATE INDEX idx_zones_warehouse ON zones(warehouse_id);
CREATE INDEX idx_locations_wh_zone ON locations(warehouse_id, zone_id);
CREATE INDEX idx_locations_barcode ON locations(barcode);

-- Users & Roles
CREATE INDEX idx_users_company ON users(company_id);
CREATE INDEX idx_users_role ON users(role_id);
CREATE INDEX idx_users_email ON users(email);

-- Products & Fast Barcode/SKU Scan Lookups
CREATE INDEX idx_products_company ON products(company_id);
CREATE INDEX idx_products_barcode ON products(barcode);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_storage ON products(storage_requirement);

-- Inventory Balances (High Frequency Queries)
CREATE INDEX idx_inv_wh_sku ON inventory_balances(warehouse_id, product_sku);
CREATE INDEX idx_inv_loc_sku ON inventory_balances(location_id, product_sku);
CREATE INDEX idx_inv_avail ON inventory_balances(qty_available) WHERE qty_available > 0;

-- Inventory Ledger (Fast Transaction Audit Search)
CREATE INDEX idx_ledger_timestamp_desc ON inventory_ledger(timestamp DESC);
CREATE INDEX idx_ledger_sku_wh ON inventory_ledger(product_sku, warehouse_id);
CREATE INDEX idx_ledger_ref_doc ON inventory_ledger(reference_doc_id);
CREATE INDEX idx_ledger_user ON inventory_ledger(user_id);

-- Operational Inbound & Outbound Tasks
CREATE INDEX idx_po_warehouse_status ON purchase_orders(warehouse_id, status);
CREATE INDEX idx_putaway_status ON putaway_tasks(status);
CREATE INDEX idx_orders_wh_status ON orders(warehouse_id, status);
CREATE INDEX idx_picking_status_picker ON picking_tasks(status, assigned_picker_id);
CREATE INDEX idx_dispatch_order ON dispatch_records(order_id);

-- Stock Adjustments & SoD Approvals
CREATE INDEX idx_adj_status ON stock_adjustments(status);
CREATE INDEX idx_adj_requested_by ON stock_adjustments(requested_by);
CREATE INDEX idx_adj_approved_by ON stock_adjustments(approved_by);

-- Audit Trail (Chronological & Severity Filters)
CREATE INDEX idx_audit_time_desc ON audit_trail(timestamp DESC);
CREATE INDEX idx_audit_severity ON audit_trail(severity);
CREATE INDEX idx_audit_user ON audit_trail(user_id);
CREATE INDEX idx_audit_hash ON audit_trail(hash);

-- =========================================================================
-- 13. REAL-TIME ANALYTICAL & DASHBOARD VIEWS
-- =========================================================================

-- View: Real-Time Total Inventory Valuation by Warehouse and Category
CREATE OR REPLACE VIEW vw_inventory_valuation AS
SELECT 
    w.warehouse_id,
    w.name AS warehouse_name,
    p.category,
    COUNT(DISTINCT p.sku) AS active_skus_count,
    SUM(ib.qty_available) AS total_available_units,
    SUM(ib.qty_damaged) AS total_damaged_units,
    SUM(ib.qty_available * p.cost_price) AS total_valuation_cost,
    SUM(ib.qty_available * p.selling_price) AS potential_market_value
FROM inventory_balances ib
JOIN products p ON ib.product_sku = p.sku
JOIN warehouses w ON ib.warehouse_id = w.warehouse_id
GROUP BY w.warehouse_id, w.name, p.category;

-- View: Live Storage Bin Utilization by Facility & Zone
CREATE OR REPLACE VIEW vw_bin_utilization AS
SELECT 
    w.warehouse_id,
    w.name AS warehouse_name,
    z.zone_id,
    z.name AS zone_name,
    z.zone_type,
    COUNT(l.location_id) AS total_bins,
    SUM(l.capacity_units) AS max_storage_capacity,
    SUM(l.occupied_units) AS current_occupied_units,
    ROUND((SUM(l.occupied_units)::NUMERIC / NULLIF(SUM(l.capacity_units), 0)::NUMERIC) * 100, 2) AS utilization_percent
FROM zones z
JOIN warehouses w ON z.warehouse_id = w.warehouse_id
LEFT JOIN locations l ON z.zone_id = l.zone_id
GROUP BY w.warehouse_id, w.name, z.zone_id, z.name, z.zone_type;

-- View: Pending Adjustments Awaiting Supervisor Authorization
CREATE OR REPLACE VIEW vw_pending_approvals AS
SELECT 
    sa.adjustment_id,
    sa.warehouse_id,
    w.name AS warehouse_name,
    sa.product_sku,
    p.name AS product_name,
    sa.location_id,
    sa.prev_qty,
    sa.target_qty,
    sa.variance,
    sa.cost_variance,
    sa.reason_code,
    u.name AS requested_by_name,
    u.approval_limit AS requester_approval_limit,
    sa.created_at
FROM stock_adjustments sa
JOIN products p ON sa.product_sku = p.sku
JOIN warehouses w ON sa.warehouse_id = w.warehouse_id
JOIN users u ON sa.requested_by = u.user_id
WHERE sa.status = 'Pending'
ORDER BY sa.created_at ASC;

-- View: Daily Throughput (Received vs Dispatched Velocity)
CREATE OR REPLACE VIEW vw_daily_throughput AS
SELECT 
    DATE(timestamp) AS activity_date,
    warehouse_id,
    COUNT(CASE WHEN transaction_type = 'Receiving' THEN 1 END) AS receiving_movements,
    SUM(CASE WHEN transaction_type = 'Receiving' THEN change_qty ELSE 0 END) AS total_received_units,
    COUNT(CASE WHEN transaction_type = 'Dispatch' THEN 1 END) AS dispatch_movements,
    ABS(SUM(CASE WHEN transaction_type = 'Dispatch' THEN change_qty ELSE 0 END)) AS total_dispatched_units,
    COUNT(CASE WHEN transaction_type = 'Adjustment' THEN 1 END) AS adjustment_events
FROM inventory_ledger
GROUP BY DATE(timestamp), warehouse_id
ORDER BY activity_date DESC;
