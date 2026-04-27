import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { LogOut, Zap, Layers, FlaskConical, FolderOpen } from 'lucide-react';
import { useProjectStore } from '../../store/useProjectStore';

// Імпортуємо панелі експорту
import ExportPanel from '../export/ExportPanel';

export default function MainLayout() {
  const { user, signOut } = useAuth();
  
  // Дістаємо всі дані для експорту зі стора
  const { result, sweepResult, layers, projectName, settings } = useProjectStore();

  return (
    <div style={styles.root}>
      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <Zap size={20} color="#01696f" strokeWidth={2.5} />
          <span style={styles.logoText}>Composite EM</span>
        </div>
        <div style={styles.headerRight}>
          <span style={styles.email}>{user?.email}</span>
          <button onClick={signOut} style={styles.signOutBtn}>
            <LogOut size={14} /> Вийти
          </button>
        </div>
      </header>

      <div style={styles.body}>
        <aside style={styles.sidebar}>
          {/* Верхня частина: Навігація */}
          <nav style={styles.nav}>
            <NavLink to="/workspace" style={({ isActive }) => ({ ...styles.navItem, ...(isActive ? styles.navItemActive : {}) })}>
              <Layers size={18} /><span>Робоча область</span>
            </NavLink>
            <NavLink to="/materials" style={({ isActive }) => ({ ...styles.navItem, ...(isActive ? styles.navItemActive : {}) })}>
              <FlaskConical size={18} /><span>База матеріалів</span>
            </NavLink>
            <NavLink to="/projects" style={({ isActive }) => ({ ...styles.navItem, ...(isActive ? styles.navItemActive : {}) })}>
              <FolderOpen size={18} /><span>Мої проекти</span>
            </NavLink>
          </nav>

          {/* Нижня частина: Експорт/Імпорт (притиснута до низу) */}
          <div style={styles.sidebarBottom}>
            <ExportPanel 
              result={result} 
              sweepResult={sweepResult} 
              layers={layers} 
              projectName={projectName} 
              settings={settings} 
            />
          </div>
        </aside>

        <main style={styles.main}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  root: { display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--bg-page)' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 1.5rem', height: '56px', background: 'var(--bg-panel)', borderBottom: '1px solid var(--border-color)', flexShrink: 0, zIndex: 10 },
  headerLeft: { display: 'flex', alignItems: 'center', gap: '0.5rem' },
  logoText: { fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-main)' },
  headerRight: { display: 'flex', alignItems: 'center', gap: '1rem' },
  email: { fontSize: '0.85rem', color: 'var(--text-muted)' },
  signOutBtn: { display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.4rem 0.8rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', background: '#fff', cursor: 'pointer', fontSize: '0.85rem', color: 'var(--text-main)' },
  body: { display: 'flex', flex: 1, overflow: 'hidden' },
  
  // Зміни в сайдбарі: додано flex-direction column та space-between
  sidebar: { width: '260px', background: 'var(--bg-panel)', borderRight: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' },
  nav: { display: 'flex', flexDirection: 'column', padding: '1rem 0.5rem', gap: '0.25rem' },
  navItem: { display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.6rem 1rem', borderRadius: 'var(--radius-md)', textDecoration: 'none', color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 500, transition: 'all 0.2s' },
  navItemActive: { background: '#f0fdf4', color: 'var(--primary)' },
  
  // Контейнер для експорту
  sidebarBottom: { padding: '1rem', borderTop: '1px solid var(--border-color)', background: '#f9fafb', overflowY: 'auto' },
  main: { flex: 1, overflowY: 'auto', padding: 'var(--space-lg)' }
};