import React, { useEffect, useState } from 'react';
import { fetchAPI, downloadCertificatePDF } from '../utils';
import LoadingSpinner from './LoadingSpinner';
import { Search, Download, ExternalLink, Calendar, User, SlidersHorizontal, AlertCircle } from 'lucide-react';

const CertificateSearch = () => {
  const [certs, setCerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [downloadingId, setDownloadingId] = useState(null);

  // Estados de Filtros
  const [search, setSearch] = useState('');
  const [type, setType] = useState('');
  const [dateStart, setDateStart] = useState('');
  const [dateEnd, setDateEnd] = useState('');
  const [municipality, setMunicipality] = useState('');
  const [pastor, setPastor] = useState('');
  
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  const loadCertificates = async () => {
    setLoading(true);
    setError('');
    try {
      // Construir query string de filtros
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (type) params.append('type', type);
      if (dateStart) params.append('dateStart', dateStart);
      if (dateEnd) params.append('dateEnd', dateEnd);
      if (municipality) params.append('municipality', municipality);
      if (pastor) params.append('pastor', pastor);

      const queryString = params.toString() ? `?${params.toString()}` : '';
      const data = await fetchAPI(`/certificates${queryString}`);
      setCerts(data);
    } catch (err) {
      console.error(err);
      setError('Error al consultar los registros. Por favor reintente.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCertificates();
  }, [type]); // Recargar automáticamente cuando cambia el tipo principal

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadCertificates();
  };

  const handleClearFilters = () => {
    setSearch('');
    setType('');
    setDateStart('');
    setDateEnd('');
    setMunicipality('');
    setPastor('');
    // Forzar recarga con filtros vacíos
    setTimeout(() => {
      loadCertificates();
    }, 0);
  };

  const handleDownload = async (id, folio) => {
    setDownloadingId(id);
    try {
      await downloadCertificatePDF(id, folio);
    } catch (err) {
      alert(err.message || 'No se pudo descargar el certificado.');
    } finally {
      setDownloadingId(null);
    }
  };

  // Formato para tabla
  const formatDateString = (dateStr) => {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  };

  return (
    <div className="fade-in">
      {/* Cabecera */}
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.8rem', fontWeight: '700', color: '#fff' }}>Localización de Certificados</h2>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.95rem' }}>Buscador interno centralizado de registros oficiales</p>
      </div>

      {/* Controles de Búsqueda */}
      <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
        <form onSubmit={handleSearchSubmit}>
          <div className="search-controls">
            
            {/* Campo de búsqueda principal */}
            <div className="form-group">
              <label className="form-label">Búsqueda rápida</label>
              <div style={{ position: 'relative' }}>
                <input 
                  type="text" 
                  value={search} 
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Nombre de fiel, cónyuge o folio..." 
                  className="input-field"
                  style={{ paddingLeft: '2.5rem' }}
                />
                <Search size={18} style={{ position: 'absolute', left: '12px', top: '13px', color: 'var(--color-text-muted)' }} />
              </div>
            </div>

            {/* Filtro de Tipo */}
            <div className="form-group">
              <label className="form-label">Tipo de Evento</label>
              <select 
                value={type} 
                onChange={(e) => setType(e.target.value)}
                className="input-field"
              >
                <option value="">Todos los eventos</option>
                <option value="bautizo">Bautizos</option>
                <option value="matrimonio">Matrimonios</option>
                <option value="presentacion">Presentaciones</option>
              </select>
            </div>

            {/* Botones de acción de filtros */}
            <div style={{ display: 'flex', gap: '0.5rem', height: '44px', marginTop: '1.3rem' }}>
              <button type="submit" className="btn btn-primary" style={{ padding: '0 1.25rem' }}>
                <span>Buscar</span>
              </button>
              <button 
                type="button" 
                className={`btn btn-secondary ${showAdvancedFilters ? 'active' : ''}`}
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                style={{ padding: '0 1rem' }}
                title="Filtros avanzados"
              >
                <SlidersHorizontal size={18} />
              </button>
              {(search || type || dateStart || dateEnd || municipality || pastor) && (
                <button type="button" className="btn btn-secondary" onClick={handleClearFilters} style={{ padding: '0 1rem' }}>
                  <span>Limpiar</span>
                </button>
              )}
            </div>

          </div>

          {/* Filtros avanzados colapsables */}
          {showAdvancedFilters && (
            <div className="form-grid fade-in" style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1.5rem', marginTop: '1rem' }}>
              
              <div className="form-group">
                <label className="form-label">Desde (Fecha del evento)</label>
                <input 
                  type="date" 
                  value={dateStart} 
                  onChange={(e) => setDateStart(e.target.value)} 
                  className="input-field" 
                />
              </div>

              <div className="form-group">
                <label className="form-label">Hasta (Fecha del evento)</label>
                <input 
                  type="date" 
                  value={dateEnd} 
                  onChange={(e) => setDateEnd(e.target.value)} 
                  className="input-field" 
                />
              </div>

              <div className="form-group">
                <label className="form-label">Municipio</label>
                <input 
                  type="text" 
                  value={municipality} 
                  onChange={(e) => setMunicipality(e.target.value)} 
                  placeholder="Ej: San Salvador" 
                  className="input-field" 
                />
              </div>

              <div className="form-group">
                <label className="form-label">Pastor Oficiante</label>
                <input 
                  type="text" 
                  value={pastor} 
                  onChange={(e) => setPastor(e.target.value)} 
                  placeholder="Ej: Alejandro" 
                  className="input-field" 
                />
              </div>

            </div>
          )}
        </form>
      </div>

      {/* Resultados de la Consulta */}
      <div className="card">
        {error && <div className="alert-toast alert-toast-error"><AlertCircle size={18} /> {error}</div>}
        
        {loading ? (
          <LoadingSpinner />
        ) : certs.length > 0 ? (
          <div className="results-table-container">
            <table className="results-table">
              <thead>
                <tr>
                  <th>Folio</th>
                  <th>Tipo</th>
                  <th>Fecha Evento</th>
                  <th>Fiel(es)</th>
                  <th>Iglesia / Pastor</th>
                  <th>Lugar</th>
                  <th style={{ textAlign: 'right' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {certs.map((c) => (
                  <tr key={c.id}>
                    <td style={{ fontWeight: 'bold', color: 'var(--color-gold)' }}>{c.folio}</td>
                    <td>
                      <span className={`badge badge-${c.type}`}>
                        {c.type === 'presentacion' ? 'Presentación' : c.type}
                      </span>
                    </td>
                    <td>{formatDateString(c.event_date)}</td>
                    <td style={{ fontWeight: '600' }}>
                      {c.type === 'matrimonio' ? (
                        <div>
                          <div>{c.name_fiel_1}</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>y {c.name_fiel_2}</div>
                        </div>
                      ) : (
                        c.name_fiel_1
                      )}
                    </td>
                    <td>
                      <div>{c.church}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>{c.pastor}</div>
                    </td>
                    <td>
                      <div>{c.municipality}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{c.state}</div>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div className="actions-cell" style={{ justifyContent: 'flex-end' }}>
                        
                        {/* Descarga de PDF de forma segura */}
                        <button 
                          className="btn btn-icon" 
                          onClick={() => handleDownload(c.id, c.folio)}
                          disabled={downloadingId === c.id}
                          title="Descargar PDF Oficial"
                        >
                          {downloadingId === c.id ? (
                            <span className="spinner" style={{ width: '14px', height: '14px', borderWidth: '2px' }}></span>
                          ) : (
                            <Download size={16} />
                          )}
                        </button>

                        {/* Enlace para validar en pestaña nueva */}
                        <a 
                          href={`/?validate=${c.folio}`} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="btn btn-icon"
                          title="Ver en Validador Público"
                        >
                          <ExternalLink size={16} />
                        </a>

                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--color-text-muted)' }}>
            <Calendar size={48} style={{ marginBottom: '1rem', opacity: 0.3 }} />
            <p style={{ fontSize: '1.1rem', fontWeight: '500' }}>No se encontraron certificados</p>
            <p style={{ fontSize: '0.9rem' }}>Intente ajustando los filtros de búsqueda o registre un nuevo documento.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CertificateSearch;
