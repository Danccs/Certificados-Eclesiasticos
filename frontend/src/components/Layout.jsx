import React from 'react';
import { LayoutDashboard, FilePlus, Search, LogOut, CheckCircle2 } from 'lucide-react';

const Layout = ({ children, currentView, setView, user, onLogout }) => {
  return (
    <div className="app-container">
      {/* Sidebar de Navegación */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="church-logo-placeholder">†</div>
          <div>
            <h1 className="sidebar-title">Fe Registral</h1>
            <span className="sidebar-subtitle">Certificados</span>
          </div>
        </div>

        <nav style={{ flex: 1 }}>
          <ul className="sidebar-menu">
            <li>
              <button 
                onClick={() => setView('dashboard')}
                className={`sidebar-item ${currentView === 'dashboard' ? 'active' : ''}`}
                style={{ width: '100%', border: 'none', background: 'none', textAlign: 'left' }}
              >
                <LayoutDashboard size={20} />
                <span>Dashboard</span>
              </button>
            </li>
            <li>
              <button 
                onClick={() => setView('new-certificate')}
                className={`sidebar-item ${currentView === 'new-certificate' ? 'active' : ''}`}
                style={{ width: '100%', border: 'none', background: 'none', textAlign: 'left' }}
              >
                <FilePlus size={20} />
                <span>Nuevo Registro</span>
              </button>
            </li>
            <li>
              <button 
                onClick={() => setView('search')}
                className={`sidebar-item ${currentView === 'search' ? 'active' : ''}`}
                style={{ width: '100%', border: 'none', background: 'none', textAlign: 'left' }}
              >
                <Search size={20} />
                <span>Buscar Registros</span>
              </button>
            </li>
            <li>
              <button 
                onClick={() => setView('validate')}
                className={`sidebar-item ${currentView === 'validate' ? 'active' : ''}`}
                style={{ width: '100%', border: 'none', background: 'none', textAlign: 'left' }}
              >
                <CheckCircle2 size={20} />
                <span>Validador Público</span>
              </button>
            </li>
          </ul>
        </nav>

        {/* Footer del Sidebar con info de usuario */}
        {user && (
          <div className="sidebar-footer">
            <div className="user-info-box">
              <div className="user-avatar">
                {user.username ? user.username.substring(0, 2).toUpperCase() : 'SE'}
              </div>
              <div>
                <div className="user-name-text">{user.username}</div>
                <div className="user-role-text">{user.role}</div>
              </div>
            </div>
            <button className="btn-logout" onClick={onLogout}>
              <LogOut size={16} />
              <span>Cerrar Sesión</span>
            </button>
          </div>
        )}
      </aside>

      {/* Área Principal de Contenido */}
      <main className="main-content">
        {children}
      </main>
    </div>
  );
};

export default Layout;
