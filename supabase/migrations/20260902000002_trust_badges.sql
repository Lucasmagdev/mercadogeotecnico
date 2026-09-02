-- =========================================================
-- Self-declared trust badges on listings
-- =========================================================

alter table public.equipment
  add column has_invoice boolean not null default false,
  add column has_calibration_cert boolean not null default false,
  add column maintenance_history_informed boolean not null default false;
