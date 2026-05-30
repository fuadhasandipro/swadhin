export type UserRole = 'admin' | 'manager' | 'staff';

export type OrderStatus =
  | 'order_placed'
  | 'designing'
  | 'design_waiting_confirmation'
  | 'design_confirmed'
  | 'waiting_for_plate'
  | 'plate_done'
  | 'waiting_stock'
  | 'waiting_print'
  | 'one_color_done'
  | 'drying'
  | 'two_color_done'
  | 'waiting_handle'
  | 'handle_done'
  | 'ready_delivery'
  | 'on_the_way'
  | 'delivered'
  | 'canceled';

export type TransactionType = 'in' | 'out';
export type TransactionCategory = 'sale' | 'expense' | 'salary' | 'collection' | 'other';
export type CustomerTransactionType = 'debit' | 'credit';

export interface Profile {
  id: string;
  user_id: string; // references auth.users
  full_name: string;
  phone: string;
  role: UserRole;
  privileges: Record<string, any> | null;
  salary_amount: number;
  created_at: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  address: string;
  balance: number; // numeric (negative = owes us, positive = we owe them)
  created_at: string;
  orders?: { count: number }[];
}

export interface Product {
  id: string;
  bag_size: string;
  bag_color: string;
  gsm: number;
  cost_per_piece: number;
  qty: number;
  cutting_type?: string;
  category?: string; // 'raw_material' | 'ink' | 'plate' | 'packaging' | 'other'
  supplier_id?: string | null;
  created_at: string;
}

export interface Supplier {
  id: string;
  name: string;
  phone: string | null;
  address: string | null;
  balance: number; // positive = we owe them, negative = they owe us
  notes: string | null;
  created_at: string;
  supplier_transactions?: { count: number }[];
}

export interface SupplierTransaction {
  id: string;
  supplier_id: string;
  type: 'debit' | 'credit';
  amount: number;
  description: string | null;
  created_at: string;
}

export interface Order {
  id: string;
  customer_id: string;
  order_date: string;
  delivery_date: string;
  status: OrderStatus;
  location: string;
  cutting_type: 'handle' | 'd-cut';
  gsm: number;
  body_color: string;
  handle_color: string;
  print_color_type: 'single' | 'double';
  print_color_config: Record<string, any> | null;
  product_id: string | null;
  rate_per_piece: number;
  qty: number;
  total_amount: number;
  paid_amount: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface CashTransaction {
  id: string;
  type: TransactionType;
  category: TransactionCategory;
  amount: number;
  description: string;
  customer_id: string | null;
  created_at: string;
  created_by: string; // references profiles.id
}

export interface CustomerTransaction {
  id: string;
  customer_id: string;
  type: CustomerTransactionType;
  amount: number;
  description: string;
  order_id: string | null;
  created_at: string;
}

export interface SalaryRecord {
  id: string;
  profile_id: string;
  month: string; // e.g., '2023-10'
  amount: number;
  paid_amount: number;
  due_amount: number;
  paid_at: string | null;
  notes: string | null;
}

export interface ActivityLog {
  id: string;
  user_id: string; // references profiles.id
  action: string;
  entity_type: string;
  entity_id: string;
  details: Record<string, any> | null;
  created_at: string;
}

export interface PrintColorConfig {
  id: string;
  name: string;
  colors: string[];
  is_active: boolean;
}

export interface SMSLog {
  id: string;
  customer_id: string | null;
  phone: string;
  message: string;
  status: string;
  sent_at: string;
}
