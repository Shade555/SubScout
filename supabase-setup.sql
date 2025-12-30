-- Create subscriptions table
CREATE TABLE subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  billing_cycle TEXT NOT NULL CHECK (billing_cycle IN ('weekly', 'monthly', 'quarterly', 'yearly')),
  start_date DATE NOT NULL,
  next_payment_date DATE NOT NULL,
  category TEXT,
  website_url TEXT,
  is_active BOOLEAN DEFAULT true,
  notification_preference TEXT DEFAULT '1day' CHECK (notification_preference IN ('1day', '3days', '1week')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own subscriptions" ON subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own subscriptions" ON subscriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own subscriptions" ON subscriptions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own subscriptions" ON subscriptions
  FOR DELETE USING (auth.uid() = user_id);

-- Create function to update next_payment_date
CREATE OR REPLACE FUNCTION calculate_next_payment_date(
  start_date DATE,
  billing_cycle TEXT
) RETURNS DATE AS $$
BEGIN
  CASE billing_cycle
    WHEN 'weekly' THEN
      RETURN start_date + INTERVAL '7 days';
    WHEN 'monthly' THEN
      RETURN start_date + INTERVAL '1 month';
    WHEN 'quarterly' THEN
      RETURN start_date + INTERVAL '3 months';
    WHEN 'yearly' THEN
      RETURN start_date + INTERVAL '1 year';
    ELSE
      RETURN start_date + INTERVAL '1 month';
  END CASE;
END;
$$ LANGUAGE plpgsql;