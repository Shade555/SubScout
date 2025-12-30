-- Add last_payment_date column to subscriptions table
ALTER TABLE subscriptions 
ADD COLUMN last_payment_date DATE;

-- Add comment for the new column
COMMENT ON COLUMN subscriptions.last_payment_date IS 'Date when the last payment was completed';