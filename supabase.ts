import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder'
);

export async function activateUserPlan(
  email: string,
  plan: string,
  months: number
) {
  const limits: Record<string, number> = { free: 5, starter: 25, pro: 999999 };
  const expiry = new Date();
  expiry.setMonth(expiry.getMonth() + months);

  const { error } = await supabase
    .from('users')
    .upsert({
      email,
      plan,
      audits_used: 0,
      audits_limit: limits[plan] || 5,
      expiry: expiry.toISOString(),
    }, { onConflict: 'email' });

  if (error) throw error;
  console.log('Plan activated:', email, plan, months, 'months');
}

// Expose to browser console for manual activation backup
if (typeof window !== 'undefined') {
  (window as any).activateUser = activateUserPlan;
}
