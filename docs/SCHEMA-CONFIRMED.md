# Schema confirmed (Step 0 complete)

## stores

| Column      | Type      | Nullable | Default | Notes |
|------------|-----------|----------|---------|-------|
| id         | uuid      | NO       | —       | PK    |
| slug       | text      | —        | —       | kent, aurora, lindseys |
| name       | text      | —        | —       |       |
| created_at | timestamptz | NO     | now()   |       |

**Rows:** kent (LeeAngelo's Kent), aurora (LeeAngelo's Aurora), lindseys (Lindsey's). No changes needed.

---

## daily_kpis

| Column              | Type      | Nullable | Default     | Notes |
|---------------------|-----------|----------|-------------|-------|
| id                  | uuid      | NO       | gen_random_uuid() | PK |
| store_id            | uuid      | NO       | —           | FK → stores.id |
| business_date       | date      | NO       | —           |       |
| net_sales           | numeric   | NO       | 0           |       |
| labor_dollars       | numeric   | NO       | 0           |       |
| labor_hours         | numeric   | NO       | 0           |       |
| food_dollars        | numeric   | NO       | 0           |       |
| disposables_dollars | numeric   | NO       | 0           |       |
| voids_dollars       | numeric   | NO       | 0           |       |
| waste_dollars       | numeric   | NO       | 0           |       |
| customers           | integer   | NO       | 0           |       |
| created_at          | timestamptz | NO     | now()       |       |
| updated_at          | timestamptz | NO     | now()       |       |

**Missing for v1 spec:** `notes`, `updated_by`.

**Constraints:** PK on `id`, FK on `store_id`. Unique on (`store_id`, `business_date`) exists as index `daily_kpis_store_day_uq` (required for upsert).

**Indexes:** `daily_kpis_pkey`, `daily_kpis_store_day_uq`. Add composite index `idx_daily_kpis_store_business_date` for weekly range queries if not present.

**RLS:** Off for both tables. No policy changes needed.

---

## Gaps to fix in Step 2

1. Add `notes` (TEXT NULL) to `daily_kpis`.
2. Add `updated_by` (TEXT NULL) to `daily_kpis` (for future auth).
3. Ensure composite index `(store_id, business_date)` exists for weekly queries (migration already in repo).
