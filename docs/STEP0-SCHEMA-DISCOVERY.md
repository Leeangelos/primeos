# Step 0 — Schema Discovery (Excel Replacement v1)

I cannot connect to your Supabase project from this environment. Run the SQL below in the **Supabase Dashboard → SQL Editor**, then paste the full result (or confirm the schema) so we can proceed with Step 2.

---

## 1. Run this in Supabase SQL Editor

Copy and run the following. It outputs tables, columns, types, constraints, indexes, RLS, and current `stores` rows.

```sql
-- ========== TABLES & COLUMNS ==========
SELECT
  c.table_schema,
  c.table_name,
  c.column_name,
  c.ordinal_position,
  c.data_type,
  c.udt_name,
  c.is_nullable,
  c.column_default
FROM information_schema.columns c
WHERE c.table_schema = 'public'
  AND c.table_name IN ('stores', 'daily_kpis')
ORDER BY c.table_name, c.ordinal_position;

-- ========== CONSTRAINTS (PK, FK, UNIQUE) ==========
SELECT
  tc.table_schema,
  tc.table_name,
  tc.constraint_name,
  tc.constraint_type,
  kcu.column_name,
  ccu.table_schema AS ref_schema,
  ccu.table_name AS ref_table,
  ccu.column_name AS ref_column
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
  ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
LEFT JOIN information_schema.constraint_column_usage ccu
  ON tc.constraint_name = ccu.constraint_name AND tc.table_schema = ccu.table_schema
WHERE tc.table_schema = 'public'
  AND tc.table_name IN ('stores', 'daily_kpis')
ORDER BY tc.table_name, tc.constraint_type, kcu.ordinal_position;

-- ========== INDEXES (excluding PK) ==========
SELECT
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('stores', 'daily_kpis')
ORDER BY tablename, indexname;

-- ========== RLS ==========
SELECT
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('stores', 'daily_kpis');

-- ========== ALL ROWS IN stores ==========
SELECT * FROM public.stores ORDER BY id;
```

---

## 2. Schema inferred from current code (for comparison)

This is what the **existing code** assumes. Your actual DB may differ.

### Tables

| Table        | Purpose                          |
|-------------|-----------------------------------|
| `public.stores`   | Store lookup by slug (id, slug)   |
| `public.daily_kpis` | One row per store per business_date |

### `stores` (inferred)

| Column   | Type   | Notes        |
|----------|--------|--------------|
| `id`     | int/bigint | PK, used as FK in daily_kpis |
| `slug`   | text   | Unique; API uses leeangelo, lindsey; cockpit uses kent, aurora, lindseys |

### `daily_kpis` (inferred from app/api/daily-kpi/route.ts and lib/weekly-cockpit.ts)

| Column             | Type   | In POST body | In GET/select | Notes |
|--------------------|--------|--------------|----------------|-------|
| `store_id`         | int    | ✓ (from store) | ✓ | FK → stores.id |
| `business_date`    | date   | ✓            | ✓ | Unique with store_id |
| `net_sales`        | number | ✓            | ✓ | |
| `labor_dollars`    | number | ✓            | ✓ | |
| `labor_hours`      | number | ✓            | ✓ | |
| `food_dollars`     | number | ✓            | ✓ | |
| `disposables_dollars` | number | ✓       | ✓ | |
| `voids_dollars`    | number | ✓            | ✓ | Optional in types |
| `waste_dollars`    | number | ✓            | ✓ | Optional in types |
| `customers`        | number | ✓            | ✓ | (tickets) |
| `notes`            | text   | —            | — | **Not in current API** |
| `updated_at`       | timestamptz | —   | — | **Not in current API** |
| `updated_by`       | text/uuid | —   | — | **Not in current API** |

- Upsert uses `onConflict: "store_id,business_date"` → unique constraint on (`store_id`, `business_date`) is required.
- Migration exists for index `idx_daily_kpis_store_business_date` on (`store_id`, `business_date`).

### RLS

- Code uses `createClient()` (anon key). If RLS is enabled and no policies allow read/write, GET/POST can return empty or 403. If you see empty results despite data in the table, check RLS and policies (or use service role for server-side APIs).

---

## 3. Gaps vs Excel Replacement v1 spec

| Requirement | Inferred from code | Spec (v1) |
|-------------|--------------------|-----------|
| Stores      | Slugs in code: leeangelo, lindsey (daily) and kent, aurora, lindseys (cockpit) | Must have rows: **kent**, **aurora**, **lindseys** |
| daily_kpis  | voids_dollars, waste_dollars, customers present in POST | Include voids_dollars, waste_dollars **only if column exists**; spec lists notes | 
| daily_kpis  | No notes, updated_at, updated_by in API | Spec: add **notes**, **updated_at**, **updated_by** (if not present) |
| Unique      | Upsert expects unique on (store_id, business_date) | Add if not present |
| Index       | Migration adds (store_id, business_date) | Add if not present |

After you run the SQL and paste the results (or confirm the schema), I will:

- Propose exact migrations for: stores seed (kent, aurora, lindseys), missing columns (notes, updated_at, updated_by), unique constraint, index.
- Proceed to Step 3 (Daily) and Step 4 (Weekly) using only the confirmed schema.

---

## 4. What to send back

Please reply with either:

1. **Paste the full SQL result** (all result sets), or  
2. **Confirm in your own words**, e.g.:  
   - “Tables `stores` and `daily_kpis` exist. Columns in `daily_kpis`: [list]. RLS is [on/off]. Stores rows: [list]. Unique constraint and index [exist/don’t exist].”

Once confirmed, no code or migrations will be written until you approve.
