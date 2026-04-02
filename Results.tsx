import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { AlertTriangle, CheckCircle, MapPin, ArrowLeft, Copy, Mail, X, TrendingUp, TrendingDown } from 'lucide-react';
import { supabase } from './supabase';
import { AuditResult, LineItem } from './types';
import { formatCurrency, formatDate, cn } from './utils';
import { useAuth } from './AuthContext';

function getStatusColor(status: string) {
  switch (status) {
    case 'DISCREPANCY': return 'bg-danger/10 border-danger/20';
    case 'NEW_CHARGE': return 'bg-orange-500/10 border-orange-500/20';
    case 'MISSING_CHARGE': return 'bg-yellow-500/10 border-yellow-500/20';
    default: return '';
  }
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; className: string }> = {
    MATCH: { label: '✓ Match', className: 'bg-primary/10 text-primary border border-primary/20' },
    DISCREPANCY: { label: '↑ Overcharge', className: 'bg-danger/10 text-danger border border-danger/20' },
    NEW_CHARGE: { label: '+ Added', className: 'bg-orange-500/10 text-orange-400 border border-orange-500/20' },
    MISSING_CHARGE: { label: '− Missing', className: 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' },
  };
  const c = config[status] || config.MATCH;
  return <span className={cn('px-2 py-1 rounded-full text-xs font-bold whitespace-nowrap', c.className)}>{c.label}</span>;
}

function ExplanationText({ status }: { status: string }) {
  const explanations: Record<string, string> = {
    DISCREPANCY: 'Rate increased from quoted price',
    NEW_CHARGE: 'This charge was not in your original quote',
    MISSING_CHARGE: 'Quoted charge was not billed',
  };
  if (!explanations[status]) return null;
  return <p className="text-xs text-white/40 italic mt-1">{explanations[status]}</p>;
}

function DisputeEmailModal({ audit, onClose }: { audit: AuditResult; onClose: () => void }) {
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);

  const discrepancies = audit.line_items.filter(
    i => i.status === 'DISCREPANCY' || i.status === 'NEW_CHARGE'
  );

  const subject = `Formal Invoice Dispute — ${audit.carrier_name} | Ref: ${formatDate(new Date().toISOString())}`;

  const disputeLines = discrepancies.map(item => {
    if (item.status === 'DISCREPANCY') {
      return `• ${item.description}:\n  Quoted: ${item.quoted_currency} ${item.quoted_amount} | Invoiced: ${item.invoiced_currency} ${item.invoiced_amount}\n  Difference: $${item.variance_usd.toFixed(2)}`;
    }
    return `• ${item.description} (${item.invoiced_currency} ${item.invoiced_amount}):\n  This charge was not included in our original quotation.`;
  }).join('\n\n');

  const body = `Dear ${audit.carrier_name} Billing Team,

We are writing to formally dispute charges on your recent invoice which differ from our agreed quotation.

Our audit identified the following discrepancies:

${disputeLines}

Total disputed amount: ${formatCurrency(audit.potential_refund)}

Please issue a credit note or corrected invoice within 5 business days of receiving this notice.

Best regards,
${user?.email}

---
Audited using BillGuard AI
Date: ${formatDate(new Date().toISOString())}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(`Subject: ${subject}\n\n${body}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-surface border border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h3 className="font-bold text-lg">Dispute Email</h3>
          <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div>
            <p className="text-xs font-bold text-white/40 uppercase tracking-wider mb-2">Subject</p>
            <div className="bg-white/5 rounded-lg p-3 text-sm font-medium">{subject}</div>
          </div>
          <div>
            <p className="text-xs font-bold text-white/40 uppercase tracking-wider mb-2">Body</p>
            <pre className="bg-white/5 rounded-lg p-4 text-sm whitespace-pre-wrap font-sans leading-relaxed text-white/80">{body}</pre>
          </div>
        </div>

        <div className="p-6 border-t border-white/10 grid grid-cols-2 gap-3">
          <button
            onClick={handleCopy}
            className={cn(
              'flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-all border',
              copied ? 'bg-primary/10 border-primary/20 text-primary' : 'border-white/10 hover:bg-white/5'
            )}
          >
            <Copy size={18} />
            {copied ? 'Copied ✓' : 'Copy Full Email'}
          </button>
          <button
            onClick={() => window.location.href = `mailto:billing@carrier.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`}
            className="flex items-center justify-center gap-2 py-3 rounded-xl font-bold bg-primary text-background hover:bg-primary/90 transition-all"
          >
            <Mail size={18} />
            Open in Mail App
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Results() {
  const { id } = useParams<{ id: string }>();
  const [audit, setAudit] = useState<AuditResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [showEmailModal, setShowEmailModal] = useState(false);

  useEffect(() => {
    const fetchAudit = async () => {
      const { data, error } = await supabase
        .from('audits')
        .select('*')
        .eq('id', id)
        .single();
      if (error) console.error(error);
      else setAudit(data);
      setLoading(false);
    };
    if (id) fetchAudit();
  }, [id]);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!audit) return (
    <div className="glass-card p-12 text-center">
      <p className="text-white/60">Audit not found.</p>
      <Link to="/" className="btn-primary mt-4 inline-block">New Audit</Link>
    </div>
  );

  const isDiscrepancy = audit.match_status === 'DISCREPANCY';
  const hasOvercharge = audit.potential_refund > 0;

  return (
    <div className="space-y-8">
      {showEmailModal && (
        <DisputeEmailModal audit={audit} onClose={() => setShowEmailModal(false)} />
      )}

      <div className="flex items-center gap-4">
        <Link to="/history" className="flex items-center gap-2 text-white/60 hover:text-white transition-colors">
          <ArrowLeft size={18} />
          Back to History
        </Link>
      </div>

      {/* Summary Card */}
      <div className="glass-card p-6">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              {isDiscrepancy ? (
                <AlertTriangle className="text-danger" size={24} />
              ) : (
                <CheckCircle className="text-primary" size={24} />
              )}
              <h1 className="text-2xl font-bold">{audit.carrier_name}</h1>
            </div>
            <p className="text-white/60">Audit completed successfully</p>
            <div className="flex items-center gap-2 text-sm text-white/60">
              <MapPin size={14} />
              <span>{audit.loading_port} → {audit.discharge_port}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-white/40 uppercase font-bold tracking-wider">Match Score:</span>
              <span className={cn('font-bold', audit.match_score >= 80 ? 'text-primary' : 'text-danger')}>
                {audit.match_score}%
              </span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-xs text-white/40 uppercase font-bold tracking-wider mb-1">Quoted Total</p>
              <p className="font-bold text-lg">{formatCurrency(audit.details.quote.total)}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-white/40 uppercase font-bold tracking-wider mb-1">Invoiced Total</p>
              <p className="font-bold text-lg">{formatCurrency(audit.details.invoice.total)}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-white/40 uppercase font-bold tracking-wider mb-1">
                {hasOvercharge ? 'Overcharge' : 'Variance'}
              </p>
              <p className={cn('font-bold text-lg', hasOvercharge ? 'text-danger' : 'text-primary')}>
                {hasOvercharge ? `+${formatCurrency(audit.potential_refund)}` : formatCurrency(0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Line Items Table */}
      <div className="glass-card overflow-hidden">
        <div className="p-6 border-b border-white/10">
          <h2 className="font-bold text-lg">Line Item Comparison</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-white/5 text-white/40 text-xs uppercase font-bold tracking-wider">
                <th className="px-6 py-4">Description</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Quoted</th>
                <th className="px-6 py-4">Invoiced</th>
                <th className="px-6 py-4">Variance</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {audit.line_items.map((item: LineItem, i: number) => (
                <tr key={i} className={cn('transition-colors', getStatusColor(item.status))}>
                  <td className="px-6 py-4">
                    <p className="font-medium">{item.description}</p>
                    <ExplanationText status={item.status} />
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs text-white/60 bg-white/5 px-2 py-1 rounded">
                      {item.category?.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-mono text-sm">
                    {item.quoted_amount != null
                      ? `${item.quoted_currency} ${item.quoted_amount.toLocaleString()}`
                      : <span className="text-white/30">—</span>
                    }
                  </td>
                  <td className="px-6 py-4 font-mono text-sm">
                    {item.invoiced_amount != null
                      ? `${item.invoiced_currency} ${item.invoiced_amount.toLocaleString()}`
                      : <span className="text-white/30">—</span>
                    }
                  </td>
                  <td className="px-6 py-4 font-mono font-bold">
                    {item.variance_usd > 0 ? (
                      <span className="text-danger flex items-center gap-1">
                        <TrendingUp size={14} />
                        +${item.variance_usd.toFixed(2)}
                      </span>
                    ) : item.variance_usd < 0 ? (
                      <span className="text-primary flex items-center gap-1">
                        <TrendingDown size={14} />
                        ${item.variance_usd.toFixed(2)}
                      </span>
                    ) : (
                      <span className="text-white/40">$0.00</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={item.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Dispute Email */}
      {hasOvercharge && (
        <div className="glass-card p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-lg">Generate Dispute Email</h3>
            <p className="text-white/60 text-sm">
              Send a formal dispute to {audit.carrier_name} to recover {formatCurrency(audit.potential_refund)}
            </p>
          </div>
          <button
            onClick={() => setShowEmailModal(true)}
            className="btn-primary flex items-center gap-2 whitespace-nowrap"
          >
            <Mail size={18} />
            Generate Dispute Email
          </button>
        </div>
      )}
    </div>
  );
}
