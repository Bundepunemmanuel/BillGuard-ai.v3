import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, FileText, AlertCircle, Loader2, CheckCircle2, FileSearch } from 'lucide-react';
import { extractTextFromPdf } from './pdf';
import { performAudit } from './ai';
import { supabase } from './supabase';
import { useAuth } from './AuthContext';
import { cn } from './utils';

export default function Audit() {
  const { user, profile, refreshProfile } = useAuth();
  const [quoteFile, setQuoteFile] = useState<File | null>(null);
  const [invoiceFile, setInvoiceFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const quoteInputRef = useRef<HTMLInputElement>(null);
  const invoiceInputRef = useRef<HTMLInputElement>(null);

  const handleAudit = async () => {
    if (!quoteFile || !invoiceFile) return;
    if (profile && profile.audits_used >= profile.audits_limit) {
      setError('Audit limit reached. Please upgrade your plan.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      setStatus('Extracting text from PDFs...');
      const [quoteText, invoiceText] = await Promise.all([
        extractTextFromPdf(quoteFile),
        extractTextFromPdf(invoiceFile)
      ]);

      setStatus('AI is analyzing documents...');
      const result = await performAudit(quoteText, invoiceText);

      setStatus('Saving results...');
      const { data, error: saveError } = await supabase
        .from('audits')
        .insert({
          user_id: user?.id,
          ...result
        })
        .select()
        .single();

      if (saveError) throw saveError;

      // Update usage
      await supabase
        .from('users')
        .update({ audits_used: (profile?.audits_used || 0) + 1 })
        .eq('id', user?.id);

      await refreshProfile();
      navigate(`/results/${data.id}`);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An error occurred during the audit.');
    } finally {
      setLoading(false);
    }
  };

  const FileDrop = ({ 
    file, 
    setFile, 
    label, 
    inputRef 
  }: { 
    file: File | null, 
    setFile: (f: File | null) => void, 
    label: string,
    inputRef: React.RefObject<HTMLInputElement | null>
  }) => (
    <div 
      onClick={() => inputRef.current?.click()}
      className={cn(
        "glass-card p-8 flex flex-col items-center justify-center gap-4 cursor-pointer transition-all hover:border-primary/40 group",
        file ? "border-primary/40 bg-primary/5" : "border-dashed"
      )}
    >
      <input 
        type="file" 
        ref={inputRef} 
        className="hidden" 
        accept=".pdf"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
      />
      <div className={cn(
        "w-16 h-16 rounded-full flex items-center justify-center transition-all",
        file ? "bg-primary text-background" : "bg-white/5 text-white/40 group-hover:text-primary"
      )}>
        {file ? <CheckCircle2 size={32} /> : <Upload size={32} />}
      </div>
      <div className="text-center">
        <p className="font-bold text-lg">{file ? file.name : label}</p>
        <p className="text-sm text-white/40">{file ? 'Click to change' : 'Drag & drop or click to upload PDF'}</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">New Audit</h1>
          <p className="text-white/60">Upload your quote and invoice to detect discrepancies.</p>
        </div>
        <div className="bg-surface px-4 py-2 rounded-lg border border-white/10 flex items-center gap-3">
          <div className="text-right">
            <p className="text-xs text-white/40 uppercase font-bold tracking-wider">Usage</p>
            <p className="font-mono text-primary">{profile?.audits_used} / {profile?.audits_limit}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <FileText className="text-primary" size={20} />
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-danger/10 border border-danger/20 text-danger rounded-xl flex items-center gap-3">
          <AlertCircle size={20} />
          <p className="font-medium">{error}</p>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        <FileDrop 
          file={quoteFile} 
          setFile={setQuoteFile} 
          label="Freight Quote PDF" 
          inputRef={quoteInputRef}
        />
        <FileDrop 
          file={invoiceFile} 
          setFile={setInvoiceFile} 
          label="Freight Invoice PDF" 
          inputRef={invoiceInputRef}
        />
      </div>

      <div className="flex justify-center pt-4">
        <button
          onClick={handleAudit}
          disabled={!quoteFile || !invoiceFile || loading}
          className="btn-primary px-12 py-4 text-lg flex items-center gap-3"
        >
          {loading ? (
            <>
              <Loader2 className="animate-spin" size={24} />
              <span>{status}</span>
            </>
          ) : (
            <>
              <FileSearch size={24} />
              <span>Start Audit</span>
            </>
          )}
        </button>
      </div>

      <div className="grid md:grid-cols-3 gap-6 pt-8">
        {[
          { title: 'Detect Overcharges', desc: 'Instantly find line items that exceed your quoted rates.' },
          { title: 'Verify Surcharges', desc: 'Check if fuel, congestion, and other surcharges are valid.' },
          { title: 'Port Validation', desc: 'Ensure loading and discharge ports match your agreement.' },
        ].map((feature, i) => (
          <div key={i} className="glass-card p-6 space-y-2">
            <h3 className="font-bold text-primary">{feature.title}</h3>
            <p className="text-sm text-white/60">{feature.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
