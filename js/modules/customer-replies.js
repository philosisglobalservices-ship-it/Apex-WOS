/**
 * Customer Replies Module Controller
 * Handles customer message intake, scenario presets, multi-draft generation,
 * copy actions, email launching, and saved snippet management.
 */

const CustomerRepliesModule = {
    templates: JSON.parse(localStorage.getItem('bizpilot_saved_templates') || '[]'),

    init() {
        this.renderSavedSnippets();
    },

    loadSampleScenario(type) {
        const profile = window.App?.getCurrentBusinessProfile() || {};
        const bName = profile.name || 'our business';
        const bType = profile.type || 'SME';

        const nameInput = document.getElementById('reply-customer-name');
        const scenarioSelect = document.getElementById('reply-scenario');
        const channelSelect = document.getElementById('reply-channel');
        const messageInput = document.getElementById('reply-customer-message');

        if (type === 'negative_review') {
            scenarioSelect.value = 'negative_review';
            channelSelect.value = 'google';
            nameInput.value = 'Marcus Vance';
            messageInput.value = `I visited ${bName} yesterday afternoon. The wait time was over 35 minutes and nobody apologized. When our order finally arrived, it was lukewarm. Usually like this place, but really disappointed with the attitude and lack of care yesterday. 2 stars.`;
        } else if (type === 'positive_review') {
            scenarioSelect.value = 'positive_review';
            channelSelect.value = 'google';
            nameInput.value = 'Emily Zhang';
            messageInput.value = `Hands down the best ${bType} experience in the area! The team at ${bName} went above and beyond for us. Quality was top-notch, communication was fast, and the pricing was very fair. 5 stars, will definitely be coming back and recommending to everyone!`;
        } else if (type === 'pricing_inquiry') {
            scenarioSelect.value = 'pricing_inquiry';
            channelSelect.value = 'email';
            nameInput.value = 'David Miller';
            messageInput.value = `Hi there, I’m interested in your ${bType} services for an upcoming project next week. Can you provide your price list, availability, and whether you offer any first-time client discounts? Thanks!`;
        } else if (type === 'reschedule_delay') {
            scenarioSelect.value = 'reschedule_delay';
            channelSelect.value = 'email';
            nameInput.value = 'Sarah Connor';
            messageInput.value = `Regarding appointment confirmation for tomorrow at 2:00 PM. (Scenario: Need to notify client that our technician/team is delayed by 1 hour due to an emergency job).`;
        }
        
        window.App?.showToast('Sample customer scenario loaded!', 'info');
    },

    async generateReplies() {
        const scenario = document.getElementById('reply-scenario')?.value || 'general_inquiry';
        const channel = document.getElementById('reply-channel')?.value || 'email';
        const tone = document.getElementById('reply-tone')?.value || 'empathetic';
        const customerName = document.getElementById('reply-customer-name')?.value || '';
        const customerMessage = document.getElementById('reply-customer-message')?.value || '';
        const customInstruction = document.getElementById('reply-custom-instruction')?.value || '';

        const container = document.getElementById('reply-results-container');
        const btn = document.getElementById('btn-generate-replies');

        if (!customerMessage.trim() && !customerName.trim()) {
            window.App?.showToast('Please enter a customer message or customer name to generate replies.', 'warning');
            return;
        }

        // Loading state
        const originalBtnText = btn.innerHTML;
        btn.innerHTML = '<span class="spinner-small"></span> AI Thinking...';
        btn.disabled = true;

        try {
            const businessProfile = window.App?.getCurrentBusinessProfile() || {};
            const drafts = await window.AIEngine.generateCustomerReplies({
                businessProfile,
                scenario,
                customerMessage,
                customerName,
                channel,
                tone,
                customInstruction
            });

            this.renderDrafts(drafts, { scenario, customerName, channel });
            window.App?.showToast('3 Tailored AI Drafts Generated!', 'success');
        } catch (error) {
            console.error('Error generating replies:', error);
            window.App?.showToast('Error generating replies. Please try again.', 'danger');
        } finally {
            btn.innerHTML = originalBtnText;
            btn.disabled = false;
        }
    },

    renderDrafts(drafts, meta) {
        const container = document.getElementById('reply-results-container');
        if (!container) return;

        let html = `
            <div class="results-header">
                <div>
                    <h3 class="font-bold text-lg">AI Generated Responses</h3>
                    <p class="text-sm text-muted">Select the best option, copy to clipboard, or send directly via email.</p>
                </div>
                <span class="badge badge-accent">3 Drafts Ready</span>
            </div>
            <div class="drafts-grid">
        `;

        drafts.forEach((draft, idx) => {
            const encodedContent = encodeURIComponent(draft.content);
            const encodedSubject = encodeURIComponent(`Re: ${window.App?.getCurrentBusinessProfile()?.name || 'Inquiry'}`);
            const mailtoUrl = `mailto:?subject=${encodedSubject}&body=${encodedContent}`;

            html += `
                <div class="card draft-card" id="draft-card-${idx}">
                    <div class="draft-header">
                        <div class="draft-meta">
                            <span class="draft-number">Draft ${idx + 1}</span>
                            <span class="draft-title">${draft.title}</span>
                        </div>
                        <span class="badge ${idx === 0 ? 'badge-primary' : 'badge-neutral'}">${draft.sentiment}</span>
                    </div>
                    <div class="draft-tone-note">Tone: ${draft.tone}</div>
                    <div class="draft-body" id="draft-text-${idx}">${draft.content.replace(/\n/g, '<br>')}</div>
                    <div class="draft-actions">
                        <button class="btn btn-sm btn-primary" onclick="CustomerRepliesModule.copyDraft(${idx})">
                            📋 Copy Reply
                        </button>
                        ${meta.channel === 'email' ? `
                            <a href="${mailtoUrl}" class="btn btn-sm btn-outline" target="_blank">
                                ✉️ Open in Email
                            </a>
                        ` : ''}
                        <button class="btn btn-sm btn-ghost" onclick="CustomerRepliesModule.saveAsTemplate(${idx}, '${draft.title.replace(/'/g, "\\'")}')">
                            ⭐ Save Template
                        </button>
                    </div>
                </div>
            `;
        });

        html += '</div>';
        container.innerHTML = html;
        container.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    },

    copyDraft(idx) {
        const el = document.getElementById(`draft-text-${idx}`);
        if (!el) return;

        const text = el.innerText;
        navigator.clipboard.writeText(text).then(() => {
            window.App?.showToast('Draft copied to clipboard!', 'success');
        }).catch(() => {
            // Fallback
            const textarea = document.createElement('textarea');
            textarea.value = text;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            window.App?.showToast('Draft copied to clipboard!', 'success');
        });
    },

    saveAsTemplate(idx, title) {
        const el = document.getElementById(`draft-text-${idx}`);
        if (!el) return;

        const content = el.innerText;
        const newTemplate = {
            id: 'tpl_' + Date.now(),
            title: title || 'Custom Snippet',
            content: content,
            savedAt: new Date().toLocaleDateString()
        };

        this.templates.unshift(newTemplate);
        localStorage.setItem('bizpilot_saved_templates', JSON.stringify(this.templates));
        this.renderSavedSnippets();
        window.App?.showToast('Saved to your reusable templates!', 'success');
    },

    renderSavedSnippets() {
        const container = document.getElementById('saved-templates-list');
        if (!container) return;

        if (this.templates.length === 0) {
            container.innerHTML = `
                <div class="empty-state-sm">
                    <p class="text-xs text-muted">No saved templates yet. Click "Save Template" on any generated reply to store reusable responses here.</p>
                </div>
            `;
            return;
        }

        let html = '';
        this.templates.slice(0, 5).forEach(tpl => {
            html += `
                <div class="saved-snippet-item">
                    <div class="snippet-header">
                        <strong>${tpl.title}</strong>
                        <button class="btn-icon text-danger" onclick="CustomerRepliesModule.deleteTemplate('${tpl.id}')" title="Delete">✕</button>
                    </div>
                    <p class="snippet-preview">${tpl.content.slice(0, 90)}...</p>
                    <div class="snippet-actions">
                        <button class="btn btn-xs btn-outline" onclick="CustomerRepliesModule.copySnippetText('${tpl.id}')">📋 Copy</button>
                        <button class="btn btn-xs btn-ghost" onclick="CustomerRepliesModule.useSnippet('${tpl.id}')">Apply to Form</button>
                    </div>
                </div>
            `;
        });

        container.innerHTML = html;
    },

    copySnippetText(id) {
        const tpl = this.templates.find(t => t.id === id);
        if (tpl) {
            navigator.clipboard.writeText(tpl.content).then(() => {
                window.App?.showToast('Snippet copied to clipboard!', 'success');
            });
        }
    },

    useSnippet(id) {
        const tpl = this.templates.find(t => t.id === id);
        if (tpl) {
            const msgInput = document.getElementById('reply-customer-message');
            if (msgInput) {
                msgInput.value = tpl.content;
                window.App?.showToast('Template loaded into message field.', 'info');
            }
        }
    },

    deleteTemplate(id) {
        this.templates = this.templates.filter(t => t.id !== id);
        localStorage.setItem('bizpilot_saved_templates', JSON.stringify(this.templates));
        this.renderSavedSnippets();
        window.App?.showToast('Template removed.', 'info');
    }
};

window.CustomerRepliesModule = CustomerRepliesModule;
