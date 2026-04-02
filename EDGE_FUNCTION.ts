// ============================================================
// SUPABASE EDGE FUNCTION — nowpayments-webhook
// ============================================================
// DO NOT upload this file to GitHub.
// This code goes into Supabase Edge Functions separately.
// 
// SETUP STEPS:
// 1. Go to supabase.com → your project → Edge Functions
// 2. Click "New Function" → name it: nowpayments-webhook
// 3. Paste everything BELOW this comment block
// 4. Add secret: NOWPAYMENTS_IPN_SECRET
// 5. Deploy the function
// 6. Copy the function URL
// 7. Paste URL in NOWPayments dashboard → Payment Settings → Webhook URL
// ============================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization,x-client-info,apikey,content-type,x-nowpayments-sig',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })

  try {
    const body = await req.json()
    const sig = req.headers.get('x-nowpayments-sig')
    const secret = Deno.env.get('NOWPAYMENTS_IPN_SECRET')

    if (sig && secret) {
      const sorted = Object.keys(body).sort().reduce((a: any, k) => { a[k] = body[k]; return a }, {})
      const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-512' }, false, ['sign'])
      const buf = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(JSON.stringify(sorted)))
      const computed = Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('')
      if (computed !== sig) return new Response('Unauthorized', { status: 401, headers: cors })
    }

    const { payment_status, order_id } = body
    if (payment_status !== 'finished' && payment_status !== 'confirmed') {
      return new Response(JSON.stringify({ received: true, ignored: true }), { headers: cors })
    }

    // order_id format: email_plan_timestamp
    const parts = order_id.split('_')
    const plan = parts[parts.length - 2]
    const email = parts.slice(0, parts.length - 2).join('_')

    const limits: Record<string, number> = { free: 5, starter: 25, pro: 999999 }
    const expiry = new Date()
    expiry.setMonth(expiry.getMonth() + 1)

    const sb = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '')
    const { error } = await sb.from('users').upsert({
      email, plan: plan.toLowerCase(),
      audits_used: 0,
      audits_limit: limits[plan.toLowerCase()] || 25,
      expiry: expiry.toISOString(),
    }, { onConflict: 'email' })

    if (error) throw new Error(error.message)
    return new Response(JSON.stringify({ success: true, email, plan }), { headers: cors })

  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: cors })
  }
})
