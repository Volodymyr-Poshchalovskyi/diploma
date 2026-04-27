// src/components/share/ShareButton.tsx
import { useState } from 'react';
import { Link2, Loader2, Check, Copy } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { ComputeResult, Layer } from '../../types';

interface Props {
  result: ComputeResult | null;
  layers: Layer[];
  projectName: string;
  settings: { mode: string; polarization: string; angleDeg: number; freqStart: number; freqStop: number };
}

export default function ShareButton({ result, layers, projectName, settings }: Props) {
  const [loading,  setLoading]  = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [copied,   setCopied]   = useState(false);
  const [toast,    setToast]    = useState('');

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const generate = async () => {
    if (!result) return showToast('Run a calculation first');
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const res = await fetch(`${API_URL}/api/share`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ project_name: projectName, layers, settings, result }),
      });

      if (!res.ok) throw new Error(await res.text());
      const { share_id } = await res.json();
      const url = `${window.location.origin}/share/${share_id}`;
      setShareUrl(url);
      window.dispatchEvent(new CustomEvent('share-created'));
    } catch (e) {
      showToast('Share failed. Check console.');
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const copy = async () => {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ position: 'relative' }}>
      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: '1.5rem', right: '1.5rem', zIndex: 9999,
          background: '#1f2937', color: '#fff', padding: '0.65rem 1rem',
          borderRadius: '8px', fontSize: '0.82rem', boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
          animation: 'fadeIn 0.2s ease',
        }}>
          {toast}
        </div>
      )}

      {!shareUrl ? (
        <button
          onClick={generate}
          disabled={loading || !result}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: '0.4rem', padding: '0.55rem', border: '1px solid #e5e7eb', borderRadius: '8px',
            background: result ? '#fff' : '#f9f9f9', color: result ? '#374151' : '#bbb',
            cursor: result ? 'pointer' : 'not-allowed', fontSize: '0.85rem', fontWeight: 500,
          }}
        >
          {loading ? <Loader2 size={14} style={{ animation: 'spin 0.8s linear infinite' }} /> : <Link2 size={14} />}
          {loading ? 'Generating link...' : 'Create share link'}
        </button>
      ) : (
        <div style={{ display: 'flex', gap: '0.4rem', width: '100%', boxSizing: 'border-box' }}>
          <input
            readOnly
            value={shareUrl}
            style={{
              flex: 1, minWidth: 0, padding: '0.45rem 0.6rem', border: '1px solid #e5e7eb',
              borderRadius: '6px', fontSize: '0.75rem', color: '#374151',
              background: '#f9fafb', outline: 'none', boxSizing: 'border-box'
            }}
          />
          <button
            onClick={copy}
            style={{
              flexShrink: 0, padding: '0.45rem 0.65rem', border: '1px solid #e5e7eb', borderRadius: '6px',
              background: copied ? '#f0fdf4' : '#fff', color: copied ? '#166534' : '#374151',
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem',
              fontSize: '0.75rem', fontWeight: 500,
            }}
          >
            {copied ? <Check size={13} /> : <Copy size={13} />}
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
      )}
    </div>
  );
}