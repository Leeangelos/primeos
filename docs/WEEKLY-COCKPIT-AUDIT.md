# Weekly Cockpit Aggregation Engine — Audit Report

**Scope:** Correctness and scale of the weekly cockpit aggregation (lib/weekly-cockpit.ts, app/api/weekly-cockpit/route.ts, lib/cockpit-config.ts). No UI changes.

---

## 1. 4:00 AM ET business cutoff

### 1.1 Use of `business_date` vs `created_at`

| Check | Status | Evidence |
|-------|--------|----------|
| Weekly aggregation uses `business_date` only | **PASS** | All Supabase queries filter on `business_date`: `.gte("business_date", week_start)`, `.lte("business_date", week_end)`. No reference to `created_at` in weekly-cockpit or weekly-cockpit route. |
| No `created_at` in aggregation | **PASS** | `daily_kpis` is queried with `select("*")` but aggregation and grouping use only `business_date` and numeric fields. Row identity for “which week” is derived from `business_date`, not timestamps. |

**Conclusion:** The engine is **correct** under the assumption that **`business_date` is already the canonical business day** (i.e. the ETL or daily entry has applied the 4AM America/New_York cutoff before writing). The weekly engine does **not** apply the cutoff; it only groups by calendar date.

---

### 1.2 UTC midnight assumptions

| Check | Status | Evidence |
|-------|--------|----------|
| Day boundaries in engine | **NONE** | The engine never interprets “midnight UTC” or any time of day. It only uses `business_date` as a string `YYYY-MM-DD` for range filters and grouping. Supabase compares strings; no timezone or time component is used. |
| Date parsing in week math | **CAVEAT** | `getWeekStart(dateStr)` uses `new Date(dateStr + "T12:00:00Z")` so that the calendar day is unambiguous regardless of local timezone (noon UTC avoids DST edge cases for the *date*). This is for **week boundary calculation only**, not for “when the day starts.” |

**Conclusion:** There are **no UTC midnight assumptions** for aggregation. Dates are used as calendar-day keys. The only “assumption” is that `business_date` in the DB represents the intended business day (post–4AM ET cutoff) for that row.

---

### 1.3 Mon–Sun week boundaries relative to ET

**Current behavior:**

- Week boundaries are **ISO week (Monday–Sunday)**.
- Monday is computed in **UTC**:
  - `getWeekStart(dateStr)`:
    - Parses `dateStr` as noon UTC: `new Date(dateStr + "T12:00:00Z")`.
    - Uses `getUTCDay()` (0 = Sunday, 1 = Monday, …).
    - Computes the **previous Monday** in UTC: `diff = day === 0 ? -6 : 1 - day`, then `setUTCDate(getUTCDate() + diff)`.
  - Returns the Monday of that UTC week as `YYYY-MM-DD`.
- So “week” = **Monday 00:00 UTC through Sunday 23:59:59 UTC** (in terms of calendar dates Mon–Sun).

**Relationship to 4AM ET:**

- The **4AM ET cutoff** defines the **business day** (e.g. “Jan 13” = period ending 4AM ET Jan 14). That is a **data-entry/ETL concern**: each row’s `business_date` should already reflect that rule.
- The **week** (Mon–Sun) in the cockpit is **calendar week in UTC**, not “Monday 4AM ET → Sunday 4AM ET” in America/New_York.
- For most use cases, if `business_date` is stored as the ET business day, calendar Mon–Sun in UTC will be **close** to an ET “week,” but **not identical** to a week defined by 4AM ET boundaries (e.g. a UTC Sunday evening is already Monday in some timezones).

**Recommendation:** If the business definition of “week” must be **strictly** “Monday 4AM ET through Sunday 3:59:59 AM ET,” then week boundaries would need to be computed in America/New_York and mapped to a set of `business_date` values (or a date range) for querying. Current implementation is **correct** for “calendar Mon–Sun in UTC” and for **pre-normalized `business_date`**; it does **not** implement an explicit 4AM ET week boundary.

---

## 2. Week normalization

### 2.1 Missing or non-Monday `week_start`

| Check | Status | Evidence |
|-------|--------|----------|
| Missing `week_start` | **HANDLED** | Route uses `weekStartParam ? getWeekStart(weekStartParam) : getWeekStart(today)`. When omitted, current week’s Monday is used. |
| Non-Monday `week_start` | **NORMALIZED** | When provided, `week_start = getWeekStart(weekStartParam)` is used. Any calendar date (e.g. Wednesday) is normalized to the Monday of that week. So the stored and returned `week_start` is always a Monday. |
| `week_end` / `prev_start` | **DERIVED** | `week_end = getWeekEnd(week_start)`, `prev_start = prevWeekStart(week_start)`. Both derive from the normalized Monday. |

**Conclusion:** Week normalization is **correct**: the API always works with a Monday and derives the week from it.

### 2.2 Defensive handling

| Risk | Status | Recommendation |
|------|--------|----------------|
| Invalid `week_start` string | **GAP** | If client sends e.g. `week_start=invalid`, `getWeekStart("invalid")` yields `Invalid Date`; `toISOString().slice(0, 10)` can produce `"Invalid D"` or similar. Queries would then use an invalid range. |
| **Suggested fix** | — | After computing `week_start`, validate that it matches `/^\d{4}-\d{2}-\d{2}$/ and that `new Date(week_start + "T12:00:00Z").getTime()` is not `NaN`. If invalid, fall back to `getWeekStart(today)`. |

---

## 3. Store slug consistency

### 3.1 Config vs database

| Source | Slugs |
|-------|--------|
| **cockpit-config.ts** | `kent`, `aurora`, `lindseys` (hardcoded in `COCKPIT_STORE_SLUGS` and `COCKPIT_TARGETS`) |
| **API behavior** | `stores` table is queried with `.in("slug", slugs)` where `slugs` comes from the request or defaults to all three config slugs. |

If the **stores** table uses different slugs (e.g. `leeangelo`, `lindsey`), then:

- `storeIdBySlug` will be empty for the requested slugs.
- `storeIds` will be empty, and the API returns `hero: null`, empty `daily`, `secondary: null`, empty `issues`, empty `comparison`.

So the cockpit **assumes** the `stores` table has rows with `slug` in `{ "kent", "aurora", "lindseys" }`.

### 3.2 Recommended fix (no adapter hacks)

- **Option A (recommended):** Seed (or migrate) the **stores** table so that it has exactly the slugs the cockpit expects:
  - Insert/update rows with `slug` = `kent`, `aurora`, `lindseys` (and any other columns your schema requires).
- **Option B:** If the DB must remain the source of truth for slugs, change **cockpit-config** to match the DB:
  - Set `COCKPIT_STORE_SLUGS` and `COCKPIT_TARGETS` to the slugs that actually exist in `stores` (e.g. `leeangelo`, `lindsey` if that’s what you have), and adjust display names and targets accordingly.

Avoid adapters that map DB slugs to config slugs in the API without updating config or DB; that duplicates truth and makes maintenance harder.

---

## 4. Weighted aggregation correctness

### 4.1 Single-store weekly KPIs

| Metric | Formula in code | Correct? |
|--------|-----------------|----------|
| Weekly PRIME % | `(total_prime_dollars / total_net_sales) * 100` with totals = sum of daily dollars/sales | **YES** — from summed totals, not average of daily %. |
| Weekly Labor % | `(total_labor_dollars / total_net_sales) * 100` | **YES** — same. |
| Weekly Food+Disposables % | `((total_food_dollars + total_disposables_dollars) / total_net_sales) * 100` | **YES** — same. |
| Weekly SLPH | `total_net_sales / total_labor_hours` | **YES** — sum(sales) / sum(hours). |

**Evidence:** `aggregateWeek()` in `lib/weekly-cockpit.ts` (lines 131–152) sums `net_sales`, `prime_dollars`, `labor_dollars`, etc., then computes all percentages and SLPH from those sums.

### 4.2 All-stores (“weighted”) view

| Check | Status | Evidence |
|-------|--------|----------|
| Current week | **PASS** | `totalAgg = aggregateWeek(allComputed)` where `allComputed` is the concatenation of all stores’ daily rows for the week. So one set of sums across all stores; KPIs are from those sums. |
| Previous week (WoW) | **PASS** | `totalPrev` is built by summing each store’s `prev_weekly.total_*` (lines 195–214). Then `prevPrimePct`, `prevLaborPct`, etc. are computed from `totalPrev.total_net_sales` and the corresponding totals. So WoW is also weighted, not average-of-averages. |
| Daily trend for “all” | **PASS** | For each date, `daily` is built from `allComputed` for that date: `totalNs = sum(net_sales)`, `totalPrime = sum(prime_dollars)`, `prime_pct = totalPrime / totalNs` (lines 281–286). So each day’s “all stores” PRIME % is weighted by that day’s sales. |

**Conclusion:** All-stores aggregation is **correct**: it is a single weighted rollup (sums then ratios), not an average of per-store weekly percentages.

---

## 5. Performance risks

### 5.1 Query pattern

| Query | Purpose | When |
|-------|--------|------|
| 1 | `stores.select("id", "slug").in("slug", slugs)` | Resolve slug → store_id. |
| 2 | `daily_kpis.select("*").in("store_id", storeIds).gte("business_date", week_start).lte("business_date", week_end)` | Current week rows. |
| 3 | Same table, same filters with `prev_start` / `prev_end` | Previous week rows (for WoW). |

There are **no per-store or per-day follow-up queries**; all aggregation is in memory after these three fetches. So **no N+1** pattern.

### 5.2 Inefficiencies and scale

| Risk | Severity | Notes |
|------|----------|--------|
| `select("*")` on `daily_kpis` | Low | Only a few columns are used; trimming to needed columns would reduce payload. Not critical at typical weekly row counts (e.g. 3 stores × 7 days = 21 rows). |
| Two separate week-range queries | Low | Could be one query with `business_date >= prev_start AND business_date <= week_end` and split in app; current approach is simple and fine for small data. |
| In-memory grouping | Low | Rows are grouped by `store_id` in a `Map` and iterated per store. O(rows) and small constant; no scalability concern for hundreds of rows. |

### 5.3 Index recommendations

Recommended index on **daily_kpis** for the weekly cockpit access pattern:

```sql
CREATE INDEX idx_daily_kpis_store_business_date
ON daily_kpis (store_id, business_date);
```

- Supports: `WHERE store_id IN (...) AND business_date >= ? AND business_date <= ?` and `ORDER BY business_date`.
- If you often query by date range first, a composite `(business_date, store_id)` can also help; for “all stores for one week,” `(store_id, business_date)` is the natural fit.

No other indexes are required for the current three-query pattern.

---

## Summary table

| Area | Result | Action |
|------|--------|--------|
| 4AM ET / business_date | Uses `business_date` only; no `created_at`; no UTC midnight logic. | Document that week = calendar Mon–Sun UTC; 4AM ET week boundary not implemented. |
| Week normalization | Missing or arbitrary date → normalized to Monday. | Add validation for `week_start`; on invalid input fall back to current week. |
| Store slugs | Cockpit expects `kent`, `aurora`, `lindseys`. | Align DB (seed) or config to one source of truth. |
| Weighted aggregation | Single-store and all-stores use summed totals then ratios. | None. |
| Performance | 3 queries, no N+1. | Add `(store_id, business_date)` index on `daily_kpis`; optional: restrict `select` to needed columns. |

---

*End of audit report.*
