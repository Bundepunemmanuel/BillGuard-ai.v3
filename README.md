# BillGuard AI V3

Freight invoice audit SaaS. AI-powered overcharge detection.

## Quick Deploy

1. Upload to GitHub
2. Connect to Vercel
3. Add environment variables (see .env.example)
4. Deploy

## Environment Variables (add to Vercel)

| Variable | Where to get it |
|---|---|
| VITE_SUPABASE_URL | Supabase → Project Settings → API |
| VITE_SUPABASE_ANON_KEY | Supabase → Project Settings → API |
| VITE_GROQ_API_KEY | console.groq.com → API Keys |
| VITE_CEREBRAS_API_KEY | cloud.cerebras.ai → API Keys |
| VITE_NOWPAYMENTS_API_KEY | nowpayments.io → Payment Settings → API Keys |
| VITE_APP_URL | Your Vercel URL e.g. https://billguard-ai.vercel.app |

## Supabase Setup

Run SUPABASE_SETUP.sql in your Supabase SQL Editor.

## NOWPayments IPN (Automatic Payment Activation)

1. Deploy Supabase Edge Function:
   - Go to Supabase → Edge Functions → New Function
   - Name: nowpayments-webhook
   - Paste code from: supabase/functions/nowpayments-webhook/index.ts
   - Add secret: NOWPAYMENTS_IPN_SECRET (from NOWPayments dashboard)

2. Add webhook URL in NOWPayments:
   - Payment Settings → Webhook URL
   - Set to: https://[your-supabase-ref].supabase.co/functions/v1/nowpayments-webhook

## Manual Plan Activation (backup)

Open browser console on your live site and type:
```js
activateUser("customer@email.com", "pro", 1)
```
