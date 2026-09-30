-- =========================================================================
-- WAREHOUSE OPERATING SYSTEM (WOS)
-- Production Demo Database Seed Data
-- =========================================================================

-- 1. Master Company Tenant
INSERT INTO companies (
    company_id, name, legal_entity, tax_id, default_currency, currency_symbol,
    industry, address, contact_email, subscription_tier, max_warehouses, max_users
) VALUES (
    'COMP-001',
    'Apex Global Supply Chain Ltd.',
    'Apex Holdings LLC',
    'NG-RC-88492019-TX',
    'NGN',
    '₦',
    'Multi-Client Contract Logistics & Distribution',
    'Plot 14 Commercial Avenue, Victoria Island, Lagos, Nigeria',
    'ops-lead@apexlogistics.com',
    'Enterprise Tier',
    10,
    50
) ON CONFLICT (company_id) DO NOTHING;

-- 2. Regional Branches
INSERT INTO branches (branch_id, company_id, name, code, region, city, manager_name, phone, address) VALUES
('BR-LOS', 'COMP-001', 'Lagos Coastal Distribution Hub', 'LOS-HUB', 'South-West Nigeria', 'Lagos', 'Sarah Jenkins', '+234 1 450 8920', 'Plot 8 Ikeja Industrial Layout, Lagos'),
('BR-ABJ', 'COMP-001', 'Abuja Central Fulfillment Depot', 'ABJ-DEP', 'North-Central Nigeria', 'Abuja', 'Chinedu Okafor', '+234 9 881 2300', 'Sector 4, Idu Industrial Zone, Abuja FCT'),
('BR-PHC', 'COMP-001', 'Port Harcourt Maritime Gateway', 'PHC-GTW', 'South-South Nigeria', 'Port Harcourt', 'Marcus Vance', '+234 84 330 901', 'Trans-Amadi Industrial Complex, Port Harcourt')
ON CONFLICT (branch_id) DO NOTHING;

-- 3. Warehouses
INSERT INTO warehouses (warehouse_id, company_id, branch_id, name, facility_type, address, total_capacity_units, status) VALUES
('WH-LOS-01', 'COMP-001', 'BR-LOS', 'Apex Ikeja Mega-Warehouse', 'Regional Distribution Center', 'Plot 8 Ikeja Industrial Layout, Lagos', 5000, 'Active'),
('WH-LOS-02', 'COMP-001', 'BR-LOS', 'Apapa Port Cold-Chain Facility', 'Cold Storage & Reefer Facility', 'Wharf Road, Apapa Maritime Area, Lagos', 2000, 'Active'),
('WH-ABJ-01', 'COMP-001', 'BR-ABJ', 'Idu Central Fulfillment Center', 'E-Commerce Depot', 'Idu Industrial Layout, Abuja', 3500, 'Active'),
('WH-PHC-01', 'COMP-001', 'BR-PHC', 'Delta Oil & Gas Logistics Depot', 'Hazardous & Chemical Depot', 'Trans-Amadi, Port Harcourt', 4000, 'Active')
ON CONFLICT (warehouse_id) DO NOTHING;

-- 4. Storage Zones for WH-LOS-01
INSERT INTO zones (zone_id, warehouse_id, name, zone_type, temperature_range, capacity_units, description) VALUES
('Z-AMB', 'WH-LOS-01', 'Ambient Storage Zone', 'Standard', '18°C - 25°C', 3000, 'Dry goods, general merchandise, non-perishables'),
('Z-COLD', 'WH-LOS-01', 'Cold-Chain Reefer Zone', 'Cold', '2°C - 8°C', 800, 'Vaccines, pharmaceuticals, temperature-sensitive food'),
('Z-HAZ', 'WH-LOS-01', 'Hazardous & Flammables Zone', 'Hazardous', 'Ambient Fire-Safe', 400, 'Chemicals, flammable lubricants, industrial paints'),
('Z-QUAR', 'WH-LOS-01', 'Quarantine & Inspection Bay', 'Quarantine', 'Controlled', 300, 'Damaged returns, uninspected inbound, recalled lots'),
('Z-STG', 'WH-LOS-01', 'Inbound/Outbound Staging Bay', 'Staging', 'Cross-dock', 500, 'Pre-dispatch pallet consolidation & receiving dock'),
('Z-RET', 'WH-LOS-01', 'Reverse Logistics & Returns', 'Returns', 'Ambient', 400, 'RMA processing, inspection triage & re-labeling')
ON CONFLICT (zone_id) DO NOTHING;

-- 5. Storage Bins (Sample Representative Set)
INSERT INTO locations (location_id, warehouse_id, zone_id, aisle, rack, shelf, bin, barcode, capacity_units, occupied_units, status) VALUES
-- Ambient Bins
('WH01-AMB-A01-R01-S01-B01', 'WH-LOS-01', 'Z-AMB', 'A01', 'R01', 'S01', 'B01', 'LOC-WH01-AMB-A01-R01-S01-B01', 100, 45, 'Active'),
('WH01-AMB-A01-R01-S01-B02', 'WH-LOS-01', 'Z-AMB', 'A01', 'R01', 'S01', 'B02', 'LOC-WH01-AMB-A01-R01-S01-B02', 100, 30, 'Active'),
('WH01-AMB-A02-R01-S01-B01', 'WH-LOS-01', 'Z-AMB', 'A02', 'R01', 'S01', 'B01', 'LOC-WH01-AMB-A02-R01-S01-B01', 100, 60, 'Active'),
('WH01-AMB-A03-R01-S01-B01', 'WH-LOS-01', 'Z-AMB', 'A03', 'R01', 'S01', 'B01', 'LOC-WH01-AMB-A03-R01-S01-B01', 100, 22, 'Active'),
-- Cold Reefer Bins
('WH01-CLD-A01-R01-S01-B01', 'WH-LOS-01', 'Z-COLD', 'A01', 'R01', 'S01', 'B01', 'LOC-WH01-CLD-A01-R01-S01-B01', 80, 50, 'Active'),
('WH01-CLD-A01-R01-S01-B02', 'WH-LOS-01', 'Z-COLD', 'A01', 'R01', 'S01', 'B02', 'LOC-WH01-CLD-A01-R01-S01-B02', 80, 40, 'Active'),
('WH01-CLD-A02-R01-S01-B01', 'WH-LOS-01', 'Z-COLD', 'A02', 'R01', 'S01', 'B01', 'LOC-WH01-CLD-A02-R01-S01-B01', 80, 45, 'Active'),
-- Hazmat Bins
('WH01-HAZ-A01-R01-S01-B01', 'WH-LOS-01', 'Z-HAZ', 'A01', 'R01', 'S01', 'B01', 'LOC-WH01-HAZ-A01-R01-S01-B01', 60, 28, 'Active'),
('WH01-HAZ-A01-R02-S01-B01', 'WH-LOS-01', 'Z-HAZ', 'A01', 'R02', 'S01', 'B01', 'LOC-WH01-HAZ-A01-R02-S01-B01', 60, 35, 'Active'),
-- Quarantine & Staging Bins
('WH01-QUR-A01-R01-S01-B01', 'WH-LOS-01', 'Z-QUAR', 'A01', 'R01', 'S01', 'B01', 'LOC-WH01-QUR-A01-R01-S01-B01', 100, 32, 'Active'),
('WH01-STG-INBOUND-01', 'WH-LOS-01', 'Z-STG', 'DOCK', 'IN', '01', 'BAY', 'LOC-WH01-STG-INBOUND-01', 250, 90, 'Active'),
('WH01-STG-OUTBOUND-01', 'WH-LOS-01', 'Z-STG', 'DOCK', 'OUT', '01', 'BAY', 'LOC-WH01-STG-OUTBOUND-01', 250, 120, 'Active')
ON CONFLICT (location_id) DO NOTHING;

-- 6. Roles
INSERT INTO roles (role_id, name, badge_label, color_theme, description) VALUES
('admin', 'System Administrator', 'SYSTEM ADMIN', 'rose', 'Full tenant management and user invitation. Strictly barred from deleting audit history.'),
('supervisor', 'Warehouse Supervisor', 'SUPERVISOR', 'amber', 'Floor supervisor. Approves stock adjustments up to ₦1,000,000. Authorizes dispatch.'),
('officer', 'Warehouse Officer', 'OFFICER', 'emerald', 'Floor execution operator. Inbound receiving, put-away, and wave picking. Limit ₦0.'),
('manager', 'Operations Manager', 'OPS MANAGER', 'indigo', 'Director of operations. Multi-facility oversight, approves adjustments up to ₦5,000,000.'),
('finance', 'Finance & Billing Controller', 'FINANCE', 'sky', 'SaaS subscription and contract storage billing management.')
ON CONFLICT (role_id) DO NOTHING;

-- 7. Permissions Matrix
INSERT INTO permissions (permission_id, module, action, description) VALUES
('company.view', 'company', 'view', 'View enterprise company profile'),
('company.edit', 'company', 'edit', 'Edit company tenant profile'),
('branches.view', 'branches', 'view', 'View distribution branches'),
('branches.edit', 'branches', 'edit', 'Create and modify branches'),
('warehouses.view', 'warehouses', 'view', 'View warehouses and bin map'),
('warehouses.edit', 'warehouses', 'edit', 'Provision and modify warehouses'),
('users.view', 'users', 'view', 'View users directory'),
('users.edit', 'users', 'edit', 'Invite and manage users'),
('roles.view', 'roles', 'view', 'View RBAC permissions matrix'),
('roles.edit', 'roles', 'edit', 'Modify role assignments'),
('inventory.view', 'inventory', 'view', 'View live inventory balances'),
('inventory.adjust_request', 'inventory', 'adjust_request', 'Raise discrepancy stock adjustments'),
('inventory.adjust_approve', 'inventory', 'adjust_approve', 'APPROVE inventory write-offs (Strict SoD)'),
('receiving.view', 'receiving', 'view', 'View inbound purchase orders'),
('receiving.process', 'receiving', 'process', 'Receive inbound goods & scan barcodes'),
('putaway.view', 'putaway', 'view', 'View put-away tasks'),
('putaway.process', 'putaway', 'process', 'Confirm bin put-away execution'),
('picking.view', 'picking', 'view', 'View outbound pick lists'),
('picking.process', 'picking', 'process', 'Execute order item picking'),
('dispatch.view', 'dispatch', 'view', 'View dispatch queue'),
('dispatch.process', 'dispatch', 'process', 'Pack and weigh parcel shipments'),
('dispatch.approve', 'dispatch', 'approve', 'Authorize final dispatch gate release'),
('returns.view', 'returns', 'view', 'View RMA returns ledger'),
('returns.process', 'returns', 'process', 'Intake returned orders'),
('returns.triage', 'returns', 'triage', 'Authorize condition triage (Restock/Quarantine)'),
('reports.view', 'reports', 'view', 'View operational reports and ledger'),
('reports.export', 'reports', 'export', 'Export confidential analytics to CSV'),
('audit.view', 'audit', 'view', 'Inspect immutable cryptographic audit trail'),
('billing.view', 'billing', 'view', 'View SaaS subscription and invoices'),
('billing.edit', 'billing', 'edit', 'Modify SaaS tier and billing rules')
ON CONFLICT (permission_id) DO NOTHING;

-- 8. Users
INSERT INTO users (
    user_id, company_id, branch_id, email, password_hash, name, title,
    role_id, warehouse_scope, approval_limit, status, avatar_text, mfa_enabled
) VALUES
('USR-001', 'COMP-001', 'BR-LOS', 't.adeyemi@apexlogistics.com', crypt('password123', gen_salt('bf')), 'Tunde Adeyemi', 'Inbound & Put-Away Floor Officer', 'officer', 'WH-LOS-01', 0.00, 'Active', 'TA', true),
('USR-002', 'COMP-001', 'BR-LOS', 's.jenkins@apexlogistics.com', crypt('password123', gen_salt('bf')), 'Sarah Jenkins', 'Shift Operations Supervisor', 'supervisor', 'WH-LOS-01', 1000000.00, 'Active', 'SJ', true),
('USR-003', 'COMP-001', 'BR-LOS', 'm.vance@apexlogistics.com', crypt('password123', gen_salt('bf')), 'Marcus Vance', 'Director of Warehouse Operations', 'manager', 'ALL', 5000000.00, 'Active', 'MV', true),
('USR-004', 'COMP-001', 'BR-LOS', 'e.rostova@apexlogistics.com', crypt('password123', gen_salt('bf')), 'Elena Rostova', 'Global Enterprise IT & SecOps Admin', 'admin', 'ALL', 10000000.00, 'Active', 'ER', true),
('USR-005', 'COMP-001', 'BR-LOS', 'd.sterling@apexlogistics.com', crypt('password123', gen_salt('bf')), 'David Sterling', 'Head of SaaS & Contract Accounting', 'finance', 'ALL', 2500000.00, 'Active', 'DS', true),
('USR-006', 'COMP-001', 'BR-ABJ', 'c.okafor@apexlogistics.com', crypt('password123', gen_salt('bf')), 'Chinedu Okafor', 'Abuja Depot Floor Lead', 'supervisor', 'WH-ABJ-01', 750000.00, 'Active', 'CO', true)
ON CONFLICT (user_id) DO NOTHING;

-- 9. Product Master Catalog
INSERT INTO products (
    sku, company_id, name, category, barcode, storage_requirement, target_zone_type,
    weight_kg, unit_of_measure, min_stock_level, max_stock_level, cost_price, selling_price, description
) VALUES
('SKU-SOLAR-INV-5KW', 'COMP-001', 'SolarEdge Hybrid Inverter 5KVA', 'Renewable Energy', '789102938401', 'Standard', 'Standard', 24.500, 'Units', 20, 200, 420000.00, 580000.00, 'Pure sine-wave 48V solar inverter for residential/commercial installations.'),
('SKU-LITH-BAT-48V', 'COMP-001', 'Pylontech US3000C Lithium Battery 3.5kWh', 'Energy Storage', '789102938402', 'Hazardous', 'Hazardous', 32.000, 'Units', 15, 150, 650000.00, 890000.00, 'LiFePO4 modular rack-mount storage battery module with smart BMS.'),
('SKU-PHARM-VAX-RHO', 'COMP-001', 'Cold-Chain Pneumococcal Vaccine Lot-X', 'Pharmaceuticals', '789102938403', 'Cold', 'Cold', 0.150, 'Vials', 100, 1500, 28000.00, 45000.00, 'Temperature sensitive vaccine requiring strict 2°C to 8°C temperature chain.'),
('SKU-IND-CHEM-LUB9', 'COMP-001', 'Castrol Industrial Heavy Grease 20L', 'Industrial Consumables', '789102938404', 'Hazardous', 'Hazardous', 18.200, 'Kegs', 25, 300, 85000.00, 120000.00, 'High-temperature marine and rig mechanical lubricant.'),
('SKU-FMCG-OLIV-500ML', 'COMP-001', 'Extra Virgin Olive Oil 500ml (Carton of 12)', 'Food & Beverage', '789102938405', 'Standard', 'Standard', 6.800, 'Cartons', 50, 600, 32000.00, 48000.00, 'First cold-pressed Mediterranean culinary olive oil.'),
('SKU-TECH-LAP-PRO16', 'COMP-001', 'Enterprise ProBook 16 i7 32GB 1TB', 'IT Equipment', '789102938406', 'Standard', 'Standard', 2.100, 'Units', 10, 80, 780000.00, 990000.00, 'Corporate workstation laptops with TPM 2.0 enterprise security chip.'),
('SKU-PHARM-INS-10ML', 'COMP-001', 'Recombinant Human Insulin 100IU/ml', 'Pharmaceuticals', '789102938407', 'Cold', 'Cold', 0.080, 'Vials', 150, 2000, 12500.00, 19500.00, 'Cold-chain insulin cartridges for diabetic care programs.')
ON CONFLICT (sku) DO NOTHING;

-- 10. Initial Stock Balances
INSERT INTO inventory_balances (warehouse_id, location_id, product_sku, qty_available, qty_reserved, qty_allocated, qty_damaged) VALUES
('WH-LOS-01', 'WH01-AMB-A01-R01-S01-B01', 'SKU-SOLAR-INV-5KW', 45, 5, 5, 0),
('WH-LOS-01', 'WH01-AMB-A01-R01-S01-B02', 'SKU-SOLAR-INV-5KW', 30, 0, 0, 0),
('WH-LOS-01', 'WH01-HAZ-A01-R01-S01-B01', 'SKU-LITH-BAT-48V', 28, 4, 4, 0),
('WH-LOS-01', 'WH01-CLD-A01-R01-S01-B01', 'SKU-PHARM-VAX-RHO', 340, 60, 60, 0),
('WH-LOS-01', 'WH01-CLD-A01-R01-S01-B02', 'SKU-PHARM-VAX-RHO', 210, 0, 0, 5),
('WH-LOS-01', 'WH01-HAZ-A01-R02-S01-B01', 'SKU-IND-CHEM-LUB9', 52, 10, 10, 0),
('WH-LOS-01', 'WH01-AMB-A02-R01-S01-B01', 'SKU-FMCG-OLIV-500ML', 180, 25, 25, 2),
('WH-LOS-01', 'WH01-AMB-A03-R01-S01-B01', 'SKU-TECH-LAP-PRO16', 22, 6, 6, 0),
('WH-LOS-01', 'WH01-CLD-A02-R01-S01-B01', 'SKU-PHARM-INS-10ML', 480, 40, 40, 0)
ON CONFLICT (warehouse_id, location_id, product_sku) DO NOTHING;

-- 11. Initial Physical Ledger Log
INSERT INTO inventory_ledger (
    company_id, warehouse_id, location_id, product_sku,
    prev_qty, change_qty, new_qty, transaction_type, user_id, reference_doc_id, timestamp
) VALUES
('COMP-001', 'WH-LOS-01', 'WH01-AMB-A01-R01-S01-B01', 'SKU-SOLAR-INV-5KW', 0, 50, 50, 'Receiving', 'USR-001', 'PO-2026-0870', CURRENT_TIMESTAMP - INTERVAL '7 days'),
('COMP-001', 'WH-LOS-01', 'WH01-AMB-A01-R01-S01-B01', 'SKU-SOLAR-INV-5KW', 50, -5, 45, 'Pick', 'USR-001', 'ORD-NG-2026-750', CURRENT_TIMESTAMP - INTERVAL '4 days'),
('COMP-001', 'WH-LOS-01', 'WH01-AMB-A02-R01-S01-B01', 'SKU-FMCG-OLIV-500ML', 182, -2, 180, 'Adjustment', 'USR-002', 'ADJ-2026-0041', CURRENT_TIMESTAMP - INTERVAL '1 day');

-- 12. Stock Adjustments (Strict SoD Demonstration)
INSERT INTO stock_adjustments (
    adjustment_id, company_id, warehouse_id, location_id, product_sku,
    prev_qty, target_qty, variance, cost_variance, requested_by, approved_by,
    reason_code, evidence_notes, status, created_at, approved_at
) VALUES
('ADJ-2026-0041', 'COMP-001', 'WH-LOS-01', 'WH01-AMB-A02-R01-S01-B01', 'SKU-FMCG-OLIV-500ML', 182, 180, -2, -64000.00, 'USR-001', 'USR-002', 'Physical count discrepancy', '2 broken bottles discovered inside carton during audit.', 'Approved', CURRENT_TIMESTAMP - INTERVAL '2 days', CURRENT_TIMESTAMP - INTERVAL '1 day'),
('ADJ-2026-0042', 'COMP-001', 'WH-LOS-01', 'WH01-AMB-A01-R01-S01-B02', 'SKU-SOLAR-INV-5KW', 31, 30, -1, -420000.00, 'USR-001', NULL, 'Data entry correction', 'Unit misplaced in staging aisle found scratched and quarantined.', 'Pending', CURRENT_TIMESTAMP - INTERVAL '4 hours', NULL),
('ADJ-2026-0043', 'COMP-001', 'WH-LOS-01', 'WH01-AMB-A03-R01-S01-B01', 'SKU-TECH-LAP-PRO16', 24, 22, -2, -1560000.00, 'USR-001', NULL, 'Damaged goods discovered', 'Roof water leak damaged packaging beyond commercial acceptance.', 'Pending', CURRENT_TIMESTAMP - INTERVAL '2 hours', NULL)
ON CONFLICT (adjustment_id) DO NOTHING;

-- 13. Purchase Orders
INSERT INTO purchase_orders (po_id, company_id, warehouse_id, supplier_name, status, eta_date, created_by) VALUES
('PO-2026-0891', 'COMP-001', 'WH-LOS-01', 'Shenzhen CleanTech Power Co.', 'Receiving', CURRENT_DATE, 'USR-004'),
('PO-2026-0892', 'COMP-001', 'WH-LOS-01', 'BioPharma Nordic AB', 'Expected', CURRENT_DATE + INTERVAL '1 day', 'USR-004')
ON CONFLICT (po_id) DO NOTHING;

INSERT INTO po_items (po_id, product_sku, expected_qty, received_qty, damaged_qty, unit_cost) VALUES
('PO-2026-0891', 'SKU-SOLAR-INV-5KW', 40, 25, 0, 420000.00),
('PO-2026-0891', 'SKU-LITH-BAT-48V', 30, 10, 1, 650000.00),
('PO-2026-0892', 'SKU-PHARM-VAX-RHO', 500, 0, 0, 28000.00),
('PO-2026-0892', 'SKU-PHARM-INS-10ML', 600, 0, 0, 12500.00);

-- 14. Outbound Orders
INSERT INTO orders (
    order_id, company_id, warehouse_id, customer_name, destination_address,
    courier_name, tracking_number, priority, status, created_by
) VALUES
('ORD-NG-2026-771', 'COMP-001', 'WH-LOS-01', 'GreenVolt Solar Solutions Ltd.', 'Plot 19 Lekki Phase 1, Lagos', 'GIG Logistics', 'GIG-LG-99201', 'Urgent', 'Allocated', 'USR-001'),
('ORD-NG-2026-772', 'COMP-001', 'WH-LOS-01', 'Federal Ministry of Health Clinic', 'Garki Hospital Stores, Abuja FCT', 'DHL Express Cold-Chain', 'DHL-CC-448102', 'Urgent', 'Picking', 'USR-001')
ON CONFLICT (order_id) DO NOTHING;

INSERT INTO order_items (order_id, product_sku, qty, picked_qty, packed_qty, allocated_location_id) VALUES
('ORD-NG-2026-771', 'SKU-SOLAR-INV-5KW', 5, 0, 0, 'WH01-AMB-A01-R01-S01-B01'),
('ORD-NG-2026-771', 'SKU-LITH-BAT-48V', 4, 0, 0, 'WH01-HAZ-A01-R01-S01-B01'),
('ORD-NG-2026-772', 'SKU-PHARM-VAX-RHO', 60, 60, 0, 'WH01-CLD-A01-R01-S01-B01'),
('ORD-NG-2026-772', 'SKU-PHARM-INS-10ML', 40, 20, 0, 'WH01-CLD-A02-R01-S01-B01');

-- 15. SaaS Subscription & Billing
INSERT INTO saas_subscriptions (
    subscription_id, company_id, plan_name, billing_interval, base_rate_usd,
    rate_per_warehouse_usd, rate_per_user_usd, status, current_cycle_start,
    current_cycle_end, payment_method, next_invoice_amount_usd
) VALUES (
    'SUB-2026-001',
    'COMP-001',
    'Enterprise Tier',
    'Monthly',
    499.00,
    39.00,
    12.00,
    'Active',
    DATE_TRUNC('month', CURRENT_DATE),
    (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month - 1 day')::DATE,
    'Mastercard Enterprise Corporate ending in •••• 9104',
    499.00 + (4 * 39.00) + (6 * 12.00) -- $727.00
) ON CONFLICT (subscription_id) DO NOTHING;

-- 16. Genesis Cryptographic Audit Trail
INSERT INTO audit_trail (
    timestamp, user_id, role_id, severity, action_type, message, prev_hash, hash, ip_address
) VALUES
(CURRENT_TIMESTAMP - INTERVAL '7 days', 'USR-004', 'admin', 'info', 'SYSTEM_INIT', 'Enterprise WOS System initialized. Zero-Trust RBAC & Ledger security policies active.', 'GENESIS_BLOCK_WOS_SYSTEM_V1', encode(digest('GENESIS_BLOCK_WOS_SYSTEM_V1', 'sha256'), 'hex'), '127.0.0.1'),
(CURRENT_TIMESTAMP - INTERVAL '6 days', 'USR-004', 'admin', 'info', 'USER_INVITED', 'Invited Tunde Adeyemi with role officer scoped to WH-LOS-01.', encode(digest('GENESIS_BLOCK_WOS_SYSTEM_V1', 'sha256'), 'hex'), encode(digest('EVENT_002', 'sha256'), 'hex'), '127.0.0.1');
