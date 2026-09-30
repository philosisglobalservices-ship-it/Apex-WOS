/**
 * Sales Analysis Module Controller
 * Handles sales transaction management, KPI calculations,
 * interactive SVG revenue and category charts, and AI growth insights.
 */

const SalesModule = {
    sales: JSON.parse(localStorage.getItem('bizpilot_sales_data') || 'null'),

    init() {
        if (!this.sales) {
            this.seedDemoSales();
        }
        this.renderAll();
    },

    seedDemoSales() {
        const profile = window.App?.getCurrentBusinessProfile() || {};
        const bType = (profile.type || '').toLowerCase();

        let sampleItems = [];
        if (bType.includes('bakery') || bType.includes('cafe')) {
            sampleItems = [
                { item: 'Sourdough Loaf & Baguette Bundle', category: 'Bread & Bakery', amount: 28, customer: 'Liam Thorne', date: '2026-09-01', method: 'Card' },
                { item: 'Cold Brew & Croissant Box (Office)', category: 'Catering', amount: 165, customer: 'Omni Media Group', date: '2026-09-02', method: 'Transfer' },
                { item: 'Artisan Pastry Selection', category: 'Pastries', amount: 45, customer: 'Sophia Bennett', date: '2026-09-03', method: 'Card' },
                { item: 'Custom Tiered Birthday Cake', category: 'Custom Cakes', amount: 240, customer: 'Elena Rostova', date: '2026-09-04', method: 'Card' },
                { item: 'Specialty Espresso Retail Beans (1kg)', category: 'Retail Coffee', amount: 36, customer: 'David Wu', date: '2026-09-05', method: 'Card' },
                { item: 'Corporate Breakfast Catering Tray', category: 'Catering', amount: 320, customer: 'Peak Ventures', date: '2026-09-05', method: 'Transfer' },
                { item: 'Weekend Brunch Bundle', category: 'Pastries', amount: 65, customer: 'Hannah Cole', date: '2026-09-06', method: 'Card' }
            ];
        } else if (bType.includes('plumb') || bType.includes('hvac')) {
            sampleItems = [
                { item: 'Emergency Burst Pipe Repair & Cleanout', category: 'Emergency Service', amount: 480, customer: 'Arthur Pendelton', date: '2026-09-01', method: 'Card' },
                { item: 'Tankless Water Heater Installation', category: 'Installations', amount: 2150, customer: 'Oakridge Condos', date: '2026-09-02', method: 'Transfer' },
                { item: 'Annual HVAC Fall Tune-Up Membership', category: 'Maintenance', amount: 290, customer: 'Claire Redfield', date: '2026-09-03', method: 'Card' },
                { item: 'Kitchen Sink & Garbage Disposal Replace', category: 'Repairs', amount: 340, customer: 'George Miller', date: '2026-09-04', method: 'Card' },
                { item: 'Commercial Bathroom Rough-in Part 1', category: 'Commercial', amount: 3800, customer: 'Metro Retailers', date: '2026-09-05', method: 'Transfer' },
                { item: 'Drain Hydro-Jetting Service', category: 'Repairs', amount: 550, customer: 'Susan Bell', date: '2026-09-06', method: 'Card' }
            ];
        } else {
            // General / Agency / Retail
            sampleItems = [
                { item: 'Monthly Growth Retainer Tier 1', category: 'Retainers', amount: 1800, customer: 'Nexus Innovations', date: '2026-09-01', method: 'Transfer' },
                { item: 'Brand Identity & Design System', category: 'Design Projects', amount: 2500, customer: 'Solstice Apparel', date: '2026-09-02', method: 'Transfer' },
                { item: 'Website Audit & Conversion CRO', category: 'Consulting', amount: 750, customer: 'Bright Dental Group', date: '2026-09-03', method: 'Card' },
                { item: 'Monthly SEO Management', category: 'Retainers', amount: 1200, customer: 'Kona Coffee Co', date: '2026-09-04', method: 'Transfer' },
                { item: 'Paid Ads Management Sprint', category: 'Performance Ads', amount: 1500, customer: 'Zenith Fitness', date: '2026-09-05', method: 'Transfer' },
                { item: 'Custom Landing Page Development', category: 'Development', amount: 1400, customer: 'Apex Real Estate', date: '2026-09-06', method: 'Transfer' }
            ];
        }

        this.sales = sampleItems.map((s, idx) => ({
            id: 'sale_' + (idx + 1),
            ...s
        }));

        this.save();
    },

    save() {
        localStorage.setItem('bizpilot_sales_data', JSON.stringify(this.sales));
    },

    renderAll() {
        const profile = window.App?.getCurrentBusinessProfile() || {};
        const analysis = window.AIEngine.analyzeSalesData({
            salesTransactions: this.sales,
            businessProfile: profile,
            targetMonthlyRevenue: 12000
        });

        this.renderKPICards(analysis, profile);
        this.renderCharts(analysis, profile);
        this.renderLedgerTable(profile);
        this.renderAIInsights(analysis);
    },

    renderKPICards(analysis, profile) {
        const curr = profile.currency || '$';

        const revEl = document.getElementById('sales-kpi-revenue');
        const aovEl = document.getElementById('sales-kpi-aov');
        const ordersEl = document.getElementById('sales-kpi-orders');
        const topEl = document.getElementById('sales-kpi-top-item');
        const targetEl = document.getElementById('sales-kpi-target-bar');
        const targetTextEl = document.getElementById('sales-kpi-target-text');

        if (revEl) revEl.innerText = `${curr}${analysis.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        if (aovEl) aovEl.innerText = `${curr}${analysis.averageOrderValue.toFixed(2)}`;
        if (ordersEl) ordersEl.innerText = `${analysis.transactionCount} Orders`;
        
        if (topEl) {
            const best = analysis.bestSellers[0];
            topEl.innerHTML = best 
                ? `<strong>${best.name.slice(0, 24)}...</strong> <span class="text-xs text-muted">(${best.share}% of total)</span>`
                : 'None yet';
        }

        if (targetEl) targetEl.style.width = `${analysis.targetPercent}%`;
        if (targetTextEl) targetTextEl.innerText = `${analysis.targetPercent}% of ${curr}${analysis.targetMonthlyRevenue.toLocaleString()} target`;
    },

    renderCharts(analysis, profile) {
        const curr = profile.currency || '$';
        const trendContainer = document.getElementById('sales-trend-chart-container');
        const donutContainer = document.getElementById('sales-donut-chart-container');

        // Render Bar Chart using pure SVG
        if (trendContainer) {
            const days = ['Sep 1', 'Sep 2', 'Sep 3', 'Sep 4', 'Sep 5', 'Sep 6'];
            const dayTotals = [0, 0, 0, 0, 0, 0];

            this.sales.forEach(s => {
                const dayNum = parseInt(s.date.split('-')[2]);
                if (dayNum >= 1 && dayNum <= 6) {
                    dayTotals[dayNum - 1] += s.amount;
                }
            });

            const max = Math.max(...dayTotals, 100);

            let barsSvg = '';
            dayTotals.forEach((amt, idx) => {
                const barHeight = Math.round((amt / max) * 130);
                const y = 150 - barHeight;
                const x = 35 + idx * 55;

                barsSvg += `
                    <g class="chart-bar-group">
                        <rect x="${x}" y="${y}" width="36" height="${barHeight}" rx="4" class="fill-primary" />
                        <text x="${x + 18}" y="${y - 6}" text-anchor="middle" font-size="10" font-weight="600" fill="#475569">${curr}${amt.toLocaleString()}</text>
                        <text x="${x + 18}" y="170" text-anchor="middle" font-size="11" fill="#64748b">${days[idx]}</text>
                    </g>
                `;
            });

            trendContainer.innerHTML = `
                <svg viewBox="0 0 380 185" class="w-full h-auto">
                    <line x1="20" y1="150" x2="370" y2="150" stroke="#cbd5e1" stroke-width="1.5" />
                    <line x1="20" y1="85" x2="370" y2="85" stroke="#f1f5f9" stroke-width="1" stroke-dasharray="3,3" />
                    <line x1="20" y1="20" x2="370" y2="20" stroke="#f1f5f9" stroke-width="1" stroke-dasharray="3,3" />
                    ${barsSvg}
                </svg>
            `;
        }

        // Render Donut Chart for Categories
        if (donutContainer) {
            const categories = Object.entries(analysis.revenueByCategory);
            if (categories.length === 0) {
                donutContainer.innerHTML = '<div class="text-xs text-muted text-center py-8">No data</div>';
                return;
            }

            const colors = ['#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'];
            let legendHtml = '<div class="donut-legend">';

            categories.forEach(([cat, amt], idx) => {
                const color = colors[idx % colors.length];
                const pct = ((amt / analysis.totalRevenue) * 100).toFixed(0);
                legendHtml += `
                    <div class="legend-item">
                        <span class="legend-color-dot" style="background-color: ${color}"></span>
                        <span class="legend-label">${cat}:</span>
                        <strong>${curr}${amt.toLocaleString()} (${pct}%)</strong>
                    </div>
                `;
            });
            legendHtml += '</div>';

            donutContainer.innerHTML = `
                <div class="flex items-center gap-4">
                    <div class="donut-visual-box">
                        <svg viewBox="0 0 100 100" class="w-24 h-24 transform -rotate-90">
                            <circle cx="50" cy="50" r="40" fill="transparent" stroke="#f1f5f9" stroke-width="16" />
                            <circle cx="50" cy="50" r="40" fill="transparent" stroke="#6366f1" stroke-width="16" stroke-dasharray="180 251" stroke-dashoffset="0" />
                            <circle cx="50" cy="50" r="40" fill="transparent" stroke="#06b6d4" stroke-width="16" stroke-dasharray="70 251" stroke-dashoffset="-180" />
                        </svg>
                    </div>
                    ${legendHtml}
                </div>
            `;
        }
    },

    renderLedgerTable(profile) {
        const tbody = document.getElementById('sales-ledger-tbody');
        if (!tbody) return;

        const curr = profile.currency || '$';

        if (this.sales.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center py-6 text-muted">No sales logged yet.</td></tr>';
            return;
        }

        let html = '';
        this.sales.forEach(s => {
            html += `
                <tr>
                    <td>${s.date}</td>
                    <td><strong>${s.customer || 'Customer'}</strong></td>
                    <td>${s.item}</td>
                    <td><span class="badge badge-neutral">${s.category || 'General'}</span></td>
                    <td><strong>${curr}${Number(s.amount).toFixed(2)}</strong></td>
                    <td>
                        <button class="btn-icon text-danger" onclick="SalesModule.deleteSale('${s.id}')" title="Delete">✕</button>
                    </td>
                </tr>
            `;
        });

        tbody.innerHTML = html;
    },

    renderAIInsights(analysis) {
        const container = document.getElementById('sales-ai-insights-container');
        if (!container) return;

        let html = `
            <div class="card mb-4 bg-gradient-soft">
                <div class="flex items-center gap-2 mb-3">
                    <span class="text-xl">🧠</span>
                    <h4 class="font-bold text-base">AI Revenue Diagnostics</h4>
                </div>
                <div class="space-y-2">
                    ${analysis.aiInsights.map(insight => `
                        <div class="insight-bullet">
                            <span>${insight}</span>
                        </div>
                    `).join('')}
                </div>

                <hr class="my-4 border-slate-200">

                <h5 class="font-bold text-sm text-slate-800 mb-2">🎯 3 Prioritized Growth Strategies:</h5>
                <div class="space-y-2">
                    ${analysis.strategicAdvice.map(strat => `
                        <div class="strategy-card">
                            <p class="text-xs text-slate-700 leading-relaxed font-medium">${strat}</p>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;

        container.innerHTML = html;
    },

    openAddSaleModal() {
        const modal = document.getElementById('modal-add-sale');
        if (modal) {
            document.getElementById('sale-date').value = new Date().toISOString().split('T')[0];
            modal.classList.add('active');
        }
    },

    closeAddSaleModal() {
        const modal = document.getElementById('modal-add-sale');
        if (modal) modal.classList.remove('active');
    },

    saveNewSale() {
        const item = document.getElementById('sale-item')?.value || '';
        const category = document.getElementById('sale-category')?.value || 'General';
        const amount = parseFloat(document.getElementById('sale-amount')?.value) || 0;
        const customer = document.getElementById('sale-customer')?.value || 'Client';
        const date = document.getElementById('sale-date')?.value || new Date().toISOString().split('T')[0];
        const method = document.getElementById('sale-method')?.value || 'Card';

        if (!item.trim() || amount <= 0) {
            window.App?.showToast('Please enter an item name and valid amount.', 'warning');
            return;
        }

        const newSale = {
            id: 'sale_' + Date.now(),
            item,
            category,
            amount,
            customer,
            date,
            method
        };

        this.sales.unshift(newSale);
        this.save();
        this.renderAll();
        this.closeAddSaleModal();

        // Clear inputs
        document.getElementById('sale-item').value = '';
        document.getElementById('sale-amount').value = '';
        document.getElementById('sale-customer').value = '';

        window.App?.showToast('Sale transaction recorded!', 'success');
    },

    deleteSale(id) {
        this.sales = this.sales.filter(s => s.id !== id);
        this.save();
        this.renderAll();
        window.App?.showToast('Sale deleted.', 'info');
    },

    reloadIndustrySampleData() {
        this.seedDemoSales();
        this.renderAll();
        window.App?.showToast('Loaded fresh industry sample sales data!', 'success');
    }
};

window.SalesModule = SalesModule;
