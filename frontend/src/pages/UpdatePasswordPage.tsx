import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Додаткова перевірка: якщо юзер зайшов сюди без токена відновлення,
  // його краще перенаправити на логін
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate('/login');
      }
    });
  }, [navigate]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      return setError('Паролі не співпадають');
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({
      password: password
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      // Пароль успішно оновлено, перекидаємо в робочу зону
      navigate('/');
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={{ marginBottom: '0.5rem' }}>Встановіть новий пароль</h1>
        
        {error && <div style={styles.error}>{error}</div>}

        <form onSubmit={handleUpdate}>
          <label style={styles.label}>Новий пароль</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Мінімум 6 символів"
            required
            minLength={6}
            style={styles.input}
          />

          <label style={styles.label}>Підтвердіть новий пароль</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            style={styles.input}
          />

          <button type="submit" disabled={loading} style={styles.button}>
            {loading ? 'Оновлення...' : 'Зберегти новий пароль'}
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
  error: { background: '#fee2e2', color: '#dc2626', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.9rem' },
};