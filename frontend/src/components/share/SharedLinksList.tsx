import { useEffect, useState } from 'react';
import { Link2, Copy, Check, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface SharedLink {
  share_id: string;
  project_name: string;
  created_at: string;
}

export default function SharedLinksList() {
  const [links, setLinks]       = useState<SharedLink[]>([]);
  const [open, setOpen]         = useState(false);
  const [copiedId, setCopiedId] = useState('');
  const [loading, setLoading]   = useState(false);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('shared_results')
      .select('share_id, project_name, created_at')
      .order('created_at', { ascending: false })
      .limit(20);
    setLinks(data || []);
    setLoading(false);
  };

  useEffect(() => {
    if (open) load();
  }, [open]);

  // Re-load when a new share is created
  useEffect(() => {
    const handler = () => { if (open) load(); };
    window.addEventListener('share-created', handler);
    return () => window.removeEventListener('share-created', handler);
  }, [open]);

  const copy = async (shareId: string) => {
    const url = `${window.location.origin}/share/${shareId}`;
    await navigator.clipboard.writeText(url);
    setCopiedId(shareId);
    setTimeout(() => setCopiedId(''), 2000);
  };

  const remove = async (shareId: string) => {
    await supabase.from('shared_results').delete().eq('share_id', shareId);
    setLinks(l => l.filter(x => x.share_id !== shareId));
  };

  return (
    <div style={{ position: 'relative', marginTop: '0.5rem' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0.4rem 0.5rem', border: '1px solid #e5e7eb', borderRadius: '6px',
          background: '#f9fafb', color: '#6b7280', cursor: 'pointer', fontSize: '0.78rem',
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <Link2 size={12} /> My shared links {links.length > 0 && !open ? `(${links.length})` : ''}
        </span>
        {open ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
      </button>

      {open && (
        <div style={{
          position: 'absolute',
          bottom: 'calc(100% + 4px)',
          left: 0,
          right: 0,
          zIndex: 100,
          border: '1px solid #e5e7eb', borderRadius: '6px',
          background: '#fff', maxHeight: '200px', overflowY: 'auto',
          boxShadow: '0 -4px 16px rgba(0,0,0,0.1)',
        }}>
          {loading && (
            <p style={{ padding: '0.75rem', fontSize: '0.75rem', color: '#9ca3af', textAlign: 'center' }}>
              Loading...
            </p>
          )}
          {!loading && links.length === 0 && (
            <p style={{ padding: '0.75rem', fontSize: '0.75rem', color: '#9ca3af', textAlign: 'center' }}>
              No shared links yet
            </p>
          )}
          {links.map(link => (
            <div key={link.share_id} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '0.45rem 0.6rem', borderBottom: '1px solid #f3f4f6',
              gap: '0.5rem',
            }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {link.project_name || 'Untitled'}
                </div>
                <div style={{ fontSize: '0.68rem', color: '#9ca3af' }}>
                  {new Date(link.created_at).toLocaleDateString()} · /share/{link.share_id.slice(0, 8)}...
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.25rem', flexShrink: 0 }}>
                <button
                  onClick={() => copy(link.share_id)}
                  title="Copy link"
                  style={{
                    padding: '0.25rem', border: '1px solid #e5e7eb', borderRadius: '4px',
                    background: copiedId === link.share_id ? '#f0fdf4' : '#fff',
                    color: copiedId === link.share_id ? '#166534' : '#6b7280',
                    cursor: 'pointer', display: 'flex', alignItems: 'center',
                  }}
                >
                  {copiedId === link.share_id ? <Check size={11} /> : <Copy size={11} />}
                </button>
                <button
                  onClick={() => remove(link.share_id)}
                  title="Delete"
                  style={{
                    padding: '0.25rem', border: '1px solid #fee2e2', borderRadius: '4px',
                    background: '#fff', color: '#ef4444', cursor: 'pointer',
                    display: 'flex', alignItems: 'center',
                  }}
                >
                  <Trash2 size={11} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}