import { useState } from 'react';
import { supabase } from '../lib/supabase';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: 'http://localhost:5173/auth/callback' },
    });
    if (error) alert(error.message);
    else setSent(true);
    setLoading(false);
  };

  if (sent) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <h2>Check your email ✉️</h2>
          <p>We sent a magic link to <strong>{email}</strong></p>
          <p style={{ color: '#666', fontSize: '0.9rem' }}>Click the link in the email to sign in.</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={{ marginBottom: '0.5rem' }}>Composite EM</h1>
        <p style={{ color: '#666', marginBottom: '2rem' }}>
          Electromagnetic modeling of multilayer composites
        </p>
        <form onSubmit={handleLogin}>
          <label style={styles.label}>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            style={styles.input}
          />
          <button type="submit" disabled={loading} style={styles.button}>
            {loading ? 'Sending...' : 'Send magic link'}
          </button>
        </form>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f5f5' },
  card: { background: '#fff', padding: '2.5rem', borderRadius: '12px', boxShadow: '0 4px 24px rgba(0,0,0,0.08)', width: '100%', maxWidth: '400px' },
  label: { display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: '0.9rem' },
  input: { width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '8px', fontSize: '1rem', marginBottom: '1rem', boxSizing: 'border-box' },
  button: { width: '100%', padding: '0.75rem', background: '#01696f', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '1rem', cursor: 'pointer', fontWeight: 600 },
};