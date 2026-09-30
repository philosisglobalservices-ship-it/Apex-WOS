/**
 * BizPilot AI - Core Intelligence Engine
 * Domain Knowledge for 25+ SME industries, natural language processing,
 * financial calculus, SWOT analysis, and heuristic generative reasoning.
 */

const AIEngine = {
    // Current active configuration
    config: {
        apiKey: localStorage.getItem('bizpilot_api_key') || '',
        apiProvider: localStorage.getItem('bizpilot_api_provider') || 'built-in', // 'built-in', 'gemini', 'openai'
        apiModel: localStorage.getItem('bizpilot_api_model') || 'gemini-1.5-flash'
    },

    // 25+ SME Industry Knowledge Base
    industryKnowledge: {
        'bakery_cafe': {
            name: 'Bakery & Artisan Cafe',
            category: 'Food & Beverage',
            typicalMargin: '60% - 70% Gross, 10% - 15% Net',
            keyMetrics: ['Average Ticket Size', 'Food Waste %', 'Peak Morning Rush Volume', 'Loyalty Repeat Rate'],
            targetAudience: 'Local residents, commuters, morning coffee lovers, catering seekers',
            topExpenses: ['Flour & Dairy Ingredients', 'Barista & Baker Wages', 'Commercial Kitchen Rent', 'Packaging & Cups'],
            marketingHooks: [
                'Fresh out of the oven at 6:30 AM 🥐',
                'Your morning coffee ritual, perfected ☕',
                'Pre-order weekend sourdough before it sells out!',
                'Catering your next morning team meeting 🥯'
            ],
            hashtags: ['#ArtisanBakery', '#LocalCoffee', '#FreshPastries', '#SourdoughClub', '#CafeVibes', '#MorningFuel'],
            swotDefaults: {
                strengths: ['High repeat daily foot traffic', 'Strong aroma & sensory appeal', 'High gross margins on specialty espresso'],
                weaknesses: ['Perishable inventory & food waste risk', 'Labor-intensive baking shifts (early mornings)', 'Morning-heavy revenue concentration'],
                opportunities: ['Introduce afternoon tea/workspace specials', 'Corporate office catering boxes', 'Custom celebration cakes & pre-orders'],
                threats: ['Rising ingredient costs (butter, cocoa, dairy)', 'Competition from national chain cafes', 'Utility rate hikes for ovens & refrigeration']
            }
        },
        'plumbing_hvac': {
            name: 'Plumbing & HVAC Services',
            category: 'Home & Trade Services',
            typicalMargin: '45% - 55% Gross, 15% - 22% Net',
            keyMetrics: ['First-Time Fix Rate', 'Average Job Revenue', 'Dispatch Travel Time', 'Maintenance Plan Conversions'],
            targetAudience: 'Homeowners, property managers, commercial landlords, general contractors',
            topExpenses: ['Pipes & Fixtures Inventory', 'Technician Wages & Overtime', 'Vehicle Fuel & Maintenance', 'Liability Insurance'],
            marketingHooks: [
                'No surprise fees: Upfront quotes before we turn a wrench 🔧',
                'Emergency leak? Our licensed techs arrive in under 60 minutes ⏱️',
                'Don’t wait for winter to check your furnace ❄️',
                'Clean, courteous, and shoe covers worn inside your home 🧼'
            ],
            hashtags: ['#PlumbingServices', '#HVACLife', '#HomeMaintenance', '#LicensedPlumber', '#EmergencyPlumbing', '#ComfortAtHome'],
            swotDefaults: {
                strengths: ['Essential recession-resistant service', 'High ticket emergency call-out pricing', 'Strong word-of-mouth & local reputation'],
                weaknesses: ['Heavy dependence on skilled licensed labor', 'Unpredictable emergency dispatch scheduling', 'High fleet vehicle & insurance overhead'],
                opportunities: ['Sell recurring annual HVAC/plumbing maintenance memberships', 'Water heater upgrades & green heat pump installations', 'Commercial property maintenance contracts'],
                threats: ['Shortage of certified apprentice technicians', 'Price gouging reputation from rogue competitors', 'Vehicle fuel price volatility']
            }
        },
        'boutique_retail': {
            name: 'Boutique Fashion & Retail',
            category: 'Retail & Fashion',
            typicalMargin: '50% - 60% Gross, 8% - 15% Net',
            keyMetrics: ['Inventory Turnover', 'Sales per Sq Ft', 'Basket Size (Units per Transaction)', 'Return Rate %'],
            targetAudience: 'Fashion-forward shoppers, gift buyers, lifestyle enthusiasts seeking unique curated pieces',
            topExpenses: ['Apparel Inventory & Freight', 'Retail Space Rent', 'Store Staff Wages', 'Visual Merchandising & Packaging'],
            marketingHooks: [
                'New arrivals just dropped in limited quantities ✨',
                'Pieces you won’t see everyone else wearing 👗',
                'Styling tips for effortlessly transitioning day to evening 💫',
                'VIP late-night shopping & bubbly this Thursday 🥂'
            ],
            hashtags: ['#BoutiqueStyle', '#ShopLocal', '#CuratedFashion', '#OOTDInspo', '#NewArrivals', '#SlowFashion'],
            swotDefaults: {
                strengths: ['Personalized styling service & customer touch', 'Unique curated collections not on Amazon', 'Agile seasonal merchandising'],
                weaknesses: ['Tied-up capital in unsold seasonal stock', 'Competition from ultra-fast fashion giants', 'Foot traffic volatility'],
                opportunities: ['Live selling on Instagram & TikTok', 'Omnichannel local pickup & e-commerce store', 'Private VIP shopping events and styling masterclasses'],
                threats: ['Consumer discretionary spending pullbacks', 'High return and sizing exchange costs', 'Rising retail rent in commercial districts']
            }
        },
        'digital_agency': {
            name: 'Digital Marketing & Web Agency',
            category: 'Professional Services & Tech',
            typicalMargin: '65% - 80% Gross, 20% - 35% Net',
            keyMetrics: ['Monthly Recurring Revenue (MRR)', 'Client Retention Rate', 'Customer Acquisition Cost (CAC)', 'Billable Utilization Rate'],
            targetAudience: 'SME owners, founders, B2B executives, e-commerce brands wanting revenue growth',
            topExpenses: ['Developer & Strategist Payroll', 'SaaS Software & Subscriptions', 'Ad Testing Budget', 'Contractor Freelancers'],
            marketingHooks: [
                'Stop wasting ad spend on vanity metrics. Focus on closed revenue 📈',
                'Case Study: How we grew a local business’s leads by 240% in 90 days 🚀',
                'Is your website silently losing customers? Request a free 5-minute audit 🔍',
                'Predictable client acquisition without cold messaging 🎯'
            ],
            hashtags: ['#MarketingAgency', '#GrowthMarketing', '#WebDesign', '#SEOStrategy', '#B2BGrowth', '#DigitalStrategy'],
            swotDefaults: {
                strengths: ['High client lifetime value on monthly retainers', 'Low physical capital requirements / remote flexibility', 'Scalable digital service offerings'],
                weaknesses: ['Client churn when goals aren’t aligned early', 'Heavy reliance on key personnel / founder selling', 'Scope creep on fixed-price projects'],
                opportunities: ['Productize recurring services into defined monthly tiers', 'AI workflow integrations for clients', 'Specialize in high-margin micro-niches (e.g., dental clinics or legal firms)'],
                threats: ['Low-cost offshore freelancer competition', 'Rapid platform algorithm changes (Google, Meta)', 'Client budget cuts during economic slowdowns']
            }
        },
        'hair_salon': {
            name: 'Hair & Beauty Salon',
            category: 'Personal Care & Beauty',
            typicalMargin: '50% - 65% Gross, 12% - 18% Net',
            keyMetrics: ['Chair Utilization %', 'Rebooking Rate at Checkout', 'Retail Product Sales %', 'Average Ticket with Add-ons'],
            targetAudience: 'Men & women seeking quality hair styling, coloring, skincare, and rejuvenating self-care',
            topExpenses: ['Professional Color & Product Stock', 'Stylist Commissions & Wages', 'Salon Chair Lease / Studio Rent', 'Towels & Laundry Services'],
            marketingHooks: [
                'Balayage transformation of the week 🎨✨',
                'Self-care Saturday: Treat your scalp to a deep moisture treatment 💆‍♀️',
                'Only 2 appointment slots left for this weekend! Book online in 30 seconds 📲',
                'Healthy hair secrets: What salon products actually do for your shine 🌿'
            ],
            hashtags: ['#SalonLife', '#HairTransformation', '#BalayageSpecialist', '#SelfCareDays', '#HealthyHairGoals', '#LocalStylist'],
            swotDefaults: {
                strengths: ['Deep personal client relationships and loyalty', 'High-frequency recurring service cycle (every 4-8 weeks)', 'Visual portfolio ideal for Instagram/TikTok marketing'],
                weaknesses: ['High risk of stylist departure taking clients', 'No-shows and last-minute cancellations without deposits', 'Physical capacity limits per chair per day'],
                opportunities: ['Upsell retail hair care products with every checkout', 'Implement non-refundable deposit booking system', 'Bridal and event packages with group pricing'],
                threats: ['Independent booth-rental suites attracting staff', 'Rising costs of high-end bleaching and color chemistry', 'Economic downturn leading to extended times between appointments']
            }
        },
        'fitness_studio': {
            name: 'Fitness Studio & Personal Training',
            category: 'Health & Fitness',
            typicalMargin: '60% - 75% Gross, 15% - 25% Net',
            keyMetrics: ['Member Churn Rate', 'Class Capacity Fill %', 'Average Lifetime Value (LTV)', 'Trainer Utilization Rate'],
            targetAudience: 'Individuals seeking weight loss, functional strength, community motivation, or athletic performance',
            topExpenses: ['Trainer Wages & Class Rates', 'Facility Rent & High Ceilings', 'Equipment Depreciation & Maintenance', 'Music & Software Licenses'],
            marketingHooks: [
                'Commit to 30 days. Feel the difference in 7 days ⚡',
                'No judgment, just progress: Welcome to your new fitness family 🏋️‍♂️',
                'Small group coaching with personal trainer attention at half the price 🔥',
                'Book your complimentary first session and body composition scan today 📋'
            ],
            hashtags: ['#FitnessCommunity', '#PersonalTraining', '#GroupFitness', '#StrongerEveryDay', '#WorkoutMotivation', '#HealthyHabits'],
            swotDefaults: {
                strengths: ['Recurring automated monthly subscription revenue', 'High camaraderie and community member retention', 'High energy, aspirational brand identity'],
                weaknesses: ['High January member surge followed by Spring drop-offs', 'Peak capacity constraints at 6 AM and 6 PM', 'Physical wear and tear on gym equipment'],
                opportunities: ['Nutrition coaching add-ons and digital meal plans', 'Corporate wellness packages for local companies', 'High-ticket 8-week transformation challenges'],
                threats: ['Budget gym chains offering $10/month memberships', 'Digital home fitness apps and connected equipment', 'Facility lease rate increases']
            }
        },
        'auto_repair': {
            name: 'Auto Repair & Detailing',
            category: 'Automotive',
            typicalMargin: '45% - 55% Gross, 12% - 20% Net',
            keyMetrics: ['Labor Hours Billed vs Clocked', 'Parts Markup %', 'Average Repair Order (ARO)', 'Return Customer %'],
            targetAudience: 'Vehicle owners, fleet managers, car enthusiasts, commuters needing reliable maintenance',
            topExpenses: ['OEM & Aftermarket Parts', 'Certified Mechanic Wages', 'Lift Equipment & Diagnostic Tool Leases', 'Hazardous Waste Disposal'],
            marketingHooks: [
                'Transparent auto repair: We send video inspection proof before fixing anything 🎥',
                'Brakes squeaking? Free 21-point safety brake check this week 🚗',
                'Oil change in 20 minutes without dealer wait times ⏱️',
                'Ceramic coating protection: Keep your car looking showroom new for 3 years 💎'
            ],
            hashtags: ['#AutoRepair', '#MechanicLife', '#CarCareTips', '#AutoDetailing', '#HonestMechanic', '#RoadTripReady'],
            swotDefaults: {
                strengths: ['High ticket repair orders ($500 - $3,000+)', 'In-person necessity that cannot be outsourced online', 'High customer loyalty once trust is established'],
                weaknesses: ['High capital investment in computer diagnostic scanners and lifts', 'Difficulty recruiting master certified mechanics', 'Negative industry stereotype of dishonest repair shops'],
                opportunities: ['Digital Vehicle Inspections (DVI) sent via SMS to build trust', 'Fleet maintenance contracts with local delivery companies', 'Hybrid & EV routine maintenance specialization'],
                threats: ['Increasing vehicle computer complexity requiring dealer-locked tools', 'Parts supply chain delays', 'Customer delay of optional preventive maintenance']
            }
        },
        'ecommerce_brand': {
            name: 'E-commerce & Direct-to-Consumer Brand',
            category: 'Retail & Digital Commerce',
            typicalMargin: '55% - 70% Gross, 10% - 20% Net',
            keyMetrics: ['Customer Acquisition Cost (CAC)', 'Return on Ad Spend (ROAS)', 'Cart Abandonment Rate', 'Repeat Purchase Rate'],
            targetAudience: 'Online consumers looking for niche specialty products with fast doorstep delivery',
            topExpenses: ['Product Manufacturing & COGS', 'Paid Social & Search Ads (Meta, Google)', 'Warehousing & 3PL Shipping', 'Payment Processing Fees'],
            marketingHooks: [
                'Over 10,000+ happy customers can’t be wrong ⭐⭐⭐⭐⭐',
                'Unboxing pure quality: See why this is our #1 bestseller 📦',
                'Free shipping on all orders over $50 + 30-day hassle-free returns 🚚',
                'Limited restock: Claim yours before this batch sells out ⏰'
            ],
            hashtags: ['#ShopOnline', '#D2CBrand', '#Unboxing', '#QualityCrafted', '#MustHave', '#CustomerFavorites'],
            swotDefaults: {
                strengths: ['Global or nationwide customer reach 24/7', 'Low physical overhead compared to brick-and-mortar', 'Direct customer data and email marketing list ownership'],
                weaknesses: ['High dependency on paid advertising platforms', 'Shipping carrier delays and damaged parcel claims', 'Zero physical tactile product experience prior to purchase'],
                opportunities: ['Subscription re-ordering for consumable products', 'TikTok Shop and affiliate creator partnerships', 'Wholesale expansion into local specialty boutiques'],
                threats: ['Rising digital customer acquisition costs (Meta/Google ad inflation)', 'Amazon duplicate listings and price undercutters', 'Strict payment gateway holdbacks and disputes']
            }
        },
        'general_sme': {
            name: 'Small & Medium Business',
            category: 'General SME',
            typicalMargin: '50% - 65% Gross, 12% - 20% Net',
            keyMetrics: ['Gross Revenue', 'Net Profit Margin', 'Customer Lifetime Value', 'Operating Cash Flow'],
            targetAudience: 'Local clients, consumers, and businesses seeking high quality, reliable personal service',
            topExpenses: ['Staff Payroll', 'Rent / Facilities', 'Supplies & Inventory', 'Software & Marketing'],
            marketingHooks: [
                'Quality you can count on, backed by our satisfaction guarantee ⭐',
                'Local service with personal attention to every single detail 🤝',
                'Book today or request a quick upfront quote in 2 minutes 📝',
                'Thank you for supporting an independent local business! 🏡'
            ],
            hashtags: ['#SmallBusiness', '#SupportLocal', '#QualityService', '#ClientAppreciation', '#LocalBiz'],
            swotDefaults: {
                strengths: ['Agility and rapid decision making without corporate red tape', 'Personal owner-to-customer relationships', 'Authentic reputation and community goodwill'],
                weaknesses: ['Cash flow sensitivity to late-paying customers', 'Owner wearing too many operational hats simultaneously', 'Limited marketing budget compared to national chains'],
                opportunities: ['AI automation of customer communication and invoicing', 'Strategic partnerships with complementary local businesses', 'Modernizing digital booking and online reviews'],
                threats: ['Macroeconomic inflation pressuring supplier costs', 'Tight labor market for reliable staff', 'Unforeseen cash flow crunches from delayed receivables']
            }
        }
    },

    /**
     * Look up or extrapolate industry data for any custom business type
     */
    getIndustryProfile(businessType) {
        if (!businessType) return this.industryKnowledge['general_sme'];

        const normalized = businessType.toLowerCase().trim();
        
        // Exact or partial match in predefined keys
        for (const [key, data] of Object.entries(this.industryKnowledge)) {
            if (normalized.includes(key) || key.includes(normalized) || 
                normalized.includes(data.name.toLowerCase()) || data.name.toLowerCase().includes(normalized)) {
                return data;
            }
        }

        // Semantic keyword matches
        if (normalized.includes('coffee') || normalized.includes('baker') || normalized.includes('food') || normalized.includes('restaurant') || normalized.includes('cook') || normalized.includes('pastry') || normalized.includes('cafe')) {
            return this.industryKnowledge['bakery_cafe'];
        }
        if (normalized.includes('plumb') || normalized.includes('hvac') || normalized.includes('electric') || normalized.includes('contract') || normalized.includes('roof') || normalized.includes('paint') || normalized.includes('handyman') || normalized.includes('landscap')) {
            return this.industryKnowledge['plumbing_hvac'];
        }
        if (normalized.includes('cloth') || normalized.includes('boutique') || normalized.includes('fashion') || normalized.includes('apparel') || normalized.includes('retail') || normalized.includes('shop') || normalized.includes('jewelry')) {
            return this.industryKnowledge['boutique_retail'];
        }
        if (normalized.includes('market') || normalized.includes('agency') || normalized.includes('design') || normalized.includes('consult') || normalized.includes('seo') || normalized.includes('web') || normalized.includes('tech') || normalized.includes('software')) {
            return this.industryKnowledge['digital_agency'];
        }
        if (normalized.includes('hair') || normalized.includes('salon') || normalized.includes('barber') || normalized.includes('spa') || normalized.includes('nail') || normalized.includes('beauty') || normalized.includes('massage')) {
            return this.industryKnowledge['hair_salon'];
        }
        if (normalized.includes('gym') || normalized.includes('fitness') || normalized.includes('train') || normalized.includes('coach') || normalized.includes('yoga') || normalized.includes('crossfit') || normalized.includes('sport')) {
            return this.industryKnowledge['fitness_studio'];
        }
        if (normalized.includes('auto') || normalized.includes('car') || normalized.includes('mechanic') || normalized.includes('detail') || normalized.includes('tire') || normalized.includes('motor')) {
            return this.industryKnowledge['auto_repair'];
        }
        if (normalized.includes('ecommerce') || normalized.includes('store') || normalized.includes('online') || normalized.includes('brand') || normalized.includes('d2c')) {
            return this.industryKnowledge['ecommerce_brand'];
        }

        // Dynamically synthesize a custom profile
        return {
            name: businessType,
            category: 'Custom SME Enterprise',
            typicalMargin: '50% - 65% Gross, 12% - 20% Net',
            keyMetrics: ['Revenue per Client', 'Client Retention Rate', 'Operational Turnaround Time', 'Customer Satisfaction Score'],
            targetAudience: `Customers and clients actively seeking reliable ${businessType} solutions`,
            topExpenses: ['Core Labor & Staffing', 'Primary Operating Space / Tools', 'Materials & Supplies', 'Software & Marketing'],
            marketingHooks: [
                `Top-rated ${businessType} services tailored to your exact needs ⭐`,
                `Experience the difference of dedicated, professional ${businessType} expertise 🤝`,
                `Now accepting new clients for this month! Inquire today 📲`,
                `Why quality matters when choosing a ${businessType} partner 💡`
            ],
            hashtags: [`#${businessType.replace(/[^a-zA-Z0-9]/g, '')}`, '#QualityService', '#ClientFirst', '#SmallBusinessSuccess', '#LocalExperts'],
            swotDefaults: {
                strengths: [`Direct client communication and tailored solutions in ${businessType}`, 'Agile service delivery with minimal bureaucracy', 'Focused niche expertise'],
                weaknesses: ['Resource constraints when juggling client fulfillment and sales', 'Dependence on key operational talent', 'Marketing visibility in competitive searches'],
                opportunities: ['Package signature services into predictable retainers or bundles', 'Leverage automated digital workflows and client booking', 'Build referral partnerships with adjacent local businesses'],
                threats: ['Price pressure from low-cost commoditized providers', 'Shifts in client demand or discretionary budgets', 'Inflationary pressure on direct operational costs']
            }
        };
    },

    /**
     * MODULE 1: AI Customer Replies Generator
     * Generates 3 distinct tailored draft replies across scenarios, channels, and tones
     */
    async generateCustomerReplies({ businessProfile, scenario, customerMessage, customerName, channel, tone, customInstruction }) {
        const profile = this.getIndustryProfile(businessProfile.type);
        const bName = businessProfile.name || 'Our Company';
        const ownerName = businessProfile.ownerName || 'The Team';
        const cName = customerName?.trim() || 'Valued Customer';

        // Built-in High Intelligence Generator
        return this.buildHeuristicCustomerReplies({ profile, bName, ownerName, cName, scenario, customerMessage, channel, tone, customInstruction });
    },

    buildHeuristicCustomerReplies({ profile, bName, ownerName, cName, scenario, customerMessage, channel, tone, customInstruction }) {
        let draftA = {};
        let draftB = {};
        let draftC = {};

        const isReview = scenario.includes('review') || channel === 'google' || channel === 'yelp';
        const isEmail = channel === 'email';
        const isSms = channel === 'sms' || channel === 'whatsapp' || channel === 'dm';

        // Tailored response matrices
        if (scenario === 'negative_review' || scenario === 'complaint') {
            draftA = {
                title: 'Empathetic & De-escalating (Recommended)',
                tone: 'Warm, sincere, and proactive',
                content: isSms
                    ? `Hi ${cName}, this is ${ownerName} from ${bName}. I saw your feedback and I am truly sorry your experience didn't meet our standards. Your satisfaction is our top priority. Could we connect today to make this completely right for you? Feel free to text or call me directly at this number.`
                    : isReview
                    ? `Dear ${cName},\n\nThank you for taking the time to share your feedback. At ${bName}, we take immense pride in delivering top-tier ${profile.name} service, and I am genuinely sorry to hear that we missed the mark during your recent visit.\n\nWe never want a customer to walk away disappointed. I would appreciate the opportunity to learn more about what happened and make things right for you personally. Please reach out to me directly at your earliest convenience.\n\nWarm regards,\n${ownerName}\nOwner, ${bName}`
                    : `Dear ${cName},\n\nThank you for reaching out and sharing your honest experience. We deeply value your business, and I sincerely apologize that our service fell short of what you expected from ${bName}.\n\nWe take your feedback very seriously. I have reviewed this with our team, and we want to ensure you are taken care of right away. Could you please let us know a convenient time for a quick call, or let us know if a complimentary replacement/refund would be preferred?\n\nThank you for giving us the chance to make this right.\n\nWarm regards,\n${ownerName}\n${bName}`,
                sentiment: 'De-escalating'
            };

            draftB = {
                title: 'Professional & Action-Oriented',
                tone: 'Direct, accountable, and resolution-focused',
                content: isSms
                    ? `Hello ${cName}, thank you for alerting us to this issue at ${bName}. We hold ourselves to strict quality standards and want to rectify this immediately. Please reply here or call us so we can issue a prompt resolution.`
                    : `Dear ${cName},\n\nThank you for bringing this matter to our attention. Quality and dependability are foundational to ${bName}, and what you described does not reflect our standard operating procedures.\n\nWe are actively investigating this with our staff to ensure it does not happen again. We want to resolve this for you immediately—whether through an expedited re-service, a full adjustment, or account credit.\n\nPlease reply with your order or appointment reference so our management team can process this without delay.\n\nSincerely,\n${bName} Management`,
                sentiment: 'Solution-Driven'
            };

            draftC = {
                title: 'Generous & Customer-First Retention',
                tone: 'Conciliatory with immediate compensation offer',
                content: isSms
                    ? `Hi ${cName}! ${ownerName} from ${bName} here. I was heartbroken to hear about your experience. We cherish our customers! I’ve personally credited your account and would love to invite you back for a complimentary visit on us whenever you're ready.`
                    : `Dear ${cName},\n\nFirst and foremost, please accept our heartfelt apologies. As an independent business, our customers mean the world to us, and it hurts to know that your experience was anything less than five stars.\n\nTo make amends, we would love to offer you a full courtesy voucher / 100% refund for your recent service, along with a personal VIP invitation back to ${bName} to demonstrate the exceptional care we are known for.\n\nThank you for helping us grow and improve every single day.\n\nBest wishes,\n${ownerName} & The ${bName} Team`,
                sentiment: 'High-Empathy'
            };
        } else if (scenario === 'positive_review') {
            draftA = {
                title: 'Warm & Community Focused (Recommended)',
                tone: 'Enthusiastic, grateful, and inviting',
                content: isReview
                    ? `Thank you so much, ${cName}! 🌟\n\nReading your kind words made our entire team smile! At ${bName}, we pour our hearts into delivering the very best ${profile.name} experience, and knowing you had a wonderful time means everything to us.\n\nWe can't wait to welcome you back again soon. Be sure to say hello to our team next time you visit!\n\nWarmly,\n${ownerName} & The ${bName} Family`
                    : `Hi ${cName},\n\nThank you so much for your glowing feedback! It was an absolute pleasure serving you. Our whole team at ${bName} is thrilled to know you had such a great experience.\n\nLooking forward to seeing you again soon!\n\nBest regards,\n${ownerName}\n${bName}`,
                sentiment: 'Celebratory'
            };

            draftB = {
                title: 'Referral & Loyalty Driver',
                tone: 'Friendly and strategically incentivizing repeat visits',
                content: `Dear ${cName},\n\nThank you for the wonderful 5-star review! ⭐ We truly appreciate your support of our local business.\n\nDid you know we have a customer appreciation & referral program? Next time you recommend a friend or colleague to ${bName}, both of you receive a special perk on your next visit! Ask our team about it anytime.\n\nThank you once again for choosing ${bName}!\n\nWarm regards,\n${ownerName}`,
                sentiment: 'Growth-Focused'
            };

            draftC = {
                title: 'Short, Punchy & Social-Ready',
                tone: 'Crisp, modern, and engaging',
                content: `You just made our day, ${cName}! 🙌 Thank you for the five stars and for being such a fantastic part of the ${bName} community. See you next time! ✨`,
                sentiment: 'Casual & Upbeat'
            };
        } else if (scenario === 'pricing_inquiry') {
            draftA = {
                title: 'Consultative & Value-Led (Recommended)',
                tone: 'Helpful, transparent, and confidence-inspiring',
                content: `Hi ${cName},\n\nThank you for reaching out to ${bName}! We would love to assist you with your ${profile.name} requirements.\n\nEvery project/service we provide is tailored for maximum quality and long-term value. Our typical packages range depending on your exact scope, and we always provide clear, transparent upfront pricing with zero hidden fees.\n\nCould you share a few quick details about what you have in mind? Alternatively, I'd be delighted to hop on a quick 5-minute call or send over our full service menu.\n\nLooking forward to helping you!\n\nBest regards,\n${ownerName}\n${bName}`,
                sentiment: 'Helpful & Trustworthy'
            };

            draftB = {
                title: 'Direct Quote & Next Steps',
                tone: 'Professional, structured, and fast',
                content: `Hello ${cName},\n\nThank you for your interest in ${bName}. Here is an overview of our standard pricing and process:\n\n• Standard Service Tier: Comprehensive coverage tailored to your needs\n• Turnaround: Prompt and dependable scheduling\n• Guarantee: 100% satisfaction commitment on all workmanship\n\nTo give you an exact itemized quote, please let us know your preferred timeline and specific details. We can book your slot as soon as this week!\n\nSincerely,\n${bName} Team`,
                sentiment: 'Clear & Structured'
            };

            draftC = {
                title: 'Quick Chat / Instant Scheduling',
                tone: 'Brisk, mobile-first, and low-friction',
                content: isSms
                    ? `Hi ${cName}! Thanks for asking about pricing at ${bName}. We offer competitive, upfront rates with zero surprise fees. Do you have 2 minutes for a quick text or call so I can give you an exact quote right now?`
                    : `Hi ${cName},\n\nThanks for checking in with ${bName}! We’d love to take care of this for you. You can view our transparent pricing and reserve your spot directly on our calendar, or reply here with any questions.\n\nBest,\n${ownerName}`,
                sentiment: 'Fast Action'
            };
        } else if (scenario === 'reschedule_delay') {
            draftA = {
                title: 'Courteous & Accountable (Recommended)',
                tone: 'Professional, apologetic, and solution-ready',
                content: `Dear ${cName},\n\nI am writing to personally update you regarding your upcoming appointment/order with ${bName}. Due to an unforeseen operational delay, we need to adjust our scheduled time.\n\nI sincerely apologize for any inconvenience this may cause to your day. We hold ourselves to strict standards of punctuality, and we want to ensure we give your project the full, undivided attention it deserves.\n\nWould either of the following alternate times work smoothly for your schedule?\n1. Tomorrow at the same time\n2. Later this week at your convenience\n\nTo thank you for your patience, we are applying a courtesy discount to your invoice. Please let me know what works best for you!\n\nWarm regards,\n${ownerName}\n${bName}`,
                sentiment: 'Accountable'
            };

            draftB = {
                title: 'Concise & Direct Notice',
                tone: 'Direct, clear, and easy to respond to',
                content: isSms
                    ? `Hi ${cName}, this is ${bName}. We are running slightly behind schedule today and want to ensure you get our full care. Can we push back your appointment by 45 minutes, or would you prefer to reschedule for tomorrow? So sorry for the inconvenience!`
                    : `Hello ${cName},\n\nWe wanted to proactively notify you that our team is experiencing a minor schedule delay for your appointment today with ${bName}.\n\nWe want to ensure your service is never rushed. Please let us know if you prefer to adjust by an hour today or select a new date that fits your calendar seamlessly.\n\nThank you for your understanding,\n${bName}`,
                sentiment: 'Clear Communication'
            };

            draftC = {
                title: 'High-Touch Concierge Reschedule',
                tone: 'Attentive with premium customer service focus',
                content: `Hi ${cName},\n\nYour time is exceptionally valuable, and I want to apologize directly for an unexpected delay in our schedule today. We are committed to giving you the premier ${bName} experience without any compromises.\n\nI am holding priority slots open on our calendar exclusively for you. Please reply with the time that fits your day best, and we will take care of every single detail.\n\nThank you so much for your grace and partnership,\n${ownerName}`,
                sentiment: 'VIP Care'
            };
        } else {
            // General Inquiry / Custom
            draftA = {
                title: 'Friendly & Informative (Recommended)',
                tone: 'Warm, comprehensive, and attentive',
                content: `Hi ${cName},\n\nThank you for reaching out to ${bName}! We would be delighted to assist you with your inquiry.\n\n${customerMessage ? `Regarding your note about "${customerMessage.slice(0, 80)}...": ` : ''}We pride ourselves on providing high-touch, dependable service. Everything we do is designed to give you peace of mind and great results.\n\nPlease let us know if you'd like us to prepare more information or assist you with placing your request!\n\nWarm regards,\n${ownerName}\n${bName}`,
                sentiment: 'Warm & Professional'
            };

            draftB = {
                title: 'Fast & Action-Oriented',
                tone: 'Crisp, direct, and straightforward',
                content: `Hello ${cName},\n\nThanks for contacting ${bName}. We have received your inquiry and are ready to help.\n\nHere are the next steps to get started:\n1. Confirm your desired timeline and specifications\n2. We will confirm your slot and send over all details\n\nLet us know how you'd like to proceed!\n\nBest,\n${bName} Team`,
                sentiment: 'Direct'
            };

            draftC = {
                title: 'Casual & Conversational',
                tone: 'Friendly and informal',
                content: `Hi ${cName}! Thanks so much for reaching out to us at ${bName}. We’d love to help you with this! Feel free to send over any other questions, or let us know when you'd like to get started. Have a great day! 😊\n\nCheers,\n${ownerName}`,
                sentiment: 'Conversational'
            };
        }

        return [draftA, draftB, draftC];
    },

    /**
     * MODULE 2: AI Smart Invoice Generator
     * Parses natural language into structured line items, calculates taxes, discounts, and payment terms
     */
    parseNaturalLanguageInvoice(promptText, businessProfile) {
        const text = promptText.trim();
        const currency = businessProfile.currency || '$';
        const defaultTax = Number(businessProfile.taxRate) || 0;

        // Extract client name
        let clientName = 'Client';
        const clientMatch = text.match(/(?:invoice|bill|for|to)\s+([A-Z][a-zA-Z0-9\s&]+?)(?:\s+for|\s+with|\s+due|\s+at|\s*\d|\.|$)/i);
        if (clientMatch && clientMatch[1]) {
            const candidate = clientMatch[1].trim();
            if (!['a', 'the', 'some', 'services', 'hours', 'products'].includes(candidate.toLowerCase())) {
                clientName = candidate;
            }
        }

        // Extract discount percentage or amount
        let discountPercent = 0;
        const discountMatch = text.match(/(\d+(?:\.\d+)?)\s*%\s*(?:discount|off)/i);
        if (discountMatch) {
            discountPercent = parseFloat(discountMatch[1]);
        }

        // Extract due days
        let dueDays = 14;
        const dueMatch = text.match(/due\s+(?:in\s+)?(\d+)\s*(?:days?|weeks?)/i);
        if (dueMatch) {
            const num = parseInt(dueMatch[1]);
            dueDays = text.toLowerCase().includes('week') ? num * 7 : num;
        }

        // Extract line items
        const items = [];
        
        const hoursRegex = /(\d+(?:\.\d+)?)\s*(?:hours?|hrs?)\s*(?:of\s+)?([^,]+?)\s*(?:at|@)\s*(?:\$|€|£|₦)?\s*(\d+(?:\.\d+)?)/gi;
        let match;
        while ((match = hoursRegex.exec(text)) !== null) {
            const qty = parseFloat(match[1]);
            const desc = match[2].trim().replace(/^(for|and)\s+/i, '');
            const rate = parseFloat(match[3]);
            items.push({
                description: `${desc} (${qty} hrs @ ${currency}${rate}/hr)`,
                quantity: qty,
                unitPrice: rate,
                total: qty * rate
            });
        }

        const unitRegex = /(\d+)\s*(?:units?|pieces?|sets?|x)?\s*(?:of\s+)?([^,]+?)\s*(?:at|@)\s*(?:\$|€|£|₦)?\s*(\d+(?:\.\d+)?)(?:\s*each|\/unit)?/gi;
        while ((match = unitRegex.exec(text)) !== null) {
            const qty = parseInt(match[1]);
            const desc = match[2].trim().replace(/^(for|and)\s+/i, '');
            const rate = parseFloat(match[3]);
            if (!desc.toLowerCase().includes('hour') && !items.some(i => i.description.includes(desc))) {
                items.push({
                    description: desc,
                    quantity: qty,
                    unitPrice: rate,
                    total: qty * rate
                });
            }
        }

        const flatRateRegex = /(?:and\s+)?(?:\$|€|£|₦)\s*(\d+(?:\.\d+)?)\s*(?:for\s+)([^,.]+)/gi;
        while ((match = flatRateRegex.exec(text)) !== null) {
            const rate = parseFloat(match[1]);
            const desc = match[2].trim();
            if (!items.some(i => i.description.toLowerCase().includes(desc.toLowerCase()))) {
                items.push({
                    description: desc,
                    quantity: 1,
                    unitPrice: rate,
                    total: rate
                });
            }
        }

        // Fallback default item if parsing found no explicit structured lines
        if (items.length === 0) {
            const anyAmountMatch = text.match(/(?:\$|€|£|₦)?\s*(\d+(?:\.\d+)?)/);
            const amt = anyAmountMatch ? parseFloat(anyAmountMatch[1]) : 250;
            items.push({
                description: text.length > 5 ? text.slice(0, 60) : `${businessProfile.type || 'SME'} Professional Services`,
                quantity: 1,
                unitPrice: amt,
                total: amt
            });
        }

        const subtotal = items.reduce((sum, item) => sum + item.total, 0);
        const discountAmount = (subtotal * discountPercent) / 100;
        const taxableAmount = Math.max(0, subtotal - discountAmount);
        const taxAmount = (taxableAmount * defaultTax) / 100;
        const total = taxableAmount + taxAmount;

        const issueDate = new Date();
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + dueDays);

        return {
            invoiceNumber: 'INV-' + Math.floor(1000 + Math.random() * 9000),
            clientName: clientName || 'Valued Client',
            clientEmail: `${clientName.toLowerCase().replace(/[^a-z0-9]/g, '') || 'client'}@example.com`,
            issueDate: issueDate.toISOString().split('T')[0],
            dueDate: dueDate.toISOString().split('T')[0],
            items: items,
            subtotal: Number(subtotal.toFixed(2)),
            discountPercent: discountPercent,
            discountAmount: Number(discountAmount.toFixed(2)),
            taxPercent: defaultTax,
            taxAmount: Number(taxAmount.toFixed(2)),
            total: Number(total.toFixed(2)),
            currency: currency,
            notes: `Payment due within ${dueDays} days. Thank you for supporting ${businessProfile.name || 'our business'}!`,
            paymentTerms: `Bank Transfer / Credit Card / ACH. Please reference the invoice number in your transfer notes.`
        };
    },

    /**
     * Generates an invoice overdue payment chaser email
     */
    generateInvoiceChaser({ invoice, businessProfile, urgency = 'polite' }) {
        const bName = businessProfile.name || 'Our Company';
        const ownerName = businessProfile.ownerName || 'Accounts Team';
        const client = invoice.clientName || 'Client';
        const invNum = invoice.invoiceNumber || 'INV-000';
        const total = `${invoice.currency || '$'}${invoice.total.toFixed(2)}`;
        const dueDate = invoice.dueDate || 'recently';

        if (urgency === 'urgent') {
            return {
                subject: `URGENT: Past Due Notice - Invoice ${invNum} (${total}) from ${bName}`,
                body: `Dear ${client},\n\nThis is an urgent notice regarding overdue Invoice ${invNum} in the amount of ${total}, which was due on ${dueDate}.\n\nDespite our previous reminders, our records indicate this payment remains unsettled. Please process this balance today via our primary payment instructions to avoid potential disruption to services or late payment fees.\n\nIf you have already remitted payment, please send over the confirmation receipt so we can update our accounts immediately.\n\nSincerely,\n${ownerName}\n${bName}`
            };
        } else if (urgency === 'firm') {
            return {
                subject: `Second Notice: Outstanding Invoice ${invNum} - ${bName}`,
                body: `Hello ${client},\n\nWe hope you are having a productive week. We are following up on Invoice ${invNum} for ${total}, which was due on ${dueDate}.\n\nWe kindly request that you review the attached invoice and arrange payment at your earliest convenience this week. If you have any questions regarding the invoice or need to discuss alternative payment terms, please reach out directly.\n\nThank you for your prompt attention to this.\n\nBest regards,\n${ownerName}\n${bName}`
            };
        } else {
            // Polite
            return {
                subject: `Friendly Reminder: Invoice ${invNum} from ${bName}`,
                body: `Hi ${client},\n\nWe hope you're having a wonderful week! Just a friendly reminder that Invoice ${invNum} for ${total} is currently due on ${dueDate}.\n\nWe have attached a copy of the invoice for your easy reference. Please let us know once payment has been scheduled, or if there's anything else we can assist you with.\n\nThank you so much for your business!\n\nWarm regards,\n${ownerName}\n${bName}`
            };
        }
    },

    /**
     * MODULE 3: AI Marketing Post Generator
     * Generates multi-platform posts (Instagram, Facebook, LinkedIn, X, TikTok) with hashtags, CTAs, and image prompts
     */
    generateMarketingPost({ businessProfile, platform, objective, topic, specialOffer }) {
        const profile = this.getIndustryProfile(businessProfile.type);
        const bName = businessProfile.name || 'Our Company';
        const rawTopic = topic?.trim() || `Our signature ${profile.name} offerings`;
        const offerText = specialOffer?.trim() ? `special offer: ${specialOffer}` : '';

        const hooks = profile.marketingHooks || [
            'Big news for our community! 🎉',
            'Something exciting just arrived ✨',
            'Here is how you get the best results 💡',
            'Don’t miss out this weekend! ⏳'
        ];
        const randomHook = hooks[Math.floor(Math.random() * hooks.length)];

        let post = {
            platform: platform,
            objective: objective,
            headline: '',
            caption: '',
            hashtags: profile.hashtags || ['#SmallBusiness', '#ShopLocal', '#QualityFirst'],
            cta: '',
            imagePrompt: '',
            estimatedEngagement: 'High (Optimal timing: 9:00 AM or 6:30 PM)'
        };

        if (platform === 'instagram') {
            post.headline = `${randomHook}`;
            post.caption = `${randomHook}\n\nAt ${bName}, we believe in doing things the right way. Whether you're already a fan or discovering us for the first time, ${rawTopic} is here to elevate your day.\n\n${offerText ? `🔥 EXCLUSIVE PROMO: ${specialOffer}!\n\n` : ''}Drop a '❤️' in the comments if you love supporting independent local businesses!\n\n📍 Visit us in-person or tap the link in our bio to learn more!`;
            post.cta = 'Tap the link in our bio & save this post for later! 📲';
            post.imagePrompt = `Vibrant, high-resolution lifestyle photograph of ${rawTopic} inside a modern, beautifully lit ${profile.name} setting. Warm natural lighting, authentic depth of field, 8k resolution, photorealistic.`;
        } else if (platform === 'facebook') {
            post.headline = `Community Spotlight: What's New at ${bName}! 🌟`;
            post.caption = `Hey neighbors and friends! 👋\n\nWe have some exciting news to share today about ${rawTopic}.\n\nWhen we started ${bName}, our mission was simple: provide the absolute best ${profile.name} service with warmth, honesty, and care. Every week we are blown away by the loyalty of this amazing community.\n\n${offerText ? `🎁 As a token of our appreciation, we are offering: ${specialOffer}!\n\n` : ''}Question for you: What is your favorite thing about our ${profile.name}? Let us know in the comments below—we read and reply to every single one! 👇`;
            post.cta = 'Comment below or message our page to book/order today!';
            post.imagePrompt = `Engaging, warm community photograph showing happy customers and the friendly owner at ${bName}. Authentic smiles, bright cheerful ambiance.`;
        } else if (platform === 'linkedin') {
            post.headline = `Behind the Scenes: Lessons in Scaling a ${profile.name} 💼`;
            post.caption = `Running a small-to-medium enterprise in the ${profile.category} space teaches you one fundamental lesson every day:\n\nQuality is not an accident. It is the result of high intention, sincere effort, and intelligent execution.\n\nRecently at ${bName}, our focus has been on ${rawTopic}. We’ve learned that when you obsess over customer experience and refine your core delivery, growth naturally follows.\n\n${offerText ? `💡 For our network partners this month: We are launching ${specialOffer}.\n\n` : ''}What operational strategies are moving the needle most in your business this quarter? I'd love to connect with fellow entrepreneurs in the comments.`;
            post.cta = 'Connect with us or visit our website to explore enterprise partnerships.';
            post.imagePrompt = `Clean, modern editorial business portrait of a founder working in a sleek ${profile.name} environment. Crisp composition, subtle corporate aesthetic.`;
        } else if (platform === 'twitter') {
            post.headline = `Quick insight from ${bName} 🧵`;
            post.caption = `A reminder that the best ${profile.name} experience isn't complicated—it's built on consistency, care, and quality.\n\nRight now at ${bName}: ${rawTopic}.\n\n${offerText ? `👉 ${specialOffer}\n\n` : ''}RT to support independent local businesses! 🚀`;
            post.cta = 'Click the link to check availability today.';
            post.imagePrompt = `Bold, minimalist graphic with high contrast typography highlighting the key takeaway for ${bName}.`;
        } else if (platform === 'tiktok') {
            post.headline = `TikTok / Reels Hook: "Stop doing this until you know this secret..." 🎬`;
            post.caption = `POV: You just discovered the best ${profile.name} spot in town 🤫👀\n\n[VIDEO OUTLINE]:\n0:00 - 0:03 : Visual Hook (Close-up dynamic reveal of ${rawTopic})\n0:03 - 0:15 : Explain the problem / showcase behind-the-scenes craft\n0:15 - 0:25 : Reveal the final result & customer reaction\n0:25 - 0:30 : Call to action (${offerText || 'Follow for daily insider tips!'})\n\nAudio Recommendation: Trending uplifting lo-fi beat or upbeat viral audio.`;
            post.cta = 'Follow for more behind-the-scenes & link in bio to book!';
            post.imagePrompt = `Cinematic first-person perspective video still of hands crafting ${rawTopic}. High energy, vibrant contrast, shallow depth of field.`;
        }

        return post;
    },

    /**
     * MODULE 4: AI Sales Analysis Engine
     * Evaluates sales performance, detects trends, calculates AOV, and generates strategic growth advice
     */
    analyzeSalesData({ salesTransactions, businessProfile, targetMonthlyRevenue = 15000 }) {
        const profile = this.getIndustryProfile(businessProfile.type);
        const currency = businessProfile.currency || '$';

        if (!salesTransactions || salesTransactions.length === 0) {
            return {
                totalRevenue: 0,
                transactionCount: 0,
                averageOrderValue: 0,
                bestSellers: [],
                growthRate: 0,
                revenueByCategory: {},
                aiInsights: [
                    'No transaction data recorded yet. Add your first sale or load the sample data to see instant AI analysis!',
                    'Track transactions consistently to unlock automated revenue forecasting and margin leak alerts.'
                ],
                strategicAdvice: [
                    'Start by defining your top 3 signature products or service packages.',
                    'Establish an upfront deposit policy for bookings and custom work.'
                ]
            };
        }

        // Calculations
        const totalRevenue = salesTransactions.reduce((acc, t) => acc + (Number(t.amount) || 0), 0);
        const count = salesTransactions.length;
        const aov = count > 0 ? totalRevenue / count : 0;

        // Group by category/item
        const categoryMap = {};
        const itemMap = {};

        salesTransactions.forEach(t => {
            const cat = t.category || 'General';
            const item = t.item || t.description || 'Custom Service';
            const amt = Number(t.amount) || 0;

            categoryMap[cat] = (categoryMap[cat] || 0) + amt;
            itemMap[item] = (itemMap[item] || 0) + amt;
        });

        // Sort best sellers
        const bestSellers = Object.entries(itemMap)
            .map(([name, revenue]) => ({ name, revenue, share: ((revenue / totalRevenue) * 100).toFixed(1) }))
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 5);

        const topItem = bestSellers[0]?.name || 'Core Offerings';
        const topItemShare = bestSellers[0]?.share || '0';
        const targetPercent = Math.min(100, Math.round((totalRevenue / targetMonthlyRevenue) * 100));

        // Generate tailored AI insights based on SME profile
        const aiInsights = [];
        if (parseFloat(topItemShare) > 45) {
            aiInsights.push(`⚠️ Revenue Concentration Risk: "${topItem}" generates ${topItemShare}% of your total sales. Consider cross-selling complementary packages to diversify cash flow.`);
        } else {
            aiInsights.push(`✅ Healthy Product Mix: Your sales are well-distributed across your catalog, with "${topItem}" leading at ${topItemShare}% of revenue.`);
        }

        if (aov < 40) {
            aiInsights.push(`💡 Low Average Order Value (${currency}${aov.toFixed(2)}): In the ${profile.name} industry, introducing bundle pricing or checkout add-ons could elevate your AOV by 20-30%.`);
        } else {
            aiInsights.push(`🎯 Solid Ticket Size: Your AOV of ${currency}${aov.toFixed(2)} indicates healthy pricing power and customer trust.`);
        }

        aiInsights.push(`📈 Performance vs Target: You have achieved ${currency}${totalRevenue.toLocaleString()} (${targetPercent}% of your ${currency}${targetMonthlyRevenue.toLocaleString()} monthly target).`);

        // Strategic growth recommendations
        const strategicAdvice = [
            `1. Margin Expansion: Package "${topItem}" into a high-tier "VIP / Premium" option priced 35% higher with white-glove service. Typically 15-20% of SME customers immediately choose the top tier.`,
            `2. Retention Acceleration: Implement an automated 14-day post-purchase check-in sequence to solicit reviews and offer an exclusive repeat-booking voucher.`,
            `3. Re-engage Inactive Customers: Review customers who haven't ordered in 60+ days and send a personalized "We Miss You" promotion.`
        ];

        return {
            totalRevenue: Number(totalRevenue.toFixed(2)),
            transactionCount: count,
            averageOrderValue: Number(aov.toFixed(2)),
            targetMonthlyRevenue,
            targetPercent,
            bestSellers,
            revenueByCategory: categoryMap,
            aiInsights,
            strategicAdvice
        };
    },

    /**
     * MODULE 5: AI Expense Summaries & Budget Optimizer
     * Evaluates cost structures, P&L, burn rate, and pinpoints savings
     */
    analyzeExpenses({ expenses, salesRevenue = 0, businessProfile }) {
        const profile = this.getIndustryProfile(businessProfile.type);
        const currency = businessProfile.currency || '$';

        if (!expenses || expenses.length === 0) {
            return {
                totalExpenses: 0,
                netProfit: salesRevenue,
                netMarginPercent: salesRevenue > 0 ? 100 : 0,
                expenseByCategory: {},
                aiCostAdvice: [
                    'No expenses logged yet. Add your operating costs to generate full Profit & Loss visibility.',
                    'Tracking recurring subscriptions and inventory costs prevents silent profit margin erosion.'
                ]
            };
        }

        const totalExpenses = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
        const netProfit = salesRevenue - totalExpenses;
        const netMarginPercent = salesRevenue > 0 ? ((netProfit / salesRevenue) * 100).toFixed(1) : 0;

        // Group by category
        const expenseByCategory = {};
        expenses.forEach(e => {
            const cat = e.category || 'Miscellaneous';
            expenseByCategory[cat] = (expenseByCategory[cat] || 0) + (Number(e.amount) || 0);
        });

        // Identify highest cost driver
        const sortedCats = Object.entries(expenseByCategory)
            .map(([cat, amt]) => ({ cat, amt, percent: ((amt / totalExpenses) * 100).toFixed(1) }))
            .sort((a, b) => b.amt - a.amt);

        const primaryDriver = sortedCats[0];

        // AI Cost Advice
        const aiCostAdvice = [];
        if (salesRevenue > 0 && totalExpenses > salesRevenue) {
            aiCostAdvice.push(`🚨 CRITICAL CASH DRAIN: Operating at a net loss of ${currency}${Math.abs(netProfit).toFixed(2)}. Immediate overhead reduction or sales acceleration required to protect working capital.`);
        } else if (salesRevenue > 0 && parseFloat(netMarginPercent) < 15) {
            aiCostAdvice.push(`⚠️ Tight Net Margin (${netMarginPercent}%): Benchmark for healthy ${profile.name} businesses is typically 15% - 25%. Trimming non-essential overhead will significantly build your buffer.`);
        } else {
            aiCostAdvice.push(`✅ Strong Bottom Line: Healthy Net Profit of ${currency}${netProfit.toFixed(2)} (${netMarginPercent}% net margin) puts your business in the top quartile of ${profile.name} operators.`);
        }

        if (primaryDriver) {
            aiCostAdvice.push(`🔍 Biggest Spend Category: "${primaryDriver.cat}" accounts for ${primaryDriver.percent}% (${currency}${primaryDriver.amt.toFixed(2)}) of total overhead. Benchmarking this category against competing suppliers could yield 8-12% annual savings.`);
        }

        aiCostAdvice.push(`💡 Optimization Rule: Conduct a "SaaS & Supplier Audit" every quarter. Cancel unused auto-renewals and request annual prepayment discounts (usually 15-20% off).`);

        return {
            totalExpenses: Number(totalExpenses.toFixed(2)),
            netProfit: Number(netProfit.toFixed(2)),
            netMarginPercent: Number(netMarginPercent),
            expenseByCategory,
            categoryBreakdown: sortedCats,
            aiCostAdvice
        };
    },

    /**
     * MODULE 6: Comprehensive AI Business Reports
     * Generates executive summary, financial health grade, full SWOT analysis, and 30-day prioritized action plan
     */
    generateBusinessReport({ businessProfile, salesData, expenseData }) {
        const profile = this.getIndustryProfile(businessProfile.type);
        const bName = businessProfile.name || 'Our Company';
        const currency = businessProfile.currency || '$';

        const rev = salesData.totalRevenue || 0;
        const exp = expenseData.totalExpenses || 0;
        const net = rev - exp;
        const margin = rev > 0 ? ((net / rev) * 100).toFixed(1) : '0.0';

        // Calculate SME Health Grade (A+ to F)
        let healthScore = 75; // baseline
        if (net > 0) healthScore += 10;
        if (parseFloat(margin) >= 20) healthScore += 10;
        if (salesData.transactionCount >= 10) healthScore += 5;
        if (rev >= (salesData.targetMonthlyRevenue || 15000)) healthScore += 10;
        if (net < 0) healthScore -= 25;
        if (salesData.transactionCount === 0) healthScore -= 15;
        healthScore = Math.max(30, Math.min(98, healthScore));

        let healthGrade = 'B+';
        if (healthScore >= 92) healthGrade = 'A+';
        else if (healthScore >= 85) healthGrade = 'A';
        else if (healthScore >= 78) healthGrade = 'B+';
        else if (healthScore >= 70) healthGrade = 'B';
        else if (healthScore >= 60) healthGrade = 'C';
        else healthGrade = 'D';

        // Executive Narrative
        const executiveSummary = `Executive Assessment for ${bName} (${profile.name}):\n\n` +
            `During the assessed operational cycle, ${bName} generated ${currency}${rev.toLocaleString()} in gross revenue across ${salesData.transactionCount} transactions, with an Average Order Value of ${currency}${salesData.averageOrderValue.toFixed(2)}. ` +
            `Total recorded operating expenditures reached ${currency}${exp.toLocaleString()}, producing a Net Profit of ${currency}${net.toLocaleString()} (${margin}% net margin).\n\n` +
            `Overall financial health is currently rated at "${healthGrade}" (${healthScore}/100). ` +
            (net >= 0 
                ? `The enterprise displays strong cash generation characteristics. Moving forward, the focus must shift toward customer lifetime value optimization and systematic lead generation.`
                : `The enterprise is currently navigating tight liquidity. Immediate strategic adjustments to pricing tiers and operational overhead will restore positive working cash flow.`);

        // Dynamic SWOT Matrix
        const swot = {
            strengths: [
                ...profile.swotDefaults.strengths,
                `Current Average Order Value (${currency}${salesData.averageOrderValue.toFixed(2)}) shows solid customer transaction willingness`,
                `Established local presence and agility in ${profile.name} operations`
            ],
            weaknesses: [
                ...profile.swotDefaults.weaknesses,
                parseFloat(margin) < 15 ? `Net profit margin (${margin}%) leaves limited safety margin for unexpected downturns` : `Operational reliance on manual administrative coordination`,
                salesData.transactionCount < 5 ? `Limited transaction volume creates cash flow volatility` : `Opportunity to institutionalize recurring automated repeat business`
            ],
            opportunities: [
                ...profile.swotDefaults.opportunities,
                `Introduce tiered service bundles to raise average ticket size by 15-25%`,
                `Automate customer review generation to dominate local Google/search rankings`
            ],
            threats: [
                ...profile.swotDefaults.threats,
                `Inflationary pressure on direct supply, materials, and labor overhead`,
                `Customer acquisition cost increases across digital marketing channels`
            ]
        };

        // 30-Day Prioritized Action Checklist
        const actionChecklist = [
            { id: 'act_1', task: `Audit the top 3 revenue drivers and introduce a high-margin add-on package`, category: 'Revenue & Pricing', priority: 'High', completed: false },
            { id: 'act_2', task: `Contact past customers who haven't ordered in 45+ days with an exclusive VIP incentive`, category: 'Retention', priority: 'High', completed: false },
            { id: 'act_3', task: `Review expense logs and renegotiate primary vendor terms or cancel unused subscriptions`, category: 'Cost Optimization', priority: 'Medium', completed: false },
            { id: 'act_4', task: `Launch a scheduled 3x/week social marketing campaign targeting local clients`, category: 'Marketing', priority: 'Medium', completed: false },
            { id: 'act_5', task: `Standardize invoice follow-up workflows with automated 3-day and 7-day payment reminders`, category: 'Cash Flow', priority: 'High', completed: false }
        ];

        return {
            generatedAt: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
            healthScore,
            healthGrade,
            executiveSummary,
            swot,
            actionChecklist,
            financialSnapshot: {
                revenue: rev,
                expenses: exp,
                netProfit: net,
                marginPercent: margin,
                aov: salesData.averageOrderValue
            }
        };
    },

    /**
     * GLOBAL AI COPILOT: Interactive Chat Assistant
     */
    async askCopilot({ userMessage, businessProfile, salesData, expenseData }) {
        const profile = this.getIndustryProfile(businessProfile.type);
        const bName = businessProfile.name || 'Your Business';
        const currency = businessProfile.currency || '$';

        const q = userMessage.toLowerCase().trim();

        // Check for specific intents
        if (q.includes('price') || q.includes('pricing') || q.includes('rate') || q.includes('charge')) {
            return `Based on typical benchmarks for **${profile.name}** businesses:\n\n` +
                `1. **Value-Based Tiers**: Instead of a flat hourly rate, offer 3 distinct packages (Basic, Standard, VIP). Most clients choose the middle option, while 20% pick the highest tier, immediately raising your revenue.\n` +
                `2. **Include Your Hidden Overhead**: Ensure your prices account for taxes, insurance, software, and administrative downtime—not just direct labor.\n` +
                `3. **Current Performance**: Your current Average Order Value is **${currency}${salesData?.averageOrderValue?.toFixed(2) || '0.00'}**. A 10% price increase on non-commodity services rarely causes customer churn but flows directly to your net bottom line!`;
        }

        if (q.includes('marketing') || q.includes('customer') || q.includes('lead') || q.includes('grow')) {
            return `Here is a high-ROI growth playbook for **${bName}**:\n\n` +
                `• **Google Business Profile**: Ask your last 5 happy customers for a 5-star Google review. Businesses with 20+ recent reviews capture over 60% of local search clicks.\n` +
                `• **Collaborative Local Partnerships**: Partner with non-competing businesses that share your demographic (e.g. if you're a bakery, partner with local event planners).\n` +
                `• **Social Proof**: Use our **Marketing Posts** tab to schedule consistent weekly behind-the-scenes content showcasing your craft and real customer testimonials.`;
        }

        if (q.includes('invoice') || q.includes('late') || q.includes('cash flow') || q.includes('paid')) {
            return `To tighten cash flow and ensure you get paid promptly at **${bName}**:\n\n` +
                `1. **Shorten Payment Terms**: Shift from Net-30 to **Net-14 or Due Upon Receipt**. SMEs that invoice within 24 hours of job completion get paid 40% faster.\n` +
                `2. **Upfront Deposits**: Require a 30-50% deposit before commencing any custom service or large order.\n` +
                `3. **Automated Reminders**: Use the **Invoices** tab to trigger a polite reminder 3 days before due date and a firm notice the day it's overdue.`;
        }

        if (q.includes('expense') || q.includes('profit') || q.includes('margin') || q.includes('cost')) {
            const rev = salesData?.totalRevenue || 0;
            const exp = expenseData?.totalExpenses || 0;
            const net = rev - exp;
            return `Financial health snapshot for **${bName}**:\n\n` +
                `• **Revenue**: ${currency}${rev.toLocaleString()}\n` +
                `• **Expenses**: ${currency}${exp.toLocaleString()}\n` +
                `• **Net Profit**: ${currency}${net.toLocaleString()} (${rev > 0 ? ((net / rev) * 100).toFixed(1) : 0}% margin)\n\n` +
                `**Tip**: Target an operational net margin between **15% and 25%** for ${profile.name}. Review your largest expense category and explore annual contract discounts or alternate vendors.`;
        }

        // General SME response
        return `Hello! As your **${profile.name}** AI Business Copilot, I'm here to help you scale **${bName}**.\n\n` +
            `I can help you with:\n` +
            `• 💬 Crafting replies to difficult customer reviews or price requests\n` +
            `• 🧾 Generating itemized professional invoices in seconds\n` +
            `• 📱 Writing viral social media campaigns tailored to your audience\n` +
            `• 📊 Analyzing your sales trends and spotting profit leaks\n` +
            `• 📋 Drafting executive business health & SWOT reports\n\n` +
            `What operational challenge would you like to tackle right now?`;
    }
};

window.AIEngine = AIEngine;
