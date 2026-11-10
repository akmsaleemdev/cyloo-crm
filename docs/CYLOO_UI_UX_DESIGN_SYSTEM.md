# CYLOO CRM — Enterprise UI/UX Design System Specification

**Version:** 6.8.9  
**Brand Identity:** CYLOO CRM  
**Primary Color:** CYLOO Blue (`#2F40CF`)  
**Accent Color:** CYLOO Green (`#3ECE90`)  
**Design Paradigm:** Modern Enterprise Flat / Glassmorphism with Strict Contrast Standards  

---

## 1. Visual Brand Identity & Logo Assets

The visual identity of CYLOO CRM is built around an approachable yet authoritative enterprise intelligence persona: a stylized, friendly robotic/AI agent embedded inside a conversation speech bubble.

### 1.1 Official Brand Assets

| Asset Type | File Path | Usage & Rules |
| :--- | :--- | :--- |
| **Primary Wordmark** | `public/cyloo-logo.svg` | Desktop application header, login/registration portals, client portal, invoices, system emails. |
| **Icon / Symbol Mark** | `public/cyloo-icon.svg` | Browser favicon, mobile PWA app icon, collapsed sidebar rail, loading splash screen. |
| **Dark Theme Wordmark** | `src/assets/cyloo-logo-dark.svg` | High-contrast variant for dark backgrounds and footer branding. |
| **Light Theme Wordmark**| `src/assets/cyloo-logo.svg` | Source SVG vector for application bundler asset pipeline. |

### 1.2 Logo Construction & Geometry
- **Icon Mark:** Formed by an intersecting speech bubble silhouette in CYLOO Green (`#3ECE90`) wrapping a rounded AI agent face with dual vertical optical sensors in CYLOO Blue (`#2F40CF`).
- **Wordmark Typography:** Geometric, clean sans-serif typeface with distinct low-slung x-height and rounded terminals in deep brand blue.
- **Clear Space:** Minimum exclusion zone equal to $0.5 \times H$ (half of the mark's total height) on all four sides.
- **Minimum Dimensions:**
  - Icon Only: Minimum render size $24 \times 24\text{ px}$.
  - Full Wordmark: Minimum render width $96\text{ px}$.

---

## 2. Color Palette & CSS Token Architecture

CYLOO CRM implements CSS custom property tokens conforming to the modern CSS Color Module Level 4 (`oklch` color space) within `src/styles.css`. This guarantees perceptual uniformity and reliable contrast ratios across light and dark operating modes.

```
┌────────────────────────────────────────────────────────┐
│                   CYLOO COLOR PALETTE                  │
├────────────────────────────┬───────────────────────────┤
│  CYLOO Blue (#2F40CF)      │  CYLOO Green (#3ECE90)    │
│  oklch(0.44 0.19 265)      │  oklch(0.75 0.17 155)     │
│  [Primary Brand / Actions] │  [Accent / Real-time AI]  │
├────────────────────────────┼───────────────────────────┤
│  Dark Neutral (#0B090A)    │  Light Neutral (#F5F3F4)  │
│  oklch(0.083 0.003 25)     │  oklch(0.966 0.002 20)    │
│  [Sidebar / Backgrounds]   │  [Surfaces / Page Base]   │
└────────────────────────────┴───────────────────────────┘
```

### 2.1 Core CSS Theme Tokens

```css
:root {
  /* ========================================================
   * CYLOO CRM Core Brand Tokens — Light Mode
   * ======================================================== */
  --primary: oklch(0.44 0.19 265);            /* CYLOO Blue #2F40CF */
  --primary-foreground: oklch(1 0 0);         /* Pure White */
  --primary-glow: color-mix(in oklab, var(--primary) 88%, oklch(100% 0 0) 12%);
  --primary-muted: color-mix(in oklab, var(--primary) 10%, var(--surface));

  --accent: #3ece90;                          /* CYLOO Green #3ECE90 */
  --accent-foreground: oklch(1 0 0);
  --accent-strong: color-mix(in oklab, var(--accent) 88%, black);
  --accent-readable: color-mix(in oklab, var(--accent) 86%, black);
  --accent-muted: color-mix(in oklab, var(--accent) 12%, var(--surface));

  --background: oklch(0.985 0 0);             /* Base canvas */
  --surface: oklch(0.98 0 0);                /* Container surface */
  --surface-elevated: oklch(1 0 0);           /* Cards and modal dialogs */
  --card: oklch(100% 0 0);
  --card-foreground: oklch(0.083 0.003 25);

  /* Status Tokens */
  --success: oklch(0.62 0.14 150);
  --warning: oklch(0.78 0.14 75);
  --danger: oklch(0.487 0.216 28);
  --info: oklch(0.55 0.14 240);

  /* Channel Attribution Tokens */
  --whatsapp: oklch(0.75 0.174 152);         /* WhatsApp Green */
  --whatsapp-foreground: oklch(0.16 0.02 152);
  --sidebar: oklch(0.083 0.003 25);          /* Near-black rail #0B090A */
  --sidebar-foreground: oklch(0.966 0.002 20);
}

.dark {
  /* ========================================================
   * CYLOO CRM Core Brand Tokens — Dark Mode
   * ======================================================== */
  --background: oklch(0.083 0.003 25);        /* Deep canvas #0B090A */
  --foreground: oklch(0.966 0.002 20);
  --surface: oklch(0.194 0.007 240);          /* Surface elevation */
  --surface-elevated: oklch(0.235 0.008 240);

  --primary: oklch(0.65 0.19 265);            /* Elevated blue for dark contrast */
  --primary-foreground: oklch(1 0 0);

  --accent: #3ece90;                          /* Retains crisp green readability */
  --accent-readable: color-mix(in oklab, var(--accent) 74%, white);

  --sidebar: oklch(0.05 0.003 25);
  --sidebar-foreground: oklch(0.966 0.002 20);
}
```

---

## 3. Typography & Text Hierarchy

CYLOO CRM standardizes on the **Inter** variable typeface family (`InterVariable`), optimized for high legibility on density-heavy tabular and dashboard interfaces.

### 3.1 Type Scale Specification

| Scale Level | Tailwind Class | CSS Font Size / Leading | Weight | Usage |
| :--- | :--- | :--- | :--- | :--- |
| **Display 2XL** | `text-4xl lg:text-5xl` | $48\text{ px} / 56\text{ px}$ | Black (900) | Landing page heroes, primary value metrics. |
| **Heading 1** | `text-2xl lg:text-3xl` | $30\text{ px} / 38\text{ px}$ | Bold (700) | Page titles, major dashboard headers. |
| **Heading 2** | `text-xl lg:text-2xl` | $24\text{ px} / 32\text{ px}$ | SemiBold (600) | Section titles, drawer modal headings. |
| **Heading 3** | `text-lg` | $18\text{ px} / 28\text{ px}$ | SemiBold (600) | Card titles, pipeline column names. |
| **Body Large** | `text-base` | $16\text{ px} / 24\text{ px}$ | Regular (400) | Form input values, long-form content. |
| **Body Default**| `text-sm` | $14\text{ px} / 20\text{ px}$ | Regular (400) | Standard UI labels, table cells, chats. |
| **Caption** | `text-xs` | $12\text{ px} / 16\text{ px}$ | Medium (500) | Timestamps, metadata badges, input hints. |
| **Micro** | `text-[10px]` | $10\text{ px} / 14\text{ px}$ | Bold (700) | Unread notification counters, channel tags. |

---

## 4. Spacing, Elevation & Component Geometry

### 4.1 Border Radius Tokens
- Sub-components (Badges, tags, chips): `--radius-sm` ($4\text{ px}$)
- Standard Controls (Buttons, text inputs, dropdown triggers): `--radius` ($8\text{ px}$)
- Containers & Cards (Panels, dashboard tiles, dropdown menus): `--radius-md` ($12\text{ px}$)
- Modals & Drawers (Sheet dialogs, quick-view panes): `--radius-lg` ($16\text{ px}$)
- Hero Containers & Highlights: `--radius-xl` ($24\text{ px}$)

### 4.2 Standard Elevation Shadows
- Level 1 (Static Cards): `0 1px 3px 0 rgb(0 0 0 / 0.05), 0 1px 2px -1px rgb(0 0 0 / 0.05)`
- Level 2 (Hover State / Floating Actions): `0 4px 6px -1px rgb(0 0 0 / 0.08), 0 2px 4px -2px rgb(0 0 0 / 0.08)`
- Level 3 (Dialogs & Drawers): `0 20px 25px -5px rgb(0 0 0 / 0.12), 0 8px 10px -6px rgb(0 0 0 / 0.08)`

---

## 5. Component Library Standards (Radix UI + shadcn)

1. **Button Component (`src/components/ui/button.tsx`):**
   - `variant="default"`: Filled CYLOO Blue (`bg-primary text-primary-foreground hover:bg-primary/90`)
   - `variant="accent"`: Filled CYLOO Green (`bg-accent text-accent-foreground hover:bg-accent/90`)
   - `variant="outline"`: High contrast border with subtle surface hover
   - `variant="ghost"`: Icon buttons and table actions
   - `variant="destructive"`: Danger red fill for irreversible actions
2. **DataTable & Virtualized Lists:**
   - Sticky header row with column sorting indicators
   - Checkbox row selection for bulk CRM operations
   - Pagination controls aligned to bottom-right
3. **Conversational Messaging Bubble:**
   - Inbound Customer: Left-aligned, subtle neutral background (`bg-muted text-foreground`)
   - Outbound Agent: Right-aligned, CYLOO Blue background (`bg-primary text-primary-foreground`)
   - Internal Note: Centered full-width amber callout (`bg-warning/15 border-warning/30 text-warning-foreground`)

---

## 6. Accessibility (WCAG 2.1 Level AA) Compliance

- **Color Contrast:** All body text on primary, secondary, and background surfaces exceeds the **4.5:1** contrast ratio.
- **Focus Rings:** All interactive inputs, buttons, and anchor tags maintain an accessible 2px focus ring using `--ring` (`var(--accent)`) with an offset of 2px.
- **Keyboard Navigation:** Full tab order traversal across data tables, modal dialogs, and slide-over inspectors with Escape key dismissal.
- **Screen Reader Support:** All icon-only buttons possess explicit `aria-label` or `sr-only` descriptive text spans.

