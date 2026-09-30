/**
 * Marketing Posts Module Controller
 * Handles multi-platform social post generation (Instagram, Facebook, LinkedIn, X, TikTok),
 * realistic social feed previews, AI image prompts, and campaign queue.
 */

const MarketingModule = {
    campaigns: JSON.parse(localStorage.getItem('bizpilot_campaigns') || '[]'),
    currentPost: null,

    init() {
        this.renderCampaignQueue();
    },

    loadTopicPreset(type) {
        const profile = window.App?.getCurrentBusinessProfile() || {};
        const bName = profile.name || 'our business';
        const bType = profile.type || 'SME';

        const topicInput = document.getElementById('mkt-topic');
        const offerInput = document.getElementById('mkt-offer');
        const objSelect = document.getElementById('mkt-objective');

        if (type === 'launch') {
            objSelect.value = 'launch';
            topicInput.value = `Introducing our new premium ${bType} service line for this season`;
            offerInput.value = '20% off for the first 15 bookings using code LAUNCH20';
        } else if (type === 'sale') {
            objSelect.value = 'promo';
            topicInput.value = `Weekend Flash Sale on all signature offerings at ${bName}`;
            offerInput.value = 'Buy 1, Get the 2nd at 50% off until Sunday midnight';
        } else if (type === 'behind_scenes') {
            objSelect.value = 'behind_scenes';
            topicInput.value = `How our team prepares every morning before opening the doors`;
            offerInput.value = '';
        } else if (type === 'testimonial') {
            objSelect.value = 'testimonial';
            topicInput.value = `Spotlight on a long-time customer who achieved incredible results with us`;
            offerInput.value = 'Mention this story to receive a complimentary bonus gift';
        }

        window.App?.showToast('Marketing topic preset loaded!', 'info');
    },

    generatePost() {
        const platform = document.querySelector('input[name="mkt-platform"]:checked')?.value || 'instagram';
        const objective = document.getElementById('mkt-objective')?.value || 'launch';
        const topic = document.getElementById('mkt-topic')?.value || '';
        const specialOffer = document.getElementById('mkt-offer')?.value || '';

        const profile = window.App?.getCurrentBusinessProfile() || {};
        const btn = document.getElementById('btn-generate-post');

        const originalText = btn.innerHTML;
        btn.innerHTML = '<span class="spinner-small"></span> Crafting Campaign...';
        btn.disabled = true;

        setTimeout(() => {
            const post = window.AIEngine.generateMarketingPost({
                businessProfile: profile,
                platform,
                objective,
                topic,
                specialOffer
            });

            this.currentPost = post;
            this.renderPostPreview(post, platform, profile);
            btn.innerHTML = originalText;
            btn.disabled = false;
            window.App?.showToast(`Generated high-converting ${platform.toUpperCase()} post!`, 'success');
        }, 300);
    },

    renderPostPreview(post, platform, profile) {
        const container = document.getElementById('marketing-preview-container');
        if (!container) return;

        const bName = profile.name || 'Business Name';
        const handle = '@' + bName.toLowerCase().replace(/[^a-z0-9]/g, '');

        let platformCardHtml = '';

        if (platform === 'instagram') {
            platformCardHtml = `
                <div class="social-mockup mockup-instagram">
                    <div class="mockup-header">
                        <div class="flex items-center gap-2">
                            <div class="avatar-sm gradient-ig">${bName.charAt(0)}</div>
                            <div>
                                <div class="font-bold text-xs">${handle}</div>
                                <div class="text-[10px] text-muted">${profile.type || 'SME'} • Sponsored / Organic</div>
                            </div>
                        </div>
                        <span class="text-muted text-xs">•••</span>
                    </div>

                    <div class="mockup-visual-prompt">
                        <div class="visual-badge">🎨 AI Suggested Visual Asset</div>
                        <p class="text-xs italic text-slate-700">"${post.imagePrompt}"</p>
                        <button class="btn btn-xs btn-outline mt-2" onclick="MarketingModule.copyImagePrompt()">📋 Copy Prompt for Canva / Midjourney</button>
                    </div>

                    <div class="mockup-body">
                        <div class="flex gap-3 text-base my-2 text-slate-700">
                            <span>❤️ 248</span>
                            <span>💬 34</span>
                            <span>↗️ 12</span>
                            <span class="ml-auto">🔖</span>
                        </div>
                        <div class="text-xs text-slate-800">
                            <strong>${handle}</strong> <span id="post-caption-text">${post.caption.replace(/\n/g, '<br>')}</span>
                        </div>
                        <div class="text-xs text-primary font-medium mt-2" id="post-hashtags-text">
                            ${post.hashtags.join(' ')}
                        </div>
                        <div class="text-[11px] text-muted mt-2">Recommended CTA: ${post.cta}</div>
                    </div>
                </div>
            `;
        } else if (platform === 'facebook') {
            platformCardHtml = `
                <div class="social-mockup mockup-facebook">
                    <div class="mockup-header">
                        <div class="flex items-center gap-2">
                            <div class="avatar-sm bg-blue-600 text-white">${bName.charAt(0)}</div>
                            <div>
                                <div class="font-bold text-xs">${bName}</div>
                                <div class="text-[10px] text-muted">Just now • 🌍 Public</div>
                            </div>
                        </div>
                        <span class="text-muted text-xs">•••</span>
                    </div>

                    <div class="mockup-body">
                        <div class="text-xs text-slate-800" id="post-caption-text">
                            ${post.caption.replace(/\n/g, '<br>')}
                        </div>
                        <div class="text-xs text-blue-600 font-medium mt-2" id="post-hashtags-text">
                            ${post.hashtags.join(' ')}
                        </div>
                    </div>

                    <div class="mockup-visual-prompt">
                        <div class="visual-badge">🖼️ Photo Asset Recommendation</div>
                        <p class="text-xs italic text-slate-700">"${post.imagePrompt}"</p>
                    </div>

                    <div class="mockup-footer-fb">
                        <span>👍 Like (42)</span>
                        <span>💬 Comment (18)</span>
                        <span>↗️ Share (7)</span>
                    </div>
                </div>
            `;
        } else if (platform === 'linkedin') {
            platformCardHtml = `
                <div class="social-mockup mockup-linkedin">
                    <div class="mockup-header">
                        <div class="flex items-center gap-2">
                            <div class="avatar-sm bg-blue-800 text-white">${bName.charAt(0)}</div>
                            <div>
                                <div class="font-bold text-xs">${bName}</div>
                                <div class="text-[10px] text-muted">${profile.ownerName || 'Founder'} • 1st • Enterprise ${profile.type || 'SME'}</div>
                            </div>
                        </div>
                        <button class="btn btn-xs btn-outline text-blue-700">+ Follow</button>
                    </div>

                    <div class="mockup-body">
                        <div class="text-xs text-slate-800" id="post-caption-text">
                            ${post.caption.replace(/\n/g, '<br>')}
                        </div>
                        <div class="text-xs text-blue-700 font-medium mt-2" id="post-hashtags-text">
                            ${post.hashtags.join(' ')}
                        </div>
                    </div>

                    <div class="mockup-visual-prompt">
                        <div class="visual-badge">💼 Business Visual Asset</div>
                        <p class="text-xs italic text-slate-700">"${post.imagePrompt}"</p>
                    </div>

                    <div class="mockup-footer-li">
                        <span>👏 Like</span>
                        <span>💬 Comment</span>
                        <span>🔄 Repost</span>
                        <span>📨 Send</span>
                    </div>
                </div>
            `;
        } else if (platform === 'twitter') {
            platformCardHtml = `
                <div class="social-mockup mockup-twitter">
                    <div class="mockup-header">
                        <div class="flex items-center gap-2">
                            <div class="avatar-sm bg-black text-white">${bName.charAt(0)}</div>
                            <div>
                                <div class="font-bold text-xs">${bName} <span class="text-muted font-normal">${handle}</span></div>
                            </div>
                        </div>
                    </div>

                    <div class="mockup-body">
                        <div class="text-xs text-slate-800" id="post-caption-text">
                            ${post.caption.replace(/\n/g, '<br>')}
                        </div>
                        <div class="text-xs text-sky-500 font-medium mt-2" id="post-hashtags-text">
                            ${post.hashtags.join(' ')}
                        </div>
                    </div>

                    <div class="mockup-footer-x">
                        <span>💬 14</span>
                        <span>🔄 28</span>
                        <span>❤️ 95</span>
                        <span>📊 3.2K</span>
                    </div>
                </div>
            `;
        } else {
            // TikTok / Reels
            platformCardHtml = `
                <div class="social-mockup mockup-tiktok">
                    <div class="mockup-header">
                        <span class="font-bold text-xs">🎬 Short-Form Video Script & Storyboard</span>
                        <span class="badge badge-accent">9:16 Video</span>
                    </div>
                    <div class="mockup-body">
                        <div class="bg-slate-900 text-slate-100 p-3 rounded-lg text-xs font-mono leading-relaxed" id="post-caption-text">
                            ${post.caption.replace(/\n/g, '<br>')}
                        </div>
                        <div class="text-xs text-sky-400 font-medium mt-2" id="post-hashtags-text">
                            ${post.hashtags.join(' ')}
                        </div>
                    </div>
                </div>
            `;
        }

        container.innerHTML = `
            <div class="card mb-4">
                <div class="flex justify-between items-center mb-3">
                    <h4 class="font-bold text-base">Live Preview (${platform.toUpperCase()})</h4>
                    <span class="text-xs text-muted">${post.estimatedEngagement}</span>
                </div>
                ${platformCardHtml}
                <div class="action-btn-group mt-4">
                    <button class="btn btn-sm btn-primary" onclick="MarketingModule.copyFullPost()">
                        📋 Copy Post & Hashtags
                    </button>
                    <button class="btn btn-sm btn-outline" onclick="MarketingModule.copyImagePrompt()">
                        🎨 Copy Image Prompt
                    </button>
                    <button class="btn btn-sm btn-accent" onclick="MarketingModule.saveToQueue()">
                        💾 Save to Campaign Queue
                    </button>
                </div>
            </div>
        `;

        container.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    },

    copyFullPost() {
        if (!this.currentPost) return;
        const full = `${this.currentPost.caption}\n\n${this.currentPost.hashtags.join(' ')}`;
        navigator.clipboard.writeText(full).then(() => {
            window.App?.showToast('Post caption & hashtags copied to clipboard!', 'success');
        });
    },

    copyImagePrompt() {
        if (!this.currentPost?.imagePrompt) return;
        navigator.clipboard.writeText(this.currentPost.imagePrompt).then(() => {
            window.App?.showToast('AI Image prompt copied! Paste into Midjourney, DALL-E, or Canva.', 'success');
        });
    },

    saveToQueue() {
        if (!this.currentPost) return;

        const campaign = {
            id: 'cmp_' + Date.now(),
            platform: this.currentPost.platform,
            objective: this.currentPost.objective,
            headline: this.currentPost.headline,
            caption: this.currentPost.caption,
            hashtags: this.currentPost.hashtags,
            createdAt: new Date().toLocaleDateString()
        };

        this.campaigns.unshift(campaign);
        localStorage.setItem('bizpilot_campaigns', JSON.stringify(this.campaigns));
        this.renderCampaignQueue();
        window.App?.showToast('Saved to your Scheduled Marketing Queue!', 'success');
    },

    renderCampaignQueue() {
        const container = document.getElementById('campaign-queue-list');
        if (!container) return;

        if (this.campaigns.length === 0) {
            container.innerHTML = `
                <div class="empty-state-sm">
                    <p class="text-xs text-muted">No scheduled campaigns yet. Generate a post above and click "Save to Campaign Queue".</p>
                </div>
            `;
            return;
        }

        let html = '';
        this.campaigns.slice(0, 6).forEach(c => {
            html += `
                <div class="saved-snippet-item">
                    <div class="snippet-header">
                        <span class="badge badge-primary text-[10px]">${c.platform.toUpperCase()}</span>
                        <button class="btn-icon text-danger" onclick="MarketingModule.deleteCampaign('${c.id}')" title="Delete">✕</button>
                    </div>
                    <p class="snippet-preview font-medium mt-1">${c.headline || c.caption.slice(0, 70)}...</p>
                    <div class="text-[10px] text-muted mt-1">Saved: ${c.createdAt}</div>
                    <div class="snippet-actions mt-2">
                        <button class="btn btn-xs btn-outline" onclick="MarketingModule.copySavedCampaign('${c.id}')">📋 Copy</button>
                    </div>
                </div>
            `;
        });

        container.innerHTML = html;
    },

    copySavedCampaign(id) {
        const c = this.campaigns.find(i => i.id === id);
        if (c) {
            const text = `${c.caption}\n\n${c.hashtags?.join(' ') || ''}`;
            navigator.clipboard.writeText(text).then(() => {
                window.App?.showToast('Campaign copied to clipboard!', 'success');
            });
        }
    },

    deleteCampaign(id) {
        this.campaigns = this.campaigns.filter(c => c.id !== id);
        localStorage.setItem('bizpilot_campaigns', JSON.stringify(this.campaigns));
        this.renderCampaignQueue();
        window.App?.showToast('Campaign removed.', 'info');
    }
};

window.MarketingModule = MarketingModule;
