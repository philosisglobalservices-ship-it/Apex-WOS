/**
 * Expense Summaries Module Controller
 * Handles expense tracking, category breakdowns, Profit & Loss (P&L) calculations,
 * and AI cost-cutting recommendations.
 */

const ExpensesModule = {
    expenses: JSON.parse(localStorage.getItem('bizpilot_expenses_data') || 'null'),

    init() {
        if (!this.expenses) {
            this.seedDemoExpenses();
        }
        this.renderAll();
    },

    seedDemoExpenses() {
        const profile = window.App?.getCurrentBusinessProfile() || {};
        const bType = (profile.type || '').toLowerCase();

        let sampleExpenses = [];
        if (bType.includes('bakery') || bType.includes('cafe')) {
            sampleExpenses = [
                { description: 'Organic Flour & Sourdough Grains', category: 'Raw Materials & Inventory', amount: 480, vendor: 'Heritage Mills Co', date: '2026-09-01' },
                { description: 'Commercial Dairy & Butter Stock', category: 'Raw Materials & Inventory', amount: 390, vendor: 'Valley Creamery', date: '2026-09-02' },
                { description: 'Assistant Baker Part-Time Shift Pay', category: 'Payroll & Wages', amount: 650, vendor: 'Staff Payroll', date: '2026-09-03' },
                { description: 'Commercial Gas & Oven Utilities', category: 'Utilities', amount: 260, vendor: 'City Energy Co', date: '2026-09-04' },
                { description: 'Eco-Friendly Takeout Boxes & Cups', category: 'Packaging & Supplies', amount: 210, vendor: 'GreenPack Direct', date: '2026-09-05' },
                { description: 'Local Meta Ad Campaign (Morning Rush)', category: 'Marketing & Ads', amount: 140, vendor: 'Meta Platforms', date: '2026-09-05' }
            ];
        } else if (bType.includes('plumb') || bType.includes('hvac')) {
            sampleExpenses = [
                { description: 'Copper Pipes & Compression Fittings', category: 'Materials & Parts', amount: 1250, vendor: 'Ferguson Supply', date: '2026-09-01' },
                { description: 'Service Van Fuel & Fleet Tolls', category: 'Fleet & Travel', amount: 420, vendor: 'Shell Fleet', date: '2026-09-02' },
                { description: 'Apprentice Technician Wages', category: 'Payroll & Wages', amount: 1600, vendor: 'Payroll Direct', date: '2026-09-03' },
                { description: 'Commercial Liability & Truck Insurance', category: 'Insurance & Licenses', amount: 550, vendor: 'State Farm Commercial', date: '2026-09-04' },
                { description: 'Digital Dispatch & Invoicing Software', category: 'Software & Tools', amount: 180, vendor: 'ServiceTitan', date: '2026-09-05' },
                { description: 'Google Local Services Ads', category: 'Marketing & Ads', amount: 350, vendor: 'Google Ads', date: '2026-09-06' }
            ];
        } else {
            // General / Agency / Services
            sampleExpenses = [
                { description: 'Contract Senior UI Designer (Project Sprint)', category: 'Contractors & Payroll', amount: 1400, vendor: 'Alex Vance Design', date: '2026-09-01' },
                { description: 'Figma, Adobe Creative Cloud & GitHub', category: 'Software & Tools', amount: 240, vendor: 'Adobe & Figma Inc', date: '2026-09-02' },
                { description: 'Co-working Office Space & High-Speed Fiber', category: 'Rent & Facilities', amount: 850, vendor: 'Industrious Hub', date: '2026-09-03' },
                { description: 'B2B LinkedIn Outreach Campaign', category: 'Marketing & Ads', amount: 320, vendor: 'LinkedIn Ads', date: '2026-09-04' },
                { description: 'Accounting & Quarterly Tax Prep', category: 'Legal & Accounting', amount: 400, vendor: 'Summit CPAs', date: '2026-09-05' }
            ];
        }

        this.expenses = sampleExpenses.map((e, idx) => ({
            id: 'exp_' + (idx + 1),
            ...e
        }));

        this.save();
    },

    save() {
        localStorage.setItem('bizpilot_expenses_data', JSON.stringify(this.expenses));
    },

    renderAll() {
        const profile = window.App?.getCurrentBusinessProfile() || {};
        const salesRevenue = window.SalesModule?.sales?.reduce((sum, s) => sum + (Number(s.amount) || 0), 0) || 0;

        const analysis = window.AIEngine.analyzeExpenses({
            expenses: this.expenses,
            salesRevenue,
            businessProfile: profile
        });

        this.renderPLSummary(analysis, salesRevenue, profile);
        this.renderCategoryBreakdown(analysis, profile);
        this.renderLedgerTable(profile);
        this.renderCostAdvice(analysis);
    },

    renderPLSummary(analysis, salesRevenue, profile) {
        const curr = profile.currency || '$';

        const revEl = document.getElementById('pl-gross-revenue');
        const expEl = document.getElementById('pl-total-expenses');
        const netEl = document.getElementById('pl-net-profit');
        const marginEl = document.getElementById('pl-profit-margin');

        if (revEl) revEl.innerText = `${curr}${salesRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        if (expEl) expEl.innerText = `${curr}${analysis.totalExpenses.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        
        if (netEl) {
            netEl.innerText = `${curr}${analysis.netProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
            netEl.className = analysis.netProfit >= 0 ? 'text-2xl font-extrabold text-success' : 'text-2xl font-extrabold text-danger';
        }

        if (marginEl) {
            marginEl.innerText = `${analysis.netMarginPercent}% Net Margin`;
            marginEl.className = analysis.netMarginPercent >= 15 ? 'text-xs font-bold text-success' : 'text-xs font-bold text-warning';
        }
    },

    renderCategoryBreakdown(analysis, profile) {
        const curr = profile.currency || '$';
        const container = document.getElementById('expenses-category-container');
        if (!container) return;

        if (!analysis.categoryBreakdown || analysis.categoryBreakdown.length === 0) {
            container.innerHTML = '<div class="text-xs text-muted text-center py-6">No expenses logged.</div>';
            return;
        }

        let html = '<div class="space-y-3">';
        analysis.categoryBreakdown.forEach((item, idx) => {
            const colors = ['#f43f5e', '#f59e0b', '#8b5cf6', '#06b6d4', '#10b981', '#64748b'];
            const color = colors[idx % colors.length];

            html += `
                <div>
                    <div class="flex justify-between text-xs mb-1">
                        <span class="font-medium text-slate-700">${item.cat}</span>
                        <span><strong>${curr}${item.amt.toLocaleString()}</strong> (${item.percent}%)</span>
                    </div>
                    <div class="w-full bg-slate-100 rounded-full h-2">
                        <div class="h-2 rounded-full" style="width: ${item.percent}%; background-color: ${color}"></div>
                    </div>
                </div>
            `;
        });
        html += '</div>';

        container.innerHTML = html;
    },

    renderLedgerTable(profile) {
        const tbody = document.getElementById('expense-ledger-tbody');
        if (!tbody) return;

        const curr = profile.currency || '$';

        if (this.expenses.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center py-6 text-muted">No expenses logged yet.</td></tr>';
            return;
        }

        let html = '';
        this.expenses.forEach(e => {
            html += `
                <tr>
                    <td>${e.date}</td>
                    <td><strong>${e.description}</strong></td>
                    <td><span class="badge badge-neutral">${e.category}</span></td>
                    <td>${e.vendor || '-'}</td>
                    <td><strong class="text-slate-800">${curr}${Number(e.amount).toFixed(2)}</strong></td>
                    <td>
                        <button class="btn-icon text-danger" onclick="ExpensesModule.deleteExpense('${e.id}')" title="Delete">✕</button>
                    </td>
                </tr>
            `;
        });

        tbody.innerHTML = html;
    },

    renderCostAdvice(analysis) {
        const container = document.getElementById('expenses-cost-advice-container');
        if (!container) return;

        let html = `
            <div class="card mb-4 bg-gradient-soft">
                <div class="flex items-center gap-2 mb-3">
                    <span class="text-xl">💡</span>
                    <h4 class="font-bold text-base">AI Cost Optimization & Budgeting Advisor</h4>
                </div>
                <div class="space-y-2">
                    ${analysis.aiCostAdvice.map(tip => `
                        <div class="insight-bullet">
                            <span>${tip}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;

        container.innerHTML = html;
    },

    openAddExpenseModal() {
        const modal = document.getElementById('modal-add-expense');
        if (modal) {
            document.getElementById('exp-date').value = new Date().toISOString().split('T')[0];
            modal.classList.add('active');
        }
    },

    closeAddExpenseModal() {
        const modal = document.getElementById('modal-add-expense');
        if (modal) modal.classList.remove('active');
    },

    saveNewExpense() {
        const desc = document.getElementById('exp-desc')?.value || '';
        const category = document.getElementById('exp-category')?.value || 'Supplies';
        const amount = parseFloat(document.getElementById('exp-amount')?.value) || 0;
        const vendor = document.getElementById('exp-vendor')?.value || 'Vendor';
        const date = document.getElementById('exp-date')?.value || new Date().toISOString().split('T')[0];

        if (!desc.trim() || amount <= 0) {
            window.App?.showToast('Please enter an expense description and valid amount.', 'warning');
            return;
        }

        const newExp = {
            id: 'exp_' + Date.now(),
            description: desc,
            category,
            amount,
            vendor,
            date
        };

        this.expenses.unshift(newExp);
        this.save();
        this.renderAll();
        this.closeAddExpenseModal();

        // Clear
        document.getElementById('exp-desc').value = '';
        document.getElementById('exp-amount').value = '';
        document.getElementById('exp-vendor').value = '';

        window.App?.showToast('Expense recorded!', 'success');
    },

    deleteExpense(id) {
        this.expenses = this.expenses.filter(e => e.id !== id);
        this.save();
        this.renderAll();
        window.App?.showToast('Expense deleted.', 'info');
    },

    reloadIndustrySampleData() {
        this.seedDemoExpenses();
        this.renderAll();
        window.App?.showToast('Loaded fresh industry sample expense data!', 'success');
    }
};

window.ExpensesModule = ExpensesModule;
