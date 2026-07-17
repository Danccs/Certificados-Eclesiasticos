import React, { useState, useEffect } from 'react';
import { fetchAPI } from './utils';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import CertificateForm from './components/CertificateForm';
import CertificateSearch from './components/CertificateSearch';
import CertificateValidator from './components/CertificateValidator';
import LoadingSpinner from './components/LoadingSpinner';
import { ShieldAlert, User, Lock, Sparkles, Sun, Moon, AlertTriangle } from 'lucide-react';

function App() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  
  // Theme toggling state
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('church_theme') || 'dark';
  });

  // Login states
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // Validación pública desde URL
  const [validateFolio, setValidateFolio] = useState(null);

  // Efecto para sincronizar el tema visual con el HTML
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('church_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Verificar parámetros de validación en URL y perfil en localStorage al iniciar
  useEffect(() => {
    const checkAuthAndParams = async () => {
      // Verificar si hay folio en la URL (ej: ?validate=BAU-2026-0001)
      const queryParams = new URLSearchParams(window.location.search);
      const validateParam = queryParams.get('validate');
      if (validateParam) {
        setValidateFolio(validateParam);
        setLoading(false);
        return;
      }

      // Si no es validación pública, verificar token
      const token = localStorage.getItem('church_token');
      if (token) {
        try {
          const userData = await fetchAPI('/auth/me');
          setUser(userData);
          setView('dashboard');
        } catch (err) {
          console.error('Sesión inválida o expirada:', err);
          localStorage.removeItem('church_token');
        }
      }
      setLoading(false);
    };

    checkAuthAndParams();
  }, []);

  // Control de Login
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError('');

    try {
      const response = await fetch(`${API_BASE_URL_LOCAL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error al iniciar sesión');
      }

      localStorage.setItem('church_token', data.token);
      setUser(data);
      setView('dashboard');
      setUsername('');
      setPassword('');
    } catch (err) {
      console.error(err);
      setLoginError(err.message || 'Error de conexión con el servidor.');
    } finally {
      setLoginLoading(false);
    }
  };

  const API_BASE_URL_LOCAL = 'http://localhost:5000/api';

  // Control de Logout
  const handleLogout = () => {
    localStorage.removeItem('church_token');
    setUser(null);
    setView('dashboard'); // Volver a vista por defecto
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--color-bg-dark)' }}>
        <LoadingSpinner />
      </div>
    );
  }

  // Elemento común del Toggle de Tema (Flotante en la esquina superior derecha)
  const ThemeToggleWidget = (
    <div className="theme-toggle-header">
      <button className="btn-theme-toggle" onClick={toggleTheme} aria-label="Cambiar tema">
        {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
        <span>{theme === 'dark' ? 'Modo Claro' : 'Modo Oscuro'}</span>
      </button>
    </div>
  );

  // --- ESCENARIO A: Vista de Validación Pública (Sin sidebar, acceso total de fieles/QR) ---
  if (validateFolio) {
    return (
      <div className="public-validator-container">
        {ThemeToggleWidget}
        
        <div className="public-logo-header">
          <div className="public-logo">†</div>
          <h1 className="public-title">Iglesia Evangélica Nacional</h1>
          <p className="public-subtitle">Portal Oficial de Validación Registral</p>
        </div>
        
        <div style={{ width: '100%', maxWidth: '650px' }}>
          <CertificateValidator initialFolio={validateFolio} />
        </div>

        <div style={{ marginTop: '3rem', textAlign: 'center', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
          <p>© {new Date().getFullYear()} Iglesia Evangélica Nacional - Todos los derechos reservados.</p>
          <p style={{ marginTop: '0.5rem' }}>
            <button 
              onClick={() => {
                // Eliminar parámetro de búsqueda de la URL sin recargar para ir a login/dashboard
                window.history.pushState({}, document.title, window.location.pathname);
                setValidateFolio(null);
                const token = localStorage.getItem('church_token');
                if (token && user) {
                  setView('dashboard');
                }
              }}
              style={{ background: 'none', border: 'none', color: 'var(--color-gold-dark)', cursor: 'pointer', textDecoration: 'underline', fontWeight: '600' }}
            >
              Ir a la Plataforma de Gestión
            </button>
          </p>
        </div>
      </div>
    );
  }

  // --- ESCENARIO B: Pantalla de Login (Si no hay usuario autenticado) ---
  if (!user) {
    return (
      <div className="login-container">
        {ThemeToggleWidget}
        
        <div className="login-card card fade-in">
          <div className="login-header-icon">
            <Lock size={26} style={{ color: 'var(--color-gold)' }} />
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--color-text-light)', marginBottom: '0.5rem' }}>Fe Registral</h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: '2rem' }}>
            Plataforma de Gestión y Emisión Eclesiástica
          </p>

          {loginError && (
            <div className="alert-toast alert-toast-error" style={{ justifyContent: 'center' }}>
              <ShieldAlert size={18} />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleLogin} style={{ textAlign: 'left' }}>
            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
              <label className="form-label">Usuario</label>
              <div style={{ position: 'relative' }}>
                <input 
                  type="text" 
                  value={username} 
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Ingrese su usuario" 
                  className="input-field"
                  style={{ paddingLeft: '2.5rem' }}
                  required
                />
                <User size={16} style={{ position: 'absolute', left: '12px', top: '14px', color: 'var(--color-text-muted)' }} />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '2rem' }}>
              <label className="form-label">Contraseña</label>
              <div style={{ position: 'relative' }}>
                <input 
                  type="password" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••" 
                  className="input-field"
                  style={{ paddingLeft: '2.5rem' }}
                  required
                />
                <Lock size={16} style={{ position: 'absolute', left: '12px', top: '14px', color: 'var(--color-text-muted)' }} />
              </div>
            </div>

            <button 
              type="submit" 
              className="btn btn-gold pulse-gold" 
              disabled={loginLoading}
              style={{ width: '100%', padding: '0.9rem' }}
            >
              {loginLoading ? (
                <span className="spinner" style={{ width: '18px', height: '18px', borderWidth: '2px' }}></span>
              ) : (
                <>
                  <Sparkles size={18} />
                  <span>Ingresar como Secretario</span>
                </>
              )}
            </button>
          </form>

          {/* Acceso directo al Validador Público */}
          <div style={{ borderTop: '1px solid var(--color-divider)', paddingTop: '1.5rem', marginTop: '2rem' }}>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
              ¿Desea validar un certificado impreso?{' '}
              <button 
                onClick={() => setValidateFolio('')}
                style={{ background: 'none', border: 'none', color: 'var(--color-primary-light)', cursor: 'pointer', textDecoration: 'underline', fontWeight: '600' }}
              >
                Abrir Validador Público
              </button>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // --- ESCENARIO C: Plataforma de Gestión (Usuario autenticado con rol Secretario Local) ---
  return (
    <div style={{ position: 'relative', minHeight: '100vh', backgroundColor: 'var(--color-bg-dark)' }}>
      {ThemeToggleWidget}
      
      <Layout currentView={view} setView={setView} user={user} onLogout={handleLogout}>
        {view === 'dashboard' && <Dashboard />}
        {view === 'new-certificate' && (
          <CertificateForm onCreationSuccess={() => setView('search')} />
        )}
        {view === 'search' && <CertificateSearch />}
        {view === 'validate' && (
          <div style={{ maxWidth: '650px', margin: '0 auto' }}>
            <CertificateValidator />
          </div>
        )}
      </Layout>
    </div>
  );
}

export default App;
