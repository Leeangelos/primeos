# Weekly aggregation — verification reference

Internal dev/ops reference for how weekly KPIs are calculated and how to verify them against the database.

---

## 1. Weekly weighted math

Weekly KPIs are **not** averages of daily percentages. We **sum** the raw dollar and hour columns across all days in the week, then compute percentages (and SLPH, AOV) from those totals.

**Formulas (same as in `lib/weekly-cockpit.ts`):**

- `total_net_sales` = Σ `net_sales`
- `total_prime_dollars` = Σ (`labor_dollars` + `food_dollars` + `disposables_dollars`) per row
- `total_labor_dollars` = Σ `labor_dollars`
- `total_labor_hours` = Σ `labor_hours`
- `total_food_dollars` = Σ `food_dollars`, `total_disposables_dollars` = Σ `disposables_dollars`
- `total_customers` = Σ `customers`

Then:

- **Weekly PRIME %** = `(total_prime_dollars / total_net_sales) * 100` (null if `total_net_sales` = 0)
- **Weekly Labor %** = `(total_labor_dollars / total_net_sales) * 100`
- **Weekly Food+Disposables %** = `((total_food_dollars + total_disposables_dollars) / total_net_sales) * 100`
- **Weekly SLPH** = `total_net_sales / total_labor_hours` (null if `total_labor_hours` = 0)
- **Weekly AOV** = `total_net_sales / total_customers` (null if `total_customers` = 0)

**Worked example (one store, 3 days):**

| business_date | net_sales | labor_dollars | food_dollars | disposables_dollars |
|---------------|-----------|---------------|--------------|---------------------|
| 2026-02-03    | 7000      | 1400          | 1500         | 300                 |
| 2026-02-04    | 7500      | 1500          | 1600         | 320                 |
| 2026-02-05    | 8000      | 1550          | 1700         | 330                 |

- `total_net_sales` = 22,500  
- `total_prime_dollars` = (1400+1500+300) + (1500+1600+320) + (1550+1700+330) = 3200 + 3420 + 3580 = **10,200**  
- **Weekly PRIME %** = (10200 / 22500) × 100 = **45.3%**

---

## 2. Week boundaries

- **Definition:** A week is **Monday 00:00 through Sunday 23:59** by calendar date.
- **Implementation:** We use **date-only** values; there is no time component. The API takes a `week_start` (Monday) as `YYYY-MM-DD` and derives `week_end` (Sunday) by adding 6 days. All filtering is on `business_date`.
- **Queries:** Rows are included when `business_date >= week_start` and `business_date <= week_end`. So the “week” is exactly the set of dates from Monday through Sunday (inclusive). No timezone or midnight logic is applied to the stored `business_date`; it is assumed to already represent the business day (e.g. 4 AM cutoff is applied at daily entry time, not in the weekly engine).

---

## 3. Manual verification in Supabase

To verify a weekly total for one store, pick the store’s `id` and the Monday (e.g. `2026-02-03`). In SQL Editor:

```sql
-- Replace STORE_UUID and the date range with the store id and week Mon–Sun
SELECT
  COUNT(*) AS days,
  SUM(net_sales) AS total_net_sales,
  SUM(labor_dollars + food_dollars + disposables_dollars) AS total_prime_dollars,
  SUM(labor_dollars) AS total_labor_dollars,
  SUM(labor_hours) AS total_labor_hours,
  SUM(food_dollars) + SUM(disposables_dollars) AS total_food_plus_disposables,
  SUM(customers) AS total_customers,
  ROUND(100.0 * SUM(labor_dollars + food_dollars + disposables_dollars) / NULLIF(SUM(net_sales), 0), 2) AS weekly_prime_pct,
  ROUND(100.0 * SUM(labor_dollars) / NULLIF(SUM(net_sales), 0), 2) AS weekly_labor_pct,
  ROUND(SUM(net_sales)::numeric / NULLIF(SUM(labor_hours), 0), 2) AS weekly_slph
FROM daily_kpis
WHERE store_id = 'STORE_UUID'
  AND business_date >= '2026-02-03'
  AND business_date <= '2026-02-09';
```

Compare `total_net_sales`, `weekly_prime_pct`, `weekly_labor_pct`, and `weekly_slph` to the values shown on the Weekly page or returned by `/api/weekly-cockpit` for that store and `week_start=2026-02-03`.

---

## 4. PRIME % and Labor targets by store

| Store   | Slug     | PRIME % target | Labor % target   |
|---------|----------|----------------|------------------|
| Kent    | kent     | ≤ 55%          | 19–21% (range)   |
| Aurora  | aurora   | ≤ 55%          | 19–21% (range)   |
| Lindsey's | lindseys | ≤ 60%        | ≤ 25% (max only) |

- **PRIME %:** On track when weekly (or daily) PRIME % ≤ the store’s `primeMax`. Kent and Aurora use 55%; Lindsey’s uses 60%.
- **Labor %:** Kent and Aurora use a band (19–21%); outside that is over or under. Lindsey’s uses a cap only (≤ 25% = on track).

Defined in `lib/cockpit-config.ts` (`COCKPIT_TARGETS`).
