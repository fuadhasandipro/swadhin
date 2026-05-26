-- Migration: 003_update_order_logic
-- Drops the old trigger that reduces stock on delivery, as this is now handled at order creation via application logic.

DROP TRIGGER IF EXISTS on_order_delivered ON public.orders;
DROP FUNCTION IF EXISTS handle_order_delivered();
