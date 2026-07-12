# AssetFlow — Design Blueprint · FINAL

**Enterprise Asset & Resource Management System**
The definitive design system. Concept → tokens → layout → grammar → screens → states → landing → motion. Nothing decorative survives that isn't earned from *whose hands is it in*.

---

## 1. The Thesis

**AssetFlow makes handing responsibility for physical things between people feel accountable without being accusatory.**

An organization's assets aren't a list — they're a **living web of people and the things in their hands**, in perpetual motion as objects pass from one person to the next. AssetFlow's only job is to keep that web honest and make the handoffs graceful. It's a chain-of-custody ledger wearing an inventory tool's clothes — closer to a library circulation desk or a lab custody log than a warehouse database.

**Register:** calm control by default, heat only where earned. ~90% neutral. Only three things ever run hot — **overdue, conflict, lost** — and that contrast *is* the hierarchy.

If a screen doesn't serve *whose hands is it in and how does it change hands*, it's noise.

---

## 2. Design Tokens (LOCKED)

### 2.1 Color — restrained, MNC-grade, "inevitable not unique"
95% neutral. Color is functional. Blue only for actions + the live state; red only when something is genuinely wrong.

```
/* Neutrals */
--canvas      #FBFBFA   app background
--surface     #FFFFFF   cards, tables, raised surfaces
--ink         #18181B   primary text
--text-2      #52525B   secondary
--text-3      #8E8E93   tertiary / captions
--hairline    #E4E4E1   borders & dividers
--hairline-2  #EDEDEA   inner row rules
--fill        #F4F4F3   zebra / hover
--fill-hover  #EEEEEC

/* Accent — one institutional blue */
--accent      #2C5FE0   primary actions + current lit state
--accent-soft #EBF0FD   selection, active-nav wash

/* Status — desaturated */
--available   #3B7A57    --allocated  #52525B    --reserved  #6B7280
--maint       #B57A1F    --alert      #C0392B (overdue/lost/conflict — the only warm alert)
--alert-soft  #FBEDEB    --disposed   #A1A1AA
```
Status = **dot + label**, never a candy pill.
Dark variant (later): graphite `#1A1917`, paper `#EDE8DE`, same accent, status +15% L.

### 2.2 Type — two families, tightly set
- **Inter Tight** — everything: UI, headers, body, names. Weights 400/450/500/600. Tracking `-0.006em`.
- **IBM Plex Mono** — the one data signal: tags, serials, timestamps, durations. Tracking `+0.02em`, slashed zero. Weights 400/500.

No display serif. KPI numbers earn weight through size + tabular Inter Tight, not a second personality.

### 2.3 Type scale (LOCKED)
```
11 micro/meta · 12 caption/serial/time · 13 dense table · 14 body
15 section title · 20 page H1 (600) · 28 KPI (600·tabular) · 40 hero (600)
Uppercase labels: 10.5 · 600 · +0.055em
```

---

## 3. Layout System

### 3.1 Spacing — 4-based, no exceptions
`4 · 8 · 12 · 16 · 24 · 32 · 48 · 64`. Everything snaps to it.

### 3.2 The app frame (never moves)
```
┌──────────┬───────────────────────────────────────────────┐
│ 236px    │  topbar 56px · breadcrumb · actions            │
│ sidebar  ├───────────────────────────────────────────────┤
│ brand    │                                                │
│ ⌘K search│   content · pad 32 · max-width 1320 · centered │
│ NAV      │                                                │
│  Now     │                                                │
│  Objects │                                                │
│  Handoffs│                                                │
│  Bookings│                                                │
│  Care    │                                                │
│  Audits  │                                                │
│ INSIGHT  │                                                │
│  Reports │                                                │
│  Ledger  │                                                │
│  Setup   │                                                │
│ ──────── │                                                │
│ user     │                                                │
└──────────┴───────────────────────────────────────────────┘
```
Sidebar `--surface`, right hairline, verb nav (role-filtered). Hot counts `--alert`, neutral counts mono `--text-3`. Active item: `--fill` wash + 2.5px `--accent` left rail. Topbar sticky, primary action filled. Content 32px pad, max-width 1320. Collapses <960px → icon rail; <640px → off-canvas.

### 3.3 Alignment law
Numbers right-aligned + tabular · text left, one baseline · tags in a fixed-width mono column (clean vertical spine) · one row height per table.

---

## 4. Table Execution Rules (law, from real builds)

1. **No boxed tag plate in tables** — it forces the mono tag to wrap and balloons rows. In tables the tag is **plain one-line mono, `nowrap`**. The stamped-plate treatment is reserved for the **detail page** and **landing**, where it's a hero element.
2. **One line per row** — names truncate with ellipsis; target **40px** rows.
3. **Serial doesn't add height** — inline or on hover, never a stacked second line.
4. **Structure must read** — header separates with full hairline + heavier weight; surface separates from canvas. No faint-sketch wash.
5. **One consistent "unheld" style** — person rows: avatar+name+dept; unheld: mono `—` + one lowercase word. The word varies, the layout doesn't.
6. **Density** — operational, not marketing; scannable at a glance.

**Objects columns:** `TAG(mono,96,nowrap) · OBJECT(name+inline serial,flex) · CATEGORY(128) · IN WHOSE HANDS(200) · STATUS(dot+label,150) · LOCATION(150) · HELD(mono,right,tabular,110)`

---

## 5. Structure — killing the ten schema-screens

Reorganized around *what needs me* / *where's that thing*, by **verbs not tables**, role-filtered.

| Surface | Replaces | Purpose | Roles |
|---|---|---|---|
| **Now** | S2 | *What needs me now.* Triage home. | All |
| **Objects** | S4 | The archive you dig through. | All (scoped) |
| **Handoffs** | S5 | Custody in motion. Heart of the app. | Mgr/Head/Employee |
| **Bookings** | S6 | Shared/bookable, time-based. | All |
| **Care** | S7 | Looking after hurt objects. | All raise · Mgr approve |
| **Audits** | S8 | The periodic reckoning. | Admin · auditors act |
| **Reports** | S9 | Read-only insight. | Admin/Mgr · Head dept |
| **Ledger** | S10 | Log + notifications merged. | Notify all · Log admin/mgr |
| **Setup** | S3 | Config. Roles change *only* here. | Admin only |

---

## 6. The Grammar — six atoms (the only building blocks)

1. **Custody Line** — object + person vouching + how long. Tag mono, name Inter Tight. The most-repeated unit.
2. **Handoff** — allocation/transfer/return as one directional shape `Priya → [AF-0012] → Raj`. Pending = frozen mid-air.
3. **Refusal** — one pattern for every "no": names who/what, never scolds, offers the forward move. Not a red toast.
4. **Consequence Gate** — Lost/Dispose/Close-cycle: slower, heavier, name-a-reason, shows who's affected before commit.
5. **Lifecycle Rail** — the 7-state machine as a physical track; current lit. On every detail page.
6. **Live Time** — durations always moving; overdue is the only accent-red time-state.

Any component outside these six = the schema showing through. Stop.

---

## 7. Screens

**Now** — heat-ordered. Hot band (overdue/conflict/discrepancy) top, *disappears when empty*. Waiting-on-me = approvals as frozen handoffs. In-my-hands = custody lines, live time. Quiet KPIs below (28px tabular, no shadow cards). Role landings differ.

**Objects** — list per Section 4. Search tag/serial/name; filter category/status/dept/location; QR toggle. **Detail page** = showcase: stamped tag plate + condition stamp + **Lifecycle Rail** + custody history (vertical ledger) + maintenance history + QR plate + **category custom fields** ("Specifications").

**Handoffs** — allocate/transfer/return as the handoff shape; already-held triggers the **Refusal**. Transfer `Requested→Approved→Re-allocated`, auto-history. Return = mark + condition notes → approve → Available. **Reserved** = "held for" future person/date. Overdue auto-flags hot.

**Bookings** — shared/bookable only. Week-grid timetable (mono time labels, filled blocks, derived statuses). Overlap `newStart<existingEnd && newEnd>existingStart` → reject with **hazard-hatch fill** + Refusal; touching OK. Reminder before slot.

**Care** — raise (object/issue/priority/photo). Kanban of work-order tickets (perforated top edge, priority stamp): `Pending→Approved/Rejected→Assigned→In Progress→Resolved`. Approve→Under Maintenance; resolve→Available.

**Audits** — admin creates cycle (scope/dates/auditors). Auditor checklist **Verified/Missing/Damaged**+note, expected location. Auto discrepancy report. **Close** fires **Consequence Gate** → Missing→Lost, Damaged→optional auto-Care.

**Reports** — calm palette, accent on the single worst value only. Utilization (bar) · maintenance frequency (bar) · due-for-return (table) · dept allocation (table+chart) · **booking heatmap** (day×hour) · CSV on every block. Role-scoped.

**Ledger** — notifications + activity log merged. Bell + page, read/unread, filter by user/entity/date. Every action writes + notifies.

**Setup (Admin)** — A: Departments (name/head/parent tree/status). B: Categories + **custom-field builder** (JSON schema). C: **Employee Directory — the only place roles change** (assign dept, promote). Treated with extra gravity.

---

## 8. Filled gaps
- **Custom fields:** Setup builds JSON field schema per category → registration renders fields dynamically → shown on detail as "Specifications."
- **Registration:** name · category · auto tag (`AF-0001`) · serial · date · cost · condition · location · photo · docs · **shared/bookable flag** · custom values.
- **Reserved:** on rail + Handoffs.
- **QR:** encodes tag, stamped-plate frame, scans → detail, printable.
- **Overdue/reminders:** time-driven → Now hot band + Ledger; reminders before slot.
- **First-run/seed admin:** seed creates first Admin → guided empty Now.

---

## 9. States (the 80% everyone skips)
Empty · loading · error · overflow — all designed.
- Empty Objects → *"Nothing's being tracked yet. Register the first thing."*
- Empty Now → *"Nothing needs you right now. Everything's accounted for."*
- Loading → skeleton custody lines. Overflow → truncate gracefully, tags never wrap, hot items first. Refusal/403 → the Refusal pattern.

---

## 10. The Landing Page — "The Living Inventory"

*The one thing this whole project is judged on. Not a diagram — a living organism.*

### 10.1 The idea
An org's assets are a **living web of people and the things in their hands** — thousands of invisible threads of responsibility, constantly shifting. No one has ever *seen* that web. The landing page **is** it, alive. The medium is the message: responsibility flowing between hands, in real time, before a single word appears.

### 10.2 The hero (no headline first)
The screen loads into a slow, breathing **constellation**. Each node is an **object tag** (`AF-0114`) tethered by a fine hairline thread to a **person** (name + quiet initial-avatar): laptops to owners, a projector to a room, a van to a crew. The whole field drifts and pulses — organic, physics-driven, hypnotic, and *warm*, because every thread is a human holding something. Hard to look away, the way a school of fish is.

Then, untouched, **custody moves in real time.** A thread detaches from Priya; the `AF-0114` node drifts across the field and re-tethers to Raj; a soft label writes itself *Priya → Raj*. It happens again elsewhere. The organism breathes and reshapes. This is the product's soul made visible.

### 10.3 The three hot beats (where it becomes unforgettable)
- **Overdue** — one thread quietly turns **red** and goes **taut**, pulling, tense. It wants attention.
- **Lost** — somewhere a thread **snaps**; a node drifts free, untethered, alone. Genuinely unsettling — exactly what losing an asset *feels* like.
- **Refusal** — two nodes reach for the same object and it **repels**. *"Priya has this."* The refusal made physical.

### 10.4 The one line (only after you've felt it)
Floating quietly over the still-living field:
> **Every object has a person.**
> *AssetFlow just never lets you forget whose hands it's in.*

### 10.5 The scroll — descend into the organism
You don't leave the web; you **descend into it**. It parts to reveal, in turn:
1. one thread up close — the **handoff** (Priya → object → Raj, approved, history writes itself)
2. the **overdue** red tug, and the app's response
3. the **snap** — Lost — and the **Consequence Gate** naming it out loud
4. the **refusal** repel, full-size: *"Priya has this → Request Transfer"*

Each is a **zoom into the same living field**, never a new slide. The rail/state color logic is honored: red appears only in these hot beats.

### 10.6 The close
Pull back out to the full breathing constellation — now calm, everything tethered, nothing red. One line:
> *Know where everything is. And whose hands it's in.*

One button: **Enter AssetFlow** → login. No pricing, no trial-speak, no feature grid.

### 10.7 Craft & why it's the one
- **Ownable:** no competitor, template, or AI default has a living custody organism as its hero. It could only exist for *this* product.
- **Emotional, not diagrammatic:** the snap and the tug are *felt*, which is what makes it stick.
- **The thesis, literally:** "whose hands is it in" is demonstrated as a living thing before a word appears.
- **Mesmerizing by construction:** ambient force-simulation that never stops moving — watched like a lava lamp.
- **Build:** canvas + force/physics simulation; neutral tokens; threads as hairlines; red only in the three hot beats; `prefers-reduced-motion` → the field settles static and the beats become quiet stills. Responsive: on mobile the web reflows to a vertical stream of custody threads. Restraint everywhere except the one big idea.

---

## 11. Login
Email + password, same tag-stamp language as the landing — front door and interior are one world; a few live threads drift faintly behind. **Signup creates an Employee — no role picker;** the absence is a designed line: *"New accounts start as Employee. An admin sets your role and department once you're in."* Forgot-password: token flow, reset link shown in-app for the demo. Role-based redirect after login.

---

## 12. Motion (whole app)
Mechanical and quiet inside the app; alive and organic on the landing. State slides along the rail. Durations tick live. Handoffs animate the object crossing between people. Consequence Gate dims its surroundings. No bouncy springs. `prefers-reduced-motion` always respected.

---

## 13. Build order
1. **Landing** — "The Living Inventory"; establishes the soul + language in one surface.
2. **Login** — same world.
3. **Now** — calm-by-default / hot-when-earned.
4. **Objects list + detail (Lifecycle Rail)** — all Section 4 table rules.
5. **Handoffs** — Refusal + Consequence Gate on their biggest stage.
6. **Bookings · Care · Audits · Reports · Ledger · Setup** — each reusing the six atoms.

Every screen reuses the grammar. Any component outside the six atoms = the schema showing through; stop and reframe.

---

*Derived end-to-end from the AssetFlow PRD and refined against real builds and critique. The web is the product; the product is the web.*
