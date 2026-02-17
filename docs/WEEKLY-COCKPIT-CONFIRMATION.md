# Weekly Cockpit — Confirmation (Code References)

## 1. All weekly filters use `business_date`, not `created_at`

**Result: CONFIRMED.** No weekly code filters or groups by `created_at`.

| Location | Evidence |
|----------|----------|
| **app/api/weekly-cockpit/route.ts** | Current week: `.gte("business_date", week_start).lte("business_date", week_end)` (lines 87–88). Previous week: `.gte("business_date", prev_start).lte("business_date", prev_end)` (lines 99–100). No `created_at` in any query. |
| **app/api/weekly-kpi/route.ts** | Same pattern: `.gte("business_date", rangeStart).lte("business_date", rangeEnd)` (lines 78–79), `.gte("business_date", prevStart).lte("business_date", prevEnd)` (lines 90–91), and 4-week range `.gte("business_date", fourWeeksStart).lte("business_date", week_end)` (lines 213–214). No `created_at`. |
| **lib/weekly-cockpit.ts** | All row types and aggregation use `business_date` only (e.g. `DailyKpiRow.business_date`, `DailyComputed.business_date`, grouping by date). No timestamp fields. |
| **lib/weekly-utils.ts** | Same: interfaces and logic use `business_date` only. |

**Conclusion:** Every weekly filter and aggregation is keyed by `business_date`; `created_at` is never used.

---

## 2. `week_start` is normalized to Monday server-side

**Result: CONFIRMED.** The API always derives a Monday before using it.

| Location | Evidence |
|----------|----------|
| **app/api/weekly-cockpit/route.ts** | `week_start = weekStartParam ? getWeekStart(weekStartParam) : getWeekStart(today)` (line 35). So: (1) when `week_start` is omitted, default is `getWeekStart(today)` (current week’s Monday); (2) when provided, it is passed through `getWeekStart()`, which returns the Monday of the week containing that date. All downstream uses (`week_end`, `prev_start`, queries, `weekDates`) use this normalized `week_start`. |
| **app/api/weekly-kpi/route.ts** | `week_start = weekStartParam ?? defaultMonday` where `defaultMonday = getWeekStart(todayStr)` (lines 36–37). If the client sends a non-Monday, this route does **not** re-normalize (it uses the param as-is). So for this file, `week_start` is Monday only when the client sends a Monday or omits the param. The **weekly-cockpit** route is the one that always normalizes via `getWeekStart(weekStartParam)`. |
| **lib/weekly-cockpit.ts** | `getWeekStart(dateStr)` (lines 44–49) returns the Monday of the week containing `dateStr` (ISO week: Monday = 1, Sunday = 0). `getWeekEnd` and `getWeekDates` take a Monday from `getWeekStart` and derive Sunday or Mon–Sun. |
| **lib/weekly-utils.ts** | Same `getWeekStart` behavior (lines 65–70). |

**Conclusion:** In **weekly-cockpit** (the cockpit API), `week_start` is **always** normalized to Monday server-side. In **weekly-kpi**, it is Monday when defaulted; if you want the same guarantee there, that route should also use `getWeekStart(weekStartParam)` when a param is provided.

---

## 3. No UTC assumptions in week boundary logic

**Result: CLARIFIED.** Week boundaries use **calendar dates only** for filtering; UTC is used only to interpret the weekday of a date string, not for day boundaries or time-of-day.

| Location | What the code does | UTC usage |
|----------|--------------------|-----------|
| **lib/weekly-cockpit.ts** `getWeekStart` (44–49) | Parses `dateStr` as noon UTC (`dateStr + "T12:00:00Z"`), uses `getUTCDay()` to get weekday, then `setUTCDate(getUTCDate() + diff)` to move to Monday. Returns `toISOString().slice(0, 10)` (YYYY-MM-DD). | **Yes:** “Monday” is the Monday of that date’s week **in UTC**. No midnight and no time-of-day in the result; output is a date string only. |
| **lib/weekly-cockpit.ts** `getWeekEnd` (51–56) | Takes a Monday (from `getWeekStart`), adds 6 days via `setUTCDate`, returns YYYY-MM-DD. | Date arithmetic in UTC; result is still a calendar date string. |
| **lib/weekly-cockpit.ts** `getWeekDates` (59–67) | Builds 7 dates by adding 0..6 days to Monday; each result is YYYY-MM-DD. | Same: date math only; no time component. |
| **lib/weekly-cockpit.ts** `prevWeekStart` (70–74) | Subtracts 7 days from a Monday string; returns YYYY-MM-DD. | Same. |
| **API queries** | All filters use `week_start` and `week_end` as **strings** (`business_date >= week_start`, `business_date <= week_end`). Supabase compares `business_date` (date or string) to these strings; no timezone or time-of-day is involved. | **No UTC in queries.** No midnight UTC; no “start/end of day” in a timezone. |

**Summary:**

- **No “midnight UTC” assumption:** Day boundaries are never “00:00 UTC” or “24:00 UTC”; the engine only works with **date values** (YYYY-MM-DD).
- **No time-of-day in week logic:** Week boundaries are “Monday date” and “Sunday date”; there is no notion of 4AM or midnight in this code.
- **Only UTC usage:** The **weekday** of a given date string is determined in UTC (noon UTC avoids date rollover for that calendar day). So “week” is effectively **ISO week in UTC**. If you need “week” defined in America/New_York (e.g. 4AM ET), that would require a separate timezone-aware implementation; the current code does not do that.

**Conclusion:** There are **no UTC assumptions for day boundaries or time-of-day**. The only UTC use is to decide which calendar date is “Monday” for a given date string; all inputs and outputs are calendar dates and all DB filters use `business_date` only.
