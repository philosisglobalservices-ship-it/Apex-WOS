/**
 * BizPilot AI - Main Application Coordinator
 * State orchestration, tab navigation, business profile switching,
 * toast notifications, modal handling, and presets.
 */

const App = {
    currentTab: 'dashboard',
    
    // Preset Business Profiles
    presetProfiles: [
        {
            id: 'biz_bakery',
            name: "Bella's Artisan Bakery & Cafe",
            type: 'Bakery & Artisan Cafe',
            ownerName: 'Isabella Rossi',
            ownerEmail: 'isabella@bellasbakery.com',
            ownerPhone: '(555) 234-8901',
            currency: '$',
            taxRate: 7,
            defaultTone: 'Empathetic & Warm',
            tagline: 'Handcrafted sourdough, organic pastries, and specialty roasts.'
        },
        {
            id: 'biz_plumbing',
            name: 'Apex Flow Plumbing & HVAC',
            type: 'Plumbing & HVAC Services',
            ownerName: 'Marcus Miller',
            ownerEmail: 'service@apexflowplumbing.com',
            ownerPhone: '(555) 789-4321',
            currency: '$',
            taxRate: 5,
            defaultTone: 'Professional & Direct',
            tagline: '24/7 licensed emergency plumbing and heating solutions.'
        },
        {
            id: 'biz_agency',
            name: 'Lumina Digital Growth Agency',
            type: 'Digital Marketing & Web Agency',
            ownerName: 'Samantha Reed',
            ownerEmail: 'samantha@luminagrowth.io',
            ownerPhone: '(555) 456-1122',
            currency: '$',
            taxRate: 0,
            defaultTone: 'Confident & Strategic',
            tagline: 'Helping SME brands acquire clients with predictable paid ads and web design.'
        },
        {
            id: 'biz_boutique',
            name: 'Urban Threads Boutique',
            type: 'Boutique Fashion & Retail',
            ownerName: 'Chloe Bennett',
            ownerEmail: 'chloe@urbanthreadsboutique.com',
            ownerPhone: '(555) 890-5678',
            currency: '$',
            taxRate: 8,
            defaultTone: 'Casual & Upbeat',
            tagline: 'Curated independent fashion, slow-crafted accessories, and lifestyle pieces.'
        }
    ],

    profile: null,

    init() {
        // Load active profile from storage or use Bakery preset
        const saved = localStorage.getItem('bizpilot_active_profile');
        if (saved) {
            try {
                this.profile = JSON.parse(saved);
            } catch (e) {
                this.profile = { ...this.presetProfiles[0] };
            }
        } else {
            this.profile = { ...this.presetProfiles[0] };
            this.saveProfile();
        }

        this.updateHeaderProfile();
        this.bindEvents();

        // Initialize modules
        window.CustomerRepliesModule?.init();
        window.InvoicesModule?.init();
        window.MarketingModule?.init();
        window.SalesModule?.init();
        window.ExpensesModule?.init();
        window.ReportsModule?.init();
        window.CopilotModule?.init();

        this.renderDashboardOverview();
    },

    getCurrentBusinessProfile() {
        return this.profile;
    },

    saveProfile() {
        localStorage.setItem('bizpilot_active_profile', JSON.stringify(this.profile));
    },

    updateHeaderProfile() {
        const nameEl = document.getElementById('header-business-name');
        const typeEl = document.getElementById('header-business-type');
        const avatarEl = document.getElementById('header-business-avatar');
        const selectEl = document.getElementById('preset-business-select');

        if (nameEl) nameEl.innerText = this.profile.name;
        if (typeEl) typeEl.innerText = this.profile.type;
        if (avatarEl) avatarEl.innerText = this.profile.name.charAt(0);
        if (selectEl && this.profile.id) selectEl.value = this.profile.id;
    },

    switchPreset(profileId) {
        const found = this.presetProfiles.find(p => p.id === profileId);
        if (found) {
            this.profile = { ...found };
            this.saveProfile();
            this.updateHeaderProfile();

            // Re-seed demo data appropriate for this industry
            window.SalesModule?.seedDemoSales();
            window.ExpensesModule?.seedDemoExpenses();

            // Refresh all views
            this.refreshAllModules();
            this.showToast(`Switched business to "${this.profile.name}" (${this.profile.type})`, 'success');
        }
    },

    openProfileModal() {
        const modal = document.getElementById('modal-profile-settings');
        if (!modal) return;

        document.getElementById('prof-name').value = this.profile.name;
        document.getElementById('prof-type').value = this.profile.type;
        document.getElementById('prof-owner').value = this.profile.ownerName || '';
        document.getElementById('prof-email').value = this.profile.ownerEmail || '';
        document.getElementById('prof-phone').value = this.profile.ownerPhone || '';
        document.getElementById('prof-currency').value = this.profile.currency || '$';
        document.getElementById('prof-tax').value = this.profile.taxRate || 0;
        document.getElementById('prof-tone').value = this.profile.defaultTone || 'Empathetic & Warm';

        modal.classList.add('active');
    },

    closeProfileModal() {
        const modal = document.getElementById('modal-profile-settings');
        if (modal) modal.classList.remove('active');
    },

    saveProfileModal() {
        const name = document.getElementById('prof-name')?.value.trim();
        const type = document.getElementById('prof-type')?.value.trim();
        const owner = document.getElementById('prof-owner')?.value.trim();
        const email = document.getElementById('prof-email')?.value.trim();
        const phone = document.getElementById('prof-phone')?.value.trim();
        const currency = document.getElementById('prof-currency')?.value.trim() || '$';
        const taxRate = parseFloat(document.getElementById('prof-tax')?.value) || 0;
        const tone = document.getElementById('prof-tone')?.value || 'Professional';

        if (!name || !type) {
            this.showToast('Please provide both Business Name and Business Type.', 'warning');
            return;
        }

        this.profile = {
            ...this.profile,
            name,
            type,
            ownerName: owner,
            ownerEmail: email,
            ownerPhone: phone,
            currency,
            taxRate,
            defaultTone: tone
        };

        this.saveProfile();
        this.updateHeaderProfile();
        this.closeProfileModal();
        this.refreshAllModules();

        this.showToast('Business Profile updated successfully!', 'success');
    },

    refreshAllModules() {
        window.SalesModule?.renderAll();
        window.ExpensesModule?.renderAll();
        window.InvoicesModule?.updateMetrics();
        window.InvoicesModule?.renderInvoiceList();
        window.ReportsModule?.generateReport();
        window.CopilotModule?.updateContextPills();
        this.renderDashboardOverview();
    },

    // Navigation Tabs
    switchTab(tabId) {
        this.currentTab = tabId;

        // Update nav items
        document.querySelectorAll('.nav-tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabId);
        });

        // Update sections
        document.querySelectorAll('.app-module-section').forEach(sec => {
            sec.classList.toggle('active', sec.id === `module-section-${tabId}`);
        });

        // Trigger module specific renders if needed
        if (tabId === 'dashboard') this.renderDashboardOverview();
        else if (tabId === 'sales') window.SalesModule?.renderAll();
        else if (tabId === 'expenses') window.ExpensesModule?.renderAll();
        else if (tabId === 'invoices') window.InvoicesModule?.renderInvoiceList();
        else if (tabId === 'reports') window.ReportsModule?.generateReport();

        window.scrollTo({ top: 0, behavior: 'smooth' });
    },

    renderDashboardOverview() {
        const profile = this.profile;
        const curr = profile.currency || '$';

        // Calculate metrics
        const salesRevenue = window.SalesModule?.sales?.reduce((sum, s) => sum + (Number(s.amount) || 0), 0) || 0;
        const totalExpenses = window.ExpensesModule?.expenses?.reduce((sum, e) => sum + (Number(e.amount) || 0), 0) || 0;
        const netProfit = salesRevenue - totalExpenses;
        const margin = salesRevenue > 0 ? ((netProfit / salesRevenue) * 100).toFixed(1) : 0;

        let outstandingInvoices = 0;
        window.InvoicesModule?.invoices?.forEach(i => {
            if (i.status === 'sent' || i.status === 'overdue') outstandingInvoices += i.total;
        });

        const revEl = document.getElementById('dash-kpi-revenue');
        const profitEl = document.getElementById('dash-kpi-profit');
        const invEl = document.getElementById('dash-kpi-invoices');
        const marginEl = document.getElementById('dash-kpi-margin');

        if (revEl) revEl.innerText = `${curr}${salesRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        if (profitEl) {
            profitEl.innerText = `${curr}${netProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
            profitEl.className = netProfit >= 0 ? 'kpi-value text-success' : 'kpi-value text-danger';
        }
        if (invEl) invEl.innerText = `${curr}${outstandingInvoices.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        if (marginEl) marginEl.innerText = `${margin}% Net Margin`;

        // Dashboard dynamic welcome banner
        const welcomeEl = document.getElementById('dash-welcome-text');
        if (welcomeEl) {
            welcomeEl.innerHTML = `Managing <strong>${profile.name}</strong> • Industry: <span class="badge badge-primary">${profile.type}</span>`;
        }
    },

    // UI Toast System
    showToast(message, type = 'info') {
        const container = document.getElementById('toast-container');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        
        const icons = {
            'success': '✓',
            'warning': '⚠️',
            'danger': '✕',
            'info': 'ℹ️'
        };

        toast.innerHTML = `
            <span class="toast-icon">${icons[type] || 'ℹ️'}</span>
            <span class="toast-message">${message}</span>
            <button class="toast-close" onclick="this.parentElement.remove()">✕</button>
        `;

        container.appendChild(toast);

        setTimeout(() => {
            toast.classList.add('toast-fadeout');
            setTimeout(() => toast.remove(), 400);
        }, 4000);
    },

    // API Key / Provider Settings Modal
    openSettingsModal() {
        const modal = document.getElementById('modal-api-settings');
        if (!modal) return;

        document.getElementById('api-provider-select').value = window.AIEngine.config.apiProvider;
        document.getElementById('api-key-input').value = window.AIEngine.config.apiKey;

        modal.classList.add('active');
    },

    closeSettingsModal() {
        const modal = document.getElementById('modal-api-settings');
        if (modal) modal.classList.remove('active');
    },

    saveSettingsModal() {
        const provider = document.getElementById('api-provider-select')?.value || 'built-in';
        const apiKey = document.getElementById('api-key-input')?.value.trim() || '';

        window.AIEngine.config.apiProvider = provider;
        window.AIEngine.config.apiKey = apiKey;

        localStorage.setItem('bizpilot_api_provider', provider);
        localStorage.setItem('bizpilot_api_key', apiKey);

        this.closeSettingsModal();
        this.showToast('AI Engine settings updated!', 'success');
    },

    bindEvents() {
        // Keyboard shortcut: Esc closes any active modal or copilot drawer
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                document.querySelectorAll('.modal.active').forEach(m => m.classList.remove('active'));
                if (window.CopilotModule?.isOpen) {
                    window.CopilotModule.toggleDrawer();
                }
            }
        });
    }
};

window.App = App;

// Bootstrap when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.App.init();
});
