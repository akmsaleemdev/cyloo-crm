/**
 * ============================================================================
 * CYLOO CRM — Enterprise Module Registry & Architecture Manifest
 * ============================================================================
 *
 * Comprehensive, production-ready module architecture definition.
 * 36 Core Modules across 8 Business Hubs | 250+ Enterprise Features.
 *
 * Provides runtime metadata, permission scopes, feature flags, and dependency
 * mapping for multi-tenant SaaS provisioning and RBAC enforcement.
 */

export type BusinessHubId =
  | "hub_crm_sales"
  | "hub_omnichannel"
  | "hub_ai_automation"
  | "hub_marketing_growth"
  | "hub_customer_service"
  | "hub_commerce_finance"
  | "hub_enterprise_saas"
  | "hub_gcc_solutions";

export interface FeatureDefinition {
  id: string;
  name: string;
  description: string;
  isEnterpriseTierOnly?: boolean;
  requiredPermissions: string[];
}

export interface EnterpriseModule {
  id: string;
  moduleNumber: number;
  name: string;
  hub: BusinessHubId;
  description: string;
  iconName: string;
  routePrefix: string;
  isAddOn?: boolean;
  dependencies: string[];
  features: FeatureDefinition[];
}

export interface BusinessHub {
  id: BusinessHubId;
  hubNumber: number;
  name: string;
  tagline: string;
  colorToken: string;
}

export const BUSINESS_HUBS: Record<BusinessHubId, BusinessHub> = {
  hub_crm_sales: {
    id: "hub_crm_sales",
    hubNumber: 1,
    name: "CRM & Sales Management",
    tagline: "High-velocity pipeline, account intelligence & deal closing",
    colorToken: "oklch(0.44 0.19 265)", // CYLOO Blue
  },
  hub_omnichannel: {
    id: "hub_omnichannel",
    hubNumber: 2,
    name: "Omnichannel Communication",
    tagline: "WhatsApp, Instagram, TikTok, Email & Cloud Telephony in one workspace",
    colorToken: "oklch(0.75 0.17 155)", // CYLOO Green
  },
  hub_ai_automation: {
    id: "hub_ai_automation",
    hubNumber: 3,
    name: "Artificial Intelligence & Automation",
    tagline: "Multilingual autonomous AI agents, voice bots & visual workflows",
    colorToken: "oklch(0.62 0.19 300)", // Purple Intelligence
  },
  hub_marketing_growth: {
    id: "hub_marketing_growth",
    hubNumber: 4,
    name: "Marketing & Business Growth",
    tagline: "Precision multi-channel campaigns, ad attribution & high-converting funnels",
    colorToken: "oklch(0.65 0.22 35)", // Amber Growth
  },
  hub_customer_service: {
    id: "hub_customer_service",
    hubNumber: 5,
    name: "Customer Service & Operations",
    tagline: "Omnichannel SLA ticketing, calendar booking, project tasks & field service",
    colorToken: "oklch(0.55 0.14 240)", // Cyan Service
  },
  hub_commerce_finance: {
    id: "hub_commerce_finance",
    hubNumber: 6,
    name: "Commerce & Financial Operations",
    tagline: "Orders, subscriptions, ZATCA e-invoicing & RevOps analytics",
    colorToken: "oklch(0.60 0.18 160)", // Emerald Commerce
  },
  hub_enterprise_saas: {
    id: "hub_enterprise_saas",
    hubNumber: 7,
    name: "Enterprise SaaS & Administration",
    tagline: "Multi-tenant governance, data MDM, white-labeling & developer ecosystem",
    colorToken: "oklch(0.35 0.08 260)", // Slate Governance
  },
  hub_gcc_solutions: {
    id: "hub_gcc_solutions",
    hubNumber: 8,
    name: "GCC Localization & Industry Solutions",
    tagline: "Arabic-first RTL experience, VAT/ZATCA compliance & tailored verticals",
    colorToken: "oklch(0.50 0.15 140)", // Regional Gold/Green
  },
};

export const ENTERPRISE_MODULES: EnterpriseModule[] = [
  // ==========================================================================
  // HUB 1 — CRM & SALES MANAGEMENT
  // ==========================================================================
  {
    id: "mod_customer_360",
    moduleNumber: 1,
    name: "Customer 360° Management",
    hub: "hub_crm_sales",
    description: "Holistic customer records, unified interaction timelines, relationship mapping and custom schemas.",
    iconName: "Users",
    routePrefix: "/crm/contacts",
    dependencies: [],
    features: [
      { id: "c360_profiles", name: "Contacts & Account Profiles", description: "Rich entity management with custom avatars, tags, and lifecycle badges.", requiredPermissions: ["contacts:read"] },
      { id: "c360_timeline", name: "Unified Interaction Timeline", description: "Chronological touchpoint feed combining chats, calls, emails, notes, and purchases.", requiredPermissions: ["contacts:read"] },
      { id: "c360_custom_fields", name: "Dynamic Schema Builder", description: "Per-tenant extensible custom fields supporting text, date, formula, and relational lookups.", requiredPermissions: ["settings:write"] },
      { id: "c360_dedup", name: "Duplicate Detection & Merging", description: "Automated identity resolution and collision merging with field survivorship rules.", requiredPermissions: ["contacts:write"] },
      { id: "c360_import_export", name: "Data Import & Export", description: "Background CSV/Excel processor with column mapping assistant and rollback controls.", requiredPermissions: ["contacts:export"] },
    ],
  },
  {
    id: "mod_lead_management",
    moduleNumber: 2,
    name: "Lead Management & Routing",
    hub: "hub_crm_sales",
    description: "Omnichannel lead intake, automated qualification scoring, UTM attribution, and round-robin distribution.",
    iconName: "Target",
    routePrefix: "/crm/leads",
    dependencies: ["mod_customer_360"],
    features: [
      { id: "lead_capture", name: "Omnichannel Ingestion", description: "Universal ingestion webhooks from Meta, Google, TikTok, and web forms.", requiredPermissions: ["leads:read"] },
      { id: "lead_scoring", name: "Predictive & Heuristic Scoring", description: "Dynamic point accrual based on engagement signals, profile fit, and velocity.", requiredPermissions: ["leads:read"] },
      { id: "lead_attribution", name: "Multi-Touch UTM Attribution", description: "Full tracking of campaign, source, medium, ad set, and initial touchpoint.", requiredPermissions: ["leads:read"] },
      { id: "lead_routing", name: "Round-Robin & SLA Assignment", description: "Weighted distribution across sales agents with escalation timers for overdue contacts.", requiredPermissions: ["leads:write"] },
    ],
  },
  {
    id: "mod_sales_pipeline",
    moduleNumber: 3,
    name: "Sales Pipeline & Opportunity Management",
    hub: "hub_crm_sales",
    description: "Multi-currency customizable sales pipelines, drag-and-drop Kanban, deal rotting indicators, and forecasting.",
    iconName: "Kanban",
    routePrefix: "/crm/deals",
    dependencies: ["mod_customer_360"],
    features: [
      { id: "pipe_kanban", name: "Interactive Kanban Pipeline", description: "Optimistic drag-and-drop stage updates powered by accessible sensor engines.", requiredPermissions: ["deals:read"] },
      { id: "pipe_multi", name: "Multi-Pipeline Architecture", description: "Support for distinct pipelines across B2B sales, renewals, and partnerships.", requiredPermissions: ["deals:read"] },
      { id: "pipe_forecast", name: "Weighted Revenue Forecasting", description: "Win probability calculations by stage with projected month/quarter close figures.", requiredPermissions: ["reports:read"] },
      { id: "pipe_rotting", name: "Rotting Deal Alerts", description: "Visual decay alerts when deals remain stagnant beyond configurable day thresholds.", requiredPermissions: ["deals:read"] },
    ],
  },
  {
    id: "mod_sales_enablement",
    moduleNumber: 4,
    name: "Sales Enablement & Quotations",
    hub: "hub_crm_sales",
    description: "Product and service pricing catalogs, price books, multi-tier discount approval gates, and PDF proposals.",
    iconName: "FileText",
    routePrefix: "/billing-documents",
    dependencies: ["mod_sales_pipeline"],
    features: [
      { id: "quote_builder", name: "Interactive Proposal Builder", description: "Line item calculations with tiered discounts, taxes, and optional line selections.", requiredPermissions: ["quotes:write"] },
      { id: "quote_approvals", name: "Discount Approval Gates", description: "Tiered manager authorization triggered when discount margins exceed team policy.", requiredPermissions: ["quotes:approve"] },
      { id: "quote_pdf", name: "High-Fidelity PDF Renderer", description: "Dynamic server-side PDF generation customized with corporate white-label branding.", requiredPermissions: ["quotes:read"] },
      { id: "quote_commission", name: "Commission Calculations", description: "Automated sales rep commission tracking tied to realized deal values.", requiredPermissions: ["finance:read"] },
    ],
  },
  {
    id: "mod_account_territory",
    moduleNumber: 5,
    name: "Account & Territory Management",
    hub: "hub_crm_sales",
    description: "Parent-child corporate hierarchies, cross-border sales territories, and key account management strategies.",
    iconName: "Building2",
    routePrefix: "/crm/companies",
    dependencies: ["mod_customer_360"],
    features: [
      { id: "acc_hierarchy", name: "Corporate Entity Hierarchies", description: "Parent enterprise grouping with child branch and regional office visibility.", requiredPermissions: ["companies:read"] },
      { id: "acc_territory", name: "Geographic Territory Boundaries", description: "Rules-based account assignment determined by country, city, and industry vertical.", requiredPermissions: ["settings:write"] },
      { id: "acc_teams", name: "Dedicated Account Pods", description: "Multi-user account coverage teams spanning account managers, SDRs, and solution engineers.", requiredPermissions: ["companies:write"] },
    ],
  },
  {
    id: "mod_contract_lifecycle",
    moduleNumber: 6,
    name: "Contract Lifecycle Management (CLM) & Digital Legal Agreements",
    hub: "hub_crm_sales",
    description: "Enterprise contract authoring, NDA/MSA templates, redlining, multi-party e-signatures, and auto-renewal tracking.",
    iconName: "FileCheck",
    routePrefix: "/crm/contracts",
    dependencies: ["mod_sales_enablement"],
    features: [
      { id: "clm_templates", name: "Master Clause Library", description: "Pre-approved legal clauses, MSAs, NDAs, and SLAs with conditional insertion logic.", requiredPermissions: ["contracts:write"] },
      { id: "clm_esign", name: "Integrated E-Signature Engine", description: "Cryptographic digital signatures compliant with international ESIGN, eIDAS, and GCC regulations.", requiredPermissions: ["contracts:sign"] },
      { id: "clm_redlining", name: "Version Comparison & Redlining", description: "Audit trail tracking contract amendments between customer revisions.", requiredPermissions: ["contracts:write"] },
      { id: "clm_renewals", name: "Automated Renewal Tracking", description: "Proactive 90/60/30-day alerts for contract expirations, price indexes, and evergreen clauses.", requiredPermissions: ["contracts:read"] },
    ],
  },
  {
    id: "mod_partner_relationship",
    moduleNumber: 7,
    name: "Partner Relationship Management (PRM) & Channel Sales",
    hub: "hub_crm_sales",
    description: "Channel partner onboarding, tier management, deal registration conflict checks, and co-op marketing (MDF).",
    iconName: "Handshake",
    routePrefix: "/crm/partners",
    dependencies: ["mod_sales_pipeline"],
    features: [
      { id: "prm_portal", name: "Dedicated Partner Portal", description: "Isolated, branded workspace for external resellers, brokers, and agencies.", requiredPermissions: ["partners:read"] },
      { id: "prm_deal_reg", name: "Deal Registration & Conflict Lock", description: "Prevents channel conflict by granting exclusive opportunity rights for approved registrations.", requiredPermissions: ["deals:write"] },
      { id: "prm_mdf", name: "Market Development Funds (MDF)", description: "Budget allocation, expense proof verification, and co-branded marketing reimbursement.", requiredPermissions: ["finance:write"] },
    ],
  },

  // ==========================================================================
  // HUB 2 — OMNICHANNEL COMMUNICATION
  // ==========================================================================
  {
    id: "mod_unified_inbox",
    moduleNumber: 8,
    name: "Unified Omnichannel Inbox",
    hub: "hub_omnichannel",
    description: "Consolidated team messaging workstation uniting WhatsApp, Instagram, Messenger, TikTok, Email, and Web Chat.",
    iconName: "MessagesSquare",
    routePrefix: "/inbox",
    dependencies: ["mod_customer_360"],
    features: [
      { id: "inbox_realtime", name: "Real-Time Conversation Stream", description: "Supabase Realtime socket stream with live typing signals, unread badges, and presence indicators.", requiredPermissions: ["conversations:read"] },
      { id: "inbox_assignment", name: "Conversation Ownership Routing", description: "Manual and skill-based assignment of threads to agents and departmental teams.", requiredPermissions: ["conversations:write"] },
      { id: "inbox_internal_notes", name: "Internal Notes & Collaboration", description: "Private agent comments with @mention alerts invisible to external customers.", requiredPermissions: ["conversations:write"] },
      { id: "inbox_canned", name: "Canned Responses & Snippets", description: "Keyboard-shortcut macro snippets with dynamic CRM field variable interpolation.", requiredPermissions: ["conversations:write"] },
    ],
  },
  {
    id: "mod_whatsapp_automation",
    moduleNumber: 9,
    name: "WhatsApp Business Platform Automation",
    hub: "hub_omnichannel",
    description: "Official Meta WhatsApp Cloud API integration, message template syncing, interactive CTA buttons, and catalog sharing.",
    iconName: "MessageCircle",
    routePrefix: "/settings/whatsapp",
    dependencies: ["mod_unified_inbox"],
    features: [
      { id: "wa_cloud_api", name: "Official Cloud API Engine", description: "High-throughput messaging directly connecting to Meta Graph API servers.", requiredPermissions: ["settings:write"] },
      { id: "wa_templates", name: "HSM Template Synchronization", description: "Submit, verify, and synchronize approved multilingual utility and marketing templates.", requiredPermissions: ["marketing:write"] },
      { id: "wa_interactive", name: "Interactive Lists & Quick Replies", description: "Native button selections, catalog cards, and single/multi-product message dispatches.", requiredPermissions: ["conversations:write"] },
      { id: "wa_compliance", name: "24-Hour Service Window Guard", description: "Strict policy compliance enforcement preventing free-form messages outside active customer windows.", requiredPermissions: ["conversations:write"] },
    ],
  },
  {
    id: "mod_social_communication",
    moduleNumber: 10,
    name: "Social Media Direct Messaging",
    hub: "hub_omnichannel",
    description: "Professional messaging connectivity for Instagram Direct, Facebook Messenger, TikTok Business, and Snapchat leads.",
    iconName: "Share2",
    routePrefix: "/settings/social",
    dependencies: ["mod_unified_inbox"],
    features: [
      { id: "social_ig_direct", name: "Instagram DM Synchronization", description: "Two-way direct messaging, story mention replies, and media attachments.", requiredPermissions: ["conversations:read"] },
      { id: "social_fb_messenger", name: "Facebook Page Messaging", description: "Page conversation synchronization with automated greeting workflows.", requiredPermissions: ["conversations:read"] },
      { id: "social_tiktok", name: "TikTok Business Messaging", description: "Official TikTok direct conversation integration and ad lead form sync.", requiredPermissions: ["conversations:read"] },
      { id: "social_snapchat", name: "Snapchat Marketing Ingestion", description: "Real-time webhook synchronization from Snapchat lead generation ad forms.", requiredPermissions: ["leads:write"] },
    ],
  },
  {
    id: "mod_telephony_voice",
    moduleNumber: 11,
    name: "Email, SMS & Cloud Telephony",
    hub: "hub_omnichannel",
    description: "Bidirectional IMAP/SMTP email sync, multi-carrier SMS gateways, click-to-call WebRTC dialers, and call recordings.",
    iconName: "Volume2",
    routePrefix: "/settings/telephony",
    dependencies: ["mod_unified_inbox"],
    features: [
      { id: "tel_email_sync", name: "Two-Way Email Sync", description: "IMAP/SMTP mailbox synchronization linking email conversations directly to contact timelines.", requiredPermissions: ["conversations:read"] },
      { id: "tel_sms_gateway", name: "SMS Gateway Integration", description: "Global and regional carrier dispatchers for transactional alerts and marketing SMS.", requiredPermissions: ["conversations:write"] },
      { id: "tel_click_to_call", name: "Click-to-Call WebRTC", description: "Browser-based telephony dialer with call logging, recording, and disposition tagging.", requiredPermissions: ["telephony:call"] },
      { id: "tel_transcription", name: "Automated Call Transcription", description: "Speech-to-text audio processing generating searchable call transcripts and summaries.", requiredPermissions: ["telephony:read"] },
    ],
  },

  // ==========================================================================
  // HUB 3 — ARTIFICIAL INTELLIGENCE & AUTOMATION
  // ==========================================================================
  {
    id: "mod_ai_agent_studio",
    moduleNumber: 12,
    name: "Multilingual AI Agent Studio",
    hub: "hub_ai_automation",
    description: "Specialized autonomous AI agents (Sales, Support, Booking), RAG vector retrieval, and human-in-the-loop oversight.",
    iconName: "Bot",
    routePrefix: "/ai-studio",
    dependencies: ["mod_customer_360"],
    features: [
      { id: "ai_specialists", name: "Specialized Agent Roles", description: "Pre-trained agent personas for Sales, Tier-1 Support, Qualification, and Booking.", requiredPermissions: ["ai:execute"] },
      { id: "ai_rag_kb", name: "Semantic RAG Knowledge Base", description: "High-dimensional vector embeddings on pgvector answering queries strictly from approved documents.", requiredPermissions: ["ai:write"] },
      { id: "ai_tool_calling", name: "Secure CRM Tool Execution", description: "Model tool calling enabling agents to query availability, create tickets, and log deals.", requiredPermissions: ["ai:execute"] },
      { id: "ai_human_gate", name: "Human-in-the-Loop Approval", description: "Execution pause states requiring supervisor review before committing sensitive actions.", requiredPermissions: ["ai:approve"] },
      { id: "ai_dialects", name: "Arabic & Regional Dialect Engine", description: "Native understanding of Modern Standard Arabic, Gulf Arabic (Khaleeji), Egyptian, and English.", requiredPermissions: ["ai:execute"] },
    ],
  },
  {
    id: "mod_ai_voice_center",
    moduleNumber: 13,
    name: "AI Voice & Conversational Contact Center",
    hub: "hub_ai_automation",
    description: "Multilingual conversational voice receptionist, neural TTS, intent routing, and real-time live human transfer.",
    iconName: "Mic",
    routePrefix: "/ai-studio/voice",
    dependencies: ["mod_telephony_voice", "mod_ai_agent_studio"],
    features: [
      { id: "aiv_receptionist", name: "Autonomous Voice Receptionist", description: "Low-latency streaming speech recognition and neural voice synthesis handling inbound calls.", requiredPermissions: ["ai:voice"] },
      { id: "aiv_booking", name: "Voice Appointment Scheduling", description: "Conversational date/time slot negotiation and automated calendar reservation.", requiredPermissions: ["ai:voice"] },
      { id: "aiv_transfer", name: "Seamless Human Call Transfer", description: "Contextual handoff passing real-time transcript to the human agent's screen.", requiredPermissions: ["telephony:call"] },
    ],
  },
  {
    id: "mod_visual_workflow",
    moduleNumber: 14,
    name: "Visual Workflow Automation Engine",
    hub: "hub_ai_automation",
    description: "Drag-and-drop node canvas (ReactFlow) supporting event triggers, condition filters, webhooks, and dead-letter retries.",
    iconName: "Workflow",
    routePrefix: "/automations",
    dependencies: ["mod_customer_360"],
    features: [
      { id: "wf_canvas", name: "Visual Drag-and-Drop Canvas", description: "Node-based canvas for orchestrating complex business processes visually.", requiredPermissions: ["workflows:write"] },
      { id: "wf_triggers", name: "Multi-Source Event Triggers", description: "Triggers on new leads, status updates, tag attachments, inbound messages, and webhooks.", requiredPermissions: ["workflows:write"] },
      { id: "wf_branching", name: "Conditional Decision Logic", description: "If/Else conditional filters evaluating field values, response timers, and user attributes.", requiredPermissions: ["workflows:write"] },
      { id: "wf_dlq", name: "Dead-Letter Queue & Auto-Retry", description: "Exponential backoff execution retries with dead-letter triage inspection for failed nodes.", requiredPermissions: ["workflows:write"] },
    ],
  },
  {
    id: "mod_predictive_intelligence",
    moduleNumber: 15,
    name: "Predictive AI & CRM Intelligence",
    hub: "hub_ai_automation",
    description: "Customer churn forecasting, sentiment classification, smart deal win probability, and natural-language CRM search.",
    iconName: "Sparkles",
    routePrefix: "/analytics/ai",
    dependencies: ["mod_sales_pipeline"],
    features: [
      { id: "pai_churn", name: "Predictive Churn Risk Alerts", description: "Identifies deteriorating account health based on interaction frequency and ticket sentiment.", requiredPermissions: ["reports:read"] },
      { id: "pai_sentiment", name: "Real-Time Sentiment Analysis", description: "Continuous classification of customer messages (Positive, Neutral, Urgent, Frustrated).", requiredPermissions: ["conversations:read"] },
      { id: "pai_nlp_search", name: "Natural-Language CRM Querying", description: "Enables conversational questions like 'Show all deals in Dubai closing this month over 50k'.", requiredPermissions: ["contacts:read"] },
    ],
  },

  // ==========================================================================
  // HUB 4 — MARKETING & BUSINESS GROWTH
  // ==========================================================================
  {
    id: "mod_campaign_management",
    moduleNumber: 16,
    name: "Marketing Campaign Management",
    hub: "hub_marketing_growth",
    description: "Multi-channel broadcast studio for WhatsApp, Email, and SMS with dynamic segmentation, suppression lists, and analytics.",
    iconName: "Send",
    routePrefix: "/campaigns",
    dependencies: ["mod_unified_inbox"],
    features: [
      { id: "camp_multi", name: "Multi-Channel Broadcast Studio", description: "Unified composer for launching coordinated email, WhatsApp, and SMS campaigns.", requiredPermissions: ["marketing:write"] },
      { id: "camp_segments", name: "Dynamic Audience Segmentation", description: "Real-time list filtering based on customer behavior, lifecycle stage, and custom attributes.", requiredPermissions: ["marketing:read"] },
      { id: "camp_ab", name: "A/B Variant Split Testing", description: "Automated subject line, template, and timing testing with winner auto-dispatch.", requiredPermissions: ["marketing:write"] },
      { id: "camp_consent", name: "Suppression & Opt-Out Compliance", description: "Automated unsubscription filtering strictly enforcing TCPA and GDPR consent mandates.", requiredPermissions: ["marketing:write"] },
    ],
  },
  {
    id: "mod_social_marketing",
    moduleNumber: 17,
    name: "Social Media Marketing & Content Calendar",
    hub: "hub_marketing_growth",
    description: "Multi-platform visual content calendar, post scheduling, approval workflows, and AI copy generation.",
    iconName: "CalendarClock",
    routePrefix: "/marketing/social",
    dependencies: ["mod_social_communication"],
    features: [
      { id: "sm_calendar", name: "Visual Content Calendar", description: "Drag-and-drop editorial calendar for scheduling posts across brand social channels.", requiredPermissions: ["marketing:write"] },
      { id: "sm_ai_copy", name: "AI Multilingual Copywriter", description: "Generates high-engagement captions and hashtags tailored to GCC demographics.", requiredPermissions: ["marketing:write"] },
      { id: "sm_approvals", name: "Content Review Workflows", description: "Internal brand approval gates prior to scheduled automated publishing.", requiredPermissions: ["marketing:approve"] },
    ],
  },
  {
    id: "mod_ads_attribution",
    moduleNumber: 18,
    name: "Advertising Integration & Multi-Touch Attribution",
    hub: "hub_marketing_growth",
    description: "Ad platform integrations (Meta, Google, TikTok, Snapchat), lead sync, CPL/CAC calculation, and offline conversions.",
    iconName: "TrendingUp",
    routePrefix: "/marketing/attribution",
    dependencies: ["mod_lead_management"],
    features: [
      { id: "ads_sync", name: "Real-Time Lead Form Sync", description: "Instant sub-second ingestion of leads submitted through Meta, Google, and TikTok native forms.", requiredPermissions: ["leads:write"] },
      { id: "ads_roas", name: "ROAS & Customer Acquisition Cost", description: "Direct linkage of closed deal revenue back to specific campaigns, ad sets, and keywords.", requiredPermissions: ["reports:read"] },
      { id: "ads_offline", name: "Offline Conversion Feedback", description: "Feeds closed CRM deals back to ad networks to optimize algorithmic bidding.", requiredPermissions: ["marketing:write"] },
    ],
  },
  {
    id: "mod_landing_pages_forms",
    moduleNumber: 19,
    name: "Website, Landing Pages & Interactive Forms",
    hub: "hub_marketing_growth",
    description: "Visual landing page builder, responsive lead capture forms, embeddable live chat, and SEO management.",
    iconName: "Globe",
    routePrefix: "/marketing/pages",
    dependencies: ["mod_lead_management"],
    features: [
      { id: "lp_builder", name: "Drag-and-Drop Page Builder", description: "High-speed landing page builder with mobile responsiveness and Arabic RTL support.", requiredPermissions: ["pages:write"] },
      { id: "lp_forms", name: "Smart Form Builder", description: "Conditional logic forms, progressive profiling, and bot-resistant anti-spam verification.", requiredPermissions: ["forms:write"] },
      { id: "lp_widget", name: "Embeddable Chat & Booking Widget", description: "Lightweight client widget script integrating live messaging and instant booking on external sites.", requiredPermissions: ["settings:write"] },
    ],
  },

  // ==========================================================================
  // HUB 5 — CUSTOMER SERVICE & OPERATIONS
  // ==========================================================================
  {
    id: "mod_helpdesk_service",
    moduleNumber: 20,
    name: "Customer Service & Helpdesk",
    hub: "hub_customer_service",
    description: "Multi-channel ticketing, SLA resolution tracking, automated ticket categorization, CSAT/NPS surveys, and knowledge base.",
    iconName: "LifeBuoy",
    routePrefix: "/helpdesk",
    dependencies: ["mod_customer_360"],
    features: [
      { id: "hd_tickets", name: "Multi-Channel Ticket Console", description: "Converts chats, emails, and web forms into prioritized support tickets.", requiredPermissions: ["tickets:read"] },
      { id: "hd_sla", name: "Granular SLA Breach Policies", description: "First-response and resolution countdown timers with automated managerial escalation.", requiredPermissions: ["tickets:write"] },
      { id: "hd_csat", name: "Automated CSAT / NPS Surveys", description: "Dispatches one-click satisfaction ratings upon ticket resolution across WhatsApp and email.", requiredPermissions: ["tickets:read"] },
      { id: "hd_kb", name: "Public & Internal Knowledge Base", description: "Searchable support documentation reducing ticket volume through self-service answers.", requiredPermissions: ["kb:read"] },
    ],
  },
  {
    id: "mod_calendar_scheduling",
    moduleNumber: 21,
    name: "Appointment & Calendar Management",
    hub: "hub_customer_service",
    description: "Public booking pages, staff availability calendars, round-robin scheduling, Google/Microsoft calendar 2-way sync.",
    iconName: "Calendar",
    routePrefix: "/calendar",
    dependencies: ["mod_customer_360"],
    features: [
      { id: "cal_booking_page", name: "Public Self-Scheduling Pages", description: "Shareable booking URLs with custom availability slots and timezone auto-detection.", requiredPermissions: ["calendar:write"] },
      { id: "cal_sync", name: "Google & Outlook Two-Way Sync", description: "Real-time calendar synchronization preventing double-booking across personal and CRM schedules.", requiredPermissions: ["calendar:write"] },
      { id: "cal_reminders", name: "Automated WhatsApp Reminders", description: "Multi-step automated reminder alerts reducing customer no-show rates.", requiredPermissions: ["calendar:write"] },
    ],
  },
  {
    id: "mod_task_project_management",
    moduleNumber: 22,
    name: "Tasks, Projects & Team Operations",
    hub: "hub_customer_service",
    description: "Collaborative project management, Kanban task boards, milestone tracking, team workload analytics, and file storage.",
    iconName: "ListTodo",
    routePrefix: "/projects",
    dependencies: ["mod_customer_360"],
    features: [
      { id: "tpm_boards", name: "Project Kanban & Sprint Boards", description: "Visual task progression with deadlines, checklists, subtasks, and entity linkages.", requiredPermissions: ["projects:read"] },
      { id: "tpm_workload", name: "Team Capacity & Workload Balance", description: "Visual heatmap of assigned tasks per staff member preventing team burnout.", requiredPermissions: ["projects:read"] },
      { id: "tpm_files", name: "Secure Project Vault", description: "Encrypted file repository with version tracking, access restrictions, and direct previews.", requiredPermissions: ["files:read"] },
    ],
  },
  {
    id: "mod_customer_portal",
    moduleNumber: 23,
    name: "Customer Self-Service Portal",
    hub: "hub_customer_service",
    description: "Secure, authenticated client portal for tracking tickets, reviewing quotes, paying invoices, and accessing documents.",
    iconName: "UserCheck",
    routePrefix: "/portal",
    dependencies: ["mod_helpdesk_service", "mod_sales_enablement"],
    features: [
      { id: "cp_auth", name: "Passwordless Client Authentication", description: "Secure magic-link and OTP login for external customer contacts.", requiredPermissions: ["portal:access"] },
      { id: "cp_tickets", name: "Ticket History & Live Reply", description: "Allows clients to open tickets, upload attachments, and review status updates.", requiredPermissions: ["portal:access"] },
      { id: "cp_billing", name: "Invoice & Quote Review", description: "Direct view of billing documents with embedded one-click payment checkout.", requiredPermissions: ["portal:access"] },
    ],
  },
  {
    id: "mod_field_service_dispatch",
    moduleNumber: 24,
    name: "Field Service & Mobile Workforce Management",
    hub: "hub_customer_service",
    description: "On-site technician dispatching, GPS route optimization, work order execution, offline mobile sync, and digital sign-off.",
    iconName: "Wrench",
    routePrefix: "/field-service",
    dependencies: ["mod_task_project_management"],
    features: [
      { id: "fsm_dispatch", name: "Smart Dispatch Scheduling", description: "Assigns on-site technicians based on geographical location, skill tags, and parts inventory.", requiredPermissions: ["field_service:write"] },
      { id: "fsm_work_orders", name: "Mobile Work Order Execution", description: "Step-by-step checklist execution with offline caching for field engineers.", requiredPermissions: ["field_service:write"] },
      { id: "fsm_signature", name: "Digital Proof-of-Service", description: "Captures on-site customer signature, timestamp, GPS coordinates, and photo proof.", requiredPermissions: ["field_service:write"] },
      { id: "fsm_inventory", name: "Truck-Stock Inventory Tracking", description: "Deducts parts consumed during on-site repair directly from enterprise inventory.", requiredPermissions: ["commerce:write"] },
    ],
  },

  // ==========================================================================
  // HUB 6 — COMMERCE & FINANCIAL OPERATIONS
  // ==========================================================================
  {
    id: "mod_products_orders",
    moduleNumber: 25,
    name: "Products, Orders & E-Commerce Integration",
    hub: "hub_commerce_finance",
    description: "SKU catalog, price books, Shopify/WooCommerce two-way synchronization, and sales order fulfillment tracking.",
    iconName: "ShoppingCart",
    routePrefix: "/commerce/orders",
    dependencies: ["mod_customer_360"],
    features: [
      { id: "ecom_catalog", name: "Unified Product & SKU Catalog", description: "Variants, bundle pricing, cost-of-goods (COGS), and stock availability.", requiredPermissions: ["commerce:read"] },
      { id: "ecom_orders", name: "Sales Order Lifecycle", description: "Order creation, fulfillment status progression, and tracking number dispatch.", requiredPermissions: ["commerce:write"] },
      { id: "ecom_sync", name: "Shopify & WooCommerce Connectors", description: "Continuous synchronization of orders, customer records, and product stock levels.", requiredPermissions: ["integrations:write"] },
    ],
  },
  {
    id: "mod_billing_subscriptions",
    moduleNumber: 26,
    name: "Billing, Payments & Subscription Engine",
    hub: "hub_commerce_finance",
    description: "Recurring subscription billing, shareable payment links, automated dunning, and regional payment gateway processing.",
    iconName: "CreditCard",
    routePrefix: "/billing",
    dependencies: ["mod_sales_enablement"],
    features: [
      { id: "bill_invoices", name: "Tax Invoice Generation", description: "Itemized tax invoices with sequential numbering, QR codes, and multi-currency formatting.", requiredPermissions: ["finance:write"] },
      { id: "bill_links", name: "Instant Shareable Payment Links", description: "Secure hosted checkout links dispatched via WhatsApp and SMS for immediate collection.", requiredPermissions: ["finance:write"] },
      { id: "bill_subs", name: "Automated Recurring Billing", description: "Subscription renewal lifecycle management with automated card retries and dunning emails.", requiredPermissions: ["finance:write"] },
      { id: "bill_gateways", name: "Regional Payment Gateways", description: "Integrations for Stripe, PayPal, and GCC regional providers (Tap, Checkout.com, PayTabs).", requiredPermissions: ["settings:write"] },
    ],
  },
  {
    id: "mod_zatca_fiscal_compliance",
    moduleNumber: 27,
    name: "ZATCA e-Invoicing & GCC Fiscal Compliance",
    hub: "hub_commerce_finance",
    description: "Saudi ZATCA FATOORA Phase 2 compliance, UBL 2.1 XML invoices, cryptographic stamps (CSID), and UAE e-billing.",
    iconName: "Receipt",
    routePrefix: "/compliance/zatca",
    dependencies: ["mod_billing_subscriptions"],
    features: [
      { id: "zatca_phase2", name: "ZATCA FATOORA Phase 2 Engine", description: "Cryptographic stamping, tamper-evident hash chaining, and clearance/reporting API.", requiredPermissions: ["finance:write"] },
      { id: "zatca_tlv_qr", name: "Cryptographic TLV QR Codes", description: "Generates base64 TLV encoded QR codes containing seller name, VAT number, timestamp, and hash.", requiredPermissions: ["finance:read"] },
      { id: "zatca_ubl_xml", name: "Standard UBL 2.1 XML Generation", description: "Strict XML document generation conforming to gazetted Saudi GAZT and UAE FTA standards.", requiredPermissions: ["finance:write"] },
    ],
  },
  {
    id: "mod_revops_analytics",
    moduleNumber: 28,
    name: "Revenue Operations & Executive Analytics",
    hub: "hub_commerce_finance",
    description: "Real-time MRR/ARR analytics, customer lifetime value (LTV), cohort churn analysis, and automated executive reports.",
    iconName: "BarChart3",
    routePrefix: "/analytics/revenue",
    dependencies: ["mod_billing_subscriptions", "mod_sales_pipeline"],
    features: [
      { id: "rev_mrr_arr", name: "SaaS & Subscription Revenue Metrics", description: "Live tracking of MRR, ARR, expansion revenue, net revenue retention (NRR), and churn.", requiredPermissions: ["reports:read"] },
      { id: "rev_cohorts", name: "Customer LTV & Cohort Retention", description: "Visual cohort retention heatmaps evaluating long-term customer monetization.", requiredPermissions: ["reports:read"] },
      { id: "rev_exports", name: "Scheduled Executive Digests", description: "Automated daily/weekly PDF and email revenue summaries to C-level stakeholders.", requiredPermissions: ["reports:read"] },
    ],
  },

  // ==========================================================================
  // HUB 7 — ENTERPRISE SAAS & ADMINISTRATION
  // ==========================================================================
  {
    id: "mod_saas_multi_tenancy",
    moduleNumber: 29,
    name: "Multi-Tenant SaaS Management & Isolation",
    hub: "hub_enterprise_saas",
    description: "Self-service organization signup, tenant isolation, feature entitlements, seat quotas, and workspace lifecycle.",
    iconName: "Boxes",
    routePrefix: "/admin/organizations",
    dependencies: [],
    features: [
      { id: "ten_isolation", name: "Strict RLS Data Isolation", description: "PostgreSQL Row-Level Security ensuring absolute mathematical isolation between tenant records.", requiredPermissions: ["admin:access"] },
      { id: "ten_onboarding", name: "Automated Tenant Onboarding", description: "Self-service signup wizard configuring default pipelines, roles, and communication channels.", requiredPermissions: ["public:access"] },
      { id: "ten_quotas", name: "Resource Quota Enforcement", description: "Real-time enforcement of plan limits across seats, storage, AI tokens, and message volume.", requiredPermissions: ["admin:access"] },
    ],
  },
  {
    id: "mod_super_admin_white_label",
    moduleNumber: 30,
    name: "Super-Admin Console & White-Label Engine",
    hub: "hub_enterprise_saas",
    description: "Platform-wide governance console, agency multi-workspace management, custom domain mapping, and theme token injection.",
    iconName: "Sliders",
    routePrefix: "/admin",
    dependencies: ["mod_saas_multi_tenancy"],
    features: [
      { id: "sa_console", name: "Global Platform Control Center", description: "High-level overview of all active tenants, platform MRR, infrastructure health, and system workers.", requiredPermissions: ["super_admin:access"] },
      { id: "sa_whitelabel", name: "Custom Domain & Branding Injection", description: "Dynamic CSS token and logo replacement mapped to custom customer subdomains.", requiredPermissions: ["settings:write"] },
      { id: "sa_feature_flags", name: "Granular Feature Flagging", description: "Enable or disable specific modules and experimental features on a per-tenant basis.", requiredPermissions: ["super_admin:access"] },
    ],
  },
  {
    id: "mod_security_governance",
    moduleNumber: 31,
    name: "Security, Compliance & IAM Governance",
    hub: "hub_enterprise_saas",
    description: "Granular RBAC/ABAC matrices, 2FA/TOTP enforcement, SSO (SAML/OIDC), tamper-evident audit logs, and Supabase Vault.",
    iconName: "ShieldCheck",
    routePrefix: "/settings/security",
    dependencies: ["mod_saas_multi_tenancy"],
    features: [
      { id: "sec_rbac", name: "Granular Permission Matrix", description: "Custom role builder specifying exact entity-level read, write, export, and delete scopes.", requiredPermissions: ["roles:write"] },
      { id: "sec_2fa", name: "Mandatory Multi-Factor (MFA / 2FA)", description: "TOTP authenticator integration with emergency recovery codes and trusted device tracking.", requiredPermissions: ["security:write"] },
      { id: "sec_sso", name: "Enterprise Single Sign-On (SSO)", description: "SAML 2.0 and OpenID Connect (OIDC) integration for Okta, Azure AD, and Google Workspace.", requiredPermissions: ["settings:write"] },
      { id: "sec_audit_logs", name: "Tamper-Evident Audit Trail", description: "Immutable log of all user logins, administrative overrides, data exports, and configuration edits.", requiredPermissions: ["audit:read"] },
      { id: "sec_vault", name: "Hardware-Encrypted Secret Storage", description: "Supabase Vault (pg_vault) envelope encryption for integration tokens and webhooks.", requiredPermissions: ["admin:access"] },
    ],
  },
  {
    id: "mod_developer_platform",
    moduleNumber: 32,
    name: "Integration Marketplace & Developer APIs",
    hub: "hub_enterprise_saas",
    description: "OpenAPI 3.0 REST endpoints, scoped API keys, incoming/outgoing webhooks, and pre-built iPaaS connectors (Zapier/Make/n8n).",
    iconName: "Code2",
    routePrefix: "/settings/developer",
    dependencies: ["mod_saas_multi_tenancy"],
    features: [
      { id: "dev_rest_api", name: "OpenAPI 3.0 Documented Endpoints", description: "Comprehensive, rate-limited REST API covering all core CRM and communication resources.", requiredPermissions: ["api_keys:write"] },
      { id: "dev_webhooks", name: "Signed Outbound Webhooks", description: "HMAC-SHA256 cryptographically signed webhook dispatches with automatic retry policies.", requiredPermissions: ["webhooks:write"] },
      { id: "dev_connectors", name: "Native iPaaS Connectors", description: "Official application modules for Zapier, Make.com, and self-hosted n8n instances.", requiredPermissions: ["integrations:read"] },
    ],
  },
  {
    id: "mod_data_governance_mdm",
    moduleNumber: 33,
    name: "Enterprise Data Hygiene, Governance & MDM",
    hub: "hub_enterprise_saas",
    description: "Automated third-party data enrichment, identity resolution across channels, scheduled fuzzy deduplication, and PII masking.",
    iconName: "Database",
    routePrefix: "/settings/data-governance",
    dependencies: ["mod_customer_360"],
    features: [
      { id: "mdm_enrichment", name: "Automated Data Enrichment", description: "Enriches corporate records with verified company size, industry, revenue, and domain data.", requiredPermissions: ["contacts:write"] },
      { id: "mdm_identity", name: "Cross-Channel Identity Resolution", description: "Links disparate phone numbers, social handles, and email addresses to a singular golden record.", requiredPermissions: ["contacts:write"] },
      { id: "mdm_hygiene", name: "Data Health & Completeness Scoring", description: "Continuous scoring highlighting invalid phone formats, dead emails, and missing fields.", requiredPermissions: ["contacts:read"] },
      { id: "mdm_privacy", name: "Automated Right-to-Erasure (GDPR/PDPL)", description: "One-click cryptographic erasure and anonymization across all historical tables and logs.", requiredPermissions: ["admin:access"] },
    ],
  },
  {
    id: "mod_sre_observability",
    moduleNumber: 34,
    name: "SRE Observability, System Health & Audit Telemetry",
    hub: "hub_enterprise_saas",
    description: "Tenant-isolated synthetic SLA probes, OpenTelemetry distributed tracing, webhook delivery health, and DLQ inspection.",
    iconName: "Activity",
    routePrefix: "/admin/system-health",
    dependencies: ["mod_saas_multi_tenancy"],
    features: [
      { id: "sre_tracing", name: "OpenTelemetry Distributed Tracing", description: "End-to-end request tracing tracking latency across edge workers, database, and AI models.", requiredPermissions: ["super_admin:access"] },
      { id: "sre_health_probes", name: "Real-Time Webhook & Socket Probes", description: "Continuous health monitors verifying Meta webhook responsiveness and edge connectivity.", requiredPermissions: ["super_admin:access"] },
      { id: "sre_dlq_inspector", name: "Dead-Letter Queue Visual Triage", description: "Console to inspect, edit payload, and replay stalled background jobs and webhook calls.", requiredPermissions: ["super_admin:access"] },
    ],
  },

  // ==========================================================================
  // HUB 8 — GCC LOCALIZATION & INDUSTRY SOLUTIONS
  // ==========================================================================
  {
    id: "mod_gcc_localization",
    moduleNumber: 35,
    name: "Middle East & GCC Regional Localization",
    hub: "hub_gcc_solutions",
    description: "Arabic-first interface, bidirectional RTL layouts, GCC currencies (AED, SAR, QAR, KWD, BHD, OMR), and Saudi/UAE VAT rules.",
    iconName: "Languages",
    routePrefix: "/settings/localization",
    dependencies: ["mod_saas_multi_tenancy"],
    features: [
      { id: "gcc_rtl", name: "Native RTL / LTR Bidirectional Layout", description: "Seamless switching between right-to-left Arabic typography and left-to-right English.", requiredPermissions: ["settings:read"] },
      { id: "gcc_currencies", name: "GCC Multi-Currency & Central Bank Rates", description: "Native support for AED, SAR, QAR, KWD, BHD, OMR with automatic daily currency conversion.", requiredPermissions: ["finance:read"] },
      { id: "gcc_vat", name: "Saudi & UAE VAT Tax Calculations", description: "Compliant calculation of standard 15% (KSA) and 5% (UAE) VAT with exemptions and zero-rating.", requiredPermissions: ["finance:write"] },
      { id: "gcc_phone_rules", name: "Regional Phone & Address Formats", description: "Strict validation masks for GCC mobile numbers (e.g. +971, +966) and National Address formats.", requiredPermissions: ["contacts:read"] },
    ],
  },
  {
    id: "mod_industry_solutions",
    moduleNumber: 36,
    name: "Industry-Specific CRM Vertical Solutions",
    hub: "hub_gcc_solutions",
    description: "Turnkey operational templates and custom workflows for Real Estate, Healthcare, Automotive, and Professional Services.",
    iconName: "LayoutGrid",
    routePrefix: "/templates/verticals",
    dependencies: ["mod_customer_360", "mod_sales_pipeline"],
    features: [
      { id: "ind_real_estate", name: "Real Estate Brokerage Template", description: "Property listing catalog, developer payment plans, broker commissions, and unit booking.", requiredPermissions: ["settings:write"] },
      { id: "ind_healthcare", name: "Clinic & Healthcare Template", description: "Patient appointment scheduling, doctor availability, HIPAA/MOH privacy, and treatment notes.", requiredPermissions: ["settings:write"] },
      { id: "ind_automotive", name: "Automotive Dealership & Service Template", description: "Vehicle inventory, VIN tracking, test-drive scheduling, and maintenance service reminders.", requiredPermissions: ["settings:write"] },
      { id: "ind_education", name: "Education & Academy Template", description: "Student enrollment funnels, course scheduling, parent communication, and tuition invoicing.", requiredPermissions: ["settings:write"] },
    ],
  },
];

/**
 * Helper: Retrieve module by numeric index (1..36)
 */
export function getModuleByNumber(num: number): EnterpriseModule | undefined {
  return ENTERPRISE_MODULES.find((m) => m.moduleNumber === num);
}

/**
 * Helper: Retrieve all modules for a given Business Hub
 */
export function getModulesByHub(hubId: BusinessHubId): EnterpriseModule[] {
  return ENTERPRISE_MODULES.filter((m) => m.hub === hubId);
}

/**
 * Total Architecture Metrics
 */
export const ARCHITECTURE_METRICS = {
  totalModules: ENTERPRISE_MODULES.length,
  totalHubs: Object.keys(BUSINESS_HUBS).length,
  totalFeatures: ENTERPRISE_MODULES.reduce((acc, m) => acc + m.features.length, 0),
};

