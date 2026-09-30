/**
 * Invoices Module Controller
 * Handles natural language invoice creation, visual line-item builder,
 * status transitions, print/PDF rendering, and overdue chasers.
 */

const InvoicesModule = {
    invoices: JSON.parse(localStorage.getItem('bizpilot_invoices') || 'null'),
    activeInvoice: null,

    init() {
        if (!this.invoices) {
            this.seedDemoInvoices();
        }
        this.renderInvoiceList();
        this.updateMetrics();
    },

    seedDemoInvoices() {
        const profile = window.App?.getCurrentBusinessProfile() || {};
        const curr = profile.currency || '$';

        this.invoices = [
            {
                id: 'inv_101',
                invoiceNumber: 'INV-1042',
                clientName: 'Apex Logistics LLC',
                clientEmail: 'billing@apexlogistics.com',
                issueDate: new Date(Date.now() - 18 * 86400000).toISOString().split('T')[0],
                dueDate: new Date(Date.now() - 4 * 86400000).toISOString().split('T')[0],
                status: 'overdue',
                currency: curr,
                items: [
                    { description: 'Quarterly Maintenance & Service Review', quantity: 1, unitPrice: 850, total: 850 },
                    { description: 'Emergency Replacement Fittings & Materials', quantity: 2, unitPrice: 120, total: 240 }
                ],
                subtotal: 1090,
                discountPercent: 0,
                discountAmount: 0,
                taxPercent: 5,
                taxAmount: 54.50,
                total: 1144.50,
                notes: 'Payment overdue by 4 days. Please settle immediately via wire transfer.',
                paymentTerms: 'Due upon receipt. Wire / Credit Card accepted.'
            },
            {
                id: 'inv_102',
                invoiceNumber: 'INV-1043',
                clientName: 'GreenTree Wellness Clinic',
                clientEmail: 'contact@greentreewellness.org',
                issueDate: new Date(Date.now() - 6 * 86400000).toISOString().split('T')[0],
                dueDate: new Date(Date.now() + 8 * 86400000).toISOString().split('T')[0],
                status: 'sent',
                currency: curr,
                items: [
                    { description: 'Standard Commercial Service Package Tier 2', quantity: 1, unitPrice: 1400, total: 1400 },
                    { description: 'Dedicated Weekend On-Call Coverage', quantity: 1, unitPrice: 350, total: 350 }
                ],
                subtotal: 1750,
                discountPercent: 5,
                discountAmount: 87.50,
                taxPercent: 5,
                taxAmount: 83.13,
                total: 1745.63,
                notes: 'Thank you for your ongoing partnership!',
                paymentTerms: 'Net 14 days.'
            },
            {
                id: 'inv_103',
                invoiceNumber: 'INV-1041',
                clientName: 'Harborview Cafe & Bistro',
                clientEmail: 'chef@harborviewbistro.com',
                issueDate: new Date(Date.now() - 25 * 86400000).toISOString().split('T')[0],
                dueDate: new Date(Date.now() - 11 * 86400000).toISOString().split('T')[0],
                status: 'paid',
                currency: curr,
                items: [
                    { description: 'On-site Diagnostic & Specialized Repair', quantity: 4, unitPrice: 110, total: 440 },
                    { description: 'OEM Filtration Units', quantity: 2, unitPrice: 75, total: 150 }
                ],
                subtotal: 590,
                discountPercent: 0,
                discountAmount: 0,
                taxPercent: 5,
                taxAmount: 29.50,
                total: 619.50,
                notes: 'Paid in full on ' + new Date(Date.now() - 12 * 86400000).toISOString().split('T')[0],
                paymentTerms: 'Paid.'
            }
        ];
        this.save();
    },

    save() {
        localStorage.setItem('bizpilot_invoices', JSON.stringify(this.invoices));
    },

    updateMetrics() {
        const curr = window.App?.getCurrentBusinessProfile()?.currency || '$';
        let outstanding = 0;
        let overdue = 0;
        let paid = 0;

        this.invoices.forEach(inv => {
            if (inv.status === 'sent') outstanding += inv.total;
            else if (inv.status === 'overdue') overdue += inv.total;
            else if (inv.status === 'paid') paid += inv.total;
        });

        const outstandingEl = document.getElementById('metric-invoices-outstanding');
        const overdueEl = document.getElementById('metric-invoices-overdue');
        const paidEl = document.getElementById('metric-invoices-paid');

        if (outstandingEl) outstandingEl.innerText = `${curr}${outstanding.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        if (overdueEl) overdueEl.innerText = `${curr}${overdue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        if (paidEl) paidEl.innerText = `${curr}${paid.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    },

    renderInvoiceList(filterStatus = 'all') {
        const container = document.getElementById('invoice-table-body');
        if (!container) return;

        let filtered = this.invoices;
        if (filterStatus !== 'all') {
            filtered = this.invoices.filter(i => i.status === filterStatus);
        }

        if (filtered.length === 0) {
            container.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center py-6 text-muted">
                        No invoices found for this filter. Create an invoice using Natural Language or click "New Invoice".
                    </td>
                </tr>
            `;
            return;
        }

        let html = '';
        filtered.forEach(inv => {
            const statusBadge = {
                'paid': '<span class="status-pill status-paid">● Paid</span>',
                'sent': '<span class="status-pill status-sent">● Pending</span>',
                'overdue': '<span class="status-pill status-overdue">⚠️ Overdue</span>',
                'draft': '<span class="status-pill status-draft">Draft</span>'
            }[inv.status] || `<span class="status-pill">${inv.status}</span>`;

            html += `
                <tr>
                    <td><strong>${inv.invoiceNumber}</strong></td>
                    <td>
                        <div class="font-medium">${inv.clientName}</div>
                        <div class="text-xs text-muted">${inv.clientEmail || ''}</div>
                    </td>
                    <td>${inv.issueDate}</td>
                    <td><span class="${inv.status === 'overdue' ? 'text-danger font-bold' : ''}">${inv.dueDate}</span></td>
                    <td><strong>${inv.currency}${inv.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></td>
                    <td>${statusBadge}</td>
                    <td>
                        <div class="action-btn-group">
                            <button class="btn btn-xs btn-outline" onclick="InvoicesModule.previewInvoice('${inv.id}')" title="Preview & Print">👁️ View</button>
                            ${inv.status !== 'paid' ? `
                                <button class="btn btn-xs btn-success" onclick="InvoicesModule.markAsPaid('${inv.id}')" title="Mark as Paid">✓ Paid</button>
                            ` : ''}
                            ${inv.status === 'overdue' || inv.status === 'sent' ? `
                                <button class="btn btn-xs btn-accent" onclick="InvoicesModule.openChaserModal('${inv.id}')" title="Send AI Payment Reminder">🔔 Chaser</button>
                            ` : ''}
                            <button class="btn btn-xs btn-ghost text-danger" onclick="InvoicesModule.deleteInvoice('${inv.id}')" title="Delete">✕</button>
                        </div>
                    </td>
                </tr>
            `;
        });

        container.innerHTML = html;
        this.updateMetrics();
    },

    filterInvoices(status) {
        // Toggle active button
        document.querySelectorAll('.invoice-filter-btn').forEach(btn => btn.classList.remove('active'));
        const activeBtn = document.getElementById(`filter-inv-${status}`);
        if (activeBtn) activeBtn.classList.add('active');

        this.renderInvoiceList(status);
    },

    parseFromNaturalLanguage() {
        const input = document.getElementById('nl-invoice-input');
        if (!input || !input.value.trim()) {
            window.App?.showToast('Please type an invoice instruction (e.g. "Bill John for 3 hours at $90 and $40 parts, due in 7 days")', 'warning');
            return;
        }

        const profile = window.App?.getCurrentBusinessProfile() || {};
        const parsed = window.AIEngine.parseNaturalLanguageInvoice(input.value, profile);

        this.openInvoiceModal(parsed);
        window.App?.showToast('AI parsed your instruction into line items! Review and save below.', 'success');
    },

    loadSampleNL(sampleType) {
        const input = document.getElementById('nl-invoice-input');
        if (!input) return;

        const profile = window.App?.getCurrentBusinessProfile() || {};
        const curr = profile.currency || '$';

        if (sampleType === 'service') {
            input.value = `Invoice Summit Horizon Group for 6 hours of technical consulting at ${curr}95/hr and ${curr}150 software deployment fee, with a 10% early payment discount, payment due in 14 days`;
        } else if (sampleType === 'retail') {
            input.value = `Bill Rebecca Lawson for 3 sets of artisan gift packages at ${curr}45 each and ${curr}25 expedited courier delivery, due in 7 days`;
        } else if (sampleType === 'maintenance') {
            input.value = `Invoice Oakridge Property Management for routine emergency repair visit of 4 hours at ${curr}80/hr and ${curr}180 pipe replacement parts, due in 10 days`;
        }

        window.App?.showToast('Sample natural language invoice loaded.', 'info');
    },

    openInvoiceModal(invoiceData = null) {
        const modal = document.getElementById('modal-invoice-editor');
        if (!modal) return;

        const profile = window.App?.getCurrentBusinessProfile() || {};
        const curr = profile.currency || '$';

        const inv = invoiceData || {
            id: 'inv_' + Date.now(),
            invoiceNumber: 'INV-' + Math.floor(1000 + Math.random() * 9000),
            clientName: '',
            clientEmail: '',
            issueDate: new Date().toISOString().split('T')[0],
            dueDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
            status: 'sent',
            currency: curr,
            items: [
                { description: 'Professional Service', quantity: 1, unitPrice: 150, total: 150 }
            ],
            subtotal: 150,
            discountPercent: 0,
            discountAmount: 0,
            taxPercent: Number(profile.taxRate) || 0,
            taxAmount: 0,
            total: 150,
            notes: `Thank you for choosing ${profile.name || 'our company'}!`,
            paymentTerms: 'Payment due within 14 days. Bank transfer or credit card accepted.'
        };

        this.activeInvoice = inv;

        document.getElementById('inv-edit-number').value = inv.invoiceNumber;
        document.getElementById('inv-edit-client').value = inv.clientName;
        document.getElementById('inv-edit-email').value = inv.clientEmail || '';
        document.getElementById('inv-edit-issue').value = inv.issueDate;
        document.getElementById('inv-edit-due').value = inv.dueDate;
        document.getElementById('inv-edit-discount').value = inv.discountPercent || 0;
        document.getElementById('inv-edit-tax').value = inv.taxPercent || 0;
        document.getElementById('inv-edit-notes').value = inv.notes || '';
        document.getElementById('inv-edit-terms').value = inv.paymentTerms || '';

        this.renderModalLineItems();
        this.recalculateModalTotals();

        modal.classList.add('active');
    },

    renderModalLineItems() {
        const tbody = document.getElementById('inv-edit-items-body');
        if (!tbody || !this.activeInvoice) return;

        let html = '';
        this.activeInvoice.items.forEach((item, idx) => {
            html += `
                <tr>
                    <td>
                        <input type="text" class="input input-sm w-full" value="${item.description}" oninput="InvoicesModule.updateItem(${idx}, 'description', this.value)" placeholder="Description">
                    </td>
                    <td style="width: 80px;">
                        <input type="number" step="0.5" class="input input-sm w-full" value="${item.quantity}" oninput="InvoicesModule.updateItem(${idx}, 'quantity', this.value)" min="0.1">
                    </td>
                    <td style="width: 120px;">
                        <input type="number" step="1" class="input input-sm w-full" value="${item.unitPrice}" oninput="InvoicesModule.updateItem(${idx}, 'unitPrice', this.value)" min="0">
                    </td>
                    <td style="width: 100px;" class="font-bold text-right pr-2">
                        ${this.activeInvoice.currency || '$'}${item.total.toFixed(2)}
                    </td>
                    <td style="width: 40px; text-align: center;">
                        <button class="btn-icon text-danger" onclick="InvoicesModule.removeLineItem(${idx})" title="Remove">✕</button>
                    </td>
                </tr>
            `;
        });

        tbody.innerHTML = html;
    },

    addLineItem() {
        if (!this.activeInvoice) return;
        this.activeInvoice.items.push({
            description: 'New Service / Item',
            quantity: 1,
            unitPrice: 50,
            total: 50
        });
        this.renderModalLineItems();
        this.recalculateModalTotals();
    },

    removeLineItem(idx) {
        if (!this.activeInvoice || this.activeInvoice.items.length <= 1) {
            window.App?.showToast('Invoice must have at least 1 line item.', 'warning');
            return;
        }
        this.activeInvoice.items.splice(idx, 1);
        this.renderModalLineItems();
        this.recalculateModalTotals();
    },

    updateItem(idx, field, value) {
        if (!this.activeInvoice || !this.activeInvoice.items[idx]) return;
        if (field === 'description') {
            this.activeInvoice.items[idx].description = value;
        } else if (field === 'quantity') {
            const qty = parseFloat(value) || 0;
            this.activeInvoice.items[idx].quantity = qty;
            this.activeInvoice.items[idx].total = qty * this.activeInvoice.items[idx].unitPrice;
        } else if (field === 'unitPrice') {
            const price = parseFloat(value) || 0;
            this.activeInvoice.items[idx].unitPrice = price;
            this.activeInvoice.items[idx].total = this.activeInvoice.items[idx].quantity * price;
        }
        this.renderModalLineItems();
        this.recalculateModalTotals();
    },

    recalculateModalTotals() {
        if (!this.activeInvoice) return;

        const discountInput = document.getElementById('inv-edit-discount');
        const taxInput = document.getElementById('inv-edit-tax');

        const discountPercent = parseFloat(discountInput?.value) || 0;
        const taxPercent = parseFloat(taxInput?.value) || 0;

        const subtotal = this.activeInvoice.items.reduce((sum, item) => sum + (item.total || 0), 0);
        const discountAmount = (subtotal * discountPercent) / 100;
        const taxable = Math.max(0, subtotal - discountAmount);
        const taxAmount = (taxable * taxPercent) / 100;
        const total = taxable + taxAmount;

        this.activeInvoice.subtotal = subtotal;
        this.activeInvoice.discountPercent = discountPercent;
        this.activeInvoice.discountAmount = discountAmount;
        this.activeInvoice.taxPercent = taxPercent;
        this.activeInvoice.taxAmount = taxAmount;
        this.activeInvoice.total = total;

        const curr = this.activeInvoice.currency || '$';
        document.getElementById('inv-calc-subtotal').innerText = `${curr}${subtotal.toFixed(2)}`;
        document.getElementById('inv-calc-discount').innerText = `-${curr}${discountAmount.toFixed(2)}`;
        document.getElementById('inv-calc-tax').innerText = `+${curr}${taxAmount.toFixed(2)}`;
        document.getElementById('inv-calc-total').innerText = `${curr}${total.toFixed(2)}`;
    },

    saveActiveInvoice() {
        if (!this.activeInvoice) return;

        this.activeInvoice.invoiceNumber = document.getElementById('inv-edit-number')?.value || this.activeInvoice.invoiceNumber;
        this.activeInvoice.clientName = document.getElementById('inv-edit-client')?.value || 'Client';
        this.activeInvoice.clientEmail = document.getElementById('inv-edit-email')?.value || '';
        this.activeInvoice.issueDate = document.getElementById('inv-edit-issue')?.value || this.activeInvoice.issueDate;
        this.activeInvoice.dueDate = document.getElementById('inv-edit-due')?.value || this.activeInvoice.dueDate;
        this.activeInvoice.notes = document.getElementById('inv-edit-notes')?.value || '';
        this.activeInvoice.paymentTerms = document.getElementById('inv-edit-terms')?.value || '';

        // Add or update in list
        const existingIdx = this.invoices.findIndex(i => i.id === this.activeInvoice.id || i.invoiceNumber === this.activeInvoice.invoiceNumber);
        if (existingIdx >= 0) {
            this.invoices[existingIdx] = this.activeInvoice;
        } else {
            this.invoices.unshift(this.activeInvoice);
        }

        this.save();
        this.renderInvoiceList();
        this.closeInvoiceModal();
        window.App?.showToast(`Invoice ${this.activeInvoice.invoiceNumber} saved!`, 'success');
    },

    closeInvoiceModal() {
        const modal = document.getElementById('modal-invoice-editor');
        if (modal) modal.classList.remove('active');
        this.activeInvoice = null;
    },

    previewInvoice(id) {
        const inv = this.invoices.find(i => i.id === id);
        if (!inv) return;

        const profile = window.App?.getCurrentBusinessProfile() || {};
        const curr = inv.currency || '$';

        const modal = document.getElementById('modal-invoice-preview');
        const container = document.getElementById('invoice-preview-sheet');
        if (!modal || !container) return;

        container.innerHTML = `
            <div class="printable-invoice">
                <div class="invoice-brand-row">
                    <div>
                        <h2 class="text-2xl font-bold text-primary">${profile.name || 'Our Company'}</h2>
                        <p class="text-sm text-muted">${profile.type || 'SME Business'}</p>
                        <p class="text-xs text-muted">${profile.ownerEmail || 'contact@business.com'} • ${profile.ownerPhone || ''}</p>
                    </div>
                    <div class="text-right">
                        <h1 class="text-3xl font-extrabold text-slate-800">INVOICE</h1>
                        <div class="font-bold text-lg text-primary">${inv.invoiceNumber}</div>
                        <div class="status-pill status-${inv.status} mt-1 inline-block">${inv.status.toUpperCase()}</div>
                    </div>
                </div>

                <hr class="my-4 border-slate-200">

                <div class="grid grid-cols-2 gap-4 my-4">
                    <div>
                        <div class="text-xs font-bold text-muted uppercase">Billed To:</div>
                        <div class="font-bold text-base mt-1">${inv.clientName}</div>
                        <div class="text-sm text-muted">${inv.clientEmail}</div>
                    </div>
                    <div class="text-right">
                        <div class="text-xs font-bold text-muted uppercase">Invoice Details:</div>
                        <div class="text-sm mt-1"><strong>Issue Date:</strong> ${inv.issueDate}</div>
                        <div class="text-sm"><strong>Due Date:</strong> ${inv.dueDate}</div>
                        <div class="text-sm"><strong>Terms:</strong> ${inv.paymentTerms || 'Due upon receipt'}</div>
                    </div>
                </div>

                <table class="table-preview my-6 w-full">
                    <thead>
                        <tr class="bg-slate-100">
                            <th class="text-left py-2 px-3">Description</th>
                            <th class="text-center py-2 px-3">Qty</th>
                            <th class="text-right py-2 px-3">Unit Price</th>
                            <th class="text-right py-2 px-3">Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${inv.items.map(item => `
                            <tr class="border-b border-slate-100">
                                <td class="py-2 px-3">${item.description}</td>
                                <td class="py-2 px-3 text-center">${item.quantity}</td>
                                <td class="py-2 px-3 text-right">${curr}${item.unitPrice.toFixed(2)}</td>
                                <td class="py-2 px-3 text-right font-bold">${curr}${item.total.toFixed(2)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>

                <div class="grid grid-cols-2 gap-4 mt-6">
                    <div class="text-xs text-muted">
                        <div class="font-bold text-slate-700 uppercase mb-1">Notes & Instructions:</div>
                        <p>${inv.notes || 'Thank you for your business!'}</p>
                        <div class="font-bold text-slate-700 uppercase mt-3 mb-1">Payment Method:</div>
                        <p>${inv.paymentTerms || 'Bank Transfer or Card'}</p>
                    </div>
                    <div class="totals-box text-right">
                        <div class="flex justify-between py-1 text-sm">
                            <span class="text-muted">Subtotal:</span>
                            <span>${curr}${inv.subtotal.toFixed(2)}</span>
                        </div>
                        ${inv.discountAmount > 0 ? `
                            <div class="flex justify-between py-1 text-sm text-success">
                                <span>Discount (${inv.discountPercent}%):</span>
                                <span>-${curr}${inv.discountAmount.toFixed(2)}</span>
                            </div>
                        ` : ''}
                        ${inv.taxAmount > 0 ? `
                            <div class="flex justify-between py-1 text-sm text-muted">
                                <span>Tax (${inv.taxPercent}%):</span>
                                <span>+${curr}${inv.taxAmount.toFixed(2)}</span>
                            </div>
                        ` : ''}
                        <hr class="my-2">
                        <div class="flex justify-between py-1 text-lg font-bold text-primary">
                            <span>Total Due:</span>
                            <span>${curr}${inv.total.toFixed(2)}</span>
                        </div>
                    </div>
                </div>
            </div>
        `;

        modal.classList.add('active');
    },

    closePreviewModal() {
        const modal = document.getElementById('modal-invoice-preview');
        if (modal) modal.classList.remove('active');
    },

    printCurrentInvoice() {
        window.print();
    },

    markAsPaid(id) {
        const inv = this.invoices.find(i => i.id === id);
        if (inv) {
            inv.status = 'paid';
            this.save();
            this.renderInvoiceList();
            window.App?.showToast(`Invoice ${inv.invoiceNumber} marked as Paid!`, 'success');
        }
    },

    deleteInvoice(id) {
        if (!confirm('Are you sure you want to delete this invoice?')) return;
        this.invoices = this.invoices.filter(i => i.id !== id);
        this.save();
        this.renderInvoiceList();
        window.App?.showToast('Invoice deleted.', 'info');
    },

    openChaserModal(id) {
        const inv = this.invoices.find(i => i.id === id);
        if (!inv) return;

        const profile = window.App?.getCurrentBusinessProfile() || {};
        const chaser = window.AIEngine.generateInvoiceChaser({
            invoice: inv,
            businessProfile: profile,
            urgency: inv.status === 'overdue' ? 'firm' : 'polite'
        });

        const modal = document.getElementById('modal-invoice-chaser');
        if (!modal) return;

        document.getElementById('chaser-invoice-num').innerText = inv.invoiceNumber;
        document.getElementById('chaser-recipient').innerText = `${inv.clientName} (${inv.clientEmail || 'No email'})`;
        document.getElementById('chaser-subject').value = chaser.subject;
        document.getElementById('chaser-body').value = chaser.body;

        modal.dataset.invoiceId = id;
        modal.classList.add('active');
    },

    changeChaserUrgency(urgency) {
        const modal = document.getElementById('modal-invoice-chaser');
        const id = modal?.dataset.invoiceId;
        const inv = this.invoices.find(i => i.id === id);
        if (!inv) return;

        const profile = window.App?.getCurrentBusinessProfile() || {};
        const chaser = window.AIEngine.generateInvoiceChaser({
            invoice: inv,
            businessProfile: profile,
            urgency
        });

        document.getElementById('chaser-subject').value = chaser.subject;
        document.getElementById('chaser-body').value = chaser.body;
        window.App?.showToast(`Generated ${urgency} payment reminder!`, 'info');
    },

    copyChaserText() {
        const subject = document.getElementById('chaser-subject')?.value || '';
        const body = document.getElementById('chaser-body')?.value || '';
        const full = `Subject: ${subject}\n\n${body}`;

        navigator.clipboard.writeText(full).then(() => {
            window.App?.showToast('Reminder email copied to clipboard!', 'success');
        });
    },

    launchChaserEmail() {
        const modal = document.getElementById('modal-invoice-chaser');
        const id = modal?.dataset.invoiceId;
        const inv = this.invoices.find(i => i.id === id);
        const email = inv?.clientEmail || '';

        const subject = encodeURIComponent(document.getElementById('chaser-subject')?.value || '');
        const body = encodeURIComponent(document.getElementById('chaser-body')?.value || '');

        window.open(`mailto:${email}?subject=${subject}&body=${body}`, '_blank');
    },

    closeChaserModal() {
        const modal = document.getElementById('modal-invoice-chaser');
        if (modal) modal.classList.remove('active');
    }
};

window.InvoicesModule = InvoicesModule;
