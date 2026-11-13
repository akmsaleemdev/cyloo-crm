import { Brand, BrandWordmark, PlatformLogo, PlatformMark } from "@/components/brand";
import { PwaInstallButton } from "@/components/pwa/pwa-install-button";
import { useBrandName } from "@/hooks/use-brand-name";
import { usePlatformBranding } from "@/hooks/use-platform-branding";
import { BRAND_NAME } from "@/lib/branding/brand";
import { useState, useEffect, useRef } from "react";
import { docsUrl } from "@/lib/docs/links";
import { SHOW_RESOURCE_LINKS } from "@/lib/docs/visibility";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AnimatePresence, motion, MotionConfig, useReducedMotion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { MarketingButton, MarketingReveal } from "@/components/marketing/motion";
import { marketingReveal } from "@/lib/marketing/motion";
import { marketingPlans } from "@/lib/marketing/public-pricing";
import "@/components/marketing/public-website.css";
import {
  MessagesSquare,
  Sparkles,
  ShieldCheck,
  BarChart3,
  Users,
  ArrowRight,
  ArrowUpRight,
  Check,
  Server,
  Bot,
  Workflow,
  CalendarClock,
  Plug,
  KeyRound,
  Megaphone,
  Ticket,
  Tag,
  Inbox,
  Clock,
  TrendingUp,
  GitBranch,
  Store,
  Send,
  Mail,
  MessageSquare,
  ShoppingCart,
  Building2,
  GraduationCap,
  HeartPulse,
  Plane,
  ChevronDown,
  UserPlus,
  BookOpen,
} from "lucide-react";
import GatewayFlow from "@/components/ui/gateway-flow";
import { Button } from "@/components/ui/button";

import { DotPattern } from "@/components/ui/dot-pattern";
import { LeadCaptureForm } from "@/components/marketing/lead-capture-form";
import { SiInstagram, SiMessenger, SiTelegram, SiWhatsapp } from "react-icons/si";

import { WhatsAppCtaButton, WhatsAppFloatingCta } from "@/components/marketing/whatsapp-cta-button";
import { ctaAttrs, trackMarketing } from "@/lib/analytics/events";
import {
  CurrentPlanBanner,
  CurrentPlanPill,
  isCurrentPlan,
} from "@/components/app/marketing/current-plan-badge";
import {
  formatPlanPrice,
  isContactSalesPlan,
  monthlyEquivalent,
  planBullets,
  useMyPlanSummary,
  usePublicPlans,
} from "@/lib/billing/public-plans";

import platformStackImg from "@/assets/marketing/cyloo-platform.svg";

import featureSharedInboxImg from "@/assets/marketing/cyloo-inbox.svg";
import stepperInboxImg from "@/assets/marketing/stepper-inbox.jpg";
import stepperFlowImg from "@/assets/marketing/stepper-flow.jpg";
import stepperCampaignImg from "@/assets/marketing/stepper-campaign.jpg";
import stepperBotImg from "@/assets/marketing/stepper-bot.jpg";
import stepperEcommerceImg from "@/assets/marketing/stepper-ecommerce.jpg";

import {
  LANDING_SOCIAL_DESCRIPTION,
  OG_IMAGE_URL,
  SITE_URL,
  getLandingContent,
  landingJsonLd,
} from "@/lib/marketing/landing-content";
import { platformBrandingQueryOptions } from "@/hooks/use-platform-branding";
import { useTenantCurrency } from "@/hooks/use-currency";
import { redirectSignedInFromMarketing } from "@/lib/auth/marketing-redirect";

export const Route = createFileRoute("/")({
  ssr: false,
  beforeLoad: redirectSignedInFromMarketing,
  loader: ({ context }) => context.queryClient.ensureQueryData(platformBrandingQueryOptions()),
  head: ({ loaderData: branding }) => {
    const platformName = branding?.platformName ?? BRAND_NAME;
    const content = getLandingContent(platformName);
    return {
      meta: [
        { title: content.title },
        { name: "description", content: content.description },
        { property: "og:title", content: content.title },
        { property: "og:description", content: LANDING_SOCIAL_DESCRIPTION },
        { property: "og:type", content: "website" },
        { property: "og:url", content: `${SITE_URL}/` },
        { property: "og:image", content: OG_IMAGE_URL },
        { property: "og:image:width", content: "1200" },
        { property: "og:image:height", content: "630" },
        { property: "og:image:alt", content: "Omnichannel CRM shared inbox" },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: content.title },
        { name: "twitter:description", content: LANDING_SOCIAL_DESCRIPTION },
        { name: "twitter:image", content: OG_IMAGE_URL },
        { name: "twitter:image:alt", content: "Omnichannel CRM shared inbox" },
      ],
      links: [{ rel: "canonical", href: `${SITE_URL}/` }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify(landingJsonLd(platformName)),
        },
      ],
    };
  },
  component: LandingPage,
});

function LandingPage() {
  return (
    <MotionConfig reducedMotion="user">
      <div className="public-marketing dark landing-shadows min-h-dvh bg-background text-foreground">
        <Nav />
        <main>
          <Hero />
          <MarketingReveal>
            <StackReplacement />
          </MarketingReveal>
          <MarketingReveal>
            <IndustryUseCases />
          </MarketingReveal>
          <MarketingReveal>
            <PlatformOverviewBento />
          </MarketingReveal>
          <MarketingReveal>
            <Stepper />
          </MarketingReveal>
          <MarketingReveal>
            <CTA />
          </MarketingReveal>
          <MarketingReveal>
            <Pricing />
          </MarketingReveal>
          <MarketingReveal>
            <MarketingSection />
          </MarketingReveal>
        </main>
        <MarketingReveal>
          <Footer />
        </MarketingReveal>
        <WhatsAppFloatingCta message="Hi! I'm on the {site} site and would like a quick walkthrough." />
      </div>
    </MotionConfig>
  );
}

/* ============================================================ */
/* Nav                                                          */
/* ============================================================ */
function Nav() {
  const reduceMotion = useReducedMotion();
  const [mobileOpen, setMobileOpen] = useState(false);
  const mobileTrigger = useRef<HTMLButtonElement>(null);
  const [scrolled, setScrolled] = useState(false);
  const [platformOpen, setPlatformOpen] = useState(false);
  const platformTrigger = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 15);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const platformItems = [
    {
      label: "Project Management",
      description: "Plan work and keep tasks moving.",
      icon: Check,
      href: "#workflow",
    },
    {
      label: "Marketing",
      description: "Create campaigns and reach your audience.",
      icon: Megaphone,
      href: "#pricing",
    },
    {
      label: "AI & Automation",
      description: "Automate routine work and save time.",
      icon: Bot,
      href: "#workflow",
    },
  ];
  return (
    <header
      className={`sticky top-0 z-40 border-b transition-all duration-300 ${
        scrolled
          ? "border-border/80 bg-background/95 shadow-sm shadow-primary/5 backdrop-blur-md"
          : "border-border bg-background/80 backdrop-blur-md"
      }`}
    >
      <div className="container-marketing grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 h-18 md:flex md:justify-between py-4">
        <Link
          to="/"
          className="flex min-w-0 items-center gap-2.5 cursor-pointer transition-transform duration-200 hover:scale-[1.02]"
          aria-label="CYLOO Home"
        >
          <PlatformLogo alt="CYLOO" className="h-8 md:h-9 w-auto shrink-0 object-contain" />
        </Link>
        <nav
          className="hidden items-center gap-5 text-base text-muted-foreground lg:flex xl:gap-8"
          aria-label="Primary navigation"
        >
          <div
            className="relative"
            onMouseEnter={() => setPlatformOpen(true)}
            onMouseLeave={() => setPlatformOpen(false)}
            onBlur={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget)) setPlatformOpen(false);
            }}
            onKeyDown={(event) => {
              if (event.key === "Escape") {
                setPlatformOpen(false);
                platformTrigger.current?.focus();
              }
            }}
          >
            <button
              ref={platformTrigger}
              type="button"
              aria-expanded={platformOpen}
              aria-controls={platformOpen ? "platform-navigation" : undefined}
              className="link-marketing inline-flex items-center gap-1 px-1"
              onClick={(event) => setPlatformOpen((open) => (event.detail === 0 ? !open : true))}
            >
              Platform{" "}
              <ChevronDown
                className={`size-3.5 transition-transform ${platformOpen ? "rotate-180" : ""}`}
              />
            </button>
            <AnimatePresence>
              {platformOpen && (
                <motion.div
                  initial={{ opacity: 0, y: reduceMotion ? 0 : 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: reduceMotion ? 0 : 4 }}
                  transition={{ duration: reduceMotion ? 0 : 0.18 }}
                  inert={!platformOpen}
                  id="platform-navigation"
                  className="absolute left-1/2 top-full z-50 w-80 -translate-x-1/2 pt-4"
                >
                  <div className="rounded-xl border border-border bg-background p-2 shadow-xl">
                    {platformItems.map(({ label, description, icon: Icon, href }) => (
                      <a
                        key={label}
                        href={href}
                        className="flex gap-3 rounded-lg p-3 transition-colors hover:bg-muted"
                        onClick={() => setPlatformOpen(false)}
                      >
                        <Icon className="mt-0.5 size-4 shrink-0 text-accent" />
                        <span>
                          <span className="block text-sm font-semibold text-foreground">
                            {label}
                          </span>
                          <span className="block text-xs text-muted-foreground">{description}</span>
                        </span>
                      </a>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          {[
            { href: "#industries", label: "Solutions" },
            { href: "#pricing", label: "Pricing" },
            { href: "#download", label: "Resources" },
          ].map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="link-marketing px-1"
              {...ctaAttrs(`nav-${l.href.replace("#", "")}`, "nav", "nav_click", l.label)}
            >
              {l.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-2 shrink-0">
          <div className="hidden lg:block">
            <PwaInstallButton />
          </div>
          <Button asChild variant="outline" size="default" className="hidden sm:inline-flex">
            <Link to="/auth" {...ctaAttrs("sign-in", "nav")}>
              Log In
            </Link>
          </Button>
          <Button asChild variant="primary" size="default">
            <Link to="/auth" search={{ mode: "sign-up" }} {...ctaAttrs("get-started", "nav")}>
              Get started
            </Link>
          </Button>
          <Button
            ref={mobileTrigger}
            variant="ghost"
            size="icon"
            className="lg:hidden"
            aria-label={mobileOpen ? "Close navigation" : "Open navigation"}
            aria-expanded={mobileOpen}
            aria-controls="home-mobile-navigation"
            onClick={() => setMobileOpen((open) => !open)}
            onKeyDown={(event) => {
              if (event.key === "Escape") setMobileOpen(false);
            }}
          >
            {mobileOpen ? <X /> : <Menu />}
          </Button>
        </div>
      </div>
      <AnimatePresence>
        {mobileOpen && (
          <motion.nav
            id="home-mobile-navigation"
            aria-label="Mobile navigation"
            className="max-h-[calc(100dvh_-_5rem)] overflow-y-auto border-t border-border bg-background lg:hidden"
            initial={{ opacity: 0, y: reduceMotion ? 0 : -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: reduceMotion ? 0 : -6 }}
            transition={{ duration: reduceMotion ? 0 : 0.18 }}
            onBlur={(event) => {
              if (
                !event.currentTarget.contains(event.relatedTarget) &&
                event.relatedTarget !== mobileTrigger.current
              )
                setMobileOpen(false);
            }}
            onKeyDown={(event) => {
              if (event.key === "Escape") {
                setMobileOpen(false);
                mobileTrigger.current?.focus();
              }
            }}
          >
            <div className="container-marketing flex flex-col gap-1 py-3!">
              {[
                { href: "#platform-overview", label: "Platform" },
                { href: "#industries", label: "Solutions" },
                { href: "#workflow", label: "Product tour" },
                { href: "#pricing", label: "Pricing" },
                { href: "#download", label: "Resources" },
                { href: "/auth", label: "Log In" },
              ].map(({ href, label }) => (
                <a
                  key={href}
                  href={href}
                  className="rounded-control px-3 py-2.5 text-sm hover:bg-muted"
                  onClick={() => setMobileOpen(false)}
                >
                  {label}
                </a>
              ))}
              <PwaInstallButton />
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}

/* ============================================================ */
/* Hero — split: promise left, live WhatsApp mockup right       */
/* ============================================================ */
function Hero() {
  const reduceMotion = useReducedMotion();
  return (
    <section className="landing-hero relative bg-background border-b border-border">
      {/* Soft gradient wash */}
      <div aria-hidden className="landing-hero-wash absolute inset-0" />
      {/* Animated flow-line background — only lightly dimmed behind the centered text so copy stays legible */}
      {!reduceMotion && (
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none"
          style={{
            maskImage:
              "radial-gradient(ellipse 55% 70% at 50% 45%, rgba(0,0,0,0.45) 0%, black 60%)",
            WebkitMaskImage:
              "radial-gradient(ellipse 55% 70% at 50% 45%, rgba(0,0,0,0.45) 0%, black 60%)",
          }}
        >
          {/* CSS selects the palette before hydration; both documents use fixed
            modes so React never leaves an SSR fallback in the iframe. */}
          <div className="landing-hero-flow-light absolute inset-0">
            <GatewayFlow mode="light" opacity={0.6} className="h-full w-full" />
          </div>
          <div className="landing-hero-flow-dark absolute inset-0">
            <GatewayFlow mode="dark" opacity={0.6} className="h-full w-full" />
          </div>
        </div>
      )}
      {/* Theme-aware radial glow — strongest at center, fading outward */}
      <div aria-hidden className="landing-hero-glow absolute inset-0 pointer-events-none" />
      {/* Clipped separately from the section so the corner marks below aren't cut off too */}
      <div aria-hidden className="absolute inset-0 overflow-hidden">
        <div className="absolute -right-40 top-10 w-[520px] h-[520px] rounded-full bg-primary/15 blur-3xl" />
        <div className="absolute -left-40 bottom-0 w-[420px] h-[420px] rounded-full bg-accent/20 blur-3xl" />
      </div>
      <div
        className="relative container-marketing pt-28 pb-20 lg:pt-36 lg:pb-28"
        style={{
          borderLeftStyle: "dashed",
          borderRightStyle: "dashed",
          borderLeftColor: "color-mix(in oklab, var(--accent) 20%, transparent)",
          borderRightColor: "color-mix(in oklab, var(--accent) 20%, transparent)",
        }}
      >
        <CornerPlus corner="bl" />
        <CornerPlus corner="br" />
        <motion.div
          initial={reduceMotion ? false : "hidden"}
          animate="visible"
          variants={marketingReveal}
          className="mx-auto max-w-3xl text-center"
        >
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: reduceMotion ? 0 : 0.25 }}
          >
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-accent shadow-xs">
              YOUR WORK. BEAUTIFULLY CONNECTED.
            </span>
          </motion.div>
          <motion.h1 variants={marketingReveal} className="text-marketing-title-lg mt-6">
            One Platform. Everything You Need to Move Forward.
          </motion.h1>
          <motion.p
            variants={marketingReveal}
            className="text-lg text-muted-foreground font-light mx-auto mt-6 max-w-2xl leading-relaxed"
          >
            Bring your conversations, customers, projects, marketing, and everyday tasks together.
            CYLOO helps you stay organized, work smarter, and get more done with the power of AI.
          </motion.p>
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.3, delay: reduceMotion ? 0 : 0.1 }}
            className="mt-8 flex flex-wrap justify-center gap-3"
          >
            <MarketingButton
              whileHover={reduceMotion ? undefined : { scale: 1.015 }}
              whileTap={reduceMotion ? undefined : { scale: 0.985 }}
              asChild
              variant="primary"
              size="xl"
              className="w-full md:w-auto shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 transition-all"
            >
              <Link to="/auth" search={{ mode: "sign-up" }} {...ctaAttrs("get-started", "hero")}>
                Get Started <ArrowRight className="size-4" />
              </Link>
            </MarketingButton>
            <MarketingButton
              whileHover={reduceMotion ? undefined : { scale: 1.015 }}
              whileTap={reduceMotion ? undefined : { scale: 0.985 }}
              asChild
              variant="outline"
              size="xl"
              className="w-full md:w-auto hover:bg-muted/60 transition-all bg-background!"
            >
              <a href="#platform-overview" {...ctaAttrs("explore-cyloo", "hero")}>
                Explore CYLOO
              </a>
            </MarketingButton>
          </motion.div>
        </motion.div>

        <div className="mt-14 flex flex-wrap items-center justify-center gap-5 lg:mt-20">
          {[
            { Icon: MessagesSquare, name: "Conversations", bg: "#2339CC" },
            { Icon: Users, name: "CRM & Sales", bg: "#2339CC" },
            { Icon: Check, name: "Projects", bg: "#2339CC" },
            { Icon: Megaphone, name: "Marketing", bg: "#2339CC" },
            { Icon: Bot, name: "AI & Automation", bg: "#3ECE90" },
          ].map(({ Icon, name, bg }) => (
            <div
              key={name}
              className="group flex flex-col items-center gap-2 cursor-pointer transition-transform duration-200 hover:-translate-y-1"
            >
              <span
                className="flex size-11 items-center justify-center rounded-full shadow-xs transition-shadow duration-200 group-hover:shadow-md"
                style={{ background: bg }}
              >
                <Icon className="size-5 text-white transition-transform duration-200 group-hover:scale-110" />
              </span>
              <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                {name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ============================================================ */
/* Stack replacement — before / after                           */
/* ============================================================ */
function StackReplacement() {
  const channelCards = [
    {
      Icon: SiWhatsapp,
      name: "WhatsApp Business",
      bg: "#3ECE90",
      desc: "Official WhatsApp Cloud API. Send templates, broadcasts and 24/7 automated replies.",
    },
    {
      Icon: SiMessenger,
      name: "Facebook Messenger",
      bg: "#2339CC",
      desc: "Reply to Page messages, comments and story mentions from the same inbox.",
    },
    {
      Icon: SiInstagram,
      name: "Instagram DMs",
      bg: "#2339CC",
      desc: "Manage Instagram direct messages, comments and mentions in real time.",
    },
    {
      Icon: MessageSquare,
      name: "SMS Campaigns",
      bg: "#2339CC",
      desc: "Reach customers instantly with high-deliverability SMS broadcasts and alerts.",
    },
    {
      Icon: Mail,
      name: "Email",
      bg: "#2339CC",
      desc: "Send transactional and marketing email from the same contact timeline.",
    },
    {
      Icon: SiTelegram,
      name: "Telegram",
      bg: "#2339CC",
      desc: "Connect a Telegram bot in seconds — no business verification, no message templates.",
    },
  ];
  const features = [
    {
      num: "01",
      title: "One inbox, every channel",
      desc: "WhatsApp, Messenger, Instagram, email and live chat — all conversations in a single workspace. No tab-switching, no missed messages, no per-agent fees.",
      link: "/helpdesk",
      linkLabel: "Open Inbox",
      image: featureSharedInboxImg,
      imageAlt: "Unified inbox showing conversations from multiple messaging channels",
    },
    {
      num: "02",
      title: "AI that knows your business",
      desc: "Bot flows with live CRM context, product catalog and order history. Handles FAQs, qualifies leads and escalates automatically — no developer required.",
      link: "/wa-chatbot",
      linkLabel: "Build AI Flows",
      image: stepperBotImg,
      imageAlt: "AI chatbot flow builder connected to CRM and product catalog",
    },
    {
      num: "03",
      title: "Campaigns that actually convert",
      desc: "Segment contacts straight from live CRM data, send approved WhatsApp templates and track delivery, opens and revenue — all in one dashboard.",
      link: "/messenger/send",
      linkLabel: "Launch Campaign",
      image: stepperCampaignImg,
      imageAlt: "WhatsApp broadcast campaign dashboard with delivery stats and segmented lists",
    },
  ];

  return (
    <section className="section-marketing bg-surface border-b border-border">
      <div className="relative container-marketing pb-0">
        <CornerPlus corner="bl" />
        <CornerPlus corner="br" />
        {/* Header row */}
        <div className="row-bleed-marketing grid grid-cols-1 items-end gap-8 border-b border-border pb-8 lg:grid-cols-[2fr_2fr_auto] lg:gap-12">
          {/* Left — title */}
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-accent dark:text-accent">
              <Sparkles className="size-3 text-accent" /> Why <Brand />
            </span>
            <h2 className="text-marketing-title mt-4 max-w-full">
              Stop juggling four tools.
              <br /> One platform does it all.
            </h2>
          </div>
          {/* Centre — lede with left accent border */}
          <div className="border-l-2 border-whatsapp pl-5">
            <p className="text-marketing-lede">
              Most teams bolt a chatbot onto a helpdesk, export contacts into a CRM, then pay a
              fourth vendor to send campaigns. <Brand /> collapses that into one platform with one
              shared database.
            </p>
          </div>
          {/* Right — text CTA */}
          <div className="shrink-0">
            <Link
              to="/features"
              className="inline-flex items-center gap-2 text-xs font-semibold uppercase text-foreground transition-colors hover:text-accent"
            >
              View all modules <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
        {/* 3-col × 2-row feature grid */}
        {/* <div className="overflow-hidden rounded-none row-bleed-marketing p-0 border-b border-border"> */}
        {/* Row 1 — text */}
        {/* <div className="grid grid-cols-1 divide-y divide-border sm:grid-cols-3 sm:divide-x sm:divide-y-0">
            {features.map((f) => (
              <div key={f.num} className="flex flex-col bg-muted/50 p-7 relative">
                <span className="inline-flex size-6 items-center justify-center rounded-control bg-whatsapp font-mono text-[11px] font-semibold text-white">
                  {f.num}
                </span>
                <h3 className="mt-3 text-lg font-semibold leading-snug text-foreground">
                  {f.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
                <div className="mt-5">
                  <Link
                    to={f.link}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-foreground transition-colors hover:text-accent"
                  >
                    {f.linkLabel} <ArrowRight className="size-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div> */}
        {/* Row 2 — illustrations */}
        {/* <div className="grid grid-cols-1 divide-y divide-border border-t border-border sm:grid-cols-3 sm:divide-x sm:divide-y-0">
            {features.map((f, i) => (
              <div
                key={f.num + "-img"}
                className="aspect-square overflow-hidden bg-muted sm:aspect-4/3 lg:aspect-square"
              >
                {i === 0 ? <InboxDemo /> : i === 1 ? <BotDemo /> : <CampaignDemo />}
              </div>
            ))}
          </div> */}
        {/* </div> */}

        {/* Connection map */}
        <div className="row-bleed-marketing px-0 py-12 relative min-h-[560px] overflow-hidden border-b border-border bg-background">
          <ConnectionMap />
        </div>

        {/* Channel coverage — every messaging channel in one shared inbox */}
        <div className=" row-bleed-marketing p-0 border-b border-border last:border-b-0">
          <div className="grid grid-cols-1 gap-px bg-border sm:grid-cols-2 lg:grid-cols-3">
            {channelCards.map((c) => (
              <div
                key={c.name}
                className="group relative overflow-hidden bg-surface p-7 transition-all duration-300 hover:bg-surface-elevated hover:shadow-lg hover:-translate-y-0.5"
              >
                <div className="flex items-center justify-between">
                  <span
                    className="flex size-12 items-center justify-center rounded-2xl shadow-sm transition-transform duration-300 group-hover:scale-110"
                    style={{ background: `${c.bg}1A`, color: c.bg }}
                  >
                    <c.Icon className="size-6" />
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border border-border/80 text-muted-foreground group-hover:border-primary/40 group-hover:text-accent transition-colors">
                    Active Gateway
                  </span>
                </div>
                <h3 className="mt-4 font-display text-base font-semibold text-foreground group-hover:text-accent transition-colors">
                  {c.name}
                </h3>
                <p className="text-marketing-card-body mt-2 leading-relaxed">{c.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// Small "+" mark centered exactly on a border intersection — reusable across
// any `relative` bordered block. The translate direction has to flip per
// corner (top/left corners pull back toward 0, bottom/right corners push
// forward past 100%) or the mark centers on the wrong side of the line.
function CornerPlus({
  corner,
  className,
  size = "size-3.5",
}: {
  corner: "tl" | "tr" | "bl" | "br";
  /** Color override for marks on a dark/inverse surface (default: text-foreground/90). */
  className?: string;
  /** Tailwind size-* class — override when the mark sits on a thicker/wider line. */
  size?: string;
}) {
  const vertical = corner[0] === "t" ? "top-0 -translate-y-1/2" : "bottom-0 translate-y-1/2";
  const horizontal = corner[1] === "l" ? "left-0 -translate-x-1/2" : "right-0 translate-x-1/2";
  return (
    <svg
      aria-hidden
      viewBox="0 0 10 10"
      className={`absolute z-10 ${size} ${className ?? "text-foreground/90"} ${vertical} ${horizontal}`}
    >
      <path d="M5 0v10M0 5h10" stroke="currentColor" strokeWidth="0.3" />
    </svg>
  );
}

/* ============================================================ */
/* Isometric platform stack — four layers (channels → AI →      */
/* CRM → your data) threaded with brand/feature icons along a   */
/* diagonal, inside a dotted isometric box wireframe.            */
/* ============================================================ */
function PlatformStackIllustration() {
  const brandName = useBrandName();
  return (
    // lg:flex-1 + lg:self-stretch (flexbox, not grid — grid's percentage-height
    // stretch is unreliable here) matches this to the text column's full
    // height; object-bottom then anchors the artwork to the bottom edge so it
    // lines up with the CTA button beside it, instead of its top.
    <div className="relative mx-auto aspect-square w-full max-w-md lg:aspect-auto lg:h-auto lg:max-w-none lg:flex-1 lg:self-stretch">
      {/* <div
        aria-hidden
        className="absolute -right-8 -top-8 size-64 rounded-full bg-primary/10 blur-3xl"
      />
      <div
        aria-hidden
        className="absolute -bottom-10 -left-8 size-56 rounded-full bg-accent/15 blur-3xl"
      /> */}

      <div className="relative h-full w-full overflow-hidden rounded-control border border-border bg-muted/50 p-6 ">
        {/* A normal in-flow block respects the parent's padding directly —
            an `absolute inset-0` image ignores padding unless height/width
            are left unset, which fought with object-cover here. */}
        <img
          src={platformStackImg}
          alt={`Isometric diagram of the ${brandName} platform stack: omnichannel messaging, AI and automation, CRM and sales, and your business data`}
          className="block h-full w-full rounded-control object-cover object-center transition-all duration-500 ease-out"
        />

        {/* Brand badge overlaid on the stock illustration */}
        <span className="absolute left-[8%] top-[6%] inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5 text-[11px] font-semibold text-foreground ">
          <PlatformMark alt="" className="size-3.5 shrink-0 object-contain" />
          <BrandWordmark /> Platform
        </span>

        {/* Caption chip, bottom-right */}
        <span className="absolute bottom-[6%] right-[8%] inline-flex items-center gap-1.5 rounded-full bg-foreground px-3 py-1.5 text-[11px] font-semibold text-background ">
          <Workflow className="size-3.5" />
          One connected stack
        </span>
      </div>
    </div>
  );
}

/* ============================================================ */
/* Industry / use cases — six verticals + an illustrated inbox   */
/* presentation for the retained industry use cases.             */
/* ============================================================ */
function IndustryUseCases() {
  const industries = [
    {
      icon: ShoppingCart,
      title: "E-commerce & Retail",
      desc: "Turn customer inquiries into sales with connected conversations and faster support.",
      color: "bg-accent text-accent dark:bg-accent/10 dark:text-accent",
    },
    {
      icon: Store,
      title: "Local Businesses",
      desc: "Manage customer messages, appointments and everyday communication in one workspace.",
      color: "bg-primary text-accent dark:bg-primary/10 dark:text-accent",
    },
    {
      icon: Building2,
      title: "Real Estate & Property",
      desc: "Capture inquiries, organize leads and keep every property conversation moving.",
      color: "bg-primary text-accent dark:bg-primary/10 dark:text-accent",
    },
    {
      icon: GraduationCap,
      title: "Education & Training",
      desc: "Simplify student inquiries, admissions communication and follow-ups.",
      color: "bg-primary text-accent dark:bg-primary/10 dark:text-accent",
    },
    {
      icon: HeartPulse,
      title: "Healthcare & Clinics",
      desc: "Coordinate patient inquiries, appointment communication and team responses.",
      color: "bg-primary text-accent dark:bg-primary/10 dark:text-accent",
    },
    {
      icon: Plane,
      title: "Hospitality & Travel",
      desc: "Deliver more connected guest experiences, from first inquiry to ongoing support.",
      color: "bg-primary text-accent dark:bg-primary/10 dark:text-accent",
    },
  ];

  return (
    <section
      id="industries"
      className="section-marketing scroll-mt-24 bg-muted/80 border-b border-border"
    >
      <div className="relative container-marketing">
        <CornerPlus corner="bl" />
        <CornerPlus corner="br" />
        <div className="flex flex-wrap items-end justify-between gap-6 row-bleed-marketing border-b border-border pb-8">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-accent dark:text-accent">
              <Building2 className="size-3 text-accent" /> Built for every industry
            </span>
            <h2 className="text-marketing-title mt-4 leading-tight">
              One platform. Endless possibilities.
            </h2>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-muted-foreground">
              From growing businesses to established teams, <Brand /> brings customer conversations,
              sales and automation together.
            </p>
          </div>

          <Button asChild variant="primary" size="lg" className="shrink-0">
            <Link to="/features" {...ctaAttrs("explore-all-solutions", "industry-use-cases")}>
              Explore all solutions <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>

        {/* Image aligns with just the card grid, not the copy/CTA row above */}
        <div className="mt-8 flex flex-col gap-8 lg:flex-row lg:items-stretch">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:flex-[1.05]">
            {industries.map(({ icon: Icon, title, desc, color }) => (
              <div
                key={title}
                className="flex flex-col rounded-control border border-border bg-background p-5 transition-shadow hover:shadow-sm sm:p-6"
              >
                <span
                  className={`flex size-12 items-center justify-center rounded-control ${color}`}
                >
                  <Icon className="size-5" />
                </span>
                <p className="mt-4 text-base font-semibold text-foreground">{title}</p>
                <p className="mt-1.5 text-[12px] leading-relaxed text-muted-foreground">{desc}</p>
                <div className="flex-1" />
                <button
                  type="button"
                  aria-label={`Explore ${title}`}
                  className="mt-6 flex size-8 shrink-0 items-center justify-center self-start rounded-full border border-border text-muted-foreground transition-colors hover:border-foreground/30 hover:bg-muted/50 hover:text-foreground"
                >
                  <ArrowUpRight className="size-3.5" />
                </button>
              </div>
            ))}
          </div>

          {/* Right — isometric platform stack: channels → AI → CRM → your data */}
          <PlatformStackIllustration />
        </div>
      </div>
    </section>
  );
}

/* ============================================================ */
/* Platform overview — premium bento grid tying every spotlight   */
/* section together into one "everything connected" close.       */
/* ============================================================ */
function PlatformOverviewBento() {
  return (
    <section
      id="platform-overview"
      className="section-marketing relative connected-platform-section bg-card"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.12) 1px, transparent 1px)",
          backgroundSize: "26px 26px",
          maskImage: "radial-gradient(ellipse 65% 55% at 50% 0%, black 0%, transparent 75%)",
          WebkitMaskImage: "radial-gradient(ellipse 65% 55% at 50% 0%, black 0%, transparent 75%)",
        }}
      />

      <div className="relative container-marketing">
        <CornerPlus corner="bl" />
        <CornerPlus corner="br" />
        <div className="row-bleed-marketing border-b border-white/15 pb-8">
          <div className="mx-auto max-w-2xl text-center ">
            <span className="chip-marketing-hero text-marketing-hero-eyebrow">
              <Sparkles className="size-3" /> Everything you need, connected
            </span>
            <h2 className="text-marketing-oninverse-title mt-5 leading-tight">
              One powerful platform.
              <br />
              Everything working together.
            </h2>
            <p className="text-marketing-oninverse-lede mt-4">
              From customer conversations to sales, marketing, and automation, <Brand /> brings your
              essential business tools into one connected workspace.
            </p>
          </div>
        </div>

        <div className="overflow-hidden rounded-0 border-y border-border bg-border row-bleed-marketing p-0">
          <div className="grid grid-cols-1 gap-px sm:grid-cols-6">
            {/* 01 — Omnichannel Inbox (large) */}
            <div className="group p-6 transition-colors duration-300 bg-muted/50 sm:col-span-3 lg:p-8">
              <span className="flex size-12 items-center justify-center rounded-control bg-primary/10 text-accent">
                <Inbox className="size-5" />
              </span>
              <h3 className="mt-5 font-display text-[16px] font-semibold leading-snug text-foreground  lg:text-[17px]">
                Omnichannel Inbox
              </h3>
              <p className="mt-2 text-[13.5px] leading-relaxed text-muted-foreground">
                Bring every conversation into one shared inbox — no more switching tabs.
              </p>

              {/* Channel badges — two rows scrolling in opposite directions */}
              <div
                className="relative mt-4 space-y-2 overflow-hidden"
                style={{
                  maskImage:
                    "linear-gradient(to right, transparent, black 12%, black 88%, transparent)",
                  WebkitMaskImage:
                    "linear-gradient(to right, transparent, black 12%, black 88%, transparent)",
                }}
              >
                <style>{`
                  @keyframes cyloo-ch-l { from { transform: translateX(0); } to { transform: translateX(-50%); } }
                  @keyframes cyloo-ch-r { from { transform: translateX(-50%); } to { transform: translateX(0); } }
                  .cyloo-ch-row-l { animation: cyloo-ch-l 16s linear infinite !important; animation-iteration-count: infinite !important; }
                  .cyloo-ch-row-r { animation: cyloo-ch-r 16s linear infinite !important; animation-iteration-count: infinite !important; }
                `}</style>
                {[
                  [
                    { name: "WhatsApp", Icon: SiWhatsapp, bg: "#3ECE90" },
                    { name: "Instagram", Icon: SiInstagram, bg: "#2339CC" },
                    { name: "Email", Icon: Mail, bg: "#2339CC" },
                  ],
                  [
                    { name: "Messenger", Icon: SiMessenger, bg: "#2339CC" },
                    { name: "Telegram", Icon: SiTelegram, bg: "#2339CC" },
                  ],
                ].map((row, i) => (
                  <div
                    key={i}
                    className={`flex w-max gap-2 ${i === 0 ? "cyloo-ch-row-l" : "cyloo-ch-row-r"}`}
                  >
                    {[...row, ...row, ...row, ...row].map((c, j) => (
                      <span
                        key={j}
                        className="flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full bg-card px-2 py-1.5 text-[11px] font-medium shadow-xs"
                      >
                        <span
                          className="flex size-4 shrink-0 items-center justify-center rounded-full text-white"
                          style={{ background: c.bg }}
                        >
                          <c.Icon className="size-2.5" />
                        </span>
                        {c.name}
                      </span>
                    ))}
                  </div>
                ))}
              </div>

              {/* Mini product preview */}
              <div className="mt-5 rounded-control border border-border bg-card p-3">
                {[
                  {
                    name: "Priya Sharma",
                    snippet: "Is the order still available?",
                    Icon: SiWhatsapp,
                    bg: "#3ECE90",
                  },
                  {
                    name: "Daniel Cruz",
                    snippet: "Thanks for the quick reply!",
                    Icon: SiMessenger,
                    bg: "#2339CC",
                  },
                  {
                    name: "Amara Okafor",
                    snippet: "Can I get a discount code?",
                    Icon: SiInstagram,
                    bg: "#2339CC",
                  },
                ].map((c, i) => (
                  <div
                    key={c.name}
                    className={`flex items-center gap-2.5 rounded-control px-3 py-3 ${i === 0 ? "bg-muted/50 " : ""}`}
                  >
                    <span
                      className="flex size-8 shrink-0 items-center justify-center rounded-full text-white"
                      style={{ background: c.bg }}
                    >
                      <c.Icon className="size-3.5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold">{c.name}</p>
                      <p className="truncate text-xs  text-muted-foreground">{c.snippet}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 02 — CRM & Sales (large) */}
            <div className="group p-6 transition-colors duration-300 bg-muted/50 sm:col-span-3 lg:p-8">
              <span className="flex size-12 items-center justify-center rounded-control bg-primary/10 text-accent">
                <BarChart3 className="size-5" />
              </span>
              <h3 className="mt-5 font-display text-[16px] font-semibold leading-snug text-foreground  lg:text-[17px]">
                CRM &amp; Sales
              </h3>
              <p className="mt-2 text-[13.5px] leading-relaxed text-muted-foreground">
                Keep every lead, contact, and deal organized with full relationship context.
              </p>

              {/* CRM entity badges — two rows scrolling in opposite directions */}
              <div
                className="relative mt-4 space-y-2 overflow-hidden"
                style={{
                  maskImage:
                    "linear-gradient(to right, transparent, black 12%, black 88%, transparent)",
                  WebkitMaskImage:
                    "linear-gradient(to right, transparent, black 12%, black 88%, transparent)",
                }}
              >
                <style>{`
                  @keyframes cyloo-ch-l { from { transform: translateX(0); } to { transform: translateX(-50%); } }
                  @keyframes cyloo-ch-r { from { transform: translateX(-50%); } to { transform: translateX(0); } }
                  .cyloo-ch-row-l { animation: cyloo-ch-l 16s linear infinite !important; animation-iteration-count: infinite !important; }
                  .cyloo-ch-row-r { animation: cyloo-ch-r 16s linear infinite !important; animation-iteration-count: infinite !important; }
                `}</style>
                {[
                  [
                    { name: "Leads", Icon: UserPlus },
                    { name: "Deals", Icon: TrendingUp },
                  ],
                  [
                    { name: "Contacts", Icon: Users },
                    { name: "Pipeline", Icon: GitBranch },
                  ],
                ].map((row, i) => (
                  <div
                    key={i}
                    className={`flex w-max gap-2 ${i === 0 ? "cyloo-ch-row-l" : "cyloo-ch-row-r"}`}
                  >
                    {[...row, ...row, ...row, ...row].map((c, j) => (
                      <span
                        key={j}
                        className="flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full bg-card px-2 py-1.5 text-[11px] font-medium shadow-xs"
                      >
                        <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-primary/10 text-accent">
                          <c.Icon className="size-2.5" />
                        </span>
                        {c.name}
                      </span>
                    ))}
                  </div>
                ))}
              </div>

              {/* Mini product preview */}
              <div className="mt-5 grid grid-cols-3 gap-2.5">
                {[
                  { name: "New Lead", deal: "Horizon Textiles", value: "$2,400", dot: "#3ECE90" },
                  { name: "Qualified", deal: "Hilltop Logistics", value: "$5,200", dot: "#2339CC" },
                  { name: "Won", deal: "Echo Fitness", value: "$6,300", dot: "#2339CC" },
                  { name: "Qualified", deal: "Hilltop Logistics", value: "$5,200", dot: "#2339CC" },
                  { name: "Won", deal: "Echo Fitness", value: "$6,300", dot: "#2339CC" },
                  { name: "New Lead", deal: "Horizon Textiles", value: "$2,400", dot: "#3ECE90" },
                ].map((stage, index) => (
                  <div
                    key={`${stage.name}-${index}`}
                    className="rounded-control bg-muted p-4 border border-border"
                  >
                    <p className="text-[11px] font-semibold uppercase">{stage.name}</p>
                    <div className="mt-2 rounded-control border border-border bg-muted/50 p-2 ">
                      <div className="flex items-center gap-1.5">
                        <span
                          className="size-1.5 shrink-0 rounded-full"
                          style={{ background: stage.dot }}
                        />
                        <p className="truncate text-[11px] font-medium text-muted-foreground">
                          {stage.deal}
                        </p>
                      </div>
                      <p className="mt-2 font-semibold">{stage.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 03 — Marketing Campaigns (medium) */}
            <div className="group bg-card p-6 transition-colors duration-300 hover:bg-muted/50 sm:col-span-2">
              <span className="flex size-12 items-center justify-center rounded-control bg-primary/10 text-accent">
                <Megaphone className="size-4.5" />
              </span>
              <h3 className="mt-4 font-display text-base font-semibold leading-snug text-foreground ">
                Marketing Campaigns
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Manage targeted messaging campaigns, organize audiences, and track activity.
              </p>
            </div>

            {/* 04 — Chatbots & Automation (medium) */}
            <div className="group bg-card p-6 transition-colors duration-300 hover:bg-muted/50 sm:col-span-2">
              <span className="flex size-12 items-center justify-center rounded-control bg-primary/10 text-accent">
                <Bot className="size-4.5" />
              </span>
              <h3 className="mt-4 font-display text-base font-semibold leading-snug text-foreground ">
                Chatbots &amp; Automation
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Automate repetitive conversations and configure intelligent responses.
              </p>
            </div>

            {/* 05 — Visual Flow Builder (medium) */}
            <div className="group bg-card p-6 transition-colors duration-300 hover:bg-muted/50 sm:col-span-2">
              <span className="flex size-12 items-center justify-center rounded-control bg-primary/10 text-accent">
                <Workflow className="size-4.5" />
              </span>
              <h3 className="mt-4 font-display text-base font-semibold leading-snug text-foreground ">
                Visual Flow Builder
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Design connected automation journeys with triggers, conditions, and actions.
              </p>
            </div>

            {[
              {
                num: "06",
                icon: Users,
                title: "Team Collaboration",
                desc: "Assign conversations, manage ownership, and keep your team working together.",
              },
              {
                num: "07",
                icon: BarChart3,
                title: "Insights & Analytics",
                desc: "Monitor conversations, team activity, and performance through clear dashboards.",
              },
              {
                num: "08",
                icon: KeyRound,
                title: "Workspaces & API Access",
                desc: "Manage multiple workspaces and extend your platform with API connections.",
              },
            ].map((f) => (
              <div
                key={f.num}
                className="group bg-card p-6 transition-colors duration-300 hover:bg-muted/50 sm:col-span-2"
              >
                <span className="flex size-12 items-center justify-center rounded-control bg-primary/10 text-accent">
                  <f.icon className="size-4.5" />
                </span>
                <h3 className="mt-4 font-display text-base font-semibold leading-snug text-foreground ">
                  {f.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
              </div>
            ))}

            {[
              {
                num: "09",
                icon: Send,
                title: "Bulk Broadcasting",
                desc: "Send personalized WhatsApp and SMS campaigns to thousands of contacts with smart throttling.",
              },
              {
                num: "10",
                icon: TrendingUp,
                title: "Lead Generation",
                desc: "Capture and qualify leads automatically, score them, and never let a hot lead slip away.",
              },
              {
                num: "11",
                icon: ShoppingCart,
                title: "E-commerce Sync",
                desc: "Connect your store to sync orders, send cart reminders, and confirm deliveries over chat.",
              },
              {
                num: "12",
                icon: CalendarClock,
                title: "Social Scheduling",
                desc: "Plan and publish posts across your social accounts from one content calendar.",
              },
              {
                num: "13",
                icon: Ticket,
                title: "Helpdesk & Ticketing",
                desc: "Turn conversations into tickets, set priorities, and resolve customer issues with SLAs.",
              },
              {
                num: "14",
                icon: Clock,
                title: "Appointment Booking",
                desc: "Let customers book, reschedule, and get reminders for appointments over chat.",
              },
            ].map((f) => (
              <div
                key={f.num}
                className="group bg-card p-6 transition-colors duration-300 hover:bg-muted/50 sm:col-span-2"
              >
                <span className="flex size-12 items-center justify-center rounded-control bg-primary/10 text-accent">
                  <f.icon className="size-4.5" />
                </span>
                <h3 className="mt-4 font-display text-base font-semibold leading-snug text-foreground ">
                  {f.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-14 flex flex-col items-center gap-6 text-center">
          <p className="text-marketing-hero-meta max-w-xl">
            Less switching. Better collaboration. More connected customer experiences.
          </p>
          <Button asChild variant="heroGhost" size="xl">
            <Link to="/features" {...ctaAttrs("explore-all-features", "platform-overview")}>
              Explore All Features <ArrowRight />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

/* ============================================================ */
/* Stepper — auto-rotating feature tabs with image + list + CTA */
/* ============================================================ */
const STEP_SLUGS = [
  "step-smart-inbox",
  "step-flow-builder",
  "step-campaigns-webhooks",
  "step-automation-chatbots",
  "step-ecommerce-shopify",
] as const;

const STEP_INDICATOR_POSITIONS = [
  "left-0 min-[45rem]:left-[0%]",
  "left-[9rem] min-[45rem]:left-[20%]",
  "left-[18rem] min-[45rem]:left-[40%]",
  "left-[27rem] min-[45rem]:left-[60%]",
  "left-[36rem] min-[45rem]:left-[80%]",
] as const;

function Stepper() {
  const reduceMotion = useReducedMotion();
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const tabListRef = useRef<HTMLDivElement>(null);

  const steps = [
    {
      n: "01",
      title: "Smart Inbox",
      desc: "One live queue for every channel — WhatsApp, Instagram, Messenger, Telegram, SMS, Email and Live Chat. Assign, tag, and resolve conversations together.",
      list: [
        "Unified inbox with real-time presence",
        "Auto-assignment, mentions, and SLA timers",
        "Internal notes and collision detection",
        "Mobile notifications for urgent threads",
      ],
      cta: "Explore the inbox",
      href: "#platform-overview",
      image: stepperInboxImg,
      alt: "Smart Inbox shared team queue",
    },
    {
      n: "02",
      title: "Flow Builder",
      desc: "Drag triggers, conditions, delays and AI steps into a visual journey with versioning, test runs, and one-click publishing.",
      list: [
        "No-code canvas with 30+ node types",
        "Branching logic, A/B splits and loops",
        "Version history and rollback",
        "Trigger from webhooks, schedules or events",
      ],
      cta: "See flow builder",
      href: "#workflow",
      image: stepperFlowImg,
      alt: "visual flow builder canvas",
    },
    {
      n: "03",
      title: "Campaigns & Webhooks",
      desc: "Broadcast approved templates to live segments, then push events to any external system or BI tool.",
      list: [
        "Segment by tags, behavior, or CRM status",
        "WhatsApp template approval pipeline",
        "Real-time analytics and read receipts",
        "Webhooks to Zapier, Make, custom APIs",
      ],
      cta: "View campaigns",
      href: "#pricing",
      image: stepperCampaignImg,
      alt: "campaign analytics dashboard",
    },
    {
      n: "04",
      title: "Automation Flows & Chatbots",
      desc: "Deploy AI agents grounded in your knowledge base that hand off cleanly to a human when confidence is low.",
      list: [
        "Knowledge base with RAG and citations",
        "Multi-language intent detection",
        "Skills-based routing and human handoff",
        "Live train from closed conversations",
      ],
      cta: "Meet the AI",
      href: "#workflow",
      image: stepperBotImg,
      alt: "AI chatbot builder",
    },
    {
      n: "05",
      title: "Ecommerce Integration",
      desc: "Connect your Shopify store and turn WhatsApp into a checkout channel. Sync products, carts, orders and abandoned-cart recovery.",
      list: [
        "Native Shopify store sync and catalog import",
        "WhatsApp product cards and mini-cart checkout",
        "Abandoned-cart and order-status automations",
        "Unified customer profile across store and chat",
      ],
      cta: "Explore commerce",
      href: "#platform-overview",
      image: stepperEcommerceImg,
      alt: "ecommerce and Shopify WhatsApp integration",
    },
  ];

  useEffect(() => {
    if (paused || reduceMotion) return;
    const id = setInterval(() => setActive((i) => (i + 1) % steps.length), 5000);
    return () => clearInterval(id);
  }, [paused, reduceMotion, steps.length]);

  // Keep the selected tab visible when the compact tab list scrolls horizontally.
  useEffect(() => {
    const tabList = tabListRef.current;
    const tab = tabList?.querySelector<HTMLButtonElement>(`[data-step-index="${active}"]`);
    if (!tabList || !tab) return;

    tabList.scrollTo({
      behavior: reduceMotion ? "auto" : "smooth",
      left: tab.offsetLeft - (tabList.clientWidth - tab.offsetWidth) / 2,
    });
  }, [active, reduceMotion]);

  // Deep links: #step-flow-builder etc. selects the tab and scrolls it into view.
  useEffect(() => {
    const applyHash = (scroll: boolean) => {
      const slug = window.location.hash.replace(/^#/, "");
      const idx = STEP_SLUGS.indexOf(slug as (typeof STEP_SLUGS)[number]);
      if (idx < 0) return;
      setActive(idx);
      setPaused(true);
      if (scroll) {
        requestAnimationFrame(() => {
          sectionRef.current?.scrollIntoView({
            behavior: reduceMotion ? "auto" : "smooth",
            block: "start",
          });
        });
      }
    };
    applyHash(true);
    const onHashChange = () => applyHash(true);
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, [reduceMotion]);

  const selectStep = (i: number) => {
    setActive(i);
    setPaused(true);
    if (typeof window !== "undefined") {
      window.history.replaceState(null, "", `#${STEP_SLUGS[i]}`);
    }
  };

  return (
    <section
      ref={sectionRef}
      id="workflow"
      className="section-marketing scroll-mt-24 border-b border-border bg-background"
    >
      <div className="relative container-marketing">
        <CornerPlus corner="bl" />
        <CornerPlus corner="br" />
        <div className="max-w-2xl">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-accent">
            <Workflow className="size-3 text-accent" /> The End-to-End Workflow
          </span>
          <h2 className="text-marketing-title mt-4">
            From first message to fully automated revenue.
          </h2>
        </div>

        <div
          className="mt-6 rounded-0 border-t border-border bg-surface shadow-elegant overflow-hidden row-bleed-marketing p-0"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onFocus={() => setPaused(true)}
          onBlur={() => setPaused(false)}
        >
          {/* Tab list — Saaly-style segmented bar: equal-width cells, divided by
              a vertical border, active tab marked by bold text + thin underline
              instead of a filled pill. */}
          <div ref={tabListRef} className="overflow-x-auto border-b border-border bg-background">
            <div
              className="relative grid min-w-[45rem] divide-x divide-border min-[45rem]:min-w-full"
              style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(9rem, 1fr))` }}
              role="tablist"
              aria-label="Product workflow"
            >
              {steps.map((s, i) => {
                const isActive = i === active;
                return (
                  <button
                    key={s.n}
                    id={STEP_SLUGS[i]}
                    data-step-index={i}
                    onClick={() => selectStep(i)}
                    role="tab"
                    aria-selected={isActive}
                    tabIndex={isActive ? 0 : -1}
                    aria-controls={`workflow-panel-${i}`}
                    onKeyDown={(event) => {
                      const next =
                        event.key === "ArrowRight"
                          ? (i + 1) % steps.length
                          : event.key === "ArrowLeft"
                            ? (i - 1 + steps.length) % steps.length
                            : event.key === "Home"
                              ? 0
                              : event.key === "End"
                                ? steps.length - 1
                                : null;
                      if (next === null) return;
                      event.preventDefault();
                      selectStep(next);
                      document.getElementById(STEP_SLUGS[next])?.focus();
                    }}
                    className={`relative min-w-0 scroll-mt-24 px-3 py-4 text-center text-xs leading-tight transition-colors duration-200 rounded-none sm:px-6 sm:py-6 sm:text-sm ${
                      isActive
                        ? "font-semibold text-foreground"
                        : "text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                    }`}
                  >
                    {s.title}
                  </button>
                );
              })}
              {/* Active-tab indicator — jumps to the active tab's slot (left/width
                transition), then its fill animates left-to-right in sync with
                the real 5s auto-advance timer, pausing on hover/focus/select
                instead of snapping, and restarting from empty on each tab. */}
              <span
                aria-hidden
                className={`absolute bottom-0 h-0.75 w-36 overflow-hidden bg-foreground/5 min-[45rem]:w-1/5 ${STEP_INDICATOR_POSITIONS[active]}`}
              >
                <span
                  key={active}
                  className="block h-full w-full origin-left bg-primary"
                  style={{
                    animation: "stepper-progress 5000ms linear forwards",
                    animationPlayState: paused ? "paused" : "running",
                  }}
                />
              </span>
            </div>
          </div>

          {/* Content panels */}
          <div className="relative">
            {steps.map((s, i) => (
              <div
                key={s.n}
                id={`workflow-panel-${i}`}
                role="tabpanel"
                aria-labelledby={STEP_SLUGS[i]}
                inert={i !== active}
                className={`transition-opacity duration-500 ease-out ${i === active ? "relative opacity-100 z-10" : "absolute inset-0 opacity-0 z-0 pointer-events-none"}`}
                aria-hidden={i !== active}
              >
                <div className="grid gap-8 px-6 pt-6 lg:grid-cols-2 lg:gap-12 lg:pt-10 lg:px-10">
                  {/* Text */}
                  <div className="flex flex-col justify-center">
                    <h3 className="text-marketing-title mt-4">{s.title}</h3>
                    <p className="text-marketing-lede mt-3">{s.desc}</p>
                    <ul className="mt-6 space-y-3">
                      {s.list.map((item) => (
                        <li key={item} className="flex items-start gap-2 text-marketing-meta">
                          <Check className="mt-0.5 size-4 shrink-0 text-whatsapp" />
                          {item}
                        </li>
                      ))}
                    </ul>
                    <div className="mt-8">
                      {/* Text CTA */}
                      <div className="shrink-0">
                        <a
                          href={s.href}
                          {...ctaAttrs("stepper_cta", "workflow", "cta_click", s.title)}
                          className="inline-flex items-center gap-2 text-xs font-semibold uppercase text-foreground transition-colors hover:text-accent"
                        >
                          {s.cta} <ArrowRight className="ml-2 size-4" />
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* Image */}
                  <div className="relative overflow-hidden rounded-control border border-border bg-muted/50 p-6">
                    <img
                      src={s.image}
                      alt={s.alt}
                      loading="lazy"
                      className="inset-0 h-full w-full object-cover rounded-control border border-border"
                      style={{ filter: "hue-rotate(110deg)" }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ============================================================ */
/* CTA                                                          */
/* ============================================================ */
function CTA() {
  const brandName = useBrandName();
  const proof = [
    {
      n: "01",
      title: "Use-case walkthrough",
      text: "A focused 20-minute session built around your team's workflow.",
    },
    {
      n: "02",
      title: "Migration path",
      text: `A practical route from your current inbox or CRM into ${brandName}.`,
    },
    {
      n: "03",
      title: "Channel onboarding",
      text: "Numbers, templates, verification, and workspace setup covered.",
    },
    {
      n: "04",
      title: "Deployment review",
      text: "Choose managed infrastructure or review self-hosting with your engineers.",
    },
  ];
  return (
    <section
      id="demo"
      className="section-marketing relative scroll-mt-24 border-b border-border bg-background p-0"
    >
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-32 top-0 size-[30rem] rounded-full bg-[#3ECE90]/8 blur-3xl" />
        <div className="absolute -right-40 bottom-0 size-[32rem] rounded-full bg-primary/12 blur-3xl" />
      </div>

      <div className="container-marketing relative py-0">
        <CornerPlus corner="bl" />
        <CornerPlus corner="br" />

        <div className="row-bleed-marketing relative overflow-hidden border-y border-white/10 bg-primary p-0 text-white ">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-25"
            style={{
              backgroundImage:
                "radial-gradient(circle, rgba(255,255,255,0.25) 1px, transparent 1px)",
              backgroundSize: "28px 28px",
              maskImage: "radial-gradient(ellipse 70% 80% at 0% 0%, black, transparent)",
              WebkitMaskImage: "radial-gradient(ellipse 70% 80% at 0% 0%, black, transparent)",
            }}
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -right-20 -top-24 size-96 rounded-full bg-[#3ECE90]/20 blur-3xl"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-48 left-1/3 size-[30rem] rounded-full bg-[#3ECE90]/15 blur-3xl"
          />

          <div className="relative grid items-stretch lg:grid-cols-[0.95fr_1.05fr]">
            <div className="flex min-w-0 flex-col px-7 py-10 sm:px-10 lg:border-r lg:border-white/10 lg:px-14 lg:py-16">
              <div>
                <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/8 px-3 py-1.5 text-[12px] font-semibold text-white/85 backdrop-blur-sm">
                  <Sparkles className="size-3 text-[#2339CC]" /> Book a demo
                </span>
                <h2 className="text-marketing-title mt-4 text-white ">
                  Ship your omnichannel CRM this week.
                </h2>
                <p className="mt-5 max-w-xl text-[15px] font-light leading-7 text-white/70">
                  Tell us how your team works today and we'll map the inbox, CRM, automation, and
                  deployment setup around your real channels and customer journey.
                </p>
              </div>

              <div className="mt-9 grid border-y border-white/12 sm:grid-cols-2">
                {proof.map((item, index) => (
                  <div
                    key={item.n}
                    className={`relative px-1 py-5 sm:px-5 ${index % 2 === 1 ? "sm:border-l sm:border-white/12" : ""} ${index > 1 ? "border-t border-white/12" : index === 1 ? "border-t border-white/12 sm:border-t-0" : ""}`}
                  >
                    <div className="flex items-start gap-3">
                      <span className="mt-0.5 font-mono text-[12px] font-semibold text-[#3ECE90]">
                        {item.n}
                      </span>
                      <div>
                        <p className="font-display text-[14px] font-semibold text-white">
                          {item.title}
                        </p>
                        <p className="mt-1.5 text-[12px] leading-relaxed text-white/70">
                          {item.text}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-auto pt-9">
                <div className="flex flex-wrap gap-3">
                  <WhatsAppCtaButton
                    size="xl"
                    label="Chat with us now"
                    message="Hi! I'd like to book a {site} demo."
                    analyticsLocation="demo-cta"
                    className="text-white w-full sm:w-fit"
                  />
                  <Button asChild variant="heroGhost" size="xl" className="w-full sm:w-fit">
                    <Link
                      to="/auth"
                      search={{ mode: "sign-up" }}
                      {...ctaAttrs("start-free", "demo-cta")}
                    >
                      Start free instead <ArrowRight />
                    </Link>
                  </Button>
                </div>
                <span className="mt-4 inline-flex items-center gap-2 text-[12px]  text-white/70">
                  <ShieldCheck className="size-3.5 text-[#3ECE90]" /> Your details stay private
                </span>
              </div>
            </div>

            <div className="relative flex min-w-0 items-center bg-white/[0.035] px-5 py-8 sm:px-8 lg:px-12 lg:py-12">
              <div className="w-full">
                <div className="mb-4 flex items-center justify-between gap-4 px-1 text-white">
                  <div>
                    <p className="font-display text-lg font-semibold">Request your walkthrough</p>
                    <p className="mt-1 text-[12px] text-white/70">
                      Tailored to your team, channels, and deployment.
                    </p>
                  </div>
                  <span className="hidden items-center gap-2 text-base  text-white/70 sm:inline-flex">
                    <span className="relative flex size-2">
                      <span className="absolute inline-flex size-full animate-ping rounded-full bg-[#3ECE90] opacity-50" />
                      <span className="relative inline-flex size-2 rounded-full bg-[#3ECE90]" />
                    </span>
                    Reply within one business day
                  </span>
                </div>
                <LeadCaptureForm />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ============================================================ */
/* Pricing                                                      */
/* ============================================================ */
function Pricing() {
  const reduceMotion = useReducedMotion();
  const { supportEmail } = usePlatformBranding();
  const {
    plans: catalogPlans,
    all,
    interval,
    setInterval: setBillingInterval,
    savingsPct,
    hasYearly,
    maxTrialDays,
  } = usePublicPlans("month");
  const plans = marketingPlans(all, catalogPlans);
  const { subscription } = useMyPlanSummary();

  // Was a literal "All prices in USD", which contradicted the prices above it
  // once the platform currency changed. Taken from the plans on display.
  const platformCurrency = useTenantCurrency();
  const displayCurrency =
    plans.find((p) => p.currency)?.currency?.toUpperCase() ?? platformCurrency;

  return (
    <section
      id="pricing"
      className="section-marketing relative scroll-mt-24 border-b border-border bg-background"
    >
      {/* <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -right-48 bottom-0 size-[34rem] rounded-full bg-primary/7 blur-3xl" />
        <div
          className="absolute inset-x-0 top-0 h-96 opacity-50"
          style={{
            backgroundImage: "radial-gradient(circle, var(--border) 1px, transparent 1px)",
            backgroundSize: "26px 26px",
            maskImage: "radial-gradient(ellipse 55% 70% at 50% 0%, black 0%, transparent 78%)",
            WebkitMaskImage:
              "radial-gradient(ellipse 55% 70% at 50% 0%, black 0%, transparent 78%)",
          }}
        />
      </div> */}

      <div className="relative container-marketing">
        <CornerPlus corner="bl" />
        <CornerPlus corner="br" />

        <div className="grid items-end gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:gap-20">
          <div className="max-w-xl">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-accent">
              <Tag className="size-3 text-accent" /> Fair, Flexible Pricing
            </span>
            <h2 className="text-marketing-title mt-4">Simple pricing. No per-agent tax.</h2>
          </div>
          <div className="max-w-2xl lg:justify-self-end">
            <p className="text-marketing-lede">
              Every plan includes the full platform — inbox, automations, templates and CRM. You
              only choose how much volume and how many seats you need.
            </p>
          </div>
        </div>

        <div className="row-bleed-marketing mt-12 grid border-y border-border bg-background p-0">
          <div className="grid items-stretch lg:grid-cols-[1fr_auto_1fr]">
            <div className="hidden items-center gap-3 border-r border-border px-8 py-5 lg:flex">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-accent dark:bg-accent/10 dark:text-accent">
                <Clock className="size-4.5" />
              </span>
              <span>
                <span className="block text-sm font-semibold text-foreground">
                  {maxTrialDays > 0 ? `${maxTrialDays}-day free trial` : "Start without friction"}
                </span>
                <span className="mt-0.5 block text-[12px] text-muted-foreground">
                  Test the complete platform before committing.
                </span>
              </span>
            </div>

            <div className="flex flex-col items-center justify-center px-6 py-4 lg:min-w-[22rem] bg-muted/50">
              <span className="mb-2 text-[10px] font-semibold uppercase text-muted-foreground">
                Choose billing frequency
              </span>
              {hasYearly && (
                <div
                  role="group"
                  aria-label="Billing interval"
                  className="inline-grid max-w-full grid-cols-2 overflow-hidden rounded-full border border-border bg-background p-1 text-xs sm:text-sm"
                >
                  {(["month", "year"] as const).map((value) => (
                    <button
                      key={value}
                      type="button"
                      aria-pressed={interval === value}
                      onClick={() => {
                        setBillingInterval(value);
                        trackMarketing("cta_click", {
                          cta_id: "billing-interval",
                          location: "home-pricing",
                          label: value,
                        });
                      }}
                      className={`rounded-full px-3 py-2 font-medium transition-all duration-200 sm:px-4 ${
                        interval === value
                          ? "bg-primary text-white shadow-sm"
                          : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                      }`}
                    >
                      {value === "month" ? "Monthly" : "Yearly"}
                      <span className="hidden sm:inline"> Billing</span>
                      {value === "year" && savingsPct > 0 && (
                        <span
                          className={`ml-1.5 hidden text-[11px] font-semibold uppercase sm:inline ${
                            interval === value ? "text-accent" : "text-accent dark:text-accent"
                          }`}
                        >
                          −{savingsPct}%
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="hidden items-center justify-end gap-3 border-l border-border px-8 py-5 lg:flex">
              <span>
                <span className="block text-right text-sm font-semibold text-foreground">
                  Flexible billing
                </span>
                <span className="mt-0.5 block text-right text-[11px] text-muted-foreground">
                  Upgrade, downgrade, or cancel anytime.
                </span>
              </span>
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-accent dark:bg-accent/10 dark:text-accent">
                <ShieldCheck className="size-4.5" />
              </span>
            </div>
          </div>

          <CurrentPlanBanner subscription={subscription} />
        </div>

        {plans.length === 0 ? (
          <p className="text-marketing-meta mt-14 text-center">
            Plans are being updated —{" "}
            <Link to="/pricing" className="text-accent hover:underline">
              see full pricing
            </Link>
            .
          </p>
        ) : (
          <div className="row-bleed-marketing flex flex-wrap justify-center gap-px border-b border-border bg-border p-0">
            {plans.map((p) => {
              const contactSales = isContactSalesPlan(p);
              const perMonth = monthlyEquivalent(p);
              const currentPlan = isCurrentPlan(p.code, subscription);

              const cta =
                p.cta_label ??
                (contactSales
                  ? "Contact sales"
                  : p.price_cents === 0
                    ? "Start free"
                    : "Start free trial");
              return (
                <motion.article
                  data-pricing-plan={p.code}
                  whileHover={reduceMotion ? undefined : { y: -3 }}
                  transition={{ duration: 0.18 }}
                  key={p.id}
                  className={`group relative flex w-full min-w-0 max-w-md flex-[1_1_18rem] flex-col overflow-hidden border border-border p-6 transition-colors duration-200 ${
                    p.highlight
                      ? "bg-primary/[0.03] dark:bg-primary/[0.06] border-primary/40 ring-1 ring-primary/30"
                      : "bg-background"
                  } ${currentPlan ? "ring-2 ring-inset ring-[#3ECE90]/60" : ""}`}
                >
                  {p.highlight && (
                    <div aria-hidden className="absolute inset-x-0 top-0 h-1.5 bg-accent" />
                  )}
                  <div className="mb-8 rounded-control border border-border bg-muted/50 p-6 sm:min-h-[18.25rem]">
                    <div className="flex min-h-7 items-start justify-between gap-3">
                      <span className="font-mono text-[11px] font-semibold text-muted-foreground">
                        PLAN {String(catalogPlans.indexOf(p) + 1).padStart(2, "0")}
                      </span>
                      {p.badge && (
                        <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-primary px-2.5 py-1 text-[9px] font-semibold uppercase text-white shadow-sm">
                          <Sparkles className="size-2.5" />
                          {p.badge}
                        </span>
                      )}
                    </div>

                    {currentPlan && (
                      <div className="mt-3 w-fit">
                        <CurrentPlanPill subscription={subscription} />
                      </div>
                    )}

                    <h3 className="mt-5 font-display text-lg font-semibold text-foreground">
                      {p.name}
                    </h3>
                    <div className="mt-4 flex flex-wrap items-baseline gap-x-1.5 gap-y-1">
                      <span className="font-display text-[2.35rem] font-semibold leading-none text-foreground">
                        {p.price_cents === 0 ? "Free" : formatPlanPrice(p.price_cents, p.currency)}
                      </span>
                      {p.price_cents > 0 && (
                        <span className="text-[11px] text-muted-foreground">
                          {p.interval === "lifetime"
                            ? "one-time"
                            : `/ ${p.interval === "year" ? "year" : "month"}`}
                        </span>
                      )}
                    </div>
                    {perMonth && (
                      <p className="mt-1.5 text-[11px] font-medium text-accent dark:text-accent">
                        {perMonth} / month, billed yearly
                      </p>
                    )}
                    {(p.tagline || p.description) && (
                      <p className="mt-3 min-h-10 text-[12px] leading-relaxed text-muted-foreground">
                        {p.tagline ?? p.description}
                      </p>
                    )}
                    {p.trial_days > 0 && !contactSales && (
                      <p className="mt-3 inline-flex w-fit items-center gap-1.5 rounded-full border border-[#2339CC]/10 bg-background/80 px-2.5 py-1 text-[11px] font-semibold text-accent dark:bg-accent/50 dark:text-accent">
                        <Clock className="size-3" />
                        {p.trial_days}-day free trial
                      </p>
                    )}
                  </div>

                  <div className="flex flex-1 flex-col p-4">
                    <p className="mb-3 text-[11px] font-semibold uppercase text-muted-foreground">
                      Included in this plan
                    </p>
                    <ul className="flex-1 space-y-2.5 text-sm">
                      {planBullets(p).map((f) => (
                        <li
                          key={f}
                          className="flex items-start gap-2.5 text-[12px] leading-relaxed text-foreground/75"
                        >
                          <span className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full bg-primary/8 dark:bg-accent/15">
                            <Check
                              className="size-2.5 text-accent dark:text-accent"
                              strokeWidth={2.4}
                            />
                          </span>
                          {f}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-auto -mx-6 -mb-6 border-t border-border">
                    {contactSales ? (
                      <a
                        href={`mailto:${supportEmail ?? "sales@cyloo.com"}?subject=Enterprise%20inquiry`}
                        {...ctaAttrs(`plan-${p.code}`, "home-pricing", "pricing_click", cta)}
                        data-analytics-plan={p.code}
                        className={`px-6 py-4 flex items-center justify-between gap-2 text-sm font-bold transition-all duration-200 ${
                          p.highlight
                            ? "bg-primary text-white hover:bg-primary/90 shadow-sm"
                            : "hover:bg-muted text-foreground"
                        }`}
                      >
                        {cta} <ArrowRight className="size-4" />
                      </a>
                    ) : currentPlan ? (
                      <Link
                        to="/billing"
                        data-analytics-plan={p.code}
                        className="px-6 py-4 flex items-center justify-between gap-2 text-sm font-bold text-foreground transition-colors hover:bg-muted"
                      >
                        Manage your plan <ArrowRight className="size-4" />
                      </Link>
                    ) : (
                      <Link
                        to="/auth"
                        search={{ plan: p.code, mode: "sign-up" } as never}
                        {...ctaAttrs(`plan-${p.code}`, "home-pricing", "pricing_click", cta)}
                        data-analytics-plan={p.code}
                        className={`px-6 py-4 flex items-center justify-between gap-2 text-sm font-bold transition-all duration-200 ${
                          p.highlight
                            ? "bg-primary text-white hover:bg-primary/90 shadow-sm"
                            : "hover:bg-muted text-foreground"
                        }`}
                      >
                        {cta} <ArrowRight className="size-4" />
                      </Link>
                    )}
                  </div>
                </motion.article>
              );
            })}
          </div>
        )}

        <div className="mt-8 flex flex-col gap-4 text-base text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p className="inline-flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px]">
            <span>All prices in {displayCurrency}.</span>
            <span aria-hidden className="hidden size-1 rounded-full bg-border sm:inline-block" />
            <span>No hidden per-agent fees.</span>
            <span aria-hidden className="hidden size-1 rounded-full bg-border sm:inline-block" />
            <span>Cancel anytime.</span>
          </p>
          <Link
            to="/pricing"
            className="inline-flex items-center gap-2 font-semibold text-[13px] text-accent transition-colors hover:text-[#2339CC] dark:text-accent"
          >
            Compare every plan <ArrowRight className="size-3.5" />
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ============================================================ */
/* APP Marketing                                                */
/* ============================================================ */

function MarketingSection() {
  const downloadStats = [
    { value: "16+", label: "Connected channels" },
    { value: "40+", label: "Platform modules" },
    { value: "04+", label: "AI providers" },
  ];

  return (
    <section id="download" className="section-marketing relative overflow-hidden bg-background">
      <div className="container-marketing relative p-0">
        <CornerPlus corner="bl" />
        <CornerPlus corner="br" />

        <div className="relative overflow-hidden bg-card px-5 py-12 sm:px-10 sm:py-16 lg:px-16 lg:py-20 dark:border-white/10 dark:bg-[#2339CC]">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              background: "transparent",
            }}
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-4 rounded-[1.45rem] border border-white dark:border-white/10 shadow-xs"
          />

          <div className="relative mx-auto flex max-w-4xl flex-col items-center text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/80 bg-card px-3 py-1.5 text-[12px] font-semibold text-accent shadow-sm dark:border-white/10 dark:bg-card dark:text-accent">
              <Sparkles className="size-3" /> Production-ready omnichannel SaaS
            </span>

            <h2 className="mt-6 max-w-3xl font-display text-[clamp(2rem,4.4vw,4rem)] font-semibold leading-[1.02] tracking-[-0.045em] text-foreground">
              Launch your own omnichannel CRM today.
            </h2>
            <p className="mt-5 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
              Download the complete <Brand /> platform and start with a unified inbox, CRM, AI
              automation, helpdesk, commerce, billing, and multi-tenant administration already
              connected.
            </p>

            <div className="mt-9 grid w-full max-w-3xl gap-3 sm:grid-cols-3">
              {downloadStats.map(({ value, label }) => (
                <div
                  key={label}
                  className="rounded-control border border-border/75 bg-card px-6 py-12 backdrop-blur-md dark:border-white/10 dark:bg-white/7"
                >
                  <span className="block  font-display text-5xl font-bold text-accent">
                    {value}
                  </span>
                  <span className="mt-3 block text-[12px] font-medium text-muted-foreground">
                    {label}
                  </span>
                </div>
              ))}
            </div>

            <Link
              to="/auth"
              {...ctaAttrs("get-started-cyloo", "download-section")}
              className="group mt-10 inline-flex min-h-16 items-center justify-center gap-2.5 rounded-control bg-primary px-12 py-4 text-sm font-semibold text-primary-foreground transition-all duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              Get Started with <Brand />
              <ArrowRight className="size-4" />
            </Link>

            <p className="mt-4 max-w-2xl text-[12px] leading-relaxed text-muted-foreground">
              Production-ready multi-tenant CRM, AI automations, omnichannel inbox, and enterprise
              SLA support.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ============================================================ */
/* Footer                                                       */
/* ============================================================ */
function Footer() {
  const columns = [
    {
      title: "Product",
      links: [
        { label: "Platform", href: "#platform-overview" },
        { label: "Product tour", href: "#workflow" },
        { label: "Solutions", href: "#industries" },
        { label: "Pricing", href: "#pricing" },
      ],
    },
    {
      title: "Resources",
      links: [
        ...(SHOW_RESOURCE_LINKS
          ? [
              { label: "Documentation", href: docsUrl() },
              { label: "Install guide", href: "/install" },
            ]
          : []),
        { label: "About", href: "/about" },
        { label: "Contact", href: "/contact" },
      ],
    },
    {
      title: "Legal",
      links: [
        { label: "Privacy policy", href: "/legal/privacy-policy" },
        { label: "Terms of service", href: "/legal/terms-of-service" },
        { label: "Cookie policy", href: "/legal/cookie-policy" },
        { label: "DPA", href: "/legal/dpa" },
      ],
    },
  ];
  const channels = [
    { Icon: SiWhatsapp, name: "WhatsApp" },
    { Icon: SiMessenger, name: "Messenger" },
    { Icon: SiInstagram, name: "Instagram" },
    { Icon: SiTelegram, name: "Telegram" },
  ];
  return (
    <footer className="relative border-t border-white/10 bg-gradient-hero">
      {/* Multi-layer gradient background: dot grid + brand-green and accent glows, masked to fade toward the
          edges. Clipped in its own layer so it doesn't cut off the corner marks below. */}
      <div aria-hidden className="absolute inset-0 overflow-hidden">
        <DotPattern className="fill-white/10 [mask-image:radial-gradient(640px_circle_at_15%_0%,white,transparent)]" />
        <div className="pointer-events-none absolute -top-24 right-0 size-[420px] rounded-full bg-accent/20 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-1/4 size-[360px] rounded-full bg-accent/25 blur-3xl" />
      </div>
      <div className="relative container-marketing border-white/5! pt-20 pb-14 lg:pt-24">
        <CornerPlus corner="tl" className="text-background/60 dark:text-foreground/60" />
        <CornerPlus corner="tr" className="text-background/60 dark:text-foreground/60" />
        <div className="row-bleed-marketing px-0 border-y border-white/5 ">
          <div className="grid gap-8 md:gap-y-0 lg:gap-8 md:grid-cols-2 lg:grid-cols-[minmax(0,1.4fr)_repeat(3,minmax(0,1fr))]">
            <div className="min-w-0 border-b lg:border-b-0 md:border-r border-white/5 px-8 py-12 lg:px-12">
              <Link
                to="/"
                className="flex min-w-0 items-center gap-2.5 cursor-pointer"
                aria-label="CYLOO Home"
              >
                <PlatformLogo alt="CYLOO" className="h-8 w-auto shrink-0 object-contain" />
              </Link>
              <p className="mt-4 max-w-xs text-sm text-background/70 dark:text-foreground/70">
                CYLOO — Intelligence Business Platform
              </p>
              <div className="mt-6 flex items-center gap-3">
                {channels.map(({ Icon, name }) => (
                  <span
                    key={name}
                    title={name}
                    className="flex size-8 items-center justify-center rounded-full bg-background/10 text-background/70 dark:text-foreground/70 transition-colors hover:bg-background/20 hover:text-background dark:hover:text-foreground"
                  >
                    <Icon className="size-4" />
                  </span>
                ))}
              </div>
              <Button asChild variant="primary" size="sm" className="mt-6">
                <Link
                  to="/auth"
                  search={{ mode: "sign-up" }}
                  {...ctaAttrs("start-free-trial", "footer")}
                >
                  Start free trial <ArrowRight className="size-3.5" />
                </Link>
              </Button>
            </div>
            {columns.map((c) => (
              <div
                key={c.title}
                className="min-w-0 border-y lg:border-b-0 md:border-t-0 md:border-x first:md:boerder-r-0 last:border-r-0 last:border-b-0 border-white/5 px-8 py-12"
              >
                <p className="font-display text-xs font-semibold uppercase text-background/50 dark:text-foreground/50">
                  {c.title}
                </p>
                <ul className="mt-5 space-y-3 text-sm text-background/70 dark:text-foreground/70">
                  {c.links.map((l) => (
                    <li key={l.label}>
                      <a
                        href={l.href}
                        className="link-marketing-onhero group inline-flex items-center gap-1.5"
                      >
                        <span className="size-1 rounded-full bg-background/30 dark:bg-foreground/30 transition-colors group-hover:bg-accent dark:group-hover:bg-accent" />
                        <span className="transition-transform group-hover:translate-x-0.5">
                          {l.label}
                        </span>
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 pt-6 text-sm text-background/70 dark:text-foreground/70">
          <span className="truncate">
            &copy; {new Date().getFullYear()} <Brand />.{" "}
            <span className="hidden sm:inline-flex">All rights reserved.</span>
          </span>
          {/* <span className="shrink-0 text-xs">
            Not affiliated with WhatsApp or Meta Platforms, Inc.
          </span> */}
          <div className="shrink-0 flex flex-wrap items-center gap-4 text-[11px] uppercase text-background/70 dark:text-foreground/70">
            <a
              href={docsUrl()}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 hover:text-white transition-colors"
            >
              <BookOpen className="size-3" /> Docs
            </a>
            <span className="w-1 h-1 flex items-center justify-center bg-white/25 rounded-full"></span>
            <a
              href="/install"
              className="inline-flex items-center gap-2 hover:text-white transition-colors"
            >
              <Server className="size-3" /> Self-host
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

{
  /* Connection map */
}
function ConnectionMap() {
  const networkNodes = [
    {
      label: "WhatsApp",
      Icon: SiWhatsapp,
      color: "#3ECE90",
      x: 110,
      y: 90,
      path: "M 270 205 V 105 Q 270 90 255 90 H 110",
      delay: "0s",
    },
    {
      label: "Instagram",
      Icon: SiInstagram,
      color: "#2339CC",
      x: 360,
      y: 70,
      path: "M 294 205 V 85 Q 294 70 309 70 H 360",
      delay: "-0.7s",
    },
    {
      label: "Messenger",
      Icon: SiMessenger,
      color: "#2339CC",
      x: 160,
      y: 205,
      path: "M 250 205 H 160",
      delay: "-1.4s",
    },
    {
      label: "Telegram",
      Icon: SiTelegram,
      color: "#2339CC",
      x: 480,
      y: 205,
      path: "M 314 205 H 480",
      delay: "-2.1s",
    },
    {
      label: "Email",
      Icon: Mail,
      color: "#2339CC",
      x: 282,
      y: 360,
      path: "M 282 225 V 360",
      delay: "-2.8s",
    },
    {
      label: "AI models",
      Icon: Bot,
      color: "#2339CC",
      x: 460,
      y: 340,
      path: "M 314 215 V 325 Q 314 340 329 340 H 460",
      delay: "-3.5s",
    },
  ];

  return (
    <div>
      <style>{`
              @keyframes integration-signal { to { stroke-dashoffset: -200; } }
              @keyframes integration-hub-pulse {
                0%, 100% { transform: scale(1); opacity: .28; }
                50% { transform: scale(1.16); opacity: 0; }
              }
              .integration-signal { animation: integration-signal 4s linear infinite; }
              .integration-hub-pulse { animation: integration-hub-pulse 3s ease-in-out infinite; }
            `}</style>
      <div
        aria-hidden
        className="absolute inset-0 opacity-55"
        style={{
          backgroundImage: "radial-gradient(circle, var(--border) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
          maskImage:
            "radial-gradient(circle at 50% 50%, black 0%, rgba(0,0,0,.65) 45%, transparent 78%)",
          WebkitMaskImage:
            "radial-gradient(circle at 50% 50%, black 0%, rgba(0,0,0,.65) 45%, transparent 78%)",
        }}
      />
      <div
        aria-hidden
        className="absolute left-1/2 top-1/2 size-80 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#3ECE90]/10 blur-3xl"
      />

      <svg
        aria-hidden
        viewBox="0 0 564 410"
        preserveAspectRatio="none"
        className="absolute inset-0 h-full w-full"
      >
        <defs>
          <linearGradient id="integration-signal-gradient" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#3ECE90" stopOpacity="0" />
            <stop offset="50%" stopColor="#3ECE90" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#2339CC" stopOpacity="0" />
          </linearGradient>
        </defs>
        {networkNodes.map((node) => (
          <g key={node.label}>
            <path
              d={node.path}
              fill="none"
              stroke="var(--border)"
              strokeWidth="1"
              vectorEffect="non-scaling-stroke"
            />
            <path
              d={node.path}
              fill="none"
              stroke="url(#integration-signal-gradient)"
              strokeWidth="2"
              strokeDasharray="40 160"
              vectorEffect="non-scaling-stroke"
              className="integration-signal"
              style={{ animationDelay: node.delay }}
            />
          </g>
        ))}
      </svg>

      <div className="absolute left-1/2 top-1/2 z-20 flex size-28 -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-control border border-border bg-background p-4 pt-6 text-center">
        <div className="flex size-16 items-center justify-center rounded-control border border-border bg-muted/35 p-2.5">
          <PlatformMark alt="" className="size-10 object-contain" />
        </div>
        <p className="mt-2 text-[11px] font-semibold text-foreground">
          <BrandWordmark /> Hub
        </p>
        <span className="integration-hub-pulse pointer-events-none absolute inset-0 rounded-control border-2 border-[#3ECE90]/30" />
      </div>

      {networkNodes.map((node) => (
        <div
          key={node.label}
          title={node.label}
          aria-label={node.label}
          className="absolute z-10 flex size-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-control border border-border bg-background transition-all duration-300 hover:-translate-y-[55%] sm:size-14"
          style={{
            left: `${(node.x / 564) * 100}%`,
            top: `${(node.y / 410) * 100}%`,
            color: node.color,
          }}
        >
          <node.Icon className="size-5 sm:size-6" />
          <span className="sr-only">{node.label}</span>
        </div>
      ))}

      <div className="absolute bottom-5 left-8 z-10 flex items-center gap-4 rounded-full border border-border bg-background/90 px-4 py-2  backdrop-blur-sm">
        <span className="flex items-center gap-1.5 text-[9px] font-medium text-muted-foreground">
          <Plug className="size-3 text-accent" /> REST API
        </span>
        <span className="h-3 w-px bg-border" />
        <span className="flex items-center gap-1.5 text-[9px] font-medium text-muted-foreground">
          <Workflow className="size-3 text-accent" /> Signed webhooks
        </span>
      </div>
    </div>
  );
}
