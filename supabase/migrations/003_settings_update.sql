-- 1. Add is_active column to profiles
ALTER TABLE public.profiles ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT true;

-- 2. Create settings table
CREATE TABLE public.settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS for settings
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read settings
CREATE POLICY "Allow authenticated read access to settings" ON public.settings FOR SELECT TO authenticated USING (true);

-- Allow authenticated users to insert/update settings (Can be restricted to admin later)
CREATE POLICY "Allow authenticated write access to settings" ON public.settings FOR ALL TO authenticated USING (true);
