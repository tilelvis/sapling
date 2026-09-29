# Forestry Tuition Planner PWA

A mobile-first, offline-capable PWA for planning a 4-year forestry degree tuition savings plan with an MMF (Money Market Fund) account. Mirrors an Excel workbook's 48-month calculation model.

## Features

### Core Financial Model
- **48-month projection engine** — mirrors the Excel workbook exactly
- **Three-layers saving model**: base saving + cushion adjustment + MMF interest (as bonus)
- **Shortfall detection** — projected balance can dip below zero to warn you early
- **Break-even solver** — calculates the exact monthly saving needed to graduate without a gap
- **Plan vs Actual tracking** — record actual monthly data and see variance

### 4 Main Views
1. **Home (Dashboard)** — compact metric strip, funding status, chart card (Balance/Cash flow/Annual), saving plan, What-If slider
2. **48 Months** — scrollable timeline with year filters, fee-month highlighting, expandable details
3. **Fees** — year-by-year breakdown, yearly review card, fee dates reference
4. **Settings** — editable assumptions, HELB per year, fee schedule editor, scenario presets, saved scenarios, saving history, backup/restore, help guide

### Smart Features
- **Header dropdown notifications** — Fees, Alerts, Variance, Streak, Awards icons drop down compact cards
- **What-If slider** — test different monthly savings and see graduation impact instantly
- **Scenario presets** — Conservative (0%), Balanced (12%), Optimistic (15%) MMF return
- **Saved scenarios** — save and compare what-if snapshots, apply back to plan
- **Goal celebration** — confetti animation when projected balance turns positive
- **Saving streak** — gamification with consecutive completed months + 48-month calendar heatmap
- **Achievements** — 8 unlockable badges across 4 tiers (bronze/silver/gold/platinum)
- **Reminders** — smart in-app reminders with browser notification support
- **Printable PDF** — A4-optimized print summary at `/print`
- **CSV export** — full 48-month plan export
- **Data backup/restore** — JSON export/import of all data
- **Dark mode** — full light/dark theme
- **PWA** — installable, offline-capable (service worker)

## Tech Stack

- **Framework**: Next.js 16 with App Router
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 4 + shadcn/ui (New York)
- **Database**: Prisma ORM + SQLite
- **State**: TanStack Query (server), Zustand (client)
- **Charts**: Recharts
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Notifications**: Sonner toasts

## Getting Started

```bash
# Install dependencies
bun install

# Push database schema
bun run db:push

# Start dev server
bun run dev

# Open http://localhost:3000
```

## Database

SQLite database at `db/custom.db`. Schema includes:
- `Settings` — singleton planning assumptions
- `FeeSchedule` — scheduled fee withdrawals (monthIndex → amount)
- `ActualTransaction` — per-month actual recorded data
- `SavingHistory` — audit trail of saving changes

## Calculation Engine

The core engine is in `src/lib/planner/engine.ts`:
- `buildProjection()` — computes 48 months of starting/contribution/withdrawal/interest/ending balances
- `solveRequiredMonthlySaving()` — binary search for break-even saving
- `computeCushionAnalysis()` — three-layers model with per-fee gap analysis
- Interest = `max(0, available) × annualRate / 12` (no interest on deficit)

## Project Structure

```
src/
├── app/
│   ├── page.tsx              # Main app entry (renders AppShell)
│   ├── layout.tsx            # Root layout with PWA metadata
│   ├── globals.css           # Forestry theme + print styles
│   ├── print/page.tsx        # Printable PDF summary route
│   └── api/
│       ├── settings/         # GET/PUT planning assumptions
│       ├── fee-schedule/     # GET/PUT fee schedule
│       ├── projection/       # GET 48-month projection (with ?whatIf=)
│       ├── complete-month/   # POST/DELETE month completion
│       ├── transactions/     # GET/PUT actual transactions
│       ├── backup/           # GET JSON backup
│       ├── restore/          # POST JSON restore
│       ├── reset-actuals/    # DELETE all actuals
│       └── saving-history/   # GET/POST/DELETE saving change history
├── components/
│   ├── planner/              # All planner components
│   └── ui/                   # shadcn/ui components
└── lib/
    ├── planner/
│   │   ├── engine.ts         # Calculation engine
│   │   ├── types.ts          # Shared types
    │   ├── data.ts           # Prisma data access
    │   └── csv.ts            # CSV export utility
    └── db.ts                 # Prisma client
```

## Default Scenario

- Tuition: Ksh 160,000/year
- Starting MMF: Ksh 60,000
- Monthly saving: Ksh 5,000
- MMF return: 12% p.a.
- HELB: Y1=120k, Y2=60k, Y3=30k, Y4=0
- Fees: Y2 Sep 60k, Y3 Sep+Apr 65k, Y4 Sep+Apr 80k
- **Result**: Ksh 5,000/mo → -Ksh 12,524 shortfall; Ksh 5,220/mo breaks even

## License

Personal use — built for a forestry degree student's tuition planning.
