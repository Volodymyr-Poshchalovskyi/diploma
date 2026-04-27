import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function AuthCallbackPage() {
  const navigate = useNavigate();

  useEffect(() => {
    // Supabase handles the token from URL hash automatically
    supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') navigate('/');
    });
  }, [navigate]);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p>Signing you in...</p>
    </div>
  );
}