import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { ShieldAlert, TrendingUp, DollarSign, Activity } from 'lucide-react';
import { supabase } from './supabase';
import { AuditResult } from './types';
import { formatCurrency } from './utils';

export default function Dashboard() {
  const [audits, setAudits] = useState<AuditResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAudits = async () => {
      const { data } = await supabase.from('audits').select('*');
      setAudits(data || []);
      setLoading(false);
    };
    fetchAudits();
  }, []);

  const totalRefunds = audits.reduce((sum, a) => sum + a.potential_refund, 0);
  const discrepancyRate = audits.length > 0 
    ? (audits.filter(a => a.match_status === 'DISCREPANCY').length / audits.length) * 100 
    : 0;
  const avgScore = audits.length > 0 
    ? audits.reduce((sum, a) => sum + a.match_score, 0) / audits.length 
    : 0;

  const carrierData = Object.entries(
    audits.reduce((acc: any, a) => {
      acc[a.carrier_name] = (acc[a.carrier_name] || 0) + a.potential_refund;
      return acc;
    }, {})
  ).map(([name, value]) => ({ name, value }));

  const statusData = [
    { name: 'Match', value: audits.filter(a => a.match_status === 'MATCH').length },
    { name: 'Discrepancy', value: audits.filter(a => a.match_status === 'DISCREPANCY').length },
  ];

  const COLORS = ['#00F5A0', '#FF3B6B', '#00C2FF', '#C9A84C'];

  if (loading) return <div className="animate-pulse space-y-8">
    <div className="grid grid-cols-4 gap-6 h-32 bg-white/5 rounded-xl"></div>
    <div className="grid grid-cols-2 gap-6 h-96 bg-white/5 rounded-xl"></div>
  </div>;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Risk Dashboard</h1>
        <p className="text-white/60">Real-time analysis of carrier performance and billing risks.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Potential Refunds', value: formatCurrency(totalRefunds), icon: DollarSign, color: 'text-primary' },
          { label: 'Discrepancy Rate', value: `${discrepancyRate.toFixed(1)}%`, icon: ShieldAlert, color: 'text-danger' },
          { label: 'Avg. Match Score', value: `${avgScore.toFixed(1)}%`, icon: Activity, color: 'text-info' },
          { label: 'Total Audits', value: audits.length, icon: TrendingUp, color: 'text-gold' },
        ].map((stat, i) => (
          <div key={i} className="glass-card p-6 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white/40 uppercase tracking-wider">{stat.label}</span>
              <stat.icon className={stat.color} size={20} />
            </div>
            <p className="text-2xl font-bold">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="glass-card p-6 space-y-6">
          <h3 className="font-bold text-lg">Refunds by Carrier</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={carrierData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                <XAxis dataKey="name" stroke="#ffffff40" fontSize={12} />
                <YAxis stroke="#ffffff40" fontSize={12} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#111118', border: '1px solid #ffffff10' }}
                  itemStyle={{ color: '#00F5A0' }}
                />
                <Bar dataKey="value" fill="#00F5A0" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-card p-6 space-y-6">
          <h3 className="font-bold text-lg">Audit Status Distribution</h3>
          <div className="h-80 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {statusData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#111118', border: '1px solid #ffffff10' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-8">
            {statusData.map((s, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i] }}></div>
                <span className="text-sm text-white/60">{s.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
