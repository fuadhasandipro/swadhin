-- Create enums
CREATE TYPE user_role AS ENUM ('admin', 'manager', 'staff');

CREATE TYPE order_status AS ENUM (
  'order_placed', 'designing', 'design_waiting_confirmation', 'design_confirmed', 
  'waiting_for_plate', 'plate_done', 'waiting_stock', 'waiting_print', 
  'one_color_done', 'drying', 'two_color_done', 'waiting_handle', 
  'handle_done', 'ready_delivery', 'on_the_way', 'delivered', 'canceled'
);

CREATE TYPE transaction_type AS ENUM ('in', 'out');
CREATE TYPE transaction_category AS ENUM ('sale', 'expense', 'salary', 'collection', 'other');
CREATE TYPE customer_transaction_type AS ENUM ('debit', 'credit');

-- 1. Profiles (Extends auth.users)
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    phone TEXT NOT NULL UNIQUE,
    role user_role NOT NULL DEFAULT 'staff',
    privileges JSONB,
    salary_amount NUMERIC NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Customers
CREATE TABLE public.customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    address TEXT,
    balance NUMERIC NOT NULL DEFAULT 0, -- negative = owes us, positive = we owe them
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Products (Stock/Bags)
CREATE TABLE public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bag_size TEXT NOT NULL,
    bag_color TEXT NOT NULL,
    gsm INTEGER NOT NULL,
    cost_per_piece NUMERIC NOT NULL DEFAULT 0,
    qty INTEGER NOT NULL DEFAULT 0 CHECK (qty >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Orders
CREATE TABLE public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES public.customers(id) ON DELETE RESTRICT,
    order_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    delivery_date TIMESTAMPTZ NOT NULL,
    status order_status NOT NULL DEFAULT 'order_placed',
    location TEXT,
    cutting_type TEXT NOT NULL,
    gsm INTEGER NOT NULL,
    body_color TEXT NOT NULL,
    handle_color TEXT NOT NULL,
    print_color_type TEXT NOT NULL,
    print_color_config JSONB,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    rate_per_piece NUMERIC NOT NULL,
    qty INTEGER NOT NULL,
    total_amount NUMERIC NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Cash Transactions
CREATE TABLE public.cash_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type transaction_type NOT NULL,
    category transaction_category NOT NULL,
    amount NUMERIC NOT NULL CHECK (amount >= 0),
    description TEXT,
    customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES public.profiles(id) ON DELETE RESTRICT
);

-- 6. Customer Transactions
CREATE TABLE public.customer_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE,
    type customer_transaction_type NOT NULL,
    amount NUMERIC NOT NULL CHECK (amount >= 0),
    description TEXT,
    order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Salary Records
CREATE TABLE public.salary_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    month TEXT NOT NULL,
    amount NUMERIC NOT NULL CHECK (amount >= 0),
    paid_amount NUMERIC NOT NULL DEFAULT 0 CHECK (paid_amount >= 0),
    due_amount NUMERIC NOT NULL DEFAULT 0 CHECK (due_amount >= 0),
    paid_at TIMESTAMPTZ,
    notes TEXT
);

-- 8. Activity Logs
CREATE TABLE public.activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id UUID,
    details JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. Print Color Configs
CREATE TABLE public.print_color_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    colors TEXT[] NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true
);

-- 10. SMS Logs
CREATE TABLE public.sms_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
    phone TEXT NOT NULL,
    message TEXT NOT NULL,
    status TEXT NOT NULL,
    sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX idx_orders_customer_id ON public.orders(customer_id);
CREATE INDEX idx_orders_status ON public.orders(status);
CREATE INDEX idx_orders_product_id ON public.orders(product_id);
CREATE INDEX idx_cash_tx_customer_id ON public.cash_transactions(customer_id);
CREATE INDEX idx_customer_tx_customer_id ON public.customer_transactions(customer_id);
CREATE INDEX idx_customer_tx_order_id ON public.customer_transactions(order_id);
CREATE INDEX idx_salary_profile_id ON public.salary_records(profile_id);
CREATE INDEX idx_activity_logs_user_id ON public.activity_logs(user_id);

-- Updated_at Trigger for Orders
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_orders_updated_at
BEFORE UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Trigger: on_order_delivered -> reduce stock qty
CREATE OR REPLACE FUNCTION handle_order_delivered()
RETURNS TRIGGER AS $$
BEGIN
    -- Only trigger if status changed to 'delivered' and product_id is set
    IF (NEW.status = 'delivered' AND OLD.status != 'delivered' AND NEW.product_id IS NOT NULL) THEN
        UPDATE public.products
        SET qty = qty - NEW.qty
        WHERE id = NEW.product_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_order_delivered
AFTER UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION handle_order_delivered();

-- Helper Function: insert_activity_log (Can be called from RPC or triggers)
CREATE OR REPLACE FUNCTION log_activity(
    p_user_id UUID,
    p_action TEXT,
    p_entity_type TEXT,
    p_entity_id UUID,
    p_details JSONB
) RETURNS VOID AS $$
BEGIN
    INSERT INTO public.activity_logs (user_id, action, entity_type, entity_id, details)
    VALUES (p_user_id, p_action, p_entity_type, p_entity_id, p_details);
END;
$$ LANGUAGE plpgsql;

-- Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cash_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.salary_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.print_color_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sms_logs ENABLE ROW LEVEL SECURITY;

-- Basic Policies: Allow authenticated users to perform operations
-- (More granular policies can be added based on 'role' in profiles)
CREATE POLICY "Allow authenticated full access to profiles" ON public.profiles FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated full access to customers" ON public.customers FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated full access to products" ON public.products FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated full access to orders" ON public.orders FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated full access to cash_transactions" ON public.cash_transactions FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated full access to customer_transactions" ON public.customer_transactions FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated full access to salary_records" ON public.salary_records FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated full access to activity_logs" ON public.activity_logs FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated full access to print_color_configs" ON public.print_color_configs FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated full access to sms_logs" ON public.sms_logs FOR ALL TO authenticated USING (true);
