-- SimuTrade Database Schema for Supabase
-- This file contains the complete database schema for the SimuTrade application
-- Run these commands in your Supabase SQL editor to set up the database

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
CREATE TYPE subscription_tier AS ENUM ('free', 'premium', 'pro');
CREATE TYPE trade_type AS ENUM ('buy', 'sell');
CREATE TYPE trade_status AS ENUM ('open', 'closed');
CREATE TYPE position_status AS ENUM ('open', 'closed');

-- Users table (extends Supabase auth.users)
CREATE TABLE users (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    subscription_tier subscription_tier DEFAULT 'free',
    virtual_balance DECIMAL(12, 2) DEFAULT 10000.00,
    total_profit_loss DECIMAL(12, 2) DEFAULT 0.00,
    tutorial_progress JSONB DEFAULT '{}',
    completed_scenarios TEXT[] DEFAULT '{}',
    stripe_customer_id VARCHAR(255),
    subscription_id VARCHAR(255),
    subscription_status VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trades table
CREATE TABLE trades (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    symbol VARCHAR(10) NOT NULL,
    type trade_type NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    entry_price DECIMAL(10, 2) NOT NULL CHECK (entry_price > 0),
    exit_price DECIMAL(10, 2),
    profit_loss DECIMAL(12, 2),
    status trade_status DEFAULT 'open',
    feedback TEXT,
    scenario_id VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Positions table (for tracking open positions)
CREATE TABLE positions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    trade_id UUID REFERENCES trades(id) ON DELETE CASCADE,
    symbol VARCHAR(10) NOT NULL,
    type trade_type NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    entry_price DECIMAL(10, 2) NOT NULL CHECK (entry_price > 0),
    current_price DECIMAL(10, 2) NOT NULL CHECK (current_price > 0),
    unrealized_pnl DECIMAL(12, 2) DEFAULT 0.00,
    exit_price DECIMAL(10, 2),
    status position_status DEFAULT 'open',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Scenarios table (for trading scenarios)
CREATE TABLE scenarios (
    id VARCHAR(50) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    difficulty VARCHAR(20) DEFAULT 'beginner',
    market_event JSONB,
    guide_steps JSONB,
    required_tier subscription_tier DEFAULT 'free',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tutorials table
CREATE TABLE tutorials (
    id VARCHAR(50) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content_type VARCHAR(20) DEFAULT 'text', -- 'text', 'video', 'interactive'
    content TEXT,
    content_url VARCHAR(500),
    trigger_event VARCHAR(100),
    required_tier subscription_tier DEFAULT 'free',
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Subscriptions table (for tracking subscription history)
CREATE TABLE subscriptions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    stripe_subscription_id VARCHAR(255) UNIQUE NOT NULL,
    stripe_customer_id VARCHAR(255) NOT NULL,
    tier subscription_tier NOT NULL,
    status VARCHAR(50) NOT NULL, -- 'active', 'canceled', 'past_due', etc.
    current_period_start TIMESTAMP WITH TIME ZONE,
    current_period_end TIMESTAMP WITH TIME ZONE,
    cancel_at_period_end BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Usage tracking table (for rate limiting)
CREATE TABLE usage_tracking (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    action_type VARCHAR(50) NOT NULL, -- 'trade', 'feedback', 'scenario'
    date DATE DEFAULT CURRENT_DATE,
    count INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, action_type, date)
);

-- Create indexes for better performance
CREATE INDEX idx_trades_user_id ON trades(user_id);
CREATE INDEX idx_trades_symbol ON trades(symbol);
CREATE INDEX idx_trades_created_at ON trades(created_at);
CREATE INDEX idx_positions_user_id ON positions(user_id);
CREATE INDEX idx_positions_status ON positions(status);
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_stripe_id ON subscriptions(stripe_subscription_id);
CREATE INDEX idx_usage_tracking_user_date ON usage_tracking(user_id, date);

-- Row Level Security (RLS) policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_tracking ENABLE ROW LEVEL SECURITY;

-- Users can only see and modify their own data
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

-- Trades policies
CREATE POLICY "Users can view own trades" ON trades
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own trades" ON trades
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own trades" ON trades
    FOR UPDATE USING (auth.uid() = user_id);

-- Positions policies
CREATE POLICY "Users can view own positions" ON positions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own positions" ON positions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own positions" ON positions
    FOR UPDATE USING (auth.uid() = user_id);

-- Subscriptions policies
CREATE POLICY "Users can view own subscriptions" ON subscriptions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own subscriptions" ON subscriptions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own subscriptions" ON subscriptions
    FOR UPDATE USING (auth.uid() = user_id);

-- Usage tracking policies
CREATE POLICY "Users can view own usage" ON usage_tracking
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own usage" ON usage_tracking
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own usage" ON usage_tracking
    FOR UPDATE USING (auth.uid() = user_id);

-- Scenarios and tutorials are public (read-only)
ALTER TABLE scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE tutorials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view scenarios" ON scenarios
    FOR SELECT USING (true);

CREATE POLICY "Anyone can view tutorials" ON tutorials
    FOR SELECT USING (true);

-- Functions and triggers for automatic updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers to update updated_at columns
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_trades_updated_at BEFORE UPDATE ON trades
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_positions_updated_at BEFORE UPDATE ON positions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to handle user creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO users (id, username, email)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'username', 'Trader' || floor(random() * 1000)::text),
        NEW.email
    );
    RETURN NEW;
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- Trigger to create user profile on signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Function to update user balance after trade
CREATE OR REPLACE FUNCTION update_user_balance_after_trade()
RETURNS TRIGGER AS $$
BEGIN
    -- Only update balance when trade is closed
    IF NEW.status = 'closed' AND OLD.status = 'open' THEN
        UPDATE users 
        SET 
            virtual_balance = virtual_balance + NEW.profit_loss,
            total_profit_loss = total_profit_loss + NEW.profit_loss
        WHERE id = NEW.user_id;
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- Trigger to update user balance when trade is closed
CREATE TRIGGER update_balance_on_trade_close
    AFTER UPDATE ON trades
    FOR EACH ROW EXECUTE FUNCTION update_user_balance_after_trade();

-- Insert default scenarios
INSERT INTO scenarios (id, title, description, difficulty, market_event, guide_steps, required_tier) VALUES
('earnings_beat', 'Earnings Beat', 'Company reports better than expected earnings', 'beginner', 
 '{"type": "earnings", "impact": "positive", "volatility": "medium"}',
 '["Analyze the earnings report", "Consider market reaction", "Decide on position size", "Set stop loss"]',
 'free'),
('market_crash', 'Market Crash', 'Sudden market downturn due to economic concerns', 'advanced',
 '{"type": "market_event", "impact": "negative", "volatility": "high"}',
 '["Assess market sentiment", "Consider defensive positions", "Manage risk exposure", "Look for opportunities"]',
 'premium'),
('news_spike', 'Breaking News', 'Positive regulatory news causes price movement', 'intermediate',
 '{"type": "news", "impact": "positive", "volatility": "high"}',
 '["Verify news authenticity", "Assess long-term impact", "Consider entry timing", "Set profit targets"]',
 'free');

-- Insert default tutorials
INSERT INTO tutorials (id, title, content_type, content, trigger_event, required_tier, order_index) VALUES
('first_trade_complete', 'First Trade Complete!', 'text', 
 'Congratulations on completing your first trade! You''ve learned the basics of placing orders and managing positions.',
 'trade_complete', 'free', 1),
('understanding_feedback', 'Understanding AI Feedback', 'text',
 'Learn how to interpret and use AI feedback to improve your trading decisions.',
 'feedback_received', 'free', 2),
('risk_management_basics', 'Risk Management Basics', 'text',
 'Essential risk management principles every trader should know.',
 'manual', 'free', 3),
('advanced_analytics', 'Advanced Analytics', 'text',
 'Deep dive into advanced trading analytics and performance metrics.',
 'manual', 'premium', 4);

-- Create a view for user statistics
CREATE VIEW user_stats AS
SELECT 
    u.id,
    u.username,
    u.subscription_tier,
    u.virtual_balance,
    u.total_profit_loss,
    COUNT(t.id) as total_trades,
    COUNT(CASE WHEN t.status = 'closed' THEN 1 END) as closed_trades,
    COUNT(CASE WHEN t.status = 'open' THEN 1 END) as open_trades,
    COUNT(CASE WHEN t.profit_loss > 0 THEN 1 END) as winning_trades,
    COUNT(CASE WHEN t.profit_loss < 0 THEN 1 END) as losing_trades,
    CASE 
        WHEN COUNT(CASE WHEN t.status = 'closed' THEN 1 END) > 0 
        THEN ROUND((COUNT(CASE WHEN t.profit_loss > 0 THEN 1 END)::DECIMAL / COUNT(CASE WHEN t.status = 'closed' THEN 1 END)) * 100, 2)
        ELSE 0 
    END as win_rate,
    COALESCE(AVG(CASE WHEN t.profit_loss > 0 THEN t.profit_loss END), 0) as avg_win,
    COALESCE(ABS(AVG(CASE WHEN t.profit_loss < 0 THEN t.profit_loss END)), 0) as avg_loss
FROM users u
LEFT JOIN trades t ON u.id = t.user_id
GROUP BY u.id, u.username, u.subscription_tier, u.virtual_balance, u.total_profit_loss;
