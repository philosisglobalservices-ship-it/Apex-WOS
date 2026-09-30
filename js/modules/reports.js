/**
 * Business Reports Module Controller
 * Handles 1-click executive SME report generation, financial health scoring,
 * dynamic SWOT matrix rendering, 30-day action checklist, and PDF/Markdown export.
 */

const ReportsModule = {
    currentReport: null,
    checklistState: JSON.parse(localStorage.getItem('bizpilot_checklist_state') || '{}'),

    init() {
        this.generateReport();
    },

    generateReport() {
        const profile = window.App?.getCurrentBusinessProfile() || {};
        const salesData = window.AIEngine.analyzeSalesData({
            salesTransactions: window.SalesModule?.sales || [],
            businessProfile: profile
        });
        const expenseData = window.AIEngine.analyzeExpenses({
            expenses: window.ExpensesModule?.expenses || [],
            salesRevenue: salesData.totalRevenue,
            businessProfile: profile
        });

        const report = window.AIEngine.generateBusinessReport({
            businessProfile: profile,
            salesData,
            expenseData
        });

        this.currentReport = report;
        this.renderReport(report, profile);
    },

    renderReport(report, profile) {
        const container = document.getElementById('business-report-container');
        if (!container) return;

        const curr = profile.currency || '$';
        const snap = report.financialSnapshot;

        let actionItemsHtml = '';
        report.actionChecklist.forEach(item => {
            const isDone = !!this.checklistState[item.id];
            actionItemsHtml += `
                <div class="checklist-row ${isDone ? 'completed' : ''}" onclick="ReportsModule.toggleCheckItem('${item.id}')">
                    <input type="checkbox" ${isDone ? 'checked' : ''} class="checkbox-action" onclick="event.stopPropagation(); ReportsModule.toggleCheckItem('${item.id}')">
                    <div class="flex-1">
                        <div class="font-medium text-xs text-slate-800">${item.task}</div>
                        <div class="text-[10px] text-muted">${item.category} • Priority: <span class="text-primary font-semibold">${item.priority}</span></div>
                    </div>
                </div>
            `;
        });

        container.innerHTML = `
            <div class="report-paper">
                <!-- REPORT HEADER -->
                <div class="report-header-banner">
                    <div>
                        <span class="badge badge-primary uppercase text-[10px] tracking-wider mb-1">Executive SME Strategy Briefing</span>
                        <h2 class="text-2xl font-black text-slate-900">${profile.name || 'Our Company'}</h2>
                        <p class="text-xs text-muted">${profile.type || 'SME Business'} • Generated on ${report.generatedAt}</p>
                    </div>
                    <div class="text-right">
                        <div class="health-grade-badge">
                            <span class="health-grade-letter">${report.healthGrade}</span>
                            <div class="health-grade-sub">Health Score: ${report.healthScore}/100</div>
                        </div>
                    </div>
                </div>

                <!-- KEY METRIC STRIP -->
                <div class="grid grid-cols-4 gap-3 my-5">
                    <div class="metric-card-mini">
                        <div class="text-[10px] text-muted uppercase">Gross Revenue</div>
                        <div class="text-base font-bold text-slate-900">${curr}${snap.revenue.toLocaleString()}</div>
                    </div>
                    <div class="metric-card-mini">
                        <div class="text-[10px] text-muted uppercase">Operating Expenses</div>
                        <div class="text-base font-bold text-slate-900">${curr}${snap.expenses.toLocaleString()}</div>
                    </div>
                    <div class="metric-card-mini">
                        <div class="text-[10px] text-muted uppercase">Net Profit</div>
                        <div class="text-base font-bold ${snap.netProfit >= 0 ? 'text-success' : 'text-danger'}">${curr}${snap.netProfit.toLocaleString()}</div>
                    </div>
                    <div class="metric-card-mini">
                        <div class="text-[10px] text-muted uppercase">Net Margin</div>
                        <div class="text-base font-bold text-primary">${snap.marginPercent}%</div>
                    </div>
                </div>

                <!-- EXECUTIVE SUMMARY -->
                <div class="card mb-5 bg-slate-50 border border-slate-200">
                    <h4 class="font-bold text-sm text-slate-900 mb-2 flex items-center gap-2">
                        <span>📝</span> Executive Performance Narrative
                    </h4>
                    <p class="text-xs text-slate-700 leading-relaxed whitespace-pre-line">${report.executiveSummary}</p>
                </div>

                <!-- SWOT MATRIX -->
                <div class="mb-5">
                    <h4 class="font-bold text-sm text-slate-900 mb-3 flex items-center gap-2">
                        <span>🧭</span> Strategic SWOT Analysis (${profile.type || 'SME'})
                    </h4>
                    <div class="swot-grid">
                        <div class="swot-box swot-strengths">
                            <div class="swot-box-header text-emerald-800">💪 Strengths</div>
                            <ul class="swot-list">
                                ${report.swot.strengths.map(s => `<li>${s}</li>`).join('')}
                            </ul>
                        </div>
                        <div class="swot-box swot-weaknesses">
                            <div class="swot-box-header text-rose-800">⚠️ Weaknesses</div>
                            <ul class="swot-list">
                                ${report.swot.weaknesses.map(w => `<li>${w}</li>`).join('')}
                            </ul>
                        </div>
                        <div class="swot-box swot-opportunities">
                            <div class="swot-box-header text-blue-800">🚀 Opportunities</div>
                            <ul class="swot-list">
                                ${report.swot.opportunities.map(o => `<li>${o}</li>`).join('')}
                            </ul>
                        </div>
                        <div class="swot-box swot-threats">
                            <div class="swot-box-header text-amber-800">🛡️ Threats</div>
                            <ul class="swot-list">
                                ${report.swot.threats.map(t => `<li>${t}</li>`).join('')}
                            </ul>
                        </div>
                    </div>
                </div>

                <!-- 30-DAY ACTION PLAN -->
                <div class="card mb-5">
                    <h4 class="font-bold text-sm text-slate-900 mb-2 flex items-center justify-between">
                        <span class="flex items-center gap-2"><span>🎯</span> 30-Day Prioritized Action Checklist</span>
                        <span class="text-xs text-muted font-normal">Click items to mark completed</span>
                    </h4>
                    <div class="checklist-container">
                        ${actionItemsHtml}
                    </div>
                </div>

                <!-- ACTIONS BAR -->
                <div class="report-actions-bar">
                    <button class="btn btn-sm btn-primary" onclick="ReportsModule.printReport()">
                        🖨️ Print / Save as PDF
                    </button>
                    <button class="btn btn-sm btn-outline" onclick="ReportsModule.copyExecutiveSummary()">
                        📋 Copy Summary
                    </button>
                    <button class="btn btn-sm btn-ghost" onclick="ReportsModule.exportMarkdown()">
                        ⬇️ Download Markdown (.md)
                    </button>
                    <button class="btn btn-sm btn-accent ml-auto" onclick="ReportsModule.generateReport()">
                        🔄 Refresh Analysis
                    </button>
                </div>
            </div>
        `;
    },

    toggleCheckItem(id) {
        this.checklistState[id] = !this.checklistState[id];
        localStorage.setItem('bizpilot_checklist_state', JSON.stringify(this.checklistState));
        this.renderReport(this.currentReport, window.App?.getCurrentBusinessProfile() || {});
    },

    printReport() {
        window.print();
    },

    copyExecutiveSummary() {
        if (!this.currentReport) return;
        navigator.clipboard.writeText(this.currentReport.executiveSummary).then(() => {
            window.App?.showToast('Executive Summary copied to clipboard!', 'success');
        });
    },

    exportMarkdown() {
        if (!this.currentReport) return;
        const profile = window.App?.getCurrentBusinessProfile() || {};
        const r = this.currentReport;
        const s = r.financialSnapshot;
        const curr = profile.currency || '$';

        const md = `# Executive Business Report: ${profile.name || 'Company'}
*Industry:* ${profile.type || 'SME'} | *Generated:* ${r.generatedAt}
*Overall Health Score:* ${r.healthScore}/100 (Grade: ${r.healthGrade})

---

## 1. Financial Snapshot
- **Gross Revenue:** ${curr}${s.revenue.toLocaleString()}
- **Total Operating Expenses:** ${curr}${s.expenses.toLocaleString()}
- **Net Profit:** ${curr}${s.netProfit.toLocaleString()}
- **Net Margin:** ${s.marginPercent}%

---

## 2. Executive Summary
${r.executiveSummary}

---

## 3. Strategic SWOT Analysis
### Strengths
${r.swot.strengths.map(x => `- ${x}`).join('\n')}

### Weaknesses
${r.swot.weaknesses.map(x => `- ${x}`).join('\n')}

### Opportunities
${r.swot.opportunities.map(x => `- ${x}`).join('\n')}

### Threats
${r.swot.threats.map(x => `- ${x}`).join('\n')}

---

## 4. 30-Day Action Checklist
${r.actionChecklist.map(a => `- [${this.checklistState[a.id] ? 'x' : ' '}] **${a.task}** (${a.category} - Priority: ${a.priority})`).join('\n')}
`;

        const blob = new Blob([md], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${(profile.name || 'business').toLowerCase().replace(/[^a-z0-9]/g, '_')}_report.md`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        window.App?.showToast('Markdown report downloaded!', 'success');
    }
};

window.ReportsModule = ReportsModule;
