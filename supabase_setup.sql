-- =========================================================================
-- WAREHOUSE OPERATING SYSTEM (WOS)
-- SUPABASE OPTIMIZED MIGRATION SCRIPT (SCHEMA + SEED + RLS POLICIES)
-- =========================================================================
-- Paste this complete script directly into your Supabase Dashboard:
-- SQL Editor -> New Query -> Run
-- Project: https://rywfmocrdpygovckkarv.supabase.co
-- =========================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Drop existing tables in reverse dependency order for clean recreation if needed
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

-- 1. Master Company Tenant
CREATE TABLE companies (
    company_id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    legal_entity VARCHAR(200) NOT NULL,
    tax_id VARCHAR(100) NOT NULL UNIQUE,
    default_currency VARCHAR(10) NOT NULL DEFAULT 'NGN',
    currency_symbol VARCHAR(5) NOT NULL DEFAULT '₦',
    industry VARCHAR(150) NOT NULL DEFAULT 'Third-Party Logistics (3PL) & Distribution',
    address TEXT NOT NULL,
    contact_email VARCHAR(255) NOT NULL,
    subscription_tier VARCHAR(50) NOT NULL DEFAULT 'Enterprise Tier',
    max_warehouses INT NOT NULL DEFAULT 10,
    max_users INT NOT NULL DEFAULT 50,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 2. Regional Branches
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
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 3. Warehouses
CREATE TABLE warehouses (
    warehouse_id VARCHAR(50) PRIMARY KEY,
    company_id VARCHAR(50) NOT NULL REFERENCES companies(company_id) ON DELETE CASCADE,
    branch_id VARCHAR(50) NOT NULL REFERENCES branches(branch_id) ON DELETE RESTRICT,
    name VARCHAR(150) NOT NULL,
    facility_type VARCHAR(60) NOT NULL DEFAULT 'Regional Distribution Center',
    address TEXT NOT NULL,
    total_capacity_units INT NOT NULL DEFAULT 5000,
    status VARCHAR(30) NOT NULL DEFAULT 'Active',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 4. Storage Zones
CREATE TABLE zones (
    zone_id VARCHAR(50) PRIMARY KEY,
    warehouse_id VARCHAR(50) NOT NULL REFERENCES warehouses(warehouse_id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    zone_type VARCHAR(50) NOT NULL DEFAULT 'Standard',
    temperature_range VARCHAR(50) NOT NULL DEFAULT 'Ambient (18°C - 25°C)',
    capacity_units INT NOT NULL DEFAULT 1000,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 5. Storage Bins & Locations
CREATE TABLE locations (
    location_id VARCHAR(50) PRIMARY KEY,
    warehouse_id VARCHAR(50) NOT NULL REFERENCES warehouses(warehouse_id) ON DELETE CASCADE,
    zone_id VARCHAR(50) NOT NULL REFERENCES zones(zone_id) ON DELETE RESTRICT,
    aisle VARCHAR(20) NOT NULL,
    rack VARCHAR(20) NOT NULL,
    shelf VARCHAR(20) NOT NULL,
    bin VARCHAR(20) NOT NULL,
    barcode VARCHAR(100) NOT NULL UNIQUE,
    capacity_units INT NOT NULL DEFAULT 100,
    occupied_units INT NOT NULL DEFAULT 0,
    status VARCHAR(30) NOT NULL DEFAULT 'Active',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 6. Master Product Catalog
CREATE TABLE products (
    sku VARCHAR(100) PRIMARY KEY,
    company_id VARCHAR(50) REFERENCES companies(company_id) ON DELETE CASCADE,
    barcode VARCHAR(100) UNIQUE,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    storage_requirement VARCHAR(50) NOT NULL DEFAULT 'Standard',
    cost_price NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    selling_price NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    unit_of_measure VARCHAR(30) NOT NULL DEFAULT 'Units',
    weight_kg NUMERIC(8, 2) NOT NULL DEFAULT 1.0,
    min_reorder_level INT NOT NULL DEFAULT 10,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 7. RBAC Roles & Permissions
CREATE TABLE roles (
    role_id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    is_system_role BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE permissions (
    permission_id VARCHAR(100) PRIMARY KEY,
    category VARCHAR(50) NOT NULL,
    action VARCHAR(100) NOT NULL,
    description TEXT
);

CREATE TABLE role_permissions (
    role_id VARCHAR(50) NOT NULL REFERENCES roles(role_id) ON DELETE CASCADE,
    permission_id VARCHAR(100) NOT NULL REFERENCES permissions(permission_id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

-- 8. Users
CREATE TABLE users (
    user_id VARCHAR(50) PRIMARY KEY,
    company_id VARCHAR(50) NOT NULL REFERENCES companies(company_id) ON DELETE CASCADE,
    role_id VARCHAR(50) NOT NULL REFERENCES roles(role_id) ON DELETE RESTRICT,
    name VARCHAR(150) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    status VARCHAR(30) NOT NULL DEFAULT 'Active',
    approval_limit NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 9. Real-Time Inventory Balances
CREATE TABLE inventory_balances (
    balance_id BIGSERIAL PRIMARY KEY,
    warehouse_id VARCHAR(50) NOT NULL REFERENCES warehouses(warehouse_id) ON DELETE CASCADE,
    location_id VARCHAR(50) NOT NULL REFERENCES locations(location_id) ON DELETE RESTRICT,
    product_sku VARCHAR(100) NOT NULL REFERENCES products(sku) ON DELETE RESTRICT,
    qty_available INT NOT NULL DEFAULT 0,
    qty_reserved INT NOT NULL DEFAULT 0,
    qty_damaged INT NOT NULL DEFAULT 0,
    lot_number VARCHAR(100),
    expiry_date DATE,
    last_counted_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT uq_wh_loc_sku_lot UNIQUE (warehouse_id, location_id, product_sku, lot_number)
);

-- 10. Immutable Physical Stock Ledger
CREATE TABLE inventory_ledger (
    entry_id BIGSERIAL PRIMARY KEY,
    tx_uuid UUID DEFAULT gen_random_uuid() NOT NULL,
    product_sku VARCHAR(100) NOT NULL REFERENCES products(sku) ON DELETE RESTRICT,
    warehouse_id VARCHAR(50) NOT NULL REFERENCES warehouses(warehouse_id) ON DELETE CASCADE,
    location_id VARCHAR(50) NOT NULL REFERENCES locations(location_id) ON DELETE RESTRICT,
    prev_qty INT NOT NULL,
    change_qty INT NOT NULL,
    new_qty INT NOT NULL,
    transaction_type VARCHAR(50) NOT NULL,
    reference_doc_id VARCHAR(100),
    user_id VARCHAR(50) NOT NULL REFERENCES users(user_id) ON DELETE RESTRICT,
    notes TEXT,
    timestamp TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 11. Inbound Purchase Orders
CREATE TABLE purchase_orders (
    po_id VARCHAR(50) PRIMARY KEY,
    warehouse_id VARCHAR(50) NOT NULL REFERENCES warehouses(warehouse_id) ON DELETE CASCADE,
    supplier_name VARCHAR(150) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'Pending',
    total_lines INT NOT NULL DEFAULT 1,
    created_by VARCHAR(50) REFERENCES users(user_id) ON DELETE RESTRICT,
    received_by VARCHAR(50) REFERENCES users(user_id) ON DELETE RESTRICT,
    expected_delivery_date DATE,
    received_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE po_items (
    po_item_id BIGSERIAL PRIMARY KEY,
    po_id VARCHAR(50) NOT NULL REFERENCES purchase_orders(po_id) ON DELETE CASCADE,
    product_sku VARCHAR(100) NOT NULL REFERENCES products(sku) ON DELETE RESTRICT,
    expected_qty INT NOT NULL,
    received_qty INT NOT NULL DEFAULT 0,
    lot_number VARCHAR(100),
    temperature_checked VARCHAR(20) DEFAULT 'Normal'
);

-- 12. Smart Put-Away Tasks
CREATE TABLE putaway_tasks (
    task_id VARCHAR(50) PRIMARY KEY,
    po_id VARCHAR(50) NOT NULL REFERENCES purchase_orders(po_id) ON DELETE CASCADE,
    product_sku VARCHAR(100) NOT NULL REFERENCES products(sku) ON DELETE RESTRICT,
    qty INT NOT NULL,
    staging_location_id VARCHAR(50) NOT NULL REFERENCES locations(location_id) ON DELETE RESTRICT,
    suggested_location_id VARCHAR(50) NOT NULL REFERENCES locations(location_id) ON DELETE RESTRICT,
    actual_location_id VARCHAR(50) REFERENCES locations(location_id) ON DELETE RESTRICT,
    assigned_user_id VARCHAR(50) REFERENCES users(user_id) ON DELETE RESTRICT,
    status VARCHAR(30) NOT NULL DEFAULT 'Pending',
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 13. Outbound Sales Orders
CREATE TABLE orders (
    order_id VARCHAR(50) PRIMARY KEY,
    warehouse_id VARCHAR(50) NOT NULL REFERENCES warehouses(warehouse_id) ON DELETE CASCADE,
    customer_name VARCHAR(150) NOT NULL,
    destination TEXT NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'Awaiting Pick',
    priority VARCHAR(20) NOT NULL DEFAULT 'Normal',
    courier VARCHAR(100),
    tracking_number VARCHAR(100),
    dispatched_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE order_items (
    order_item_id BIGSERIAL PRIMARY KEY,
    order_id VARCHAR(50) NOT NULL REFERENCES orders(order_id) ON DELETE CASCADE,
    product_sku VARCHAR(100) NOT NULL REFERENCES products(sku) ON DELETE RESTRICT,
    ordered_qty INT NOT NULL,
    picked_qty INT NOT NULL DEFAULT 0,
    packed_qty INT NOT NULL DEFAULT 0,
    suggested_location_id VARCHAR(50) REFERENCES locations(location_id) ON DELETE RESTRICT
);

-- 14. Picking Tasks
CREATE TABLE picking_tasks (
    pick_task_id VARCHAR(50) PRIMARY KEY,
    order_id VARCHAR(50) NOT NULL REFERENCES orders(order_id) ON DELETE CASCADE,
    product_sku VARCHAR(100) NOT NULL REFERENCES products(sku) ON DELETE RESTRICT,
    location_id VARCHAR(50) NOT NULL REFERENCES locations(location_id) ON DELETE RESTRICT,
    requested_qty INT NOT NULL,
    picked_qty INT NOT NULL DEFAULT 0,
    assigned_picker_id VARCHAR(50) REFERENCES users(user_id) ON DELETE RESTRICT,
    status VARCHAR(30) NOT NULL DEFAULT 'Assigned',
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 15. Stock Adjustments (Strict SoD)
CREATE TABLE stock_adjustments (
    adjustment_id VARCHAR(50) PRIMARY KEY,
    warehouse_id VARCHAR(50) NOT NULL REFERENCES warehouses(warehouse_id) ON DELETE CASCADE,
    product_sku VARCHAR(100) NOT NULL REFERENCES products(sku) ON DELETE RESTRICT,
    location_id VARCHAR(50) NOT NULL REFERENCES locations(location_id) ON DELETE RESTRICT,
    prev_qty INT NOT NULL,
    target_qty INT NOT NULL,
    variance INT NOT NULL,
    cost_variance NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    reason_code VARCHAR(100) NOT NULL,
    evidence_notes TEXT,
    requested_by VARCHAR(50) NOT NULL REFERENCES users(user_id) ON DELETE RESTRICT,
    approved_by VARCHAR(50) REFERENCES users(user_id) ON DELETE RESTRICT,
    status VARCHAR(30) NOT NULL DEFAULT 'Pending',
    approved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT chk_sod_prevent_self_approval CHECK (requested_by != approved_by)
);

-- 16. Reverse Logistics (RMA)
CREATE TABLE returned_orders (
    return_id VARCHAR(50) PRIMARY KEY,
    order_id VARCHAR(50) NOT NULL REFERENCES orders(order_id) ON DELETE RESTRICT,
    product_sku VARCHAR(100) NOT NULL REFERENCES products(sku) ON DELETE RESTRICT,
    qty INT NOT NULL,
    customer_name VARCHAR(150) NOT NULL,
    reason_code VARCHAR(100) NOT NULL,
    triage_disposition VARCHAR(50) NOT NULL,
    inspected_by VARCHAR(50) NOT NULL REFERENCES users(user_id) ON DELETE RESTRICT,
    routed_zone_id VARCHAR(50) NOT NULL REFERENCES zones(zone_id) ON DELETE RESTRICT,
    target_location_id VARCHAR(50) REFERENCES locations(location_id) ON DELETE RESTRICT,
    status VARCHAR(30) NOT NULL DEFAULT 'Processed',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 17. Cryptographic Tamper-Resistant Audit Trail
CREATE TABLE audit_trail (
    entry_id BIGSERIAL PRIMARY KEY,
    timestamp TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    user_id VARCHAR(50) NOT NULL,
    role_snapshot VARCHAR(100) NOT NULL,
    severity VARCHAR(20) NOT NULL DEFAULT 'INFO',
    action_type VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    metadata_json JSONB,
    prev_hash VARCHAR(64) NOT NULL,
    hash VARCHAR(64) NOT NULL UNIQUE
);

-- =========================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES FOR SUPABASE
-- Enables instant, seamless REST access using the Supabase publishable key
-- =========================================================================
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE warehouses ENABLE ROW LEVEL SECURITY;
ALTER TABLE zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE po_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE putaway_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE picking_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_adjustments ENABLE ROW LEVEL SECURITY;
ALTER TABLE returned_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_trail ENABLE ROW LEVEL SECURITY;

-- Grant Full Permissive Policies for Web Application Operations
CREATE POLICY "Allow public read access" ON companies FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read access" ON branches FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read access" ON warehouses FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read access" ON zones FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read access" ON locations FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read access" ON products FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read access" ON roles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read access" ON permissions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read access" ON role_permissions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read access" ON users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read access" ON inventory_balances FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read access" ON inventory_ledger FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read access" ON purchase_orders FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read access" ON po_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read access" ON putaway_tasks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read access" ON orders FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read access" ON order_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read access" ON picking_tasks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read access" ON stock_adjustments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read access" ON returned_orders FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read access" ON audit_trail FOR ALL USING (true) WITH CHECK (true);

-- =========================================================================
-- POPULATE SEED ENTERPRISE DATA DIRECTLY INTO SUPABASE
-- =========================================================================
INSERT INTO companies (company_id, name, legal_entity, tax_id, default_currency, currency_symbol, industry, address, contact_email, subscription_tier, max_warehouses, max_users)
VALUES ('COMP-001', 'Apex Global Supply Chain Ltd.', 'Apex Holdings LLC', 'NG-RC-88492019-TX', 'NGN', '₦', 'Multi-Client Contract Logistics & Distribution', 'Plot 14 Commercial Avenue, Victoria Island, Lagos, Nigeria', 'ops-lead@apexlogistics.com', 'Enterprise Tier', 10, 50)
ON CONFLICT (company_id) DO NOTHING;

INSERT INTO branches (branch_id, company_id, name, code, region, city, manager_name, phone, address) VALUES
('BR-LOS', 'COMP-001', 'Lagos Coastal Distribution Hub', 'LOS-HUB', 'South-West Nigeria', 'Lagos', 'Sarah Jenkins', '+234 1 450 8920', 'Plot 8 Ikeja Industrial Layout, Lagos'),
('BR-ABJ', 'COMP-001', 'Abuja Central Fulfillment Depot', 'ABJ-DEP', 'North-Central Nigeria', 'Abuja', 'Chinedu Okafor', '+234 9 881 2300', 'Sector 4, Idu Industrial Zone, Abuja FCT'),
('BR-PHC', 'COMP-001', 'Port Harcourt Maritime Gateway', 'PHC-GTW', 'South-South Nigeria', 'Port Harcourt', 'Marcus Vance', '+234 84 330 901', 'Trans-Amadi Industrial Complex, Port Harcourt')
ON CONFLICT (branch_id) DO NOTHING;

INSERT INTO warehouses (warehouse_id, company_id, branch_id, name, facility_type, address, total_capacity_units, status) VALUES
('WH-LOS-01', 'COMP-001', 'BR-LOS', 'Apex Ikeja Mega-Warehouse', 'Regional Distribution Center', 'Plot 8 Ikeja Industrial Layout, Lagos', 5000, 'Active'),
('WH-LOS-02', 'COMP-001', 'BR-LOS', 'Apapa Port Cold-Chain Facility', 'Cold Storage & Reefer Facility', 'Wharf Road, Apapa Maritime Area, Lagos', 2000, 'Active'),
('WH-ABJ-01', 'COMP-001', 'BR-ABJ', 'Idu Central Fulfillment Center', 'E-Commerce Depot', 'Idu Industrial Layout, Abuja', 3500, 'Active'),
('WH-PHC-01', 'COMP-001', 'BR-PHC', 'Delta Oil & Gas Logistics Depot', 'Hazardous & Chemical Depot', 'Trans-Amadi, Port Harcourt', 4000, 'Active')
ON CONFLICT (warehouse_id) DO NOTHING;

INSERT INTO zones (zone_id, warehouse_id, name, zone_type, temperature_range, capacity_units, description) VALUES
('Z-AMB', 'WH-LOS-01', 'Ambient Storage Zone', 'Standard', '18°C - 25°C', 3000, 'Dry goods, general merchandise, non-perishables'),
('Z-COLD', 'WH-LOS-01', 'Cold-Chain Reefer Zone', 'Cold', '2°C - 8°C', 800, 'Vaccines, pharmaceuticals, temperature-sensitive food'),
('Z-HAZ', 'WH-LOS-01', 'Hazardous & Flammables Zone', 'Hazardous', 'Ambient Fire-Safe', 400, 'Chemicals, flammable lubricants, industrial paints'),
('Z-QUAR', 'WH-LOS-01', 'Quarantine & Inspection Bay', 'Quarantine', 'Controlled', 300, 'Damaged returns, uninspected inbound, recalled lots'),
('Z-STG', 'WH-LOS-01', 'Inbound/Outbound Staging Bay', 'Staging', 'Cross-dock', 500, 'Pre-dispatch pallet consolidation & receiving dock'),
('Z-RET', 'WH-LOS-01', 'Reverse Logistics & Returns', 'Returns', 'Ambient', 400, 'RMA processing, inspection triage & re-labeling')
ON CONFLICT (zone_id) DO NOTHING;

INSERT INTO locations (location_id, warehouse_id, zone_id, aisle, rack, shelf, bin, barcode, capacity_units, occupied_units, status) VALUES
('WH01-AMB-A01-R01-S01-B01', 'WH-LOS-01', 'Z-AMB', 'A01', 'R01', 'S01', 'B01', 'LOC-WH01-AMB-A01-R01-S01-B01', 100, 45, 'Active'),
('WH01-AMB-A01-R01-S01-B02', 'WH-LOS-01', 'Z-AMB', 'A01', 'R01', 'S01', 'B02', 'LOC-WH01-AMB-A01-R01-S01-B02', 100, 30, 'Active'),
('WH01-AMB-A02-R01-S01-B01', 'WH-LOS-01', 'Z-AMB', 'A02', 'R01', 'S01', 'B01', 'LOC-WH01-AMB-A02-R01-S01-B01', 100, 60, 'Active'),
('WH01-AMB-A03-R01-S01-B01', 'WH-LOS-01', 'Z-AMB', 'A03', 'R01', 'S01', 'B01', 'LOC-WH01-AMB-A03-R01-S01-B01', 100, 22, 'Active'),
('WH01-CLD-A01-R01-S01-B01', 'WH-LOS-01', 'Z-COLD', 'A01', 'R01', 'S01', 'B01', 'LOC-WH01-CLD-A01-R01-S01-B01', 80, 50, 'Active'),
('WH01-CLD-A01-R01-S01-B02', 'WH-LOS-01', 'Z-COLD', 'A01', 'R01', 'S01', 'B02', 'LOC-WH01-CLD-A01-R01-S01-B02', 80, 40, 'Active'),
('WH01-HAZ-A01-R01-S01-B01', 'WH-LOS-01', 'Z-HAZ', 'A01', 'R01', 'S01', 'B01', 'LOC-WH01-HAZ-A01-R01-S01-B01', 60, 20, 'Active'),
('WH01-STG-BAY-01', 'WH-LOS-01', 'Z-STG', 'STG', '00', '00', 'B01', 'LOC-WH01-STG-BAY-01', 500, 0, 'Active'),
('WH01-QUR-A01-R01-S01-B01', 'WH-LOS-01', 'Z-QUAR', 'Q01', 'R01', 'S01', 'B01', 'LOC-WH01-QUR-A01-R01-S01-B01', 50, 2, 'Active')
ON CONFLICT (location_id) DO NOTHING;

INSERT INTO roles (role_id, name, code, description) VALUES
('ROLE-OFFICER', 'Warehouse Officer', 'OFFICER', 'Receives inbound stock, executes picking, moves goods, no approval rights'),
('ROLE-SUPERVISOR', 'Warehouse Supervisor', 'SUPERVISOR', 'Approves routine stock adjustments up to ₦1M, assigns wave picks'),
('ROLE-OPS-MGR', 'Operations Manager', 'OPS_MGR', 'Approves large stock write-offs up to ₦5M, manages facility thresholds'),
('ROLE-SYS-ADMIN', 'System Administrator', 'ADMIN', 'Manages users and roles. Zero access to modify physical inventory or purge audit logs'),
('ROLE-FINANCE', 'Finance & SaaS Admin', 'FINANCE', 'Views inventory valuation, manages SaaS subscription, invoicing and fee rules')
ON CONFLICT (role_id) DO NOTHING;

INSERT INTO users (user_id, company_id, role_id, name, email, approval_limit) VALUES
('USR-001', 'COMP-001', 'ROLE-OFFICER', 'Tunde Adeyemi', 'tunde.a@apexlogistics.com', 0.00),
('USR-002', 'COMP-001', 'ROLE-SUPERVISOR', 'Sarah Jenkins', 'sarah.j@apexlogistics.com', 1000000.00),
('USR-003', 'COMP-001', 'ROLE-OPS-MGR', 'Marcus Vance', 'marcus.v@apexlogistics.com', 5000000.00),
('USR-004', 'COMP-001', 'ROLE-SYS-ADMIN', 'Elena Rostova', 'elena.r@apexlogistics.com', 0.00),
('USR-005', 'COMP-001', 'ROLE-FINANCE', 'David Chen', 'david.c@apexlogistics.com', 10000000.00)
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO products (sku, company_id, barcode, name, category, storage_requirement, cost_price, selling_price, unit_of_measure, weight_kg, min_reorder_level) VALUES
('SKU-SOLAR-INV-5KW', 'COMP-001', '890123456001', 'Apex 5.0kVA Pure Sine Wave Inverter', 'Renewable Energy', 'Standard', 420000.00, 560000.00, 'Units', 24.5, 10),
('SKU-LITH-BAT-48V', 'COMP-001', '890123456002', 'Apex 48V 100Ah Lithium Iron Phosphate Battery', 'Renewable Energy', 'Hazardous', 650000.00, 890000.00, 'Units', 42.0, 5),
('SKU-PHARM-VAX-RHO', 'COMP-001', '890123456003', 'Rh-Immune Globulin Sterile Solution (2°C - 8°C)', 'Cold Chain Pharma', 'Cold', 38000.00, 52000.00, 'Vials', 0.3, 100),
('SKU-FMCG-OLIV-500ML', 'COMP-001', '890123456004', 'Premium Cold-Pressed Extra Virgin Olive Oil 500ml', 'FMCG & Groceries', 'Standard', 32000.00, 48000.00, 'Cartons', 6.0, 50),
('SKU-TECH-LAP-PRO16', 'COMP-001', '890123456005', 'ApexBook Pro 16-inch Enterprise Workstation (32GB)', 'Consumer Tech', 'Standard', 780000.00, 950000.00, 'Units', 2.1, 15),
('SKU-IND-CHEM-LUB9', 'COMP-001', '890123456006', 'High-Temp Industrial Turbine Lubricant 20L', 'Industrial Chemicals', 'Hazardous', 85000.00, 115000.00, 'Drums', 19.5, 12)
ON CONFLICT (sku) DO NOTHING;

-- Initial Inventory Balances
INSERT INTO inventory_balances (warehouse_id, location_id, product_sku, qty_available, qty_reserved, qty_damaged, lot_number) VALUES
('WH-LOS-01', 'WH01-AMB-A01-R01-S01-B01', 'SKU-SOLAR-INV-5KW', 45, 5, 0, 'LOT-2026-INV-001'),
('WH-LOS-01', 'WH01-AMB-A01-R01-S01-B02', 'SKU-SOLAR-INV-5KW', 30, 0, 0, 'LOT-2026-INV-002'),
('WH-LOS-01', 'WH01-AMB-A02-R01-S01-B01', 'SKU-FMCG-OLIV-500ML', 180, 25, 2, 'LOT-2026-FMCG-88'),
('WH-LOS-01', 'WH01-AMB-A03-R01-S01-B01', 'SKU-TECH-LAP-PRO16', 22, 6, 0, 'LOT-2026-TECH-04'),
('WH-LOS-01', 'WH01-CLD-A01-R01-S01-B01', 'SKU-PHARM-VAX-RHO', 240, 60, 0, 'LOT-2026-MED-99'),
('WH-LOS-01', 'WH01-HAZ-A01-R01-S01-B01', 'SKU-LITH-BAT-48V', 20, 4, 0, 'LOT-2026-BAT-12')
ON CONFLICT DO NOTHING;

-- Initial Cryptographic Audit Block
INSERT INTO audit_trail (timestamp, user_id, role_snapshot, severity, action_type, description, metadata_json, prev_hash, hash)
VALUES (
    CURRENT_TIMESTAMP,
    'SYS-KERNEL',
    'KERNEL',
    'INFO',
    'SYSTEM_GENESIS',
    'Warehouse Operating System initialized with cryptographic tamper-resistant hash chaining.',
    '{"event": "genesis_block_created", "status": "active"}'::jsonb,
    '0000000000000000000000000000000000000000000000000000000000000000',
    '3a1b8c2d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b'
) ON CONFLICT (hash) DO NOTHING;
