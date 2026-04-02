import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { TrendingUp, PieChart, Layers, Globe } from 'lucide-react';
import { supabase } from './supabase';
import { AuditResult } from './types';
import { formatCurrency } from './utils';

export default function CostIntelligence() {
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

  // Aggregate costs by category
  const categoryData = Object.entries(
    audits.flatMap(a => a.line_items).reduce((acc: any, item) => {
      acc[item.category] = (acc[item.category] || 0) + (item.invoiced_amount || 0);
      return acc;
    }, {})
  ).map(([name, value]) => ({ 
    name: name.replace('_', ' '), 
    value: value as number 
  })).sort((a, b) => b.value - a.value);

  // Cost trend over time
  const trendData = audits.map(a => ({
    date: new Date(a.created_at!).toLocaleDateString(),
    cost: a.details.invoice.total,
    savings: a.potential_refund
  })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  if (loading) return <div className="animate-pulse space-y-8">
    <div className="h-96 bg-white/5 rounded-xl"></div>
    <div className="h-96 bg-white/5 rounded-xl"></div>
  </div>;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Cost Intelligence</h1>
        <p className="text-white/60">Deep dive into your freight spending patterns and hidden costs.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="glass-card p-6 flex items-center gap-4">
          <div className="w-12 h-12 bg-info/10 rounded-xl flex items-center justify-center text-info">
            <Layers size={24} />
          </div>
          <div>
            <p className="text-xs text-white/40 uppercase font-bold tracking-wider">Top Cost Driver</p>
            <p className="text-xl font-bold">{categoryData[0]?.name || 'N/A'}</p>
          </div>
        </div>
        <div className="glass-card p-6 flex items-center gap-4">
          <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
            <TrendingUp size={24} />
          </div>
          <div>
            <p className="text-xs text-white/40 uppercase font-bold tracking-wider">Total Audited Spend</p>
            <p className="text-xl font-bold">{formatCurrency(audits.reduce((sum, a) => sum + a.details.invoice.total, 0))}</p>
          </div>
        </div>
        <div className="glass-card p-6 flex items-center gap-4">
          <div className="w-12 h-12 bg-gold/10 rounded-xl flex items-center justify-center text-gold">
            <Globe size={24} />
          </div>
          <div>
            <p className="text-xs text-white/40 uppercase font-bold tracking-wider">Active Trade Lanes</p>
            <p className="text-xl font-bold">{new Set(audits.map(a => `${a.loading_port}-${a.discharge_port}`)).size}</p>
          </div>
        </div>
      </div>

      <div className="glass-card p-6 space-y-6">
        <h3 className="font-bold text-lg">Spend by Category</h3>
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={categoryData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" horizontal={false} />
              <XAxis type="number" stroke="#ffffff40" fontSize={12} />
              <YAxis dataKey="name" type="category" stroke="#ffffff40" fontSize={10} width={120} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#111118', border: '1px solid #ffffff10' }}
                formatter={(value: number) => formatCurrency(value)}
              />
              <Bar dataKey="value" fill="#00C2FF" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="glass-card p-6 space-y-6">
        <h3 className="font-bold text-lg">Spend & Savings Trend</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
              <XAxis dataKey="date" stroke="#ffffff40" fontSize={12} />
              <YAxis stroke="#ffffff40" fontSize={12} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#111118', border: '1px solid #ffffff10' }}
              />
              <Line type="monotone" dataKey="cost" stroke="#00C2FF" strokeWidth={2} dot={false} name="Invoice Total" />
              <Line type="monotone" dataKey="savings" stroke="#00F5A0" strokeWidth={2} dot={false} name="Potential Savings" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
