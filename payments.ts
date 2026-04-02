const NOWPAYMENTS_API_KEY = import.meta.env.VITE_NOWPAYMENTS_API_KEY;
const APP_URL = import.meta.env.VITE_APP_URL;
const SUPABASE_REF = import.meta.env.VITE_SUPABASE_URL?.split('//')[1]?.split('.')[0] || '';

export async function createPaymentInvoice(
  amount: number,
  plan: string,
  email: string
): Promise<void> {
  if (!NOWPAYMENTS_API_KEY) {
    throw new Error('Payment system not configured. Contact billguard.ai@gmail.com');
  }

  // order_id format: email_plan_timestamp
  // webhook parses this to extract email and plan
  const orderId = `${email}_${plan}_${Date.now()}`;

  const response = await fetch('https://api.nowpayments.io/v1/invoice', {
    method: 'POST',
    headers: {
      'x-api-key': NOWPAYMENTS_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      price_amount: amount,
      price_currency: 'usd',
      pay_currency: 'usdttrc20',
      order_id: orderId,
      order_description: `BillGuard AI ${plan} Plan`,
      success_url: `${APP_URL}/settings?payment=success`,
      cancel_url: `${APP_URL}/pricing`,
      // IPN goes to Supabase Edge Function for automatic activation
      ipn_callback_url: `https://${SUPABASE_REF}.supabase.co/functions/v1/nowpayments-webhook`,
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to create payment invoice');
  }

  const invoice = await response.json();

  if (!invoice.invoice_url) {
    throw new Error('No invoice URL returned from payment provider');
  }

  window.location.href = invoice.invoice_url;
}
