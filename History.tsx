import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FileSearch, Calendar, ChevronRight, AlertTriangle, CheckCircle } from 'lucide-react';
import { supabase } from './supabase';
import { AuditResult } from './types';
import { formatCurrency, formatDate, cn } from './utils';

export default function History() {
  const [audits, setAudits] = useState<AuditResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAudits = async () => {
      const { data, error } = await supabase
        .from('audits')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) console.error(error);
      else setAudits(data || []);
      setLoading(false);
    };

    fetchAudits();
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64"><FileSearch className="animate-pulse text-primary" size={48} /></div>;

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Audit History</h1>
          <p className="text-white/60">Review your previous freight invoice audits.</p>
        </div>
        <Link to="/" className="btn-primary">New Audit</Link>
      </div>

      {audits.length === 0 ? (
        <div className="glass-card p-12 text-center space-y-4">
          <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto">
            <History size={32} className="text-white/20" />
          </div>
          <p className="text-white/60">No audits found yet. Start your first audit to see it here.</p>
        </div>
      ) : (
        <div className="glass-card">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-white/5 text-white/40 text-xs uppercase font-bold tracking-wider">
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Carrier</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Score</th>
                  <th className="px-6 py-4">Potential Refund</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {audits.map((audit) => (
                  <tr key={audit.id} className="hover:bg-white/5 transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar size={14} className="text-white/40" />
                        <span>{formatDate(audit.created_at!)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-bold">{audit.carrier_name}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {audit.match_status === 'MATCH' ? (
                          <CheckCircle size={14} className="text-primary" />
                        ) : (
                          <AlertTriangle size={14} className="text-danger" />
                        )}
                        <span className={cn(
                          "text-xs font-bold uppercase",
                          audit.match_status === 'MATCH' ? "text-primary" : "text-danger"
                        )}>
                          {audit.match_status}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono text-sm">{audit.match_score}%</td>
                    <td className="px-6 py-4 font-mono font-bold text-primary">
                      {formatCurrency(audit.potential_refund, audit.base_currency)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link 
                        to={`/results/${audit.id}`}
                        className="inline-flex items-center gap-1 text-primary hover:underline font-bold text-sm"
                      >
                        View Report
                        <ChevronRight size={16} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
