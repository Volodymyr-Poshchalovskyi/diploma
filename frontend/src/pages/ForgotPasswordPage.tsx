import { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      // URL, куди юзер потрапить після кліку в листі
      redirectTo: 'http://localhost:5173/update-password',
    });

    if (error) {
      setError(error.message);
    } else {
      setMessage('Інструкції з відновлення надіслано на вашу пошту.');
      setEmail('');
    }
    setLoading(false);
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={{ marginBottom: '0.5rem' }}>Відновлення пароля</h1>
        <p style={{ color: '#666', marginBottom: '2rem', fontSize: '0.9rem' }}>
          Введіть email, і ми надішлемо посилання для скидання пароля.
        </p>

        {error && <div style={styles.error}>{error}</div>}
        {message && <div style={styles.success}>{message}</div>}

        <form onSubmit={handleReset}>
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
            {loading ? 'Надсилання...' : 'Надіслати посилання'}
          </button>
        </form>

        <p style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.9rem' }}>
          Згадали пароль? <Link to="/login" style={{ color: '#01696f' }}>Повернутися до входу</Link>
        </p>
      </div>
    </div>
  );
}

// Використовуємо ті ж стилі, що й для логіну (згодом ми їх оптимізуємо)
const styles: Record<string, React.CSSProperties> = {
  container: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f5f5' },
  card: { background: '#fff', padding: '2.5rem', borderRadius: '12px', boxShadow: '0 4px 24px rgba(0,0,0,0.08)', width: '100%', maxWidth: '400px' },
  label: { display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: '0.9rem' },
  input: { width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '8px', fontSize: '1rem', marginBottom: '1rem', boxSizing: 'border-box' },
  button: { width: '100%', padding: '0.75rem', background: '#01696f', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '1rem', cursor: 'pointer', fontWeight: 600 },
  error: { background: '#fee2e2', color: '#dc2626', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.9rem' },
  success: { background: '#d1fae5', color: '#059669', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.9rem' },
};