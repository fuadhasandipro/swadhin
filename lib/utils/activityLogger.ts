import { SupabaseClient } from "@supabase/supabase-js";

export interface LogEntry {
  userId: string;
  action: string;
  entityType: string;
  entityId?: string;
  details?: Record<string, any>;
}

export async function logActivity(supabase: SupabaseClient, entry: LogEntry): Promise<void> {
  const { error } = await supabase.rpc('log_activity', {
    p_user_id: entry.userId,
    p_action: entry.action,
    p_entity_type: entry.entityType,
    p_entity_id: entry.entityId || null,
    p_details: entry.details || {}
  });

  if (error) {
    console.error("Failed to log activity:", error);
    // We intentionally don't throw an error here to prevent logging failures 
    // from breaking the main business logic (e.g. stopping an order creation).
  }
}
