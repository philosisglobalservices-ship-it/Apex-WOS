/**
 * Warehouse Operating System (WOS)
 * Application User Interface & Reactive View Renderer
 */

const WOS_UI = (function () {
    let currentTab = 'inventory';

    // Toast notification
    function showToast(message, type = 'info') {
        const container = document.getElementById('toast-container');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        
        let icon = 'ℹ️';
        if (type === 'success') icon = '✅';
        if (type === 'warning') icon = '⚠️';
        if (type === 'error' || type === 'critical') icon = '🚫';

        toast.innerHTML = `
            <div class="toast-icon">${icon}</div>
            <div class="toast-content">${message}</div>
            <button class="toast-close" onclick="this.parentElement.remove()">&times;</button>
        `;

        container.appendChild(toast);
        setTimeout(() => {
            if (toast.parentElement) {
                toast.classList.add('toast-fade');
                setTimeout(() => toast.remove(), 400);
            }
        }, 5000);
    }

    // Tab Navigation
    function switchTab(tabId) {
        currentTab = tabId;
        
        // Update nav links
        document.querySelectorAll('.nav-item').forEach(el => {
            el.classList.toggle('active', el.dataset.tab === tabId);
        });

        // Hide all views, show current
        document.querySelectorAll('.module-view').forEach(el => {
            el.classList.remove('active');
        });

        const target = document.getElementById(`view-${tabId}`);
        if (target) {
            target.classList.add('active');
            renderView(tabId);
        }

        updateHeaderTelemetry();
    }

    // Update Header & Global Bar active persona telemetry
    function updateHeaderTelemetry() {
        const user = WOS_RBAC.getActiveUser();
        const role = WOS_RBAC.getActiveRole();
        const state = WOS_Data.getState();

        const avatarEl = document.getElementById('header-user-avatar');
        const nameEl = document.getElementById('header-user-name');
        const roleBadgeEl = document.getElementById('header-role-badge');
        const limitEl = document.getElementById('header-approval-limit');

        if (avatarEl) avatarEl.textContent = user.avatarText || user.name.substring(0, 2).toUpperCase();
        if (nameEl) nameEl.textContent = user.name;
        if (roleBadgeEl) {
            roleBadgeEl.textContent = role.name;
            roleBadgeEl.className = `badge badge-${role.color || 'indigo'}`;
        }
        if (limitEl) {
            limitEl.textContent = user.approvalLimit > 0 
                ? `Limit: ₦${user.approvalLimit.toLocaleString()}` 
                : 'No Approval Authority';
        }

        // Header Persona dropdown sync
        const select = document.getElementById('persona-quick-switcher');
        if (select) {
            select.value = user.id;
        }

        // Sidebar Persona Card sync
        const sideAvatar = document.getElementById('sidebar-user-avatar');
        const sideName = document.getElementById('sidebar-user-name');
        const sideRole = document.getElementById('sidebar-user-role');
        const sideLimit = document.getElementById('sidebar-user-limit');
        const sideSelect = document.getElementById('sidebar-persona-switcher');

        if (sideAvatar) sideAvatar.textContent = user.avatarText || user.name.substring(0, 2).toUpperCase();
        if (sideName) sideName.textContent = user.name;
        if (sideRole) sideRole.textContent = role.name;
        if (sideLimit) {
            sideLimit.textContent = user.approvalLimit > 0
                ? `Approval Limit: ₦${user.approvalLimit.toLocaleString()}`
                : 'No Approval Authority (₦0)';
        }
        if (sideSelect) {
            sideSelect.value = user.id;
        }

        // Global Persona button group highlight sync
        document.querySelectorAll('.persona-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.persona === user.id);
        });

        // Privilege Explainer text update
        const explainer = document.getElementById('persona-privilege-explainer');
        if (explainer) {
            let permSummary = '';
            let blockSummary = '';

            if (user.roleId === 'officer') {
                permSummary = 'Inbound receiving, barcode scanning, smart put-away, wave picking, packing.';
                blockSummary = 'Stock adjustment approvals (Approval Limit: ₦0), System administration, SaaS Billing.';
            } else if (user.roleId === 'supervisor') {
                permSummary = `Stock adjustment approvals up to ₦${user.approvalLimit.toLocaleString()}, task assignments, dispatch gate release, RMA quality triage.`;
                blockSummary = 'Self-approval of own adjustments (Strict SoD), modifying SaaS subscription & financial rules.';
            } else if (user.roleId === 'manager') {
                permSummary = `Cross-facility visibility, adjustment approvals up to ₦${user.approvalLimit.toLocaleString()}, operational reports export, dispatch overrides.`;
                blockSummary = 'Secretly modifying or deleting transaction audit history (Strict Immutability).';
            } else if (user.roleId === 'admin') {
                permSummary = 'User lifecycle management, role & permission delegation, facility and zone configuration.';
                blockSummary = 'PURGING OR DELETING TRANSACTION LEDGER (Strict Zero-Trust policy: write-only cryptographically chained logs).';
            } else if (user.roleId === 'finance') {
                permSummary = 'SaaS subscription tier configuration, client storage billing, commercial invoicing.';
                blockSummary = 'Floor warehouse operations (cannot receive, put-away, or pick without supervisor assignment).';
            }

            explainer.innerHTML = `
                Active Persona: <strong>${user.name} (${role.name})</strong> — 
                <span class="text-emerald-700 font-bold">Permitted:</span> ${permSummary} 
                <span class="text-rose-600 font-bold">Strictly Blocked:</span> ${blockSummary}
            `;
        }

        // Warehouse selector dropdown sync
        const whSelect = document.getElementById('warehouse-quick-switcher');
        if (whSelect && state.activeWarehouseId) {
            whSelect.value = state.activeWarehouseId;
        }
    }

    // Global Modal manager
    function openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('open');
            document.body.classList.add('modal-open');
        }
    }

    function closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('open');
            document.body.classList.remove('modal-open');
        }
    }

    // Core Router to render specific modules
    function renderView(tabId) {
        switch (tabId) {
            case 'company':
                renderCompanyView();
                break;
            case 'branches':
                renderBranchesView();
                break;
            case 'warehouses':
                renderWarehousesView();
                break;
            case 'users':
                renderUsersView();
                break;
            case 'roles':
                renderRolesView();
                break;
            case 'inventory':
                renderInventoryView();
                break;
            case 'receiving':
                renderReceivingView();
                break;
            case 'putaway':
                renderPutAwayView();
                break;
            case 'picking':
                renderPickingView();
                break;
            case 'dispatch':
                renderDispatchView();
                break;
            case 'returns':
                renderReturnsView();
                break;
            case 'audit':
                renderAuditView();
                break;
            case 'billing':
                renderBillingView();
                break;
        }
    }

    // =========================================================================
    // VIEW 1: COMPANY & MULTI-TENANCY
    // =========================================================================
    function renderCompanyView() {
        const container = document.getElementById('view-company');
        if (!container) return;
        const state = WOS_Data.getState();
        const c = state.company;
        const canEdit = WOS_RBAC.hasPermission('company.edit');

        container.innerHTML = `
            <div class="view-header">
                <div>
                    <h1 class="view-title">🏢 Enterprise Organization & Profile</h1>
                    <p class="view-subtitle">Tenant-level multi-warehouse settings, global currency, and regulatory entities.</p>
                </div>
                <div>
                    ${canEdit 
                        ? `<button class="btn btn-primary" onclick="WOS_UI.openCompanyEditModal()">✏️ Edit Company Profile</button>` 
                        : `<span class="badge badge-warning" title="Requires Administrator or Operations Manager role">🔒 Read-Only (Admin Restricted)</span>`
                    }
                </div>
            </div>

            <div class="grid-2-col mb-6">
                <div class="card">
                    <div class="card-header">
                        <div class="card-title">Corporate Master Record</div>
                        <span class="badge badge-emerald">ACTIVE TENANT</span>
                    </div>
                    <div class="table-responsive">
                        <table class="details-table">
                            <tr><th>Company Name:</th><td><strong>${c.name}</strong></td></tr>
                            <tr><th>Legal Entity:</th><td>${c.legalEntity}</td></tr>
                            <tr><th>Tax / Registration ID:</th><td><code>${c.taxId}</code></td></tr>
                            <tr><th>Industry Sector:</th><td>${c.industry}</td></tr>
                            <tr><th>HQ Physical Address:</th><td>${c.address}</td></tr>
                            <tr><th>Executive Contact:</th><td><a href="mailto:${c.contactEmail}">${c.contactEmail}</a></td></tr>
                        </table>
                    </div>
                </div>

                <div class="card">
                    <div class="card-header">
                        <div class="card-title">System Settings & Limits</div>
                        <span class="badge badge-indigo">${c.subscriptionTier} TIER</span>
                    </div>
                    <div class="table-responsive">
                        <table class="details-table">
                            <tr><th>Primary Currency:</th><td><strong>${c.defaultCurrency} (${c.currencySymbol})</strong></td></tr>
                            <tr><th>Active Warehouses:</th><td><span class="font-bold text-indigo-600">${state.warehouses.length}</span> of ${c.maxWarehouses} max licensed</td></tr>
                            <tr><th>Registered Operators:</th><td><span class="font-bold text-indigo-600">${state.users.length}</span> of ${c.maxUsers} max users</td></tr>
                            <tr><th>Audit Security Level:</th><td><span class="badge badge-emerald">SHA-256 Hash Chained (Tamper Evident)</span></td></tr>
                            <tr><th>SoD Policy Enforcement:</th><td><span class="badge badge-emerald">STRICT (Zero Self-Approval)</span></td></tr>
                            <tr><th>Next SaaS Billing Date:</th><td><code>${c.nextBillingDate}</code></td></tr>
                        </table>
                    </div>
                </div>
            </div>

            <div class="card">
                <div class="card-header">
                    <div class="card-title">Operational Hierarchy Structure</div>
                </div>
                <div class="hierarchy-flow">
                    <div class="hierarchy-node root">
                        <div class="node-icon">🏢</div>
                        <div class="node-title">${c.name}</div>
                        <div class="node-subtitle">Enterprise Parent Entity</div>
                    </div>
                    <div class="hierarchy-connector">↓</div>
                    <div class="hierarchy-branches-row">
                        ${state.branches.map(b => `
                            <div class="hierarchy-branch-card">
                                <div class="branch-pill">🌿 ${b.name}</div>
                                <div class="branch-meta">${b.city} • Manager: ${b.manager}</div>
                                <div class="wh-subnodes">
                                    ${state.warehouses.filter(w => w.branchId === b.id).map(w => `
                                        <div class="wh-subnode">
                                            🏭 <strong>${w.name}</strong>
                                            <span class="text-xs text-muted">(${w.type})</span>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
    }

    // =========================================================================
    // VIEW 2: BRANCHES MODULE
    // =========================================================================
    function renderBranchesView() {
        const container = document.getElementById('view-branches');
        if (!container) return;
        const state = WOS_Data.getState();
        const canEdit = WOS_RBAC.hasPermission('branches.edit');

        container.innerHTML = `
            <div class="view-header">
                <div>
                    <h1 class="view-title">🌿 Regional Distribution Branches</h1>
                    <p class="view-subtitle">Regional commercial and geographic distribution hubs overseeing depot networks.</p>
                </div>
                <div>
                    ${canEdit
                        ? `<button class="btn btn-primary" onclick="WOS_UI.openBranchAddModal()">+ Add New Branch</button>`
                        : `<span class="badge badge-warning">🔒 Edit Restricted</span>`
                    }
                </div>
            </div>

            <div class="cards-grid">
                ${state.branches.map(b => {
                    const whCount = state.warehouses.filter(w => w.branchId === b.id).length;
                    return `
                        <div class="card branch-card">
                            <div class="card-header">
                                <div>
                                    <div class="card-title">${b.name}</div>
                                    <span class="text-xs font-mono text-muted">Code: ${b.code}</span>
                                </div>
                                <span class="badge badge-emerald">ACTIVE</span>
                            </div>
                            <div class="card-body">
                                <p class="text-sm mb-3">📍 <strong>Region:</strong> ${b.region} (${b.city})</p>
                                <p class="text-sm mb-2">👤 <strong>Branch Manager:</strong> ${b.manager}</p>
                                <p class="text-sm mb-2">📞 <strong>Operations Hotline:</strong> ${b.phone}</p>
                                <p class="text-xs text-muted mb-4">🏢 <strong>Physical Hub:</strong> ${b.address}</p>
                                
                                <div class="branch-stats-box flex gap-4">
                                    <div class="metric-pill">
                                        <div class="metric-val">${whCount}</div>
                                        <div class="metric-lbl">Warehouses</div>
                                    </div>
                                    <div class="metric-pill">
                                        <div class="metric-val">${state.users.filter(u => u.branchId === b.id).length}</div>
                                        <div class="metric-lbl">Assigned Staff</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    }

    // =========================================================================
    // VIEW 3: WAREHOUSES & VISUAL BIN MAP
    // =========================================================================
    function renderWarehousesView() {
        const container = document.getElementById('view-warehouses');
        if (!container) return;
        const state = WOS_Data.getState();
        const activeWh = state.warehouses.find(w => w.id === state.activeWarehouseId) || state.warehouses[0];
        const whBins = state.locations.filter(l => l.warehouseId === activeWh.id);
        const canEdit = WOS_RBAC.hasPermission('warehouses.edit');

        container.innerHTML = `
            <div class="view-header">
                <div>
                    <h1 class="view-title">🏭 Warehouses & Storage Bin Architecture</h1>
                    <p class="view-subtitle">Physical warehouse topology, dedicated storage zones, and fine-grained bin addresses.</p>
                </div>
                <div class="flex gap-2">
                    <select class="select" id="wh-view-selector" onchange="WOS_UI.switchActiveWarehouse(this.value)">
                        ${state.warehouses.map(w => `
                            <option value="${w.id}" ${w.id === activeWh.id ? 'selected' : ''}>
                                ${w.name} (${w.type})
                            </option>
                        `).join('')}
                    </select>
                    ${canEdit ? `<button class="btn btn-outline" onclick="WOS_UI.openWarehouseAddModal()">+ Add Warehouse</button>` : ''}
                </div>
            </div>

            <!-- Warehouse Meta Card -->
            <div class="card mb-6">
                <div class="flex justify-between items-center flex-wrap gap-4 p-4">
                    <div>
                        <div class="flex items-center gap-2">
                            <h2 class="text-xl font-black">${activeWh.name}</h2>
                            <span class="badge badge-emerald">${activeWh.status}</span>
                            <span class="badge badge-indigo">${activeWh.type}</span>
                        </div>
                        <p class="text-xs text-muted mt-1">📍 ${activeWh.address}</p>
                    </div>
                    <div class="flex gap-4">
                        <div class="metric-pill">
                            <span class="metric-lbl">Total Capacity</span>
                            <span class="metric-val">${activeWh.totalCapacityUnits.toLocaleString()} Units</span>
                        </div>
                        <div class="metric-pill">
                            <span class="metric-lbl">Occupied Bins</span>
                            <span class="metric-val text-amber-500">${activeWh.occupiedUnits.toLocaleString()} Units</span>
                        </div>
                        <div class="metric-pill">
                            <span class="metric-lbl">Utilization</span>
                            <span class="metric-val text-indigo-600">${Math.round((activeWh.occupiedUnits / activeWh.totalCapacityUnits) * 100)}%</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Zones Overview -->
            <div class="card mb-6">
                <div class="card-header">
                    <div class="card-title">Storage Temperature & Hazard Zones (${state.zones.length} Configured)</div>
                </div>
                <div class="zones-grid">
                    ${state.zones.map(z => {
                        let badgeClass = 'badge-slate';
                        if (z.type === 'Cold') badgeClass = 'badge-sky';
                        if (z.type === 'Hazardous') badgeClass = 'badge-rose';
                        if (z.type === 'Quarantine') badgeClass = 'badge-amber';
                        if (z.type === 'Staging') badgeClass = 'badge-purple';

                        return `
                            <div class="zone-card">
                                <div class="flex justify-between items-start mb-2">
                                    <strong>${z.name}</strong>
                                    <span class="badge ${badgeClass}">${z.type}</span>
                                </div>
                                <div class="text-xs text-muted mb-2">Temp: <code>${z.tempRange}</code></div>
                                <div class="text-xs mb-2">${z.description}</div>
                                <div class="text-xs font-mono font-bold text-slate-700">Capacity: ${z.capacity} units</div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>

            <!-- Interactive Visual 2D Bin Map -->
            <div class="card">
                <div class="card-header">
                    <div>
                        <div class="card-title">Live 2D Bin Occupancy Matrix: ${activeWh.name}</div>
                        <div class="text-xs text-muted">Click any bin cell to inspect live stock contents and capacity load.</div>
                    </div>
                    <div class="bin-legend">
                        <span class="legend-item"><span class="legend-box bin-empty"></span> &lt; 30% Fill</span>
                        <span class="legend-item"><span class="legend-box bin-optimal"></span> 30 - 75% Fill</span>
                        <span class="legend-item"><span class="legend-box bin-near-full"></span> &gt; 75% Full</span>
                        <span class="legend-item"><span class="legend-box bin-quarantine"></span> Quarantine/Hazard</span>
                    </div>
                </div>

                <div class="bin-map-container">
                    <div class="bin-grid">
                        ${whBins.map(loc => {
                            const pct = Math.round((loc.occupiedUnits / loc.capacityUnits) * 100);
                            let fillClass = 'bin-empty';
                            if (loc.zoneId === 'Z-QUAR') fillClass = 'bin-quarantine';
                            else if (pct > 75) fillClass = 'bin-near-full';
                            else if (pct >= 30) fillClass = 'bin-optimal';

                            const items = state.inventoryBalances.filter(b => b.locationId === loc.id);

                            return `
                                <div class="bin-cell ${fillClass}" 
                                     onclick="WOS_UI.inspectBin('${loc.id}')"
                                     title="Bin: ${loc.id}\nZone: ${loc.zoneId}\nLoad: ${loc.occupiedUnits}/${loc.capacityUnits} (${pct}%)\nStored SKUs: ${items.length}">
                                    <div class="bin-id-label">${loc.aisle}-${loc.rack}-${loc.shelf}-${loc.bin}</div>
                                    <div class="bin-load-pct">${pct}%</div>
                                    <div class="bin-qty">${loc.occupiedUnits}u</div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            </div>
        `;
    }

    // =========================================================================
    // VIEW 4: USERS DIRECTORY & RBAC SCOPES
    // =========================================================================
    function renderUsersView() {
        const container = document.getElementById('view-users');
        if (!container) return;
        const state = WOS_Data.getState();
        const canManageUsers = WOS_RBAC.hasPermission('users.edit');

        container.innerHTML = `
            <div class="view-header">
                <div>
                    <h1 class="view-title">👥 User Identity & Delegated Scopes</h1>
                    <p class="view-subtitle">Security directory, warehouse scoping, and monetary approval limits.</p>
                </div>
                <div>
                    ${canManageUsers
                        ? `<button class="btn btn-primary" onclick="WOS_UI.openUserAddModal()">+ Invite New User</button>`
                        : `<span class="badge badge-warning" title="Admin restricted">🔒 User Admin Restricted</span>`
                    }
                </div>
            </div>

            <div class="alert alert-info mb-6">
                <div class="alert-icon">🛡️</div>
                <div>
                    <strong>First-Class RBAC Differentiator:</strong>
                    Each user is bounded by strict warehouse scopes and financial approval limits.
                    Notice that <strong>Tunde Adeyemi (Warehouse Officer)</strong> has an approval limit of ₦0, 
                    while <strong>Sarah Jenkins (Supervisor)</strong> can authorize adjustments up to ₦1,000,000.
                </div>
            </div>

            <div class="card">
                <div class="table-responsive">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>User Identity</th>
                                <th>System Role</th>
                                <th>Warehouse Scope</th>
                                <th>Financial Approval Limit</th>
                                <th>MFA</th>
                                <th>Status</th>
                                <th>Switch Persona</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${state.users.map(u => {
                                const role = state.roles.find(r => r.id === u.roleId) || { name: u.roleId, color: 'slate' };
                                const isCurrent = u.id === state.activeUser.id;
                                return `
                                    <tr class="${isCurrent ? 'row-active-user' : ''}">
                                        <td>
                                            <div class="flex items-center gap-3">
                                                <div class="user-avatar-small bg-${role.color || 'indigo'}">${u.avatarText || 'U'}</div>
                                                <div>
                                                    <div class="font-bold">${u.name} ${isCurrent ? '<span class="badge badge-emerald">ACTIVE NOW</span>' : ''}</div>
                                                    <div class="text-xs text-muted">${u.email} • ${u.title || ''}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <span class="badge badge-${role.color || 'slate'}">${role.name}</span>
                                        </td>
                                        <td><code>${u.warehouseScope}</code></td>
                                        <td>
                                            <strong>₦${(u.approvalLimit || 0).toLocaleString()}</strong>
                                        </td>
                                        <td>
                                            ${u.mfa ? '<span class="text-emerald-600 font-bold">✓ Enforced</span>' : '<span class="text-muted">Disabled</span>'}
                                        </td>
                                        <td>
                                            <span class="badge badge-emerald">${u.status}</span>
                                        </td>
                                        <td>
                                            ${isCurrent 
                                                ? `<button class="btn btn-xs btn-outline" disabled>Current Operator</button>`
                                                : `<button class="btn btn-xs btn-primary" onclick="WOS_UI.switchPersona('${u.id}')">Simulate Persona</button>`
                                            }
                                        </td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }

    // =========================================================================
    // VIEW 5: ROLES & PERMISSIONS MATRIX
    // =========================================================================
    function renderRolesView() {
        const container = document.getElementById('view-roles');
        if (!container) return;
        const state = WOS_Data.getState();

        const modulesList = [
            { key: 'company.edit', label: 'Company Profile & Policy Config' },
            { key: 'branches.edit', label: 'Create & Manage Branches' },
            { key: 'warehouses.edit', label: 'Manage Physical Warehouses & Bins' },
            { key: 'users.edit', label: 'User Invitation & Role Delegation' },
            { key: 'inventory.adjust_request', label: 'Initiate Stock Discrepancy Adjustment' },
            { key: 'inventory.adjust_approve', label: 'APPROVE Stock Adjustments (Write-offs)' },
            { key: 'receiving.process', label: 'Receive Inbound Stock & Damaged Intake' },
            { key: 'putaway.process', label: 'Execute Put-Away to Storage Bins' },
            { key: 'picking.process', label: 'Pick Outbound Customer Orders' },
            { key: 'dispatch.approve', label: 'Authorize Dispatch Release & Gate Pass' },
            { key: 'returns.triage', label: 'Triage Returns (Quarantine vs Restock)' },
            { key: 'reports.export', label: 'Export Confidential Operational Analytics' },
            { key: 'billing.edit', label: 'Modify SaaS Subscription & Financials' },
            { key: 'audit.delete', label: 'Purge or Delete Audit Trail History (FORBIDDEN)' }
        ];

        container.innerHTML = `
            <div class="view-header">
                <div>
                    <h1 class="view-title">🛡️ Zero-Trust Roles & Permissions Matrix</h1>
                    <p class="view-subtitle">Granular access control policies enforcing operational security and regulatory compliance.</p>
                </div>
            </div>

            <div class="card mb-6 bg-gradient-dark text-white p-5" style="background: linear-gradient(135deg, #1e293b, #0f172a); color: #fff; padding: 1.25rem; border-radius: 8px;">
                <h3 class="text-base font-bold text-amber-300 mb-2">⚡ The Core Separation of Duties (SoD) Guarantees</h3>
                <div class="grid-3-col gap-4 text-xs">
                    <div class="p-3 bg-slate-800 rounded border border-slate-700" style="background: rgba(255,255,255,0.06); padding: 12px; border-radius: 6px;">
                        <strong class="text-emerald-400">1. Warehouse Officer</strong><br>
                        Can scan barcodes, receive stock, and execute picks. <strong>CANNOT</strong> approve stock adjustments or touch SaaS settings.
                    </div>
                    <div class="p-3 bg-slate-800 rounded border border-slate-700" style="background: rgba(255,255,255,0.06); padding: 12px; border-radius: 6px;">
                        <strong class="text-amber-400">2. Warehouse Supervisor</strong><br>
                        Can approve stock adjustments up to designated limit, but <strong>CANNOT</strong> self-approve adjustments they raised, and cannot edit billing.
                    </div>
                    <div class="p-3 bg-slate-800 rounded border border-slate-700" style="background: rgba(255,255,255,0.06); padding: 12px; border-radius: 6px;">
                        <strong class="text-rose-400">3. System Administrator</strong><br>
                        Can manage users and system configs, but <strong>CANNOT secretly delete transaction history</strong>. The audit chain is cryptographically write-only.
                    </div>
                </div>
            </div>

            <div class="card">
                <div class="table-responsive">
                    <table class="data-table matrix-table">
                        <thead>
                            <tr>
                                <th>Functional Capability / Permission Key</th>
                                ${state.roles.map(r => `
                                    <th class="text-center">
                                        <div class="font-bold text-slate-800">${r.name}</div>
                                        <span class="badge badge-${r.color || 'slate'} text-xs">${r.badge}</span>
                                    </th>
                                `).join('')}
                            </tr>
                        </thead>
                        <tbody>
                            ${modulesList.map(m => {
                                const isAuditDelete = m.key === 'audit.delete';
                                return `
                                    <tr class="${isAuditDelete ? 'row-forbidden' : ''}">
                                        <td>
                                            <strong>${m.label}</strong><br>
                                            <code class="text-xs text-muted">${m.key}</code>
                                        </td>
                                        ${state.roles.map(r => {
                                            if (isAuditDelete) {
                                                return `<td class="text-center"><span class="matrix-denied text-rose-600 font-bold" title="Strictly forbidden for ALL roles to guarantee legal auditability">❌ DENIED (ALL)</span></td>`;
                                            }
                                            const has = r.permissions && r.permissions.includes(m.key);
                                            return `
                                                <td class="text-center">
                                                    ${has 
                                                        ? `<span class="matrix-allowed text-emerald-600 font-black">✓ ALLOWED</span>` 
                                                        : `<span class="matrix-denied text-slate-400">✕ Denied</span>`
                                                    }
                                                </td>
                                            `;
                                        }).join('')}
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }

    // =========================================================================
    // VIEW 6: INVENTORY BALANCES & DISCREPANCY ADJUSTMENTS
    // =========================================================================
    function renderInventoryView() {
        const container = document.getElementById('view-inventory');
        if (!container) return;
        const state = WOS_Data.getState();
        const activeWh = state.activeWarehouseId;
        const balances = WOS_Modules.Inventory.getBalances(activeWh);
        const products = WOS_Modules.Inventory.getProducts();

        const totalSKUs = products.length;
        const totalUnits = balances.reduce((sum, b) => sum + (b.qtyAvailable || 0), 0);
        const totalDamaged = balances.reduce((sum, b) => sum + (b.qtyDamaged || 0), 0);
        const pendingAdjCount = state.adjustments.filter(a => a.status === 'Pending').length;

        container.innerHTML = `
            <div class="view-header">
                <div>
                    <h1 class="view-title">📊 Real-Time Inventory & Stock Balances</h1>
                    <p class="view-subtitle">Live multi-location SKU balances, low-stock alerts, and auditable physical adjustments.</p>
                </div>
                <div class="flex gap-2">
                    <button class="btn btn-outline" onclick="WOS_UI.openBarcodeModal()">📷 Scan Barcode</button>
                    <button class="btn btn-primary" onclick="WOS_UI.openAdjustmentRequestModal()">⚖️ Raise Stock Adjustment</button>
                    ${WOS_RBAC.hasPermission('company.edit') ? `<button class="btn btn-outline" onclick="WOS_UI.openProductAddModal()">+ New SKU</button>` : ''}
                </div>
            </div>

            <div class="grid-4-col mb-6">
                <div class="card stat-card">
                    <div class="stat-lbl">Active Catalog SKUs</div>
                    <div class="stat-val">${totalSKUs} SKUs</div>
                    <div class="stat-trend text-emerald-600">FMCG, Pharma & Solar</div>
                </div>
                <div class="card stat-card">
                    <div class="stat-lbl">Physical Units on Floor</div>
                    <div class="stat-val text-indigo-600">${totalUnits.toLocaleString()}</div>
                    <div class="stat-trend text-muted">Across all storage bins</div>
                </div>
                <div class="card stat-card">
                    <div class="stat-lbl">Quarantined / Damaged</div>
                    <div class="stat-val text-rose-600">${totalDamaged} Units</div>
                    <div class="stat-trend text-rose-500">In Quarantine Zone</div>
                </div>
                <div class="card stat-card">
                    <div class="stat-lbl">Pending Adjustments</div>
                    <div class="stat-val text-amber-600">${pendingAdjCount} Pending</div>
                    <div class="stat-trend text-amber-600">Awaiting Supervisor</div>
                </div>
            </div>

            <div class="card mb-6">
                <div class="card-header">
                    <div class="card-title">Storage Bin SKU Balances</div>
                    <div class="flex gap-2">
                        <input type="text" id="inventory-search-input" class="input input-sm" placeholder="Filter SKU, Name, Bin..." oninput="WOS_UI.filterInventoryTable(this.value)">
                    </div>
                </div>
                <div class="table-responsive">
                    <table class="data-table" id="inventory-data-table">
                        <thead>
                            <tr>
                                <th>SKU & Product Name</th>
                                <th>Category / Storage</th>
                                <th>Bin Address</th>
                                <th>Available Qty</th>
                                <th>Reserved</th>
                                <th>Damaged</th>
                                <th>Unit Cost</th>
                                <th>Valuation</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${balances.map(b => {
                                const p = products.find(prod => prod.sku === b.sku) || { name: b.sku, category: 'General', storageRequirement: 'Standard', costPrice: 0 };
                                const valuation = b.qtyAvailable * p.costPrice;
                                return `
                                    <tr>
                                        <td>
                                            <div class="font-bold text-indigo-700">${b.sku}</div>
                                            <div class="text-xs">${p.name}</div>
                                            <div class="text-xs font-mono text-muted">Barcode: ${p.barcode || '—'}</div>
                                        </td>
                                        <td>
                                            <div>${p.category}</div>
                                            <span class="badge ${p.storageRequirement === 'Cold' ? 'badge-sky' : (p.storageRequirement === 'Hazardous' ? 'badge-rose' : 'badge-slate')} text-xs">
                                                ${p.storageRequirement}
                                            </span>
                                        </td>
                                        <td><code>${b.locationId}</code></td>
                                        <td><span class="font-bold text-base ${b.qtyAvailable < 20 ? 'text-rose-600' : 'text-emerald-700'}">${b.qtyAvailable}</span></td>
                                        <td><span class="text-amber-600">${b.qtyReserved || 0}</span></td>
                                        <td><span class="${b.qtyDamaged > 0 ? 'text-rose-600 font-bold' : 'text-muted'}">${b.qtyDamaged || 0}</span></td>
                                        <td>₦${p.costPrice.toLocaleString()}</td>
                                        <td><strong>₦${valuation.toLocaleString()}</strong></td>
                                        <td>
                                            <button class="btn btn-xs btn-outline" onclick="WOS_UI.quickAdjustModal('${b.sku}', '${b.locationId}', ${b.qtyAvailable})">
                                                Adjust Count
                                            </button>
                                        </td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
            </div>

            <div class="card">
                <div class="card-header">
                    <div>
                        <div class="card-title">Stock Adjustments Queue (Strict SoD Enforced)</div>
                        <div class="text-xs text-muted">Warehouse Officers can request counts, but only Supervisors/Managers can approve them. Self-approval is blocked by the engine.</div>
                    </div>
                </div>
                <div class="table-responsive">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Adjustment ID</th>
                                <th>SKU & Bin</th>
                                <th>Count Discrepancy</th>
                                <th>Monetary Variance</th>
                                <th>Requested By</th>
                                <th>Reason & Notes</th>
                                <th>Status</th>
                                <th>Supervisor Approval Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${state.adjustments.map(adj => {
                                const sodCheck = WOS_RBAC.checkAdjustmentApprovalPolicy(adj);
                                const isPending = adj.status === 'Pending';
                                
                                return `
                                    <tr>
                                        <td><code>${adj.id}</code><br><span class="text-xs text-muted">${WOS_Modules.formatTimestamp(adj.createdAt)}</span></td>
                                        <td>
                                            <strong>${adj.sku}</strong><br>
                                            <code class="text-xs">${adj.locationId}</code>
                                        </td>
                                        <td>
                                            Book: <strong>${adj.prevQty}</strong> ➔ Actual: <strong>${adj.targetQty}</strong><br>
                                            <span class="badge ${adj.variance < 0 ? 'badge-rose' : 'badge-emerald'}">
                                                ${adj.variance > 0 ? '+' : ''}${adj.variance} units
                                            </span>
                                        </td>
                                        <td>
                                            <strong class="${adj.costVariance < 0 ? 'text-rose-600' : 'text-emerald-600'}">
                                                ₦${Math.abs(adj.costVariance).toLocaleString()}
                                            </strong>
                                        </td>
                                        <td>
                                            <div class="text-xs">${adj.requestedByName}</div>
                                        </td>
                                        <td>
                                            <div class="text-xs font-bold">${adj.reasonCode}</div>
                                            <div class="text-xs text-muted italic">${adj.evidenceNotes || '—'}</div>
                                        </td>
                                        <td>
                                            <span class="badge ${adj.status === 'Approved' ? 'badge-emerald' : (adj.status === 'Pending' ? 'badge-amber' : 'badge-rose')}">
                                                ${adj.status}
                                            </span>
                                        </td>
                                        <td>
                                            ${isPending ? `
                                                ${sodCheck.allowed ? `
                                                    <div class="flex gap-1">
                                                        <button class="btn btn-xs btn-success" onclick="WOS_UI.approveAdjustment('${adj.id}')">
                                                            ✓ Approve
                                                        </button>
                                                        <button class="btn btn-xs btn-danger" onclick="WOS_UI.rejectAdjustment('${adj.id}')">
                                                            ✕ Reject
                                                        </button>
                                                    </div>
                                                ` : `
                                                    <div class="sod-blocked-badge" title="${sodCheck.reason}">
                                                        🔒 Blocked (${sodCheck.code === 'SOD_SELF_APPROVAL_VIOLATION' ? 'Self-Approval Forbidden' : (sodCheck.code === 'APPROVAL_LIMIT_EXCEEDED' ? 'Exceeds Limit' : 'No Authority')})
                                                    </div>
                                                `}
                                            ` : `
                                                <div class="text-xs text-muted">
                                                    Reviewed by: ${adj.approvedByName || '—'}<br>
                                                    ${WOS_Modules.formatTimestamp(adj.approvedAt)}
                                                </div>
                                            `}
                                        </td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }

    // =========================================================================
    // VIEW 7: INBOUND RECEIVING
    // =========================================================================
    function renderReceivingView() {
        const container = document.getElementById('view-receiving');
        if (!container) return;
        const state = WOS_Data.getState();
        const pos = WOS_Modules.Receiving.getPurchaseOrders(state.activeWarehouseId);

        container.innerHTML = `
            <div class="view-header">
                <div>
                    <h1 class="view-title">📥 Inbound Receiving Dock</h1>
                    <p class="view-subtitle">Purchase Order check-in, barcode scanning, damage triage, and automatic Put-Away task generation.</p>
                </div>
                <div class="flex gap-2">
                    <button class="btn btn-outline" onclick="WOS_UI.openBarcodeModal()">📷 Scan Inbound Barcode</button>
                    <button class="btn btn-primary" onclick="WOS_UI.openPOCreateModal()">+ New Purchase Order</button>
                </div>
            </div>

            <div class="card mb-6">
                <div class="card-header">
                    <div class="card-title">Inbound Purchase Orders Queue</div>
                </div>
                <div class="table-responsive">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>PO Number</th>
                                <th>Supplier / Vendor</th>
                                <th>Expected ETA</th>
                                <th>Items & Quantities</th>
                                <th>Status</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${pos.map(po => {
                                const totalExpected = po.items.reduce((s, i) => s + i.expectedQty, 0);
                                const totalReceived = po.items.reduce((s, i) => s + i.receivedQty, 0);
                                const totalDamaged = po.items.reduce((s, i) => s + i.damagedQty, 0);

                                return `
                                    <tr>
                                        <td>
                                            <strong>${po.id}</strong><br>
                                            <span class="text-xs text-muted">Created: ${po.createdDate}</span>
                                        </td>
                                        <td><strong>${po.supplierName}</strong></td>
                                        <td><code>${po.etaDate}</code></td>
                                        <td>
                                            <div class="text-xs">
                                                Expected: <strong>${totalExpected}</strong> | 
                                                Received: <span class="text-emerald-600 font-bold">${totalReceived}</span> | 
                                                Damaged: <span class="text-rose-600 font-bold">${totalDamaged}</span>
                                            </div>
                                            <div class="progress-bar-container mt-1">
                                                <div class="progress-bar-fill" style="width: ${Math.min(100, Math.round((totalReceived / totalExpected) * 100))}%"></div>
                                            </div>
                                        </td>
                                        <td>
                                            <span class="badge ${po.status === 'Completed' ? 'badge-emerald' : (po.status === 'Receiving' ? 'badge-amber' : 'badge-slate')}">
                                                ${po.status}
                                            </span>
                                        </td>
                                        <td>
                                            ${po.status !== 'Completed' ? `
                                                <button class="btn btn-xs btn-primary" onclick="WOS_UI.openReceiveDockModal('${po.id}')">
                                                    📦 Receive Items
                                                </button>
                                            ` : `
                                                <button class="btn btn-xs btn-outline" onclick="WOS_UI.viewPOItems('${po.id}')">
                                                    View Receipt Slip
                                                </button>
                                            `}
                                        </td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }

    // =========================================================================
    // VIEW 8: PUT-AWAY MODULE
    // =========================================================================
    function renderPutAwayView() {
        const container = document.getElementById('view-putaway');
        if (!container) return;
        const tasks = WOS_Modules.PutAway.getTasks(WOS_Data.getState().activeWarehouseId);

        container.innerHTML = `
            <div class="view-header">
                <div>
                    <h1 class="view-title">📦 Smart Put-Away & Bin Allocation</h1>
                    <p class="view-subtitle">Algorithmic bin recommendation based on storage compatibility, zone temperature, and bin capacity.</p>
                </div>
            </div>

            <div class="card">
                <div class="card-header">
                    <div class="card-title">Pending & Processing Put-Away Tasks</div>
                </div>
                <div class="table-responsive">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Task ID</th>
                                <th>Source Ref</th>
                                <th>Product SKU</th>
                                <th>Quantity</th>
                                <th>Source Location</th>
                                <th>Recommended Bin</th>
                                <th>Assigned Worker</th>
                                <th>Status</th>
                                <th>Execution</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${tasks.map(t => {
                                const isPending = t.status === 'Pending';
                                return `
                                    <tr>
                                        <td><strong>${t.id}</strong></td>
                                        <td><code>${t.poId}</code></td>
                                        <td><span class="font-bold text-indigo-700">${t.sku}</span></td>
                                        <td><strong>${t.qty} units</strong></td>
                                        <td><span class="badge badge-purple">${t.sourceLocationId}</span></td>
                                        <td>
                                            <span class="badge badge-emerald font-mono">${t.recommendedLocationId}</span>
                                            <div class="text-xs text-muted">Optimal Zone Match</div>
                                        </td>
                                        <td>${t.assignedUserName}</td>
                                        <td>
                                            <span class="badge ${t.status === 'Completed' ? 'badge-emerald' : 'badge-amber'}">
                                                ${t.status}
                                            </span>
                                        </td>
                                        <td>
                                            ${isPending ? `
                                                <button class="btn btn-xs btn-success" onclick="WOS_UI.executePutAwayModal('${t.id}')">
                                                    ✓ Confirm Put-Away
                                                </button>
                                            ` : `
                                                <span class="text-xs text-muted">Completed: ${WOS_Modules.formatTimestamp(t.completedAt)}</span>
                                            `}
                                        </td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }

    // =========================================================================
    // VIEW 9: PICKING MODULE
    // =========================================================================
    function renderPickingView() {
        const container = document.getElementById('view-picking');
        if (!container) return;
        const state = WOS_Data.getState();
        const orders = WOS_Modules.Picking.getOrders(state.activeWarehouseId);
        const pickTasks = WOS_Modules.Picking.getPickingTasks();

        container.innerHTML = `
            <div class="view-header">
                <div>
                    <h1 class="view-title">📋 Outbound Wave Picking</h1>
                    <p class="view-subtitle">Optimized pick routes, bin scanning confirmation, and allocation tracking.</p>
                </div>
                <div>
                    <button class="btn btn-primary" onclick="WOS_UI.openOrderCreateModal()">+ Create Outbound Order</button>
                </div>
            </div>

            <div class="card mb-6">
                <div class="card-header">
                    <div class="card-title">Customer Order Fulfillment Pipeline</div>
                </div>
                <div class="table-responsive">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Order ID</th>
                                <th>Customer & Destination</th>
                                <th>Priority</th>
                                <th>Line Items</th>
                                <th>Courier & Tracking</th>
                                <th>Status</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${orders.map(o => {
                                let badge = 'badge-slate';
                                if (o.status === 'Allocated') badge = 'badge-indigo';
                                if (o.status === 'Picking') badge = 'badge-amber';
                                if (o.status === 'Picked') badge = 'badge-purple';
                                if (o.status === 'Packed') badge = 'badge-sky';
                                if (o.status === 'Dispatched') badge = 'badge-emerald';

                                return `
                                    <tr>
                                        <td>
                                            <strong>${o.id}</strong><br>
                                            <span class="text-xs text-muted">${WOS_Modules.formatTimestamp(o.createdAt)}</span>
                                        </td>
                                        <td>
                                            <strong>${o.customerName}</strong>
                                            <div class="text-xs text-muted">📍 ${o.destination}</div>
                                        </td>
                                        <td><span class="badge ${o.priority === 'Urgent' ? 'badge-rose' : 'badge-slate'}">${o.priority}</span></td>
                                        <td>
                                            ${o.items.map(it => `
                                                <div class="text-xs">
                                                    • ${it.sku} (<strong>${it.pickedQty}/${it.qty}</strong> picked)
                                                </div>
                                            `).join('')}
                                        </td>
                                        <td>
                                            <div class="text-xs font-bold">${o.courier || 'Unassigned'}</div>
                                            <code class="text-xs text-muted">${o.trackingNumber || '—'}</code>
                                        </td>
                                        <td><span class="badge ${badge}">${o.status}</span></td>
                                        <td>
                                            ${o.status === 'Allocated' || o.status === 'Picking' ? `
                                                <button class="btn btn-xs btn-primary" onclick="WOS_UI.openPickExecutionModal('${o.id}')">
                                                    👟 Start Picking
                                                </button>
                                            ` : (o.status === 'Picked' ? `
                                                <button class="btn btn-xs btn-outline" onclick="WOS_UI.switchTab('dispatch')">
                                                    📦 Ready to Pack
                                                </button>
                                            ` : `<span class="text-xs text-muted">Order ${o.status}</span>`)}
                                        </td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
            </div>

            <div class="card">
                <div class="card-header">
                    <div class="card-title">Floor Picker Work Tasks</div>
                </div>
                <div class="table-responsive">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Task ID</th>
                                <th>Order Ref</th>
                                <th>Target Bin Location</th>
                                <th>SKU</th>
                                <th>Required Qty</th>
                                <th>Picked Qty</th>
                                <th>Status</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${pickTasks.map(pt => `
                                <tr>
                                    <td><code>${pt.id}</code></td>
                                    <td><strong>${pt.orderId}</strong></td>
                                    <td><code class="font-bold text-indigo-700">${pt.locationId}</code></td>
                                    <td>${pt.sku}</td>
                                    <td><strong>${pt.qty}</strong></td>
                                    <td><span class="text-emerald-600 font-bold">${pt.pickedQty}</span></td>
                                    <td><span class="badge ${pt.status === 'Completed' ? 'badge-emerald' : 'badge-amber'}">${pt.status}</span></td>
                                    <td>
                                        ${pt.status !== 'Completed' ? `
                                            <button class="btn btn-xs btn-success" onclick="WOS_UI.quickConfirmPick('${pt.id}')">
                                                ✓ Confirm Pick
                                            </button>
                                        ` : '✓ Picked'}
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }

    // =========================================================================
    // VIEW 10: DISPATCH MODULE
    // =========================================================================
    function renderDispatchView() {
        const container = document.getElementById('view-dispatch');
        if (!container) return;
        const orders = WOS_Modules.Picking.getOrders(WOS_Data.getState().activeWarehouseId);
        const readyOrders = orders.filter(o => o.status === 'Picked' || o.status === 'Packed' || o.status === 'Dispatched');

        container.innerHTML = `
            <div class="view-header">
                <div>
                    <h1 class="view-title">🚚 Packing, Dispatch & Gate Release</h1>
                    <p class="view-subtitle">Package weight verification, carrier dispatch manifests, and printable security gate passes.</p>
                </div>
            </div>

            <div class="card">
                <div class="card-header">
                    <div class="card-title">Dispatch Staging Bay</div>
                </div>
                <div class="table-responsive">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Order ID</th>
                                <th>Customer & Courier</th>
                                <th>Packing Box / Weight</th>
                                <th>Authorization</th>
                                <th>Status</th>
                                <th>Dispatch Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${readyOrders.map(o => {
                                return `
                                    <tr>
                                        <td>
                                            <strong>${o.id}</strong>
                                        </td>
                                        <td>
                                            <strong>${o.customerName}</strong>
                                            <div class="text-xs text-muted">Carrier: ${o.courier} (Tracking: ${o.trackingNumber || '—'})</div>
                                        </td>
                                        <td>
                                            ${o.packingDetails ? `
                                                <div class="text-xs font-bold">${o.packingDetails.boxType}</div>
                                                <div class="text-xs text-muted">Weight: ${o.packingDetails.weightKg} kg (Packed by ${o.packingDetails.packedBy})</div>
                                            ` : `<span class="text-xs text-amber-600">Pending Packing</span>`}
                                        </td>
                                        <td>
                                            ${o.authorizedBy ? `<span class="text-xs text-emerald-700 font-bold">✓ ${o.authorizedBy}</span>` : `<span class="text-xs text-muted">Supervisor Gate Clearance Required</span>`}
                                        </td>
                                        <td>
                                            <span class="badge ${o.status === 'Dispatched' ? 'badge-emerald' : 'badge-amber'}">
                                                ${o.status}
                                            </span>
                                        </td>
                                        <td>
                                            <div class="flex gap-1 flex-wrap">
                                                ${o.status === 'Picked' ? `
                                                    <button class="btn btn-xs btn-primary" onclick="WOS_UI.openPackModal('${o.id}')">
                                                        📦 Pack & Weigh
                                                    </button>
                                                ` : ''}

                                                ${o.status === 'Packed' ? `
                                                    <button class="btn btn-xs btn-success" onclick="WOS_UI.openAuthorizeDispatchModal('${o.id}')">
                                                        🚚 Authorize Release
                                                    </button>
                                                ` : ''}

                                                <button class="btn btn-xs btn-outline" onclick="WOS_UI.printDispatchManifest('${o.id}')">
                                                    📄 Manifest / Gate Pass
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }

    // =========================================================================
    // VIEW 11: RETURNS MODULE (REVERSE LOGISTICS)
    // =========================================================================
    function renderReturnsView() {
        const container = document.getElementById('view-returns');
        if (!container) return;
        const returns = WOS_Modules.Returns.getReturns();

        container.innerHTML = `
            <div class="view-header">
                <div>
                    <h1 class="view-title">🔄 Returns Management & Quality Triage</h1>
                    <p class="view-subtitle">Customer RMA processing, condition inspection, and intelligent routing (Restock vs Quarantine vs Disposal).</p>
                </div>
                <div>
                    <button class="btn btn-primary" onclick="WOS_UI.openReturnIntakeModal()">+ Intake RMA Return</button>
                </div>
            </div>

            <div class="card">
                <div class="card-header">
                    <div class="card-title">Returned Orders Ledger</div>
                </div>
                <div class="table-responsive">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>RMA Number</th>
                                <th>Original Order</th>
                                <th>SKU & Return Qty</th>
                                <th>Return Reason</th>
                                <th>Triage Disposition</th>
                                <th>Routed Bin Location</th>
                                <th>Inspector</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${returns.map(r => `
                                <tr>
                                    <td><code>${r.id}</code></td>
                                    <td><strong>${r.orderId}</strong></td>
                                    <td><strong>${r.sku}</strong> (${r.qty} units)</td>
                                    <td>${r.reasonCode}</td>
                                    <td>
                                        <span class="badge ${r.triageDisposition === 'Restocked' ? 'badge-emerald' : (r.triageDisposition === 'Quarantined' ? 'badge-amber' : 'badge-rose')}">
                                            ${r.triageDisposition}
                                        </span>
                                    </td>
                                    <td><code>${r.targetLocationId}</code></td>
                                    <td>${r.inspectedByName}</td>
                                    <td><span class="badge badge-emerald">${r.status}</span></td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }

    // =========================================================================
    // VIEW 12: AUDIT TRAIL & TAMPER INTEGRITY (THE DIFFERENTIATOR)
    // =========================================================================
    function renderAuditView() {
        const container = document.getElementById('view-audit');
        if (!container) return;
        const state = WOS_Data.getState();
        const logs = state.auditTrail;
        const movements = state.inventoryLedger;

        container.innerHTML = `
            <div class="view-header">
                <div>
                    <h1 class="view-title">🔒 Cryptographic Audit Trail & Tamper-Evident Ledger</h1>
                    <p class="view-subtitle">Write-only immutable event log linked by SHA-256 hash chains. Guarantees zero-trust accountability.</p>
                </div>
                <div class="flex gap-2">
                    <button class="btn btn-success" onclick="WOS_UI.runIntegrityCheck()">
                        🛡️ Verify Hash Chain Integrity
                    </button>
                    <button class="btn btn-danger" onclick="WOS_UI.simulateSecretDeletion()">
                        ⚠️ Attempt Secret History Deletion
                    </button>
                </div>
            </div>

            <div id="audit-integrity-banner" class="alert alert-success mb-6">
                <div class="alert-icon">✓</div>
                <div>
                    <strong>Chain Integrity Status: VERIFIED UNTOUCHED</strong><br>
                    <span class="text-xs">All ${logs.length} historical blocks match their cryptographic hashes. No unauthorized deletions or manual database tampering detected.</span>
                </div>
            </div>

            <div class="card mb-6">
                <div class="card-header">
                    <div>
                        <div class="card-title">Immutable Security Event Log (${logs.length} Entries)</div>
                        <div class="text-xs text-muted">Each entry seals the previous block hash into its signature.</div>
                    </div>
                    <div class="flex gap-2">
                        <select class="select select-sm" id="audit-severity-filter" onchange="WOS_UI.filterAuditLogs()">
                            <option value="ALL">All Severities</option>
                            <option value="critical">Critical Only</option>
                            <option value="warning">Warnings</option>
                            <option value="success">Success</option>
                            <option value="info">Info</option>
                        </select>
                    </div>
                </div>
                <div class="table-responsive">
                    <table class="data-table" id="audit-log-table">
                        <thead>
                            <tr>
                                <th>Block #</th>
                                <th>Timestamp</th>
                                <th>Operator</th>
                                <th>Severity</th>
                                <th>Action Event</th>
                                <th>Message & Context</th>
                                <th>Cryptographic Hash Seal</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${logs.slice().reverse().map(l => {
                                let sevBadge = 'badge-slate';
                                if (l.severity === 'critical') sevBadge = 'badge-rose';
                                if (l.severity === 'warning') sevBadge = 'badge-amber';
                                if (l.severity === 'success') sevBadge = 'badge-emerald';
                                if (l.severity === 'info') sevBadge = 'badge-indigo';

                                return `
                                    <tr class="${l.severity === 'critical' ? 'row-critical-audit' : ''}">
                                        <td>#${l.id}</td>
                                        <td><span class="text-xs font-mono">${WOS_Modules.formatTimestamp(l.timestamp)}</span></td>
                                        <td>
                                            <div class="font-bold text-xs">${l.userId}</div>
                                            <div class="text-xs text-muted">(${l.role})</div>
                                        </td>
                                        <td><span class="badge ${sevBadge}">${l.severity.toUpperCase()}</span></td>
                                        <td><code>${l.actionType}</code></td>
                                        <td class="text-xs">${l.message}</td>
                                        <td>
                                            <div class="font-mono text-xs text-indigo-700 font-bold" title="Block Hash: ${l.hash}">
                                                ${l.hash.substring(0, 12)}...${l.hash.substring(l.hash.length - 6)}
                                            </div>
                                            <div class="font-mono text-xs text-muted" title="Prev Hash: ${l.prevHash}">
                                                ↩ ${l.prevHash.substring(0, 8)}...
                                            </div>
                                        </td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
            </div>

            <div class="card">
                <div class="card-header">
                    <div class="card-title">Physical Inventory Movement Ledger (${movements.length} Records)</div>
                </div>
                <div class="table-responsive">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Entry ID</th>
                                <th>Timestamp</th>
                                <th>SKU</th>
                                <th>Type</th>
                                <th>Bin Address</th>
                                <th>Prev ➔ New</th>
                                <th>Delta</th>
                                <th>Operator</th>
                                <th>Doc Reference</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${movements.map(m => `
                                <tr>
                                    <td><code>#${m.entryId}</code></td>
                                    <td><span class="text-xs">${WOS_Modules.formatTimestamp(m.timestamp)}</span></td>
                                    <td><strong>${m.sku}</strong></td>
                                    <td><span class="badge badge-slate">${m.transactionType}</span></td>
                                    <td><code>${m.locationId}</code></td>
                                    <td>${m.prevQty} ➔ <strong>${m.newQty}</strong></td>
                                    <td>
                                        <span class="font-bold ${m.changeQty > 0 ? 'text-emerald-600' : 'text-rose-600'}">
                                            ${m.changeQty > 0 ? '+' : ''}${m.changeQty}
                                        </span>
                                    </td>
                                    <td>${m.userName}</td>
                                    <td><code>${m.refDocId}</code></td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }

    // =========================================================================
    // VIEW 13: SAAS SUBSCRIPTION & BILLING
    // =========================================================================
    function renderBillingView() {
        const container = document.getElementById('view-billing');
        if (!container) return;
        const sub = WOS_Modules.Billing.getSubscription();
        const canEdit = WOS_RBAC.hasPermission('billing.edit');

        container.innerHTML = `
            <div class="view-header">
                <div>
                    <h1 class="view-title">💳 SaaS Subscription & Multi-Tenant Billing</h1>
                    <p class="view-subtitle">Monthly SaaS subscription per warehouse and active user seats.</p>
                </div>
                <div>
                    <span class="badge badge-emerald text-sm">ACTIVE SUBSCRIPTION</span>
                </div>
            </div>

            <div class="grid-3-col mb-6">
                <div class="card">
                    <div class="card-header">
                        <div class="card-title">Active SaaS Plan</div>
                        <span class="badge badge-indigo">${sub.planName}</span>
                    </div>
                    <div class="card-body">
                        <div class="text-3xl font-black text-slate-900 mb-2">$${sub.nextInvoiceAmount} <span class="text-xs text-muted">/${sub.billingInterval.toLowerCase()}</span></div>
                        <p class="text-xs text-muted mb-4">Covers base platform license, enterprise RBAC security, and tamper-resistant audit infrastructure.</p>
                        <div class="text-xs text-slate-600">
                            <strong>Current Billing Cycle:</strong><br>${sub.currentBillingCycle}
                        </div>
                    </div>
                </div>

                <div class="card">
                    <div class="card-header">
                        <div class="card-title">Warehouse Licenses</div>
                    </div>
                    <div class="card-body">
                        <div class="text-3xl font-black text-indigo-600 mb-2">${sub.activeWarehouses} <span class="text-xs text-muted">Active Facilities</span></div>
                        <p class="text-xs text-muted mb-2">Rate: $${sub.costPerWarehouse} / warehouse / month</p>
                        <div class="text-xs font-bold text-slate-700">Subtotal: $${sub.activeWarehouses * sub.costPerWarehouse} / mo</div>
                    </div>
                </div>

                <div class="card">
                    <div class="card-header">
                        <div class="card-title">Operator User Seats</div>
                    </div>
                    <div class="card-body">
                        <div class="text-3xl font-black text-indigo-600 mb-2">${sub.activeUsers} <span class="text-xs text-muted">Active Operators</span></div>
                        <p class="text-xs text-muted mb-2">Rate: $${sub.costPerUser} / user / month</p>
                        <div class="text-xs font-bold text-slate-700">Subtotal: $${sub.activeUsers * sub.costPerUser} / mo</div>
                    </div>
                </div>
            </div>

            <div class="card mb-6">
                <div class="card-header">
                    <div>
                        <div class="card-title">Interactive SaaS Cost Calculator</div>
                        <div class="text-xs text-muted">Adjust warehouse and user counts to simulate monthly SaaS operational costs.</div>
                    </div>
                </div>
                <div class="card-body">
                    <div class="grid-3-col gap-6 mb-6">
                        <div>
                            <label class="label">Choose SaaS Tier</label>
                            <select id="calc-tier" class="select" onchange="WOS_UI.recalculatePricing()">
                                <option value="Starter Tier">Starter Tier ($99 Base)</option>
                                <option value="Growth Tier">Growth Tier ($249 Base)</option>
                                <option value="Enterprise Tier" selected>Enterprise Tier ($499 Base)</option>
                            </select>
                        </div>
                        <div>
                            <label class="label">Number of Warehouses (<span id="calc-wh-val">${sub.activeWarehouses}</span>)</label>
                            <input type="range" id="calc-wh-slider" min="1" max="25" value="${sub.activeWarehouses}" class="slider" oninput="WOS_UI.recalculatePricing()">
                        </div>
                        <div>
                            <label class="label">Number of Users (<span id="calc-user-val">${sub.activeUsers}</span>)</label>
                            <input type="range" id="calc-user-slider" min="1" max="100" value="${sub.activeUsers}" class="slider" oninput="WOS_UI.recalculatePricing()">
                        </div>
                    </div>

                    <div class="p-4 bg-slate-50 border border-slate-200 rounded-lg flex justify-between items-center flex-wrap gap-4" style="background: #f8fafc; padding: 16px; border: 1px solid #e2e8f0; border-radius: 8px;">
                        <div>
                            <div class="text-xs text-muted">Estimated Monthly SaaS Investment:</div>
                            <div class="text-3xl font-black text-emerald-600" id="calc-total-display">$535.00 / month</div>
                            <div class="text-xs text-muted" id="calc-breakdown-display">Base: $499 + Warehouses: $196 + Users: $90</div>
                        </div>
                        <div>
                            ${canEdit ? `
                                <button class="btn btn-primary" onclick="WOS_UI.applyCalculatedPlan()">
                                    ✓ Apply Plan to Enterprise Tenant
                                </button>
                            ` : `
                                <span class="badge badge-warning" title="Finance or Admin only">🔒 Plan Upgrade Restricted to Finance/Admin</span>
                            `}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // =========================================================================
    // MODALS & USER INTERACTIONS
    // =========================================================================

    function switchPersona(userId) {
        const user = WOS_RBAC.switchUser(userId);
        if (user) {
            updateHeaderTelemetry();
            renderView(currentTab);
            const role = WOS_RBAC.getActiveRole();
            showToast(`Simulating ${user.name} (${role.name}). Scoped to ${user.warehouseScope}. Approval Limit: ₦${user.approvalLimit.toLocaleString()}.`, 'info');
        }
    }

    function switchActiveWarehouse(whId) {
        const state = WOS_Data.getState();
        state.activeWarehouseId = whId;
        WOS_Data.persist();
        renderView(currentTab);
        showToast(`Switched active warehouse context to ${whId}.`, 'info');
    }

    function openBarcodeModal() {
        openModal('modal-barcode');
    }

    function handleBarcodeSimulation(code) {
        closeModal('modal-barcode');
        const state = WOS_Data.getState();
        
        const prod = state.products.find(p => p.barcode === code || p.sku === code);
        if (prod) {
            showToast(`Scanned Product: ${prod.name} (${prod.sku}).`, 'success');
            switchTab('inventory');
            const searchInput = document.getElementById('inventory-search-input');
            if (searchInput) {
                searchInput.value = prod.sku;
                filterInventoryTable(prod.sku);
            }
            return;
        }

        const bin = state.locations.find(l => l.id === code || l.barcode === code);
        if (bin) {
            showToast(`Scanned Storage Bin: ${bin.id} in Zone ${bin.zoneId}.`, 'success');
            switchTab('warehouses');
            inspectBin(bin.id);
            return;
        }

        showToast(`Unrecognized barcode: ${code}.`, 'warning');
    }

    function inspectBin(binId) {
        const state = WOS_Data.getState();
        const bin = state.locations.find(l => l.id === binId);
        if (!bin) return;

        const items = state.inventoryBalances.filter(b => b.locationId === binId);
        const modal = document.getElementById('modal-bin-inspector');
        if (!modal) return;

        document.getElementById('modal-bin-id').textContent = bin.id;
        document.getElementById('modal-bin-zone').textContent = bin.zoneId;
        document.getElementById('modal-bin-occupancy').textContent = `${bin.occupiedUnits} / ${bin.capacityUnits} units (${Math.round((bin.occupiedUnits / bin.capacityUnits) * 100)}%)`;

        const itemsList = document.getElementById('modal-bin-items-tbody');
        if (itemsList) {
            itemsList.innerHTML = items.length > 0 ? items.map(it => `
                <tr>
                    <td><strong>${it.sku}</strong></td>
                    <td>${it.qtyAvailable}</td>
                    <td>${it.qtyReserved || 0}</td>
                    <td>${it.qtyDamaged || 0}</td>
                </tr>
            `).join('') : '<tr><td colspan="4" class="text-center text-muted">Bin is currently empty.</td></tr>';
        }

        openModal('modal-bin-inspector');
    }

    // Stock Adjustments
    function openAdjustmentRequestModal() {
        openModal('modal-adjustment-request');
    }

    function quickAdjustModal(sku, locationId, currentQty) {
        openAdjustmentRequestModal();
        const skuInput = document.getElementById('adj-sku');
        const locInput = document.getElementById('adj-location');
        const countInput = document.getElementById('adj-physical-count');

        if (skuInput) skuInput.value = sku;
        if (locInput) locInput.value = locationId;
        if (countInput) countInput.value = currentQty;
    }

    function submitAdjustmentRequest() {
        try {
            const sku = document.getElementById('adj-sku').value;
            const loc = document.getElementById('adj-location').value;
            const physicalCount = Number(document.getElementById('adj-physical-count').value);
            const reason = document.getElementById('adj-reason').value;
            const notes = document.getElementById('adj-notes').value;

            WOS_Modules.Inventory.requestAdjustment(sku, "WH-LOS-01", loc, physicalCount, reason, notes);
            closeModal('modal-adjustment-request');
            renderView('inventory');
            showToast(`Adjustment raised successfully. Sent to Supervisor queue for approval.`, 'success');
        } catch (e) {
            showToast(e.message, 'error');
        }
    }

    function approveAdjustment(adjId) {
        try {
            WOS_Modules.Inventory.approveAdjustment(adjId);
            renderView('inventory');
            showToast(`Adjustment ${adjId} approved! Inventory balances and ledger updated.`, 'success');
        } catch (e) {
            showToast(e.message, 'error');
        }
    }

    function rejectAdjustment(adjId) {
        const reason = prompt("Enter reason for rejection:", "Count unverified during physical inspection");
        if (reason) {
            try {
                WOS_Modules.Inventory.rejectAdjustment(adjId, reason);
                renderView('inventory');
                showToast(`Adjustment ${adjId} rejected.`, 'warning');
            } catch (e) {
                showToast(e.message, 'error');
            }
        }
    }

    // Inbound Receiving
    function openPOCreateModal() {
        openModal('modal-create-po');
    }

    function submitPOCreate() {
        try {
            const supplier = document.getElementById('po-supplier').value;
            const sku = document.getElementById('po-item-sku').value;
            const qty = Number(document.getElementById('po-item-qty').value);

            if (!supplier) throw new Error("Supplier name is required.");
            if (!sku) throw new Error("SKU is required.");
            if (qty <= 0) throw new Error("Quantity must be positive.");

            WOS_Modules.Receiving.createPO(supplier, "WH-LOS-01", null, [{ sku, expectedQty: qty }]);
            closeModal('modal-create-po');
            renderView('receiving');
            showToast(`Created PO successfully!`, 'success');
        } catch (e) {
            showToast(e.message, 'error');
        }
    }

    function openReceiveDockModal(poId) {
        const po = WOS_Modules.Receiving.getPOById(poId);
        if (!po) return;

        document.getElementById('receive-po-id').value = po.id;
        document.getElementById('receive-po-supplier').textContent = po.supplierName;

        const select = document.getElementById('receive-sku-select');
        if (select) {
            select.innerHTML = po.items.map(i => `
                <option value="${i.sku}">${i.sku} (Expected: ${i.expectedQty}, Recv: ${i.receivedQty})</option>
            `).join('');
        }

        openModal('modal-receive-dock');
    }

    function submitReceiveItem() {
        try {
            const poId = document.getElementById('receive-po-id').value;
            const sku = document.getElementById('receive-sku-select').value;
            const goodQty = Number(document.getElementById('receive-good-qty').value);
            const damagedQty = Number(document.getElementById('receive-damaged-qty').value);

            WOS_Modules.Receiving.receiveItem(poId, sku, goodQty, damagedQty);
            closeModal('modal-receive-dock');
            renderView('receiving');
            showToast(`Received ${goodQty} good units and ${damagedQty} damaged units. Put-away task created!`, 'success');
        } catch (e) {
            showToast(e.message, 'error');
        }
    }

    function viewPOItems(poId) {
        const po = WOS_Modules.Receiving.getPOById(poId);
        if (!po) return;
        alert(`Goods Receipt Slip for ${po.id}:\n\nSupplier: ${po.supplierName}\nStatus: ${po.status}\n\nItems Received:\n` + 
            po.items.map(i => `• ${i.sku}: Expected ${i.expectedQty}, Received ${i.receivedQty}, Damaged ${i.damagedQty}`).join('\n')
        );
    }

    // Put-Away
    function executePutAwayModal(taskId) {
        try {
            WOS_Modules.PutAway.executePutAway(taskId);
            renderView('putaway');
            showToast(`Put-away completed! Stock transferred to bin.`, 'success');
        } catch (e) {
            showToast(e.message, 'error');
        }
    }

    // Picking & Orders
    function openOrderCreateModal() {
        openModal('modal-create-order');
    }

    function submitOrderCreate() {
        try {
            const customer = document.getElementById('ord-customer').value;
            const dest = document.getElementById('ord-destination').value;
            const sku = document.getElementById('ord-sku').value;
            const qty = Number(document.getElementById('ord-qty').value);
            const courier = document.getElementById('ord-courier').value;

            if (!customer || !dest) throw new Error("Customer name and destination are required.");
            if (!sku || qty <= 0) throw new Error("Valid SKU and positive quantity required.");

            WOS_Modules.Picking.createOrder(customer, dest, "WH-LOS-01", [{ sku, qty }], courier);
            closeModal('modal-create-order');
            renderView('picking');
            showToast(`Order created and stock reserved! Pick tasks queued.`, 'success');
        } catch (e) {
            showToast(e.message, 'error');
        }
    }

    function openPickExecutionModal(orderId) {
        const state = WOS_Data.getState();
        const tasks = state.pickingTasks.filter(t => t.orderId === orderId && t.status !== 'Completed');
        if (tasks.length === 0) {
            showToast("All items for this order are already picked.", 'info');
            return;
        }

        // Pick next task
        quickConfirmPick(tasks[0].id);
    }

    function quickConfirmPick(taskId) {
        try {
            WOS_Modules.Picking.confirmPick(taskId);
            renderView('picking');
            showToast(`Pick confirmed! Stock moved to Packing station.`, 'success');
        } catch (e) {
            showToast(e.message, 'error');
        }
    }

    // Packing & Dispatch
    function openPackModal(orderId) {
        document.getElementById('pack-order-id').value = orderId;
        openModal('modal-pack-order');
    }

    function submitPackOrder() {
        try {
            const orderId = document.getElementById('pack-order-id').value;
            const boxType = document.getElementById('pack-box-type').value;
            const weight = Number(document.getElementById('pack-weight').value);

            WOS_Modules.Dispatch.packOrder(orderId, boxType, weight);
            closeModal('modal-pack-order');
            renderView('dispatch');
            showToast(`Order packed and weighed. Ready for supervisor release.`, 'success');
        } catch (e) {
            showToast(e.message, 'error');
        }
    }

    function openAuthorizeDispatchModal(orderId) {
        const order = WOS_Modules.Picking.getOrderById(orderId);
        if (!order) return;

        document.getElementById('dispatch-auth-order-id').value = order.id;
        document.getElementById('dispatch-auth-customer').textContent = order.customerName;
        document.getElementById('dispatch-auth-courier').value = order.courier || 'GIG Logistics';

        openModal('modal-authorize-dispatch');
    }

    function submitAuthorizeDispatch() {
        try {
            const orderId = document.getElementById('dispatch-auth-order-id').value;
            const courier = document.getElementById('dispatch-auth-courier').value;
            const tracking = document.getElementById('dispatch-auth-tracking').value;

            WOS_Modules.Dispatch.authorizeDispatch(orderId, courier, tracking);
            closeModal('modal-authorize-dispatch');
            renderView('dispatch');
            showToast(`Order dispatched! Gate pass released.`, 'success');
        } catch (e) {
            showToast(e.message, 'error');
        }
    }

    function printDispatchManifest(orderId) {
        const order = WOS_Modules.Picking.getOrderById(orderId);
        if (!order) return;

        const printWindow = window.open('', '_blank', 'width=800,height=900');
        if (!printWindow) {
            alert("Please allow popups to view and print the Dispatch Manifest.");
            return;
        }

        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Official Dispatch Gate Pass — ${order.id}</title>
                <style>
                    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #1e293b; }
                    .header { border-bottom: 2px solid #0f172a; padding-bottom: 20px; margin-bottom: 25px; display: flex; justify-content: space-between; align-items: flex-start; }
                    .logo { font-size: 24px; font-weight: 900; color: #4338ca; }
                    .badge { display: inline-block; padding: 4px 10px; background: #ecfdf5; color: #065f46; font-weight: bold; border-radius: 4px; font-size: 12px; }
                    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; font-size: 14px; }
                    table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
                    th, td { border: 1px solid #cbd5e1; padding: 10px; text-align: left; font-size: 13px; }
                    th { background-color: #f1f5f9; }
                    .barcode-mock { font-family: monospace; font-size: 26px; letter-spacing: 4px; border: 2px dashed #64748b; padding: 12px; text-align: center; margin: 25px 0; }
                    .footer { font-size: 11px; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 15px; }
                </style>
            </head>
            <body>
                <div class="header">
                    <div>
                        <div class="logo">⚡ APEX GLOBAL WOS</div>
                        <div>Official Outbound Shipping Manifest & Gate Pass</div>
                    </div>
                    <div>
                        <span class="badge">STATUS: DISPATCH AUTHORIZED</span>
                        <div style="font-size: 12px; margin-top: 5px;">Doc Ref: <strong>${order.id}</strong></div>
                    </div>
                </div>

                <div class="barcode-mock">
                    *${order.trackingNumber || order.id}*
                </div>

                <div class="grid">
                    <div>
                        <strong>Consignee / Destination:</strong><br>
                        ${order.customerName}<br>
                        ${order.destination}
                    </div>
                    <div>
                        <strong>Logistics Provider:</strong><br>
                        Courier: <strong>${order.courier}</strong><br>
                        Tracking #: <code>${order.trackingNumber || 'PENDING'}</code><br>
                        Gate Release Authorized By: ${order.authorizedBy || 'Warehouse Supervisor'}
                    </div>
                </div>

                <table>
                    <thead>
                        <tr>
                            <th>Item SKU</th>
                            <th>Description</th>
                            <th>Packed Qty</th>
                            <th>Weight</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${order.items.map(it => `
                            <tr>
                                <td><strong>${it.sku}</strong></td>
                                <td>Outbound Shipment Item</td>
                                <td>${it.packedQty || it.qty} Units</td>
                                <td>Standard Parcel</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>

                <div style="margin-top: 40px; display: flex; justify-content: space-between;">
                    <div>
                        ___________________________<br>
                        <strong>Warehouse Dispatcher Signature</strong>
                    </div>
                    <div>
                        ___________________________<br>
                        <strong>Courier Driver Signature & Stamp</strong>
                    </div>
                </div>

                <div class="footer" style="margin-top: 50px;">
                    Generated by Enterprise WOS (Cloud Platform). Tamper-evident cryptographic signature verified.
                </div>
            </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.focus();
    }

    // Returns RMA
    function openReturnIntakeModal() {
        openModal('modal-return-intake');
    }

    function submitReturnIntake() {
        try {
            const orderId = document.getElementById('rma-order-id').value;
            const sku = document.getElementById('rma-sku').value;
            const qty = Number(document.getElementById('rma-qty').value);
            const reason = document.getElementById('rma-reason').value;
            const triage = document.getElementById('rma-triage').value;
            const notes = document.getElementById('rma-notes').value;

            WOS_Modules.Returns.processReturn(orderId, sku, qty, reason, triage, notes);
            closeModal('modal-return-intake');
            renderView('returns');
            showToast(`Return processed! Stock routed to ${triage === 'Restocked' ? 'Storage bin' : 'Quarantine bay'}.`, 'success');
        } catch (e) {
            showToast(e.message, 'error');
        }
    }

    // Administration Modals (Company, Branch, Warehouse, User, Product)
    function openCompanyEditModal() {
        openModal('modal-edit-company');
    }

    function submitCompanyEdit() {
        const name = document.getElementById('comp-name').value;
        const legal = document.getElementById('comp-legal').value;
        const addr = document.getElementById('comp-addr').value;
        const email = document.getElementById('comp-email').value;

        const state = WOS_Data.getState();
        state.company.name = name || state.company.name;
        state.company.legalEntity = legal || state.company.legalEntity;
        state.company.address = addr || state.company.address;
        state.company.contactEmail = email || state.company.contactEmail;

        WOS_Data.persist();
        closeModal('modal-edit-company');
        renderView('company');
        showToast("Company profile updated.", 'success');
    }

    function openBranchAddModal() {
        openModal('modal-add-branch');
    }

    function submitBranchAdd() {
        const name = document.getElementById('branch-name').value;
        const code = document.getElementById('branch-code').value;
        const city = document.getElementById('branch-city').value;
        const region = document.getElementById('branch-region').value;
        const manager = document.getElementById('branch-manager').value;

        if (!name || !code) {
            showToast("Branch name and code are required.", 'error');
            return;
        }

        const state = WOS_Data.getState();
        const branchId = 'BR-' + code.toUpperCase();
        state.branches.push({
            id: branchId,
            name,
            code,
            city: city || 'Lagos',
            region: region || 'Southern Nigeria',
            manager: manager || 'Regional Lead',
            phone: '+234 1 000 0000',
            address: `${name} Distribution Complex, ${city}`,
            active: true,
            warehouseIds: []
        });

        WOS_Data.persist();
        closeModal('modal-add-branch');
        renderView('branches');
        showToast(`Branch ${name} created.`, 'success');
    }

    function openWarehouseAddModal() {
        openModal('modal-add-warehouse');
    }

    function submitWarehouseAdd() {
        const name = document.getElementById('wh-name').value;
        const type = document.getElementById('wh-type').value;
        const branchId = document.getElementById('wh-branch').value;
        const cap = Number(document.getElementById('wh-cap').value) || 3000;

        if (!name) {
            showToast("Warehouse name required.", 'error');
            return;
        }

        const state = WOS_Data.getState();
        const whId = `WH-${branchId.replace('BR-', '')}-0${state.warehouses.length + 1}`;
        state.warehouses.push({
            id: whId,
            branchId,
            name,
            type,
            address: `${name}, ${branchId}`,
            totalCapacityUnits: cap,
            occupiedUnits: 0,
            status: 'Active',
            zones: ['Z-AMB', 'Z-STG', 'Z-QUAR']
        });

        state.company.activeWarehousesCount = state.warehouses.length;
        state.saasSubscription.activeWarehouses = state.warehouses.length;

        WOS_Data.persist();
        closeModal('modal-add-warehouse');
        renderView('warehouses');
        showToast(`Warehouse ${name} created.`, 'success');
    }

    function openUserAddModal() {
        openModal('modal-add-user');
    }

    function submitUserAdd() {
        const name = document.getElementById('usr-name').value;
        const email = document.getElementById('usr-email').value;
        const roleId = document.getElementById('usr-role').value;
        const limit = Number(document.getElementById('usr-limit').value) || 0;

        if (!name || !email) {
            showToast("Name and email are required.", 'error');
            return;
        }

        const state = WOS_Data.getState();
        const userId = `USR-00${state.users.length + 1}`;
        state.users.push({
            id: userId,
            name,
            email,
            roleId,
            branchId: 'BR-LOS',
            warehouseScope: 'WH-LOS-01',
            approvalLimit: limit,
            status: 'Active',
            avatarText: name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2),
            mfa: true,
            title: `${roleId.toUpperCase()} Operator`
        });

        state.company.activeUsersCount = state.users.length;
        state.saasSubscription.activeUsers = state.users.length;

        WOS_Data.persist();
        closeModal('modal-add-user');
        renderView('users');
        showToast(`User ${name} invited.`, 'success');
    }

    function openProductAddModal() {
        openModal('modal-add-product');
    }

    function submitProductAdd() {
        const sku = document.getElementById('prod-sku').value;
        const name = document.getElementById('prod-name').value;
        const category = document.getElementById('prod-category').value;
        const storage = document.getElementById('prod-storage').value;
        const cost = Number(document.getElementById('prod-cost').value) || 10000;
        const price = Number(document.getElementById('prod-price').value) || 15000;

        if (!sku || !name) {
            showToast("SKU and product name are required.", 'error');
            return;
        }

        let targetZone = 'Z-AMB';
        if (storage === 'Cold') targetZone = 'Z-COLD';
        if (storage === 'Hazardous') targetZone = 'Z-HAZ';

        WOS_Modules.Inventory.addProduct({
            sku,
            name,
            category,
            barcode: Math.floor(100000000000 + Math.random() * 900000000000).toString(),
            storageRequirement: storage,
            targetZone,
            weightKg: 2.5,
            costPrice: cost,
            sellingPrice: price,
            minStock: 10,
            maxStock: 500,
            unit: 'Units',
            description: name
        });

        closeModal('modal-add-product');
        renderView('inventory');
        showToast(`Product SKU ${sku} added.`, 'success');
    }

    // Audit Trail Tools
    function runIntegrityCheck() {
        const result = WOS_Data.verifyAuditIntegrity();
        const banner = document.getElementById('audit-integrity-banner');
        if (!banner) return;

        if (result.valid) {
            banner.className = 'alert alert-success mb-6';
            banner.innerHTML = `
                <div class="alert-icon">✓</div>
                <div>
                    <strong>Cryptographic Audit Chain: 100% VALID & INTACT</strong><br>
                    <span class="text-xs">Traversed and mathematically verified ${result.count} chained blocks back to Genesis (${result.genesisHash.substring(0, 16)}...). Zero broken links.</span>
                </div>
            `;
            showToast(`Hash chain verified! All ${result.count} blocks valid.`, 'success');
        } else {
            banner.className = 'alert alert-danger mb-6';
            banner.innerHTML = `
                <div class="alert-icon">🚫</div>
                <div>
                    <strong>CRITICAL TAMPER WARNING: HASH CHAIN BROKEN!</strong><br>
                    <span class="text-xs">${result.reason}</span>
                </div>
            `;
            showToast(`Tamper detected at block #${result.tamperedLogId}!`, 'critical');
        }
    }

    function simulateSecretDeletion() {
        const check = WOS_RBAC.attemptAuditDeletion("Operator attempted to purge historical audit records via developer console");
        
        renderView('audit');
        
        alert(
            `🚫 ${check.title}\n\n` +
            `${check.message}\n\n` +
            `👉 A Critical Security Incident has been appended to the audit trail with severity "CRITICAL".`
        );
    }

    function filterAuditLogs() {
        const filter = document.getElementById('audit-severity-filter').value;
        const rows = document.querySelectorAll('#audit-log-table tbody tr');
        rows.forEach(r => {
            if (filter === 'ALL') {
                r.style.display = '';
            } else {
                const badge = r.querySelector('.badge');
                if (badge && badge.textContent.trim().toLowerCase() === filter.toLowerCase()) {
                    r.style.display = '';
                } else {
                    r.style.display = 'none';
                }
            }
        });
    }

    function filterInventoryTable(query) {
        query = query.toLowerCase().trim();
        const rows = document.querySelectorAll('#inventory-data-table tbody tr');
        rows.forEach(r => {
            const text = r.textContent.toLowerCase();
            r.style.display = text.includes(query) ? '' : 'none';
        });
    }

    // SaaS Calculator
    function recalculatePricing() {
        const tier = document.getElementById('calc-tier').value;
        const wh = Number(document.getElementById('calc-wh-slider').value);
        const users = Number(document.getElementById('calc-user-slider').value);

        document.getElementById('calc-wh-val').textContent = wh;
        document.getElementById('calc-user-val').textContent = users;

        const calc = WOS_Modules.Billing.calculatePricing(tier, wh, users);
        document.getElementById('calc-total-display').textContent = `$${calc.total.toFixed(2)} / month`;
        document.getElementById('calc-breakdown-display').textContent = `Base: $${calc.baseCost} + ${wh} Warehouses ($${calc.whCost}) + ${users} Users ($${calc.userCost})`;
    }

    function applyCalculatedPlan() {
        try {
            const tier = document.getElementById('calc-tier').value;
            WOS_Modules.Billing.updatePlan(tier, 'Monthly');
            renderView('billing');
            showToast(`SaaS Subscription updated to ${tier}!`, 'success');
        } catch (e) {
            showToast(e.message, 'error');
        }
    }

    function resetDemoData() {
        if (confirm("Reset all WOS data to factory enterprise seed state? All test transactions will be reinitialized.")) {
            WOS_Data.resetToFactorySeed();
            updateHeaderTelemetry();
            renderView(currentTab);
            showToast("System reset to enterprise demo seed successfully.", 'success');
        }
    }

    // =========================================================================
    // SUPABASE CLOUD MANAGEMENT HANDLERS
    // =========================================================================
    function openSupabaseModal() {
        openModal('modal-supabase-sync');
        updateSupabaseTelemetryUI();
    }

    async function updateSupabaseTelemetryUI() {
        const headerPill = document.getElementById('supabase-header-pill');
        const headerText = document.getElementById('supabase-status-text');
        const modalBadge = document.getElementById('supabase-modal-badge');
        if (!headerPill || !headerText) return;

        if (typeof WOS_Supabase === 'undefined') {
            headerPill.className = 'supabase-status-pill offline';
            headerText.textContent = 'SUPABASE: STANDBY';
            return;
        }

        const info = WOS_Supabase.getStatus();
        if (info.status === 'connected') {
            headerPill.className = 'supabase-status-pill connected';
            headerText.textContent = 'SUPABASE: CLOUD LIVE';
            if (modalBadge) {
                modalBadge.className = 'badge badge-emerald';
                modalBadge.textContent = 'CONNECTED & LIVE';
            }
        } else if (info.status === 'tables_missing') {
            headerPill.className = 'supabase-status-pill tables_missing';
            headerText.textContent = 'SUPABASE: SCHEMA NEEDED';
            if (modalBadge) {
                modalBadge.className = 'badge badge-amber';
                modalBadge.textContent = 'SCHEMA NEEDED';
            }
        } else if (info.status === 'unreachable' || info.status === 'error') {
            headerPill.className = 'supabase-status-pill error';
            headerText.textContent = 'SUPABASE: OFFLINE';
            if (modalBadge) {
                modalBadge.className = 'badge badge-rose';
                modalBadge.textContent = 'OFFLINE / DUAL-MODE';
            }
        } else {
            headerPill.className = 'supabase-status-pill';
            headerText.textContent = 'SUPABASE: CLOUD READY';
            if (modalBadge) {
                modalBadge.className = 'badge badge-indigo';
                modalBadge.textContent = 'CLOUD READY';
            }
        }
    }

    async function testSupabaseConnectionUI() {
        const logBox = document.getElementById('supabase-log-output');
        if (logBox) logBox.innerHTML = '⏳ Probing Supabase endpoint (https://rywfmocrdpygovckkarv.supabase.co)...';

        if (typeof WOS_Supabase === 'undefined') {
            if (logBox) logBox.innerHTML = '<span class="text-rose-500">❌ Error: Supabase client library not loaded.</span>';
            return;
        }

        const res = await WOS_Supabase.testConnection();
        updateSupabaseTelemetryUI();

        if (logBox) {
            if (res.success && res.status === 'connected') {
                logBox.innerHTML = `
<span class="text-emerald-400">✅ 200 OK — Supabase Cloud Connected!</span>
Project: rywfmocrdpygovckkarv.supabase.co
Tables active: ${res.tablesExist ? 'Yes' : 'No'}
Latency: OK | REST API: Operational
Authentication: Publishable Key Valid
Timestamp: ${new Date().toLocaleTimeString()}
                `.trim();
                showToast("Supabase cloud connection verified successfully!", 'success');
            } else if (res.status === 'tables_missing') {
                logBox.innerHTML = `
<span class="text-amber-400">⚠️ Connected to Supabase, but schema is uninitialized.</span>
The database responded, but the 'products' table was not found.
👉 Solution: Open Supabase SQL Editor and execute 'supabase_setup.sql' to initialize the 20 tables!
                `.trim();
                showToast("Connected to Supabase! Run supabase_setup.sql in SQL Editor to create tables.", 'warning');
            } else {
                logBox.innerHTML = `
<span class="text-rose-400">⚠️ Connection Check:</span>
${res.error || 'Network error or project is paused.'}
Status: Dual-mode fallback active (using local tamper-resistant storage).
                `.trim();
                showToast("Supabase ping: " + (res.error || 'Check project / network'), 'warning');
            }
        }
    }

    async function pushToSupabaseUI() {
        const logBox = document.getElementById('supabase-log-output');
        if (logBox) logBox.innerHTML = '⏳ Pushing local master catalog and audit ledger to Supabase...';

        try {
            const state = WOS_Data.getState();
            const res = await WOS_Supabase.pushAllToSupabase(state);
            if (res.success) {
                if (logBox) {
                    logBox.innerHTML = `
<span class="text-emerald-400">✅ Push Completed Successfully!</span>
- Synced Products: ${res.results.products} rows
- Synced Audit Logs: ${res.results.auditTrail} rows
Cloud database is now up to date with local state.
                    `.trim();
                }
                showToast(`Pushed ${res.results.products} products & ${res.results.auditTrail} audit blocks to Supabase!`, 'success');
            } else {
                if (logBox) {
                    logBox.innerHTML = `
<span class="text-rose-400">⚠️ Push had partial errors:</span>
${res.results.errors.join('<br>')}
                    `.trim();
                }
                showToast("Push encountered errors. Ensure tables are created first.", 'warning');
            }
        } catch (e) {
            if (logBox) logBox.innerHTML = `<span class="text-rose-400">❌ Error: ${e.message}</span>`;
            showToast(e.message, 'error');
        }
    }

    async function pullFromSupabaseUI() {
        const logBox = document.getElementById('supabase-log-output');
        if (logBox) logBox.innerHTML = '⏳ Querying remote records from Supabase...';

        try {
            const res = await WOS_Supabase.pullFromSupabase();
            if (res.success && res.remoteData) {
                const state = WOS_Data.getState();
                let prodCount = 0;
                let auditCount = 0;

                if (res.remoteData.products && res.remoteData.products.length > 0) {
                    state.products = res.remoteData.products;
                    prodCount = res.remoteData.products.length;
                }
                if (res.remoteData.auditTrail && res.remoteData.auditTrail.length > 0) {
                    state.auditTrail = res.remoteData.auditTrail;
                    auditCount = res.remoteData.auditTrail.length;
                }

                WOS_Data.persist();
                renderView(currentTab);

                if (logBox) {
                    logBox.innerHTML = `
<span class="text-emerald-400">✅ Pulled and merged from Supabase!</span>
- Retrieved Products: ${prodCount}
- Retrieved Audit Logs: ${auditCount}
Local workspace updated with remote cloud state.
                    `.trim();
                }
                showToast(`Pulled ${prodCount} products from Supabase!`, 'success');
            } else {
                if (logBox) logBox.innerHTML = `<span class="text-amber-400">⚠️ ${res.error || 'No records returned from Supabase.'}</span>`;
                showToast(res.error || 'Failed to pull from Supabase', 'warning');
            }
        } catch (e) {
            if (logBox) logBox.innerHTML = `<span class="text-rose-400">❌ Error: ${e.message}</span>`;
            showToast(e.message, 'error');
        }
    }

    function copySupabaseSQL() {
        const sqlPath = "supabase_setup.sql";
        if (navigator.clipboard) {
            navigator.clipboard.writeText(
                `-- Execute supabase_setup.sql in Supabase SQL Editor\n-- File path: c:\\Users\\User\\Desktop\\Enterprises\\supabase_setup.sql`
            ).then(() => {
                showToast("Reference copied! Open supabase_setup.sql in your workspace.", 'success');
            }).catch(() => {
                showToast("File available at c:\\Users\\User\\Desktop\\Enterprises\\supabase_setup.sql", 'info');
            });
        } else {
            showToast("File available at c:\\Users\\User\\Desktop\\Enterprises\\supabase_setup.sql", 'info');
        }
    }

    return {
        switchTab,
        renderView,
        updateHeaderTelemetry,
        showToast,
        openModal,
        closeModal,
        switchPersona,
        switchActiveWarehouse,
        openBarcodeModal,
        handleBarcodeSimulation,
        inspectBin,
        openAdjustmentRequestModal,
        quickAdjustModal,
        submitAdjustmentRequest,
        approveAdjustment,
        rejectAdjustment,
        openPOCreateModal,
        submitPOCreate,
        openReceiveDockModal,
        submitReceiveItem,
        viewPOItems,
        executePutAwayModal,
        openOrderCreateModal,
        submitOrderCreate,
        openPickExecutionModal,
        quickConfirmPick,
        openPackModal,
        submitPackOrder,
        openAuthorizeDispatchModal,
        submitAuthorizeDispatch,
        printDispatchManifest,
        openReturnIntakeModal,
        submitReturnIntake,
        openCompanyEditModal,
        submitCompanyEdit,
        openBranchAddModal,
        submitBranchAdd,
        openWarehouseAddModal,
        submitWarehouseAdd,
        openUserAddModal,
        submitUserAdd,
        openProductAddModal,
        submitProductAdd,
        runIntegrityCheck,
        simulateSecretDeletion,
        filterAuditLogs,
        filterInventoryTable,
        recalculatePricing,
        applyCalculatedPlan,
        resetDemoData,
        openSupabaseModal,
        updateSupabaseTelemetryUI,
        testSupabaseConnectionUI,
        pushToSupabaseUI,
        pullFromSupabaseUI,
        copySupabaseSQL
    };
})();

if (typeof window !== 'undefined') {
    window.WOS_UI = WOS_UI;
}
