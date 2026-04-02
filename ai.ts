import { AuditResult } from './types';

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
const CEREBRAS_API_KEY = import.meta.env.VITE_CEREBRAS_API_KEY;

const SYSTEM_PROMPT = "You are a freight invoice auditor. Return valid JSON only.";

const USER_PROMPT_TEMPLATE = (quoteText: string, invoiceText: string) => `
Compare these freight documents. Find all overcharges.

QUOTE: ${quoteText}
INVOICE: ${invoiceText}

Return JSON:
{
  "carrier_name": "string",
  "match_status": "MATCH or DISCREPANCY",
  "match_score": 0-100,
  "potential_refund": number in USD,
  "base_currency": "USD",
  "loading_port": "string",
  "discharge_port": "string",
  "line_items": [{
    "description": "string",
    "status": "MATCH/DISCREPANCY/NEW_CHARGE/MISSING_CHARGE",
    "quoted_amount": number or null,
    "quoted_currency": "string",
    "invoiced_amount": number or null,
    "invoiced_currency": "string",
    "variance_usd": number,
    "category": "OCEAN_FREIGHT/THC_ORIGIN/THC_DESTINATION/DOCUMENTATION/FUEL_SURCHARGE/CONGESTION/INLAND_TRANSPORT/CUSTOMS/INSURANCE/AGENCY/PENALTY/MISCELLANEOUS"
  }],
  "details": {
    "quote": {"total": number},
    "invoice": {"total": number}
  }
}`;

async function callGroq(prompt: string): Promise<AuditResult> {
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${GROQ_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: prompt }
      ],
      response_format: { type: 'json_object' }
    })
  });

  if (!response.ok) {
    if (response.status === 429) throw new Error('RATE_LIMIT');
    throw new Error('GROQ_ERROR');
  }

  const data = await response.json();
  return JSON.parse(data.choices[0].message.content);
}

async function callCerebras(prompt: string): Promise<AuditResult> {
  const response = await fetch('https://api.cerebras.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${CEREBRAS_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama3.1-8b',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: prompt }
      ]
    })
  });

  if (!response.ok) throw new Error('CEREBRAS_ERROR');

  const data = await response.json();
  return JSON.parse(data.choices[0].message.content);
}

export async function performAudit(quoteText: string, invoiceText: string): Promise<AuditResult> {
  const prompt = USER_PROMPT_TEMPLATE(quoteText, invoiceText);
  
  const timeoutPromise = new Promise((_, reject) => 
    setTimeout(() => reject(new Error('TIMEOUT')), 120000)
  );

  const auditPromise = (async () => {
    try {
      return await callGroq(prompt);
    } catch (error: any) {
      console.warn('Groq failed, falling back to Cerebras:', error.message);
      return await callCerebras(prompt);
    }
  })();

  return Promise.race([auditPromise, timeoutPromise]) as Promise<AuditResult>;
}
