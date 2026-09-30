# Apex WOS — Enterprise Cloud-Based Warehouse Operating System

A cloud-based **Warehouse Operating System (WOS)** built to replace paper records, fragile spreadsheets, and informal WhatsApp communications with an auditable, automated, zero-trust digital operating system.

---

## 🎯 The Core Problem & Solution

| The Spreadsheet / WhatsApp Reality | The Apex WOS Standard |
| :--- | :--- |
| **Stock Discrepancies**: Physical count doesn't match paper records. | **Real-Time Balances & Ledger**: Every inbound, pick, and transfer updates bin-level balances and an immutable movement ledger. |
| **Unauthorized Access**: Anyone can edit cells or adjust stock counts. | **Zero-Trust RBAC & SoD**: Floor officers cannot approve adjustments. Supervisors cannot alter finances. System admins cannot secretly delete audit logs. |
| **Missing Inventory**: Items lost in random warehouse racks. | **Smart Bin Allocation (`WH-Z-A-R-S-B`)**: Algorithmic bin recommendations matching cold/hazardous requirements with 2D occupancy mapping. |
| **Slow Dispatch**: Inefficient picking routes and delayed approvals. | **Wave Picking & Printable Gate Passes**: Guided pick routes, parcel weight verification, courier assignment, and one-click shipping manifests. |
| **Lack of Accountability**: "Who did what?" is impossible to prove. | **Cryptographic Tamper-Evident Audit Trail**: Every action is sealed with a SHA-256 block hash chained back to the Genesis block. |

---

## 🏗️ 13 Core Modules Hierarchy

```
Company Profile & Multi-Tenancy
   ↓
Regional Distribution Branches
   ↓
Physical Warehouses & 2D Storage Bins
   ↓
Users Identity Directory
   ↓
Roles & Permissions (RBAC Matrix)
   ↓
Inventory Balances & Master Catalog
   ↓
Inbound Receiving Dock
   ↓
Smart Put-Away
   ↓
Outbound Wave Picking
   ↓
Packing & Dispatch Gate Release
   ↓
Reverse Logistics (RMA Returns)
   ↓
Cryptographic Audit Trail & Compliance
   ↓
Multi-Tenant SaaS Subscription Engine
```

---

## 🛡️ Important Differentiator: First-Class RBAC + Auditability

### 1. Separation of Duties (SoD) Personas
Use the **Persona Switcher** in the top header to instantly experience the system from each user's perspective:

1. **Warehouse Officer (Tunde Adeyemi)**
   - **Can**: Scan barcodes, receive inbound goods against POs, execute put-aways, pick outbound orders, pack parcels, and request count adjustments.
   - **Strictly Blocked**: Cannot approve stock adjustments (Approval Limit: ₦0). Attempting an approval triggers a policy rejection and logs an unauthorized access attempt in the audit trail.

2. **Warehouse Supervisor (Sarah Jenkins)**
   - **Can**: Supervise operations, approve stock adjustments up to **₦1,000,000**, triage returns, and authorize outbound gate release.
   - **Strictly Blocked**: Cannot approve adjustments she requested herself (Self-Approval Anti-Collusion Rule), cannot edit company SaaS subscription billing, and cannot delete logs.

3. **Operations Manager (Marcus Vance)**
   - **Can**: Global multi-depot visibility, approve high-value adjustments up to **₦5,000,000**, and export confidential operational reports.

4. **System Administrator (Elena Rostova)**
   - **Can**: Manage users, provision warehouses, and configure system rules.
   - **Strictly Prohibited**: **Cannot secretly delete or tamper with transaction history**. The ledger is cryptographically append-only.

5. **Finance & Billing Controller (David Sterling)**
   - **Can**: Manage SaaS pricing tiers, invoice cycles, and 3PL contract storage rates.

---

## 🔒 Cryptographic Audit Chain & Anti-Tamper Verification

- Every event (receiving, picking, dispatch, stock adjustment request/approval, login, unauthorized access attempt) generates a cryptographically signed block with `hash = SHA256(prevHash | timestamp | user | role | severity | action | message | stateSnapshot)`.
- **Integrity Verification**: Click **"Verify Hash Chain Integrity"** in the Audit module to mathematically traverse the entire block chain back to Genesis and prove that zero records have been deleted or modified.
- **Anti-Tamper Demonstration**: Click **"Attempt Secret History Deletion"** to see how the system actively repels purge commands, triggers an instant Critical Security Incident alert, and writes the violation to the immutable ledger.

---

## 💳 Business Model: Monthly SaaS Subscription Calculator

The built-in SaaS billing engine calculates monthly recurring subscriptions per active warehouse and active user seats:
- **Starter Tier**: $99/mo base + $49/warehouse + $15/user
- **Growth Tier**: $249/mo base + $49/warehouse + $15/user
- **Enterprise Tier**: $499/mo base + $39/warehouse + $12/user
- Interactive sliders in the **SaaS Subscriptions** module enable real-time price modeling with an instant 20% annual discount calculator.

---

---

## ⚡ Supabase Cloud Database & PostgreSQL Integration

Apex WOS connects directly to **Supabase** for live cloud persistence, asynchronous audit log replication, and relational multi-facility storage:
- **Cloud Endpoint**: `https://rywfmocrdpygovckkarv.supabase.co`
- **Schema Migration**: [`supabase_setup.sql`](file:///c:/Users/User/Desktop/Enterprises/supabase_setup.sql) contains all 20 relational tables, analytical views (`vw_inventory_valuation`, `vw_bin_utilization`, `vw_daily_throughput`), indexes, and Row Level Security (RLS) policies.
- **Dual-Mode Operation**: When online, state syncs to Supabase. If offline or in standby, the application automatically runs on the tamper-resistant local ledger without operational interruption.

---

## 🚀 How to Run

1. Open `index.html` in Google Chrome, Microsoft Edge, Mozilla Firefox, or Safari.
2. The system runs client-side with zero compilation required, and connects live to Supabase.
3. Click the **SUPABASE: CLOUD READY** badge in the top navigation bar to test cloud connectivity or push local master catalog data.
4. To reset the application back to the clean enterprise demonstration dataset, click **"🔄 Reset Enterprise Demo Data"** at the bottom of the sidebar.
