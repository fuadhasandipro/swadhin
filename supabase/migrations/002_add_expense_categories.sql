-- Migration: 002_add_expense_categories

CREATE TABLE IF NOT EXISTS public.expense_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.expense_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated full access to expense_categories" 
ON public.expense_categories 
FOR ALL TO authenticated 
USING (true);

-- Insert defaults
INSERT INTO public.expense_categories (name, description) VALUES
('Raw Material', 'Purchases for manufacturing'),
('Utility Bill', 'Electricity, Water, Gas, Internet'),
('Salary/Wages', 'Employee and staff compensation'),
('Transport/Delivery', 'Shipping and logistics costs'),
('Rent', 'Factory or shop rent'),
('Other Expense', 'Miscellaneous expenses')
ON CONFLICT (name) DO NOTHING;
