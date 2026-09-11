# SAKSHAM Frontend — Responsive Build Instructions (for coding agents)

*Give this whole file to whichever agent/teammate is building Track 2. It assumes they already have: the mobile mockups (uimockup_v1.pdf / mk1–mk5.jpg), the Master Reference doc, and the Team Execution Plan. This file is specifically about HOW to build mobile + desktop together without creating duplicate work.*

---

## 1. Core rule: ONE codebase, not two

Do not create separate files or components for mobile and desktop versions of the same screen (e.g. no `Discover.jsx` + `DiscoverDesktop.jsx`). Every screen is built once. Desktop and mobile are two renderings of the same component, controlled by CSS breakpoints — not two different components with duplicated logic, duplicated data-fetching, or duplicated copy.

**Why this matters:** two files means every future change (copy edit, bug fix, new field) has to be made twice and will eventually drift out of sync. With a 3-day build and limited people, this is not affordable. If you ever find yourself about to copy-paste a component to make a "desktop version," stop — that's the signal you should be reaching for a CSS breakpoint instead.

---

## 2. Breakpoint convention

Use a single, consistent breakpoint across the whole app — don't invent a new one per screen. If using Tailwind (recommended given the existing Next.js setup referenced in the Master Reference's file ownership map):

- Default (no prefix) = mobile styles
- `md:` prefix (≥768px) = desktop styles

Every desktop-specific class in every screen should use `md:`. This keeps the responsive logic predictable and greppable across the codebase — anyone can search for `md:` and see every place desktop diverges from mobile.

---

## 3. The navigation shell — the one structurally different piece

Everything else in the app is the same layout, just reflowed. Navigation is the one place where mobile and desktop are genuinely different UI, not just re-flowed CSS: bottom tab bar (mobile) vs. left sidebar (desktop).

Still build this as ONE `Shell` component, not two, using conditional rendering:

```jsx
export default function Shell({ children }) {
  return (
    <>
      {/* Desktop sidebar - hidden on mobile */}
      <div className="hidden md:flex md:flex-col md:w-60 md:fixed md:h-full">
        <Sidebar />
      </div>

      {/* Mobile bottom nav - hidden on desktop */}
      <div className="md:hidden fixed bottom-0 w-full">
        <BottomNav />
      </div>

      {/* Content area - shifts right on desktop to clear the sidebar */}
      <div className="md:ml-60">
        {children}
      </div>
    </>
  );
}
```

`Sidebar` and `BottomNav` can share the same nav-item data (icons, labels, routes, active-state logic) even though they render as different DOM structures — pull that shared data into one array/config and map over it in both components, don't hardcode the item list twice.

**Drawer note:** on mobile, secondary items (Saved, Compare, Settings, Help, How SAKSHAM Works, Install App, Language, Log out) live in a slide-out drawer. On desktop, these become permanently visible items in the sidebar itself (below a divider under the 4 primary nav items) — there is no desktop drawer. Don't build a desktop drawer/overlay; just render the same items list directly into `Sidebar`.

---

## 4. Per-screen layout pattern: mostly `flex-col` → `md:flex-row`

The large majority of desktop changes across this app are the same pattern: things that stack vertically on mobile sit side-by-side on desktop. Example:

```jsx
// Financials tab — Eligibility card + Suitability card
<div className="flex flex-col md:flex-row gap-4">
  <EligibilityCard />
  <SuitabilityCard />
</div>
```

Apply this exact pattern (`flex-col md:flex-row` on the parent, no changes needed inside the child cards) to the following, screen by screen:

**Landing Page**
- Hero: text block + photo → side-by-side on desktop (`md:flex-row`, text on left, image on right)
- "How SAKSHAM helps" 3 cards: stacked → `md:flex-row` (or `md:grid md:grid-cols-3`)
- "Built for your reality" 4 feature cards: stacked → `md:grid md:grid-cols-2` (2x2, not full row)
- FAQ accordion: stays single-column on both, but wrap in `md:max-w-2xl md:mx-auto` so it doesn't stretch full-width on desktop

**Discover**
- Top Movers cards: mobile horizontal-scroll → desktop static row, no scroll needed at 1440px, just render all cards with normal flex/grid
- Insights-for-[location] 3 stat cards: stacked → `md:flex-row`
- Categories: default to the `2x2` grid view (already built as a toggle state per the mockup) when `md:` — i.e. desktop default view = grid, mobile default view = list. This is a state default change, not a new component.
- Map: give it a larger `md:h-[500px]` or similar — desktop genuinely benefits from more map space, this isn't just "don't break," it's an upgrade

**My Reports**
- Report cards: 1-per-row → `md:grid md:grid-cols-2`

**New Assessment wizard**
- Steps 1, 3, 4 (idea / location / review) and the Assessment Completed screen: these are FORMS, not data screens. Do NOT stretch them full-width on desktop. Cap them: `md:max-w-xl md:mx-auto`. A giant text input spanning 1440px looks broken, not upgraded.
- Step 2 (category tiles): mobile 4x2 grid → `md:grid-cols-4` (one row of tiles instead of two)

**Dashboard — Dashboard tab**
- Fit Score ring + Fit Score Breakdown bars: stacked → `md:flex-row`, ring on left, breakdown on right
- Final Recommendation's two-column list (supporting factors / points to consider): already 2-column at mobile size per the mockup, no change needed

**Dashboard — Market tab**
- "Market Snapshot" card + "Local Market Summary" card: stacked → `md:flex-row`

**Dashboard — Financials tab**
- "Financial Structure (Max Eligibility)" card + "Recommended Structure (Suitability)" card: stacked → `md:flex-row` (this is the pattern shown in the example above — worth doing well since it reinforces the eligibility-vs-suitability distinction the product cares about)

**Dashboard — Next Steps tab**
- Progress stepper: NO change, already horizontal, works at both sizes as-is
- "Next Steps" action list + "Personal Notes" box: stacked → `md:flex-row`

**Dashboard tab strip itself (Dashboard/Market/Financials/Schemes/Next Steps)**
- Keep as a horizontal row at both sizes — do not convert to a vertical/sidebar tab list unless explicitly told otherwise. This was flagged as an open decision; default to the simpler option (horizontal at both sizes) unless overridden.

---

## 5. What NOT to touch

- Do not build a separate desktop router, separate desktop pages directory, or a `/desktop` route. It's the same routes at every screen size.
- Do not add a "switch to desktop version" toggle in the UI — the layout should just respond to the actual browser width automatically. There is no user-facing mode switch.
- Do not redesign colors, type, icons, or copy for desktop. Only layout (stacking direction, grid columns, max-width) changes. If a screen looks visually different in tone between mobile and desktop, that's a bug, not a feature.

---

## 6. Known gaps — don't invent designs for these

Two things referenced in the app do not have finished designs yet, mobile or desktop:
- **Schemes tab** (appears in every Dashboard sub-tab strip, but no screen has been mocked up)
- **New Assessment Steps 1, 3, and 4** are described in the execution plan but not shown in the current mockup images — only Step 2 (Details) has been pictured

If you reach either of these while building, stop and flag it rather than guessing a layout — these need an actual design pass first (mobile, then desktop), not an improvised one baked into the codebase.

---

## 7. Quick self-check before marking a screen "done"

- [ ] Does this screen have exactly one component file, not two?
- [ ] Are all desktop-specific styles using the `md:` prefix, nothing custom?
- [ ] Does the sidebar/bottom-nav swap automatically based on width, with no separate desktop route?
- [ ] Do form/confirmation screens (wizard steps, Assessment Completed) stay capped-width on desktop instead of stretching full-bleed?
- [ ] Same copy, same colors, same icons at both sizes — only layout changed?
