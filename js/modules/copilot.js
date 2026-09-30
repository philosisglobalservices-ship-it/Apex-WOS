/**
 * Global AI Copilot Module Controller
 * Floating interactive SME business copilot drawer with context awareness
 */

const CopilotModule = {
    history: JSON.parse(localStorage.getItem('bizpilot_copilot_chat') || '[]'),
    isOpen: false,

    init() {
        if (this.history.length === 0) {
            this.addBotMessage(
                `👋 Hello! I am your **BizPilot AI Copilot**. I have full context on your active business profile, current sales figures, and invoices.\n\n` +
                `How can I help you grow your business today? Feel free to ask about pricing strategy, marketing angles, or cash flow optimization!`
            );
        }
        this.renderHistory();
        this.updateContextPills();
    },

    toggleDrawer() {
        this.isOpen = !this.isOpen;
        const drawer = document.getElementById('copilot-drawer');
        const overlay = document.getElementById('copilot-overlay');

        if (this.isOpen) {
            drawer?.classList.add('active');
            overlay?.classList.add('active');
            this.updateContextPills();
            setTimeout(() => document.getElementById('copilot-user-input')?.focus(), 200);
        } else {
            drawer?.classList.remove('active');
            overlay?.classList.remove('active');
        }
    },

    updateContextPills() {
        const profile = window.App?.getCurrentBusinessProfile() || {};
        const pill = document.getElementById('copilot-context-pill');
        if (pill) {
            pill.innerText = `Active: ${profile.name || 'SME'} (${profile.type || 'General'})`;
        }
    },

    renderHistory() {
        const container = document.getElementById('copilot-chat-messages');
        if (!container) return;

        let html = '';
        this.history.forEach(msg => {
            const isUser = msg.sender === 'user';
            const formattedContent = msg.text
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                .replace(/\n/g, '<br>');

            html += `
                <div class="chat-bubble-row ${isUser ? 'user-row' : 'bot-row'}">
                    ${!isUser ? '<div class="copilot-avatar">🤖</div>' : ''}
                    <div class="chat-bubble ${isUser ? 'bubble-user' : 'bubble-bot'}">
                        <div class="bubble-content">${formattedContent}</div>
                        <div class="bubble-time">${msg.time}</div>
                    </div>
                    ${isUser ? '<div class="user-avatar">👤</div>' : ''}
                </div>
            `;
        });

        container.innerHTML = html;
        container.scrollTop = container.scrollHeight;
    },

    addBotMessage(text) {
        this.history.push({
            id: 'msg_' + Date.now(),
            sender: 'bot',
            text: text,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        });
        this.save();
        this.renderHistory();
    },

    addUserMessage(text) {
        this.history.push({
            id: 'msg_' + Date.now(),
            sender: 'user',
            text: text,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        });
        this.save();
        this.renderHistory();
    },

    save() {
        localStorage.setItem('bizpilot_copilot_chat', JSON.stringify(this.history));
    },

    async sendMessage() {
        const input = document.getElementById('copilot-user-input');
        if (!input || !input.value.trim()) return;

        const userText = input.value.trim();
        input.value = '';

        this.addUserMessage(userText);

        // Show typing indicator
        const container = document.getElementById('copilot-chat-messages');
        const typingEl = document.createElement('div');
        typingEl.id = 'copilot-typing-indicator';
        typingEl.className = 'chat-bubble-row bot-row';
        typingEl.innerHTML = `
            <div class="copilot-avatar">🤖</div>
            <div class="chat-bubble bubble-bot">
                <div class="typing-dots">
                    <span></span><span></span><span></span>
                </div>
            </div>
        `;
        container?.appendChild(typingEl);
        container.scrollTop = container.scrollHeight;

        try {
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

            const reply = await window.AIEngine.askCopilot({
                userMessage: userText,
                businessProfile: profile,
                salesData,
                expenseData
            });

            document.getElementById('copilot-typing-indicator')?.remove();
            this.addBotMessage(reply);
        } catch (err) {
            document.getElementById('copilot-typing-indicator')?.remove();
            this.addBotMessage("I encountered a momentary hiccup. Please ask again or select one of the quick suggestions below.");
        }
    },

    sendQuickPrompt(promptText) {
        const input = document.getElementById('copilot-user-input');
        if (input) {
            input.value = promptText;
            this.sendMessage();
        }
    },

    clearChat() {
        this.history = [];
        this.save();
        this.init();
        window.App?.showToast('Copilot chat history cleared.', 'info');
    }
};

window.CopilotModule = CopilotModule;
