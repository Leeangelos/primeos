-- Optional: store previous sync price for cheese/price-change alerts.
ALTER TABLE me_products ADD COLUMN IF NOT EXISTS previous_latest_price numeric;
