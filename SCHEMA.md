# ISOGuardian DB Schema Reference

**Last refreshed: 2026-05-01** (staging `kesmzjuegmgdxiruhfdz`)

This is the ground truth for column names, types, defaults, and NOT NULL constraints. Update whenever schema changes. Read this BEFORE writing any insert/update.

---

## `companies` (UUID id)

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| id | uuid | NO | uuid_generate_v4() | |
| name | text | NO | — | |
| industry | text | YES | — | |
| registration_number | text | YES | — | |
| standards | jsonb | YES | `["ISO_9001"]` | **Array of strings.** App currently writes `{ISO_9001: true}` object — drift. |
| tier | text | YES | `'basic'` | **Default invalid after 2026-05-01 migration.** Allowed: `starter`, `growth`, `enterprise`, `reseller`. |
| ai_operations_limit / used | integer | YES | 0 | |
| ai_reset_date | date | YES | — | |
| settings | jsonb | YES | `{single_standard_mode:false, notifications_enabled:true}` | |
| status | text | YES | `'active'` | |
| reseller_id | uuid | YES | — | |
| standards_enabled | text[] | YES | `{ISO_9001}` | Postgres array, separate from `standards` jsonb |
| created_by / updated_by | uuid | YES | — | |
| company_code | text | YES | — | |
| doc_counter / ncr_counter / audit_counter / review_counter / risk_counter / objective_counter / training_counter / improvement_counter | integer | YES | 0 | |
| logo_url | text | YES | — | |
| key_personnel | jsonb | YES | `{}` | |
| products_services / qms_scope / quality_policy | text | YES | `''` | |
| address / contact_phone / contact_email | text | YES | — | |
| created_at / updated_at | timestamptz | YES | now() | |

---

## `subscriptions` (UUID id)

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| id | uuid | NO | gen_random_uuid() | |
| company_id | uuid | YES | — | |
| **plan** | text | **NO** | — | NOT `tier`. Values mirror `companies.tier`. |
| status | text | NO | `'trial'` | |
| **users_count** | integer | NO | 1 | NOT `user_count`. |
| **price_per_user** | numeric | NO | 400.00 | NOT `base_price`. |
| billing_cycle | text | NO | `'monthly'` | |
| current_period_start | date | NO | — | |
| current_period_end | date | NO | — | |
| trial_end_date / trial_ends_at | date / timestamptz | YES | — | |
| total_amount | numeric | YES | — | **GENERATED column** (`users_count × price_per_user`). Do NOT insert/update directly. |
| currency | text | YES | `'ZAR'` | |
| cancelled_at / cancellation_reason | timestamptz / text | YES | — | |
| payfast_subscription_id / payfast_token | text | YES | — | |
| billing_email | text | YES | — | |
| payment_method | text | YES | `'payfast'` | |
| grace_period_end | timestamptz | YES | — | |
| next_billing_date | date | YES | — | |
| referral_code / partner_code | text | YES | — | |
| created_at / updated_at | timestamptz | YES | now() | |

**Does NOT have:** `tier`, `base_price`, `discount_percent`, `final_price`, `user_count`, `created_by`.

---

## `users` (UUID id, must match auth.users.id)

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| **id** | uuid | NO | **— (NO default)** | Must match `auth.users.id`. Insert via service-role Edge Function only. |
| company_id | uuid | YES | — | |
| email | text | NO | — | |
| full_name | text | NO | — | |
| role | text | YES | `'viewer'` | **App uses `user`/`lead_auditor`/`admin`/`super_admin`.** `viewer` is legacy default — code paths expect the new set. |
| standards_access | jsonb | YES | `["ISO_9001"]` | **Stored UPPERCASE in DB.** Some existing rows have lowercase (`["iso_9001"]`) — `.some(a => a.toUpperCase() === ...)` defence applied. |
| avatar_url / phone | text | YES | — | |
| last_login | timestamptz | YES | — | |
| login_count | integer | YES | 0 | |
| is_active | boolean | YES | true | **No `status` column.** Suspended = `is_active = false`. |
| created_at / updated_at | timestamptz | YES | now() | |

**Does NOT have:** `status`.

---

## `cancellation_requests` (UUID id)

| Column | Type | Null | Default |
|---|---|---|---|
| id | uuid | NO | gen_random_uuid() |
| company_id | uuid | NO | — |
| requested_by | uuid | NO | — |
| subscription_id | uuid | YES | — |
| subscription_status | text | YES | — |
| tier | text | YES | — |
| account_age_days | integer | YES | — |
| cooling_off_applies | boolean | NO | false |
| within_initial_term | boolean | NO | false |
| months_remaining | integer | YES | — |
| termination_fee_zar | numeric | YES | — |
| reason | text | YES | — |
| acknowledgement_signed | boolean | NO | false |
| status | text | NO | `'pending'` |
| processed_by / processed_at / processor_notes / effective_date | mixed | YES | — |
| requested_at / updated_at | timestamptz | NO | now() |

---

## `erasure_requests` (UUID id)

| Column | Type | Null | Default |
|---|---|---|---|
| id | uuid | NO | gen_random_uuid() |
| user_id | uuid | NO | — |
| company_id | uuid | YES | — |
| user_email | text | NO | — |
| user_full_name | text | YES | — |
| reason | text | YES | — |
| acknowledgement_signed | boolean | NO | false |
| status | text | NO | `'pending'` |
| processed_by / processed_at / processor_notes / retention_exceptions | mixed | YES | — |
| requested_at | timestamptz | NO | now() |
| sla_deadline_at | timestamptz | NO | now() + 30d |
| updated_at | timestamptz | NO | now() |

---

## Other tables (column-name highlights only)

- **`audits`** — `audit_number`, `audit_type`, `standard`, `audit_date`, `assigned_auditor_id/name`, `status` default `'Planned'`, `evidence_reviewed`, `auditor_recommendation`, `conclusion`, `corrective_actions`. No `title`.
- **`management_reviews`** — `review_number`, `review_date`, `chairperson`, `attendees`, `agenda_items`, `minutes`. No `title`.
- **`ncrs`** — `ncr_number`, `title`, `description`, `standard`, `clause` (int), `severity`, `status` default `'Open'`. `assigned_to/by/created_by/updated_by/closed_by/deleted_by` are TEXT not UUID.
- **`documents`** — `company_id` is **TEXT** (mismatch with rest), `name` (NOT `title`), `clause_name` NOT NULL, `type` NOT NULL, `version` text default `'1.0'`. Has `version` and `version_history` columns (CLAUDE.md said missing — outdated).
- **`compliance_requirements`** — `clause_number`, `clause_name`, `requirement_text`, `compliance_status` default `'Not Met'`, `evidence_document_id`.
- **`resellers`** — `company_id` is **TEXT**, `reseller_name`, `contact_email`, `commission_rate` default 0.25.
- **`reseller_clients`** — `client_company_id` is TEXT, `subscription_tier` default `'Starter'` (capitalised!), `status` default `'Active'`.

---

## Schema drift / known DB inconsistencies

1. `companies.tier` default `'basic'` is invalid against the post-2026-05-01 check constraint — fix by changing default to `'starter'`.
2. `users.role` default `'viewer'` is a legacy value the app never produces — should change to `'user'`.
3. `companies.standards` jsonb stored as object `{ISO_9001: true}` but schema default is array `["ISO_9001"]`. App reads both — risky.
4. `documents.company_id` is TEXT while every other `company_id` is UUID. Documented in CLAUDE.md.
5. `resellers.company_id` and `reseller_clients.client_company_id` are TEXT for the same reason.
6. `users.standards_access` mixed casing — some rows lowercase. Defensive `.toUpperCase()` comparison applied across Compliance, Documents, Dashboard.
7. CLAUDE.md previously said `documents.version` and `documents.version_history` don't exist — they DO. Update CLAUDE.md.

---

## Re-dump command

```sql
SELECT c.table_name, c.column_name, c.data_type, c.is_nullable, c.column_default
FROM information_schema.columns c
WHERE c.table_schema = 'public'
  AND c.table_name IN (
    'companies','subscriptions','users','cancellation_requests','erasure_requests',
    'resellers','reseller_clients','documents','ncrs','audits','management_reviews',
    'compliance_requirements'
  )
ORDER BY c.table_name, c.ordinal_position;
```
