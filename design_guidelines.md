# CCC Group CRM Design Guidelines

## Design Approach: Design System + Productivity References

**Selected Approach:** Design system-based with inspiration from Linear, Notion, and modern productivity tools.

**Justification:** This is a utility-focused, information-dense application requiring efficiency, consistency, and learnability. The CRM handles complex workflows (jobs, partners, quotes, invoices) across multiple user roles, demanding standardized patterns over visual experimentation.

**Key Principles:**
- Information density without clutter
- Consistent, predictable patterns
- Fast data scanning and task completion
- Role-appropriate interface complexity

---

## Typography System

**Font Families:**
- Primary: Inter (via Google Fonts) - UI, body text, data tables
- Monospace: JetBrains Mono (via Google Fonts) - financial data, IDs, codes

**Type Scale:**
- Page titles: text-2xl font-semibold
- Section headers: text-lg font-semibold
- Card/Panel titles: text-base font-semibold
- Body text: text-sm
- Meta/secondary text: text-xs
- Table headers: text-xs font-medium uppercase tracking-wide
- Financial figures: text-base font-mono font-semibold

---

## Layout & Spacing System

**Core Spacing Units:** 2, 4, 6, 8, 12, 16 (Tailwind scale)

**Standard Applications:**
- Component padding: p-4 to p-6
- Section gaps: gap-6 to gap-8
- Table cell padding: px-4 py-3
- Card spacing: p-6
- Form field spacing: space-y-4
- Page margins: px-6 to px-8

**Layout Structure:**
- Sidebar navigation: w-64 (fixed)
- Main content: flex-1 with max-w-7xl container
- Dashboard cards: grid with gap-6
- Two-column forms: grid-cols-1 md:grid-cols-2 gap-6

---

## Component Library

### Navigation & Structure
- **Sidebar:** Fixed left navigation with logo, main menu, user profile at bottom. Sections grouped with dividers.
- **Top Bar:** Page title, breadcrumbs, global search, notifications, user menu. Height h-16.
- **Page Header:** Title + actions (filters, create button). Consistent mb-6.

### Data Display
- **Pipeline Kanban:** Horizontal scrolling columns, cards with compact job details, drag-drop zones.
- **Data Tables:** Zebra striping, sortable headers, row actions on hover, sticky header for long lists.
- **Stat Cards:** Icon, large number (text-3xl), label, optional trend indicator. Grid layout.
- **Detail Panels:** Side drawer (w-96) or full-page layout with organized sections.

### Forms & Input
- **Input Fields:** Label above, border focus states, helper text below. Consistent h-10 for text inputs.
- **Dropdowns:** Standard select with clear labels, multi-select with tags.
- **Radio/Checkbox Groups:** Vertical stack with proper spacing (space-y-3).
- **File Upload:** Drag-drop zone with preview thumbnails.

### Status & Feedback
- **Status Badges:** Small pill badges with semantic meanings (pending, active, completed, paid). Text-xs, px-2.5, py-0.5, rounded-full.
- **Progress Indicators:** Multi-step headers showing pipeline stages, current highlighted.
- **Alert Banners:** Contextual messaging at top of sections (info, warning, success).

### Action Components
- **Primary Buttons:** h-10, px-4, font-medium, rounded-lg
- **Secondary Buttons:** Similar sizing, outline treatment
- **Icon Buttons:** w-10 h-10, rounded-lg, hover states
- **Dropdown Menus:** Clean list with icons, grouped sections with dividers

### Specialized Components
- **Partner Assignment Card:** Partner avatar, name, trade category, status toggle, contact quick actions.
- **Job Card (Kanban):** Job number, client name, address snippet, value, delivery type badge, assigned partner indicator.
- **Financial Summary:** Line items with amounts right-aligned, totals with font-semibold, margin calculations prominent.
- **Task List:** Checkbox, task description, assignee avatar, due date badge, priority indicator.
- **Timeline View:** Vertical timeline with timestamps, activity descriptions, user attribution.

### Dashboard Components
- **Director Dashboard:** Grid of stat cards (4 cols), revenue chart, partner performance table, recent jobs list.
- **Admin Dashboard:** Task queue (sortable table), outstanding items (alert cards), quick actions panel.
- **Filter Bar:** Horizontal row of filter chips with clear/reset option. Position below page header.

---

## Layout Patterns

**List Views:** Table with row actions, filter bar above, pagination below.

**Detail Views:** Two-column layout - primary info left (2/3 width), meta sidebar right (1/3 width). Full-width sections stack vertically.

**Create/Edit Forms:** Single column for simple forms, two-column grid for complex intake forms. Action buttons fixed at bottom or floating footer.

**Dashboard:** Responsive grid (grid-cols-1 md:grid-cols-2 lg:grid-cols-4 for cards), mixed widget sizes, priority content top-left.

---

## Animations

Minimal, functional only:
- Sidebar collapse/expand transition
- Dropdown open/close
- Toast notifications slide-in
- Loading spinners on data fetch
- Kanban card drag feedback