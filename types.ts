export interface LineItem {
  description: string;
  status: 'MATCH' | 'DISCREPANCY' | 'NEW_CHARGE' | 'MISSING_CHARGE';
  quoted_amount: number | null;
  quoted_currency: string;
  invoiced_amount: number | null;
  invoiced_currency: string;
  variance_usd: number;
  category: string;
}

export interface AuditDetails {
  quote: { total: number; base_rate?: number; fuel_surcharge?: number; accessorial_fees?: number };
  invoice: { total: number; base_rate?: number; fuel_surcharge?: number; accessorial_fees?: number };
}

export interface AuditResult {
  id?: string;
  user_id?: string;
  created_at?: string;
  carrier_name: string;
  match_status: 'MATCH' | 'DISCREPANCY';
  match_score: number;
  potential_refund: number;
  base_currency: string;
  loading_port: string;
  discharge_port: string;
  line_items: LineItem[];
  details: AuditDetails;
}

export interface UserProfile {
  id: string;
  email: string;
  plan: 'free' | 'starter' | 'pro';
  audits_used: number;
  audits_limit: number;
  expiry: string | null;
  created_at: string;
}
