"use client";

import React from "react";
import { format, isToday, isYesterday } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle2, 
  PlusCircle, 
  Banknote, 
  Package, 
  Settings, 
  UserPlus, 
  Trash2, 
  AlertTriangle,
  Info
} from "lucide-react";

const ACTION_MAP: Record<string, string> = {
  'CREATE_ORDER': 'created new order',
  'UPDATE_STATUS': 'updated order status',
  'DELETE_ORDER': 'deleted order',
  'ADD_STOCK': 'added new stock',
  'UPDATE_PRODUCT': 'updated stock',
  'RESTOCK_PRODUCT': 'restocked product',
  'DELETE_PRODUCT': 'deleted stock',
  'CASH_TRANSACTION': 'recorded cash transaction',
  'CREATE_CUSTOMER': 'added new customer',
  'UPDATE_CUSTOMER': 'updated customer details',
  'DELETE_CUSTOMER': 'deleted customer',
  'ADJUST_BALANCE': 'adjusted balance',
  'CASH_COLLECTION': 'collected cash',
  'PAY_SALARY': 'paid salary',
  'CREATE_MANAGER': 'created manager account',
  'UPDATE_PRIVILEGES': 'updated privileges',
  'UPDATE_SALARY': 'updated salary',
  'TOGGLE_USER_STATUS': 'toggled user status',
  'UPDATE_SETTING': 'updated system settings',
  'CREATE_PRINT_CONFIG': 'added print color',
  'TOGGLE_PRINT_CONFIG': 'toggled print color',
  'SEND_TEST_SMS': 'sent test SMS',
  'CREATE_EXPENSE_CATEGORY': 'created expense category',
  'DELETE_EXPENSE_CATEGORY': 'deleted expense category',
};

const formatActivityTime = (dateStr: string) => {
  const d = new Date(dateStr);
  if (isToday(d)) {
    return `Today ${format(d, "h:mm a")}`;
  }
  if (isYesterday(d)) {
    return `Yesterday ${format(d, "h:mm a")}`;
  }
  return format(d, "d MMM h:mm a");
};

const getRoleName = (profile: any) => {
  if (!profile) return 'System';
  if (profile.role === 'admin') return 'Admin';
  if (profile.role === 'manager') {
    if (profile.privileges?.includes('delivery_manager') || profile.privileges?.delivery_manager) return 'Delivery Manager';
    if (profile.privileges?.includes('order_manager') || profile.privileges?.order_manager) return 'Order Manager';
    if (profile.privileges?.includes('stock_manager') || profile.privileges?.stock_manager) return 'Stock Manager';
    return 'Manager';
  }
  return profile.role || 'User';
};

const formatStatus = (status: string) => {
  if (!status) return 'Updated';
  return status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
};

const formatEntityName = (log: any) => {
  const d = log.details || {};
  switch (log.entity_type) {
    case 'orders': return d.customer_name ? `order for ${d.customer_name}` : `order`;
    case 'customers': return d.name || d.customer_name ? `customer "${d.name || d.customer_name}"` : `customer`;
    case 'products': return d.bag_size ? `stock item (${d.bag_size} ${d.color || ''})`.trim() : `stock item`;
    default: return log.entity_type?.replace(/s$/, '') || 'item'; // Removes trailing 's' for singular (e.g. 'orders' -> 'order')
  }
};

const getLogContent = (log: any) => {
  const role = getRoleName(log.profile);
  const name = log.profile?.full_name || 'System';
  const prefix = `<span class="font-semibold text-slate-800 dark:text-emerald-100">${role} ${name !== 'System' ? `(${name})` : ''}</span>`;
  
  const d = log.details || {};
  const entityName = formatEntityName(log);
  
  switch(log.action) {
    case 'CREATE_ORDER':
      return `${prefix} created new <span class="font-medium text-slate-700 dark:text-emerald-200">${entityName}</span> ${(d.qty || d.order_qty) ? `(${(d.qty || d.order_qty).toLocaleString()} pcs)` : ''}. ${d.sms_sent ? 'SMS sent to customer.' : ''}`.trim();
    case 'UPDATE_STATUS':
      return `${prefix} marked <span class="font-medium text-slate-700 dark:text-emerald-200">${entityName}</span> as <span class="bg-emerald-100/80 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-200 px-1.5 py-0.5 rounded text-[11px] font-semibold">${formatStatus(d.new_status || d.status || d.to)}</span>. ${d.sms_sent ? 'SMS sent to customer.' : ''}`.trim();
    case 'ADD_STOCK':
      return `${prefix} added ${d.qty?.toLocaleString() || 0} pcs to stock: ${d.bag_size || ''} ${d.color || ''} / ${d.gsm || ''} GSM / ${d.cutting_type || ''} cut.`;
    case 'RESTOCK_PRODUCT':
      return `${prefix} restocked ${d.added_qty?.toLocaleString() || d.qty?.toLocaleString() || 0} pcs to stock. New total: ${d.new_qty?.toLocaleString() || 0} pcs.`;
    case 'CASH_TRANSACTION':
      return `${prefix} recorded cash ${d.type === 'in' ? 'collection' : 'payment'} of ৳${d.amount?.toLocaleString() || 0} ${d.type === 'in' ? 'from' : 'to'} ${d.customer_name || 'customer'}${d.method ? ` via ${d.method}` : ''}.`;
    case 'CASH_COLLECTION':
      return `${prefix} recorded cash collection of ৳${d.amount?.toLocaleString() || 0} from ${d.customer_name || 'customer'}${d.method ? ` via ${d.method}` : ''}.`;
    case 'CREATE_CUSTOMER':
      return `${prefix} added new customer "${d.name || ''}".`;
    case 'ADJUST_BALANCE':
      return `${prefix} adjusted balance by ৳${d.amount?.toLocaleString() || 0} for ${d.customer_name ? `customer "${d.customer_name}"` : 'customer'}.`;
    case 'CREATE_MANAGER':
      return `${prefix} created new manager account "${d.name || ''}".`;
    case 'UPDATE_SETTING':
      return `${prefix} updated system settings ${d.setting_name ? `(${d.setting_name})` : ''}.`;
    case 'DELETE_ORDER':
      return `${prefix} deleted <span class="font-medium text-slate-700 dark:text-emerald-200">${entityName}</span>.`;
    default:
      // Fallback
      if (log.action?.includes('FLAG') || log.action?.includes('SYSTEM')) {
        return `<span class="font-semibold text-slate-800 dark:text-emerald-100">System flagged</span> <span class="font-medium text-slate-700 dark:text-emerald-200">${entityName}</span> — ${d.message || d.reason || 'Notice'}.`;
      }
      return `${prefix} ${ACTION_MAP[log.action] || log.action.toLowerCase().replace(/_/g, ' ')} for <span class="font-medium text-slate-700 dark:text-emerald-200">${entityName}</span>.`;
  }
};

const getLogIcon = (action: string, isSystem: boolean = false) => {
  if (isSystem || action.includes('FLAG')) return <AlertTriangle className="text-red-500 w-4 h-4" />;
  if (action.includes('ORDER')) return <PlusCircle className="text-emerald-500 w-4 h-4" />;
  if (action.includes('STATUS')) return <CheckCircle2 className="text-blue-500 w-4 h-4" />;
  if (action.includes('STOCK') || action.includes('PRODUCT')) return <Package className="text-amber-500 w-4 h-4" />;
  if (action.includes('CASH') || action.includes('BALANCE')) return <Banknote className="text-emerald-600 w-4 h-4" />;
  if (action.includes('CUSTOMER') || action.includes('MANAGER')) return <UserPlus className="text-purple-500 w-4 h-4" />;
  if (action.includes('SETTING')) return <Settings className="text-slate-500 w-4 h-4" />;
  if (action.includes('DELETE')) return <Trash2 className="text-red-500 w-4 h-4" />;
  return <Info className="text-slate-400 w-4 h-4" />;
};

export function ActivityLogTable({ logs }: { logs: any[] }) {
  if (logs.length === 0) {
    return <div className="p-8 text-center text-slate-500">No activity logs found.</div>;
  }

  return (
    <div className="rounded-xl border border-slate-200 dark:border-emerald-900/30 bg-white dark:bg-[#0a0f0a]/50 overflow-hidden shadow-sm">
      <div className="divide-y divide-slate-100 dark:divide-emerald-900/20">
        {logs.map((log) => {
          const isSystem = !log.user_id;
          return (
            <div key={log.id} className="p-4 flex gap-4 hover:bg-slate-50 dark:hover:bg-emerald-900/10 transition-colors group">
              <div className="shrink-0 mt-0.5">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isSystem ? 'bg-red-50 dark:bg-red-950/30' : 'bg-slate-100 dark:bg-emerald-900/20'}`}>
                  {getLogIcon(log.action, isSystem)}
                </div>
              </div>
              <div className="flex-1">
                <div 
                  className="text-sm text-slate-700 dark:text-emerald-50/80 leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: getLogContent(log) }}
                />
                <div className="text-xs text-slate-400 dark:text-emerald-600 mt-1.5 font-medium">
                  {formatActivityTime(log.created_at)}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
