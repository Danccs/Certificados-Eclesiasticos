import React, { useEffect, useState } from 'react';
import { fetchAPI, downloadCertificatePDF } from '../utils';
import LoadingSpinner from './LoadingSpinner';
import { 
  FolderGit2, 
  Droplet, 
  Heart, 
  UserPlus, 
  Search as SearchIcon, 
  Eye, 
  FileText, 
  AlertCircle, 
  AlertTriangle, 
  CheckCircle2, 
  TrendingUp as TrendUpIcon, 
  TrendingDown as TrendDownIcon, 
  Minus,
  Download,
  Info
} from 'lucide-react';

const Dashboard = () => {
  const [certs, setCerts] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Filtros de búsqueda integrados
  const [searchName, setSearchName] = useState('');
  const [searchType, setSearchType] = useState('');
  const [searchDate, setSearchDate] = useState('');
  const [searchLocality, setSearchLocality] = useState('');
  
  // Certificado actualmente seleccionado para la Vista Previa (Preview)
  const [selectedCert, setSelectedCert] = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);

  const loadData = async (filterQuery = '') => {
    setLoading(true);
    setError('');
    try {
      // Cargar estadísticas
      const statsData = await fetchAPI('/certificates/stats');
      setStats(statsData);

      // Cargar certificados filtrados
      const certsData = await fetchAPI(`/certificates${filterQuery}`);
      setCerts(certsData);

      // Por defecto seleccionar el primer certificado de la lista para el Preview
      if (certsData.length > 0) {
        setSelectedCert(certsData[0]);
      } else {
        setSelectedCert(null);
      }
    } catch (err) {
      console.error(err);
      setError('Error al conectar con la base de datos central.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleFilter = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchName) params.append('search', searchName);
    if (searchType) params.append('type', searchType);
    if (searchDate) {
      params.append('dateStart', searchDate);
      params.append('dateEnd', searchDate);
    }
    if (searchLocality) params.append('municipality', searchLocality);
    
    const queryStr = params.toString() ? `?${params.toString()}` : '';
    loadData(queryStr);
  };

  const handleDownload = async (id, folio) => {
    setDownloadingId(id);
    try {
      await downloadCertificatePDF(id, folio);
    } catch (err) {
      alert(err.message || 'No se pudo descargar el PDF.');
    } finally {
      setDownloadingId(null);
    }
  };

  const formatDateShort = (dateStr) => {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-');
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    return `${parseInt(day, 10)} ${months[parseInt(month, 10) - 1]}, ${year}`;
  };

  const formatDateLong = (dateStr) => {
    if (!dateStr) return 'Fecha pendiente';
    const [year, month, day] = dateStr.split('-');
    const months = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    return `${parseInt(day, 10)} de ${months[parseInt(month, 10) - 1]} de ${year}`;
  };

  if (loading && !stats) return <LoadingSpinner />;

  // Totales base de Stitch + dinámicos de la DB
  const dbTotals = stats ? stats.totals : { bautizos: 0, matrimonios: 0, presentaciones: 0 };
  const totalCertificados = 1240 + dbTotals.bautizos + dbTotals.matrimonios + dbTotals.presentaciones;
  const totalBautizos = 45 + dbTotals.bautizos;
  const totalMatrimonios = 12 + dbTotals.matrimonios;
  const totalPresentaciones = 28 + dbTotals.presentaciones;

  return (
    <div className="fade-in">
      {/* Cabecera del Dashboard */}
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.8rem', fontWeight: '700', color: 'var(--color-primary)', fontFamily: 'var(--font-serif)' }}>
          Dashboard de Gestión Eclesiástica
        </h2>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.95rem' }}>
          Secretario Local — Resumen y Registro de Folios de la Diócesis
        </p>
      </div>

      {/* KPI Row (Fila superior de indicadores de Stitch) */}
      <div className="metrics-grid">
        {/* Total Certificados */}
        <div className="metric-card">
          <div className="metric-icon-box">
            <FolderGit2 size={24} />
          </div>
          <div className="metric-info" style={{ flex: 1 }}>
            <span className="metric-label">Total Certificados</span>
            <span className="metric-value">{totalCertificados}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', fontSize: '0.75rem', color: '#15803d', fontWeight: '600' }}>
            <TrendUpIcon size={14} style={{ marginRight: '2px' }} />
            <span>+12% este año</span>
          </div>
        </div>

        {/* Bautizos este mes */}
        <div className="metric-card">
          <div className="metric-icon-box">
            <Droplet size={24} />
          </div>
          <div className="metric-info" style={{ flex: 1 }}>
            <span className="metric-label">Bautizos este mes</span>
            <span className="metric-value">{totalBautizos}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', fontSize: '0.75rem', color: '#15803d', fontWeight: '600' }}>
            <TrendUpIcon size={14} style={{ marginRight: '2px' }} />
            <span>8 nuevos hoy</span>
          </div>
        </div>

        {/* Matrimonios este mes */}
        <div className="metric-card">
          <div className="metric-icon-box">
            <Heart size={24} />
          </div>
          <div className="metric-info" style={{ flex: 1 }}>
            <span className="metric-label">Matrimonios este mes</span>
            <span className="metric-value">{totalMatrimonios}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: '600' }}>
            <Minus size={14} style={{ marginRight: '2px' }} />
            <span>Igual vs mes anterior</span>
          </div>
        </div>

        {/* Presentaciones de niños */}
        <div className="metric-card">
          <div className="metric-icon-box">
            <UserPlus size={24} />
          </div>
          <div className="metric-info" style={{ flex: 1 }}>
            <span className="metric-label">Presentaciones</span>
            <span className="metric-value">{totalPresentaciones}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', fontSize: '0.75rem', color: '#b91c1c', fontWeight: '600' }}>
            <TrendDownIcon size={14} style={{ marginRight: '2px' }} />
            <span>-5% vs mes anterior</span>
          </div>
        </div>
      </div>

      {/* Main Grid de 12 Columnas */}
      <div className="grid-12">
        
        {/* Sección Izquierda: Buscador y Tabla de Registros (col-span-8) */}
        <div className="col-span-8" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Tarjeta 1: Buscador de Registros */}
          <div className="card" style={{ padding: '1.5rem', marginBottom: 0 }}>
            <h3 className="card-title">
              <SearchIcon size={20} style={{ color: 'var(--color-primary)' }} />
              <span>Buscador de Registros</span>
            </h3>
            
            <form onSubmit={handleFilter}>
              <div className="form-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.7rem' }}>Nombre del Fiel</label>
                  <input 
                    type="text" 
                    value={searchName}
                    onChange={(e) => setSearchName(e.target.value)}
                    placeholder="Ej: Juan Pérez" 
                    className="input-field" 
                    style={{ padding: '0.6rem 0.8rem', fontSize: '0.85rem' }}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.7rem' }}>Tipo de Evento</label>
                  <select 
                    value={searchType}
                    onChange={(e) => setSearchType(e.target.value)}
                    className="input-field"
                    style={{ padding: '0.6rem 0.8rem', fontSize: '0.85rem' }}
                  >
                    <option value="">Todos</option>
                    <option value="bautizo">Bautismo</option>
                    <option value="matrimonio">Matrimonio</option>
                    <option value="presentacion">Presentación</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.7rem' }}>Fecha</label>
                  <input 
                    type="date" 
                    value={searchDate}
                    onChange={(e) => setSearchDate(e.target.value)}
                    className="input-field" 
                    style={{ padding: '0.6rem 0.8rem', fontSize: '0.85rem' }}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.7rem' }}>Localidad</label>
                  <input 
                    type="text" 
                    value={searchLocality}
                    onChange={(e) => setSearchLocality(e.target.value)}
                    placeholder="Municipio..." 
                    className="input-field" 
                    style={{ padding: '0.6rem 0.8rem', fontSize: '0.85rem' }}
                  />
                </div>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                {(searchName || searchType || searchDate || searchLocality) && (
                  <button 
                    type="button" 
                    className="btn btn-secondary" 
                    onClick={() => {
                      setSearchName('');
                      setSearchType('');
                      setSearchDate('');
                      setSearchLocality('');
                      loadData();
                    }}
                    style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                  >
                    Limpiar
                  </button>
                )}
                <button type="submit" className="btn btn-primary" style={{ padding: '0.5rem 1.25rem', fontSize: '0.85rem' }}>
                  <SearchIcon size={16} />
                  <span>Filtrar Resultados</span>
                </button>
              </div>
            </form>
          </div>

          {/* Tarjeta 2: Tabla de Registros Recientes */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--color-divider)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 className="card-title" style={{ margin: 0, fontSize: '1.15rem' }}>Registros Recientes</h3>
              {error && <span style={{ color: 'var(--color-error)', fontSize: '0.8rem' }}>{error}</span>}
            </div>

            {loading ? (
              <LoadingSpinner />
            ) : certs.length > 0 ? (
              <div className="results-table-container">
                <table className="results-table">
                  <thead>
                    <tr style={{ background: 'var(--color-input-bg)' }}>
                      <th style={{ padding: '0.85rem 1rem' }}>Folio</th>
                      <th style={{ padding: '0.85rem 1rem' }}>Nombre</th>
                      <th style={{ padding: '0.85rem 1rem' }}>Tipo</th>
                      <th style={{ padding: '0.85rem 1rem' }}>Fecha</th>
                      <th style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {certs.slice(0, 10).map((c) => (
                      <tr key={c.id} className="zebra-stripe">
                        <td style={{ fontWeight: '700', color: 'var(--color-primary)' }}>{c.folio}</td>
                        <td style={{ fontWeight: '600' }}>
                          {c.type === 'matrimonio' ? `${c.name_fiel_1} y ${c.name_fiel_2}` : c.name_fiel_1}
                        </td>
                        <td>
                          <span className={`badge badge-${c.type}`} style={{ fontSize: '10px', padding: '0.2rem 0.5rem', fontWeight: '700', borderRadius: '4px' }}>
                            {c.type === 'presentacion' ? 'Presentación' : c.type}
                          </span>
                        </td>
                        <td>{formatDateShort(c.event_date)}</td>
                        <td style={{ textAlign: 'right' }}>
                          <div className="actions-cell" style={{ justifyContent: 'flex-end', gap: '0.35rem' }}>
                            {/* Visualizar en el Preview de la derecha */}
                            <button 
                              className={`btn btn-icon ${selectedCert && selectedCert.id === c.id ? 'active' : ''}`}
                              onClick={() => setSelectedCert(c)}
                              title="Ver vista previa"
                              style={{ width: '32px', height: '32px', borderColor: selectedCert && selectedCert.id === c.id ? 'var(--color-gold)' : '' }}
                            >
                              <Eye size={14} />
                            </button>
                            {/* Descargar PDF */}
                            <button 
                              className="btn btn-icon" 
                              onClick={() => handleDownload(c.id, c.folio)}
                              disabled={downloadingId === c.id}
                              title="Descargar PDF Oficial"
                              style={{ width: '32px', height: '32px' }}
                            >
                              {downloadingId === c.id ? (
                                <span className="spinner" style={{ width: '12px', height: '12px', borderWidth: '1.5px' }}></span>
                              ) : (
                                <FileText size={14} />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}>
                No se encontraron registros de certificados en la base de datos.
              </div>
            )}
          </div>
        </div>

        {/* Sección Derecha: Estadísticas, Preview e Informes (col-span-4) */}
        <div className="col-span-4" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Tarjeta 1: Gráfico de Crecimiento Vertical (Stitch Style) */}
          <div className="growth-chart-container">
            <h3 style={{ fontSize: '1.1rem', fontWeight: '600', color: 'var(--color-text-light)', fontFamily: 'var(--font-serif)', marginBottom: '0.25rem' }}>
              Crecimiento Mensual
            </h3>
            <div className="growth-bars">
              {/* Representación visual de crecimiento en barras */}
              <div className="growth-bar-column" style={{ height: '40%' }} title="Abril"></div>
              <div className="growth-bar-column" style={{ height: '55%' }} title="Mayo"></div>
              <div className="growth-bar-column" style={{ height: '45%' }} title="Junio"></div>
              <div className="growth-bar-column" style={{ height: '60%' }} title="Julio"></div>
              <div className="growth-bar-column" style={{ height: '75%' }} title="Agosto"></div>
              <div className="growth-bar-column" style={{ height: '90%' }} title="Septiembre"></div>
              <div className="growth-bar-column active" style={{ height: '100%' }} title="Octubre (Actual)"></div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem', fontSize: '9px', fontWeight: '700', color: 'var(--color-text-muted)' }}>
              <span>ABR</span>
              <span>MAY</span>
              <span>JUN</span>
              <span>JUL</span>
              <span>AGO</span>
              <span>SEP</span>
              <span>OCT</span>
            </div>
            <p style={{ marginTop: '1rem', fontSize: '0.85rem', color: 'var(--color-text-muted)', lineHeight: '1.4' }}>
              Incremento del <strong style={{ color: 'var(--color-primary)' }}>14.2%</strong> en el flujo de registros respecto al trimestre anterior.
            </p>
          </div>

          {/* Tarjeta 2: Preview del Certificado Seleccionado (Fidelity Component) */}
          <div className="certificate-preview-container">
            <h3 style={{ fontSize: '1.1rem', fontWeight: '600', color: 'var(--color-text-light)', fontFamily: 'var(--font-serif)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Eye size={18} style={{ color: 'var(--color-gold)' }} />
              <span>Vista Previa del Certificado</span>
            </h3>

            {selectedCert ? (
              <div className="certificate-preview-card">
                {/* Bordes Decorativos del Certificado Físico */}
                <div className="border-decoration-1"></div>
                <div className="border-decoration-2"></div>
                
                {/* Watermark de Fondo */}
                <div className="certificate-preview-watermark">†</div>

                <div className="certificate-preview-header">
                  <div style={{ fontSize: '1.5rem', color: 'var(--color-primary)', marginBottom: '0.5rem' }}>†</div>
                  <h4 className="certificate-preview-title" style={{ fontSize: '1.1rem' }}>
                    CERTIFICADO DE {selectedCert.type.toUpperCase()}
                  </h4>
                  <p className="certificate-preview-subtitle">
                    Iglesia Evangélica Nacional
                  </p>
                </div>

                <div className="certificate-preview-body">
                  <p className="certificate-preview-phrase" style={{ fontSize: '0.75rem' }}>
                    {selectedCert.type === 'bautizo' && '"Yo te bautizo en el nombre del Padre, y del Hijo, y del Espíritu Santo."'}
                    {selectedCert.type === 'matrimonio' && '"Lo que Dios unió, no lo separe el hombre."'}
                    {selectedCert.type === 'presentacion' && '"Dejad a los niños venir a mí, y no se lo impidáis."'}
                  </p>

                  <div className="certificate-preview-subject">
                    <span className="certificate-preview-subject-label">
                      {selectedCert.type === 'matrimonio' ? 'Contrayentes' : 'Fiel Consagrado'}
                    </span>
                    <p className="certificate-preview-subject-name" style={{ fontSize: '1.15rem' }}>
                      {selectedCert.type === 'matrimonio' ? (
                        `${selectedCert.name_fiel_1} & ${selectedCert.name_fiel_2}`
                      ) : (
                        selectedCert.name_fiel_1
                      )}
                    </p>
                  </div>

                  <div className="certificate-preview-details" style={{ fontSize: '0.75rem', lineHeight: '1.5' }}>
                    {selectedCert.type === 'bautizo' && (
                      <>
                        <p>Hijo(a) de: <strong>{selectedCert.father_name || 'N/A'}</strong> y <strong>{selectedCert.mother_name || 'N/A'}</strong>.</p>
                        <p>Nacido(a) el: <strong>{formatDateLong(selectedCert.date_of_birth)}</strong>.</p>
                        <p>Recibió el sacramento el: <strong>{formatDateLong(selectedCert.event_date)}</strong>.</p>
                        <p>Templo: <strong>{selectedCert.church}</strong> ({selectedCert.municipality}, {selectedCert.state}).</p>
                        <p>Padrinos: <strong>{selectedCert.godparents_witnesses || 'No registrados'}</strong>.</p>
                      </>
                    )}
                    {selectedCert.type === 'matrimonio' && (
                      <>
                        <p>Padres del Novio: <strong>{selectedCert.father_name || 'N/A'}</strong>.</p>
                        <p>Padres de la Novia: <strong>{selectedCert.mother_name || 'N/A'}</strong>.</p>
                        <p>Consagraron su matrimonio el: <strong>{formatDateLong(selectedCert.event_date)}</strong>.</p>
                        <p>Templo: <strong>{selectedCert.church}</strong> ({selectedCert.municipality}, {selectedCert.state}).</p>
                        <p>Testigos: <strong>{selectedCert.godparents_witnesses || 'No registrados'}</strong>.</p>
                      </>
                    )}
                    {selectedCert.type === 'presentacion' && (
                      <>
                        <p>Hijo(a) de: <strong>{selectedCert.father_name || 'N/A'}</strong> y <strong>{selectedCert.mother_name || 'N/A'}</strong>.</p>
                        <p>Nacido(a) el: <strong>{formatDateLong(selectedCert.date_of_birth)}</strong>.</p>
                        <p>Presentado al Señor el: <strong>{formatDateLong(selectedCert.event_date)}</strong>.</p>
                        <p>Templo: <strong>{selectedCert.church}</strong> ({selectedCert.municipality}, {selectedCert.state}).</p>
                        <p>Padrinos: <strong>{selectedCert.godparents_witnesses || 'No registrados'}</strong>.</p>
                      </>
                    )}
                  </div>

                  <div className="certificate-preview-signature-block">
                    {/* Firma transparente del Pastor Principal overlay */}
                    <img 
                      src="http://localhost:5000/api/auth/me" /* fallback local */
                      onError={(e) => {
                        e.target.src = '/backend/assets/firma_pastor.png'; // placeholder local
                        // Intentar cargar la firma real generada
                        e.target.src = 'http://localhost:5000/api/certificates/validate/logo'; // workaround
                        // En desarrollo, usamos el endpoint estático o un path directo.
                        // Dado que está en /backend/assets/firma_pastor.png, la referenciamos con un endpoint o imagen de assets.
                      }}
                      src={`http://localhost:5000/assets/firma_pastor.png`}
                      /* Cargamos la firma local de forma estática o una firma por defecto */
                      srcSet={`http://localhost:5000/assets/firma_pastor.png 1x`}
                      alt="Firma del Pastor" 
                      className="certificate-preview-signature-img"
                    />
                    <div className="certificate-preview-signature-line"></div>
                    <span className="certificate-preview-signature-title">Pastor Principal</span>
                  </div>
                  
                  <p style={{ fontSize: '8px', color: 'var(--color-text-muted)', textTransform: 'uppercase', marginTop: '1.25rem', fontWeight: 'bold' }}>
                    Folio Oficial: {selectedCert.folio}
                  </p>
                </div>
              </div>
            ) : (
              <div className="certificate-preview-card" style={{ justifyContent: 'center', color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
                <div className="border-decoration-1"></div>
                <div className="border-decoration-2"></div>
                <Info size={36} style={{ marginBottom: '1rem', opacity: 0.3 }} />
                <span>Seleccione un registro de la tabla para ver su certificado físico</span>
              </div>
            )}
            
            {selectedCert && (
              <button 
                onClick={() => handleDownload(selectedCert.id, selectedCert.folio)}
                className="btn btn-gold" 
                style={{ width: '100%', marginTop: '1rem', padding: '0.65rem' }}
                disabled={downloadingId === selectedCert.id}
              >
                {downloadingId === selectedCert.id ? (
                  <span className="spinner" style={{ width: '14px', height: '14px', borderWidth: '1.5px' }}></span>
                ) : (
                  <>
                    <FileText size={16} />
                    <span>Imprimir / Descargar Borrador</span>
                  </>
                )}
              </button>
            )}
          </div>

          {/* Tarjeta 3: Pendientes (Color Primario) */}
          <div className="pending-card">
            <h3>
              <CheckCircle2 size={18} />
              <span>Actividades Pendientes</span>
            </h3>
            <ul className="pending-list">
              <li className="pending-item">
                <AlertTriangle size={16} className="icon-alert" />
                <span>3 Registros de Bautizo requieren firma hológrafa del Párroco local.</span>
              </li>
              <li className="pending-item">
                <AlertCircle size={16} className="icon-alert" />
                <span>Cita agendada para corrección de acta de presentación - 16:00 hrs.</span>
              </li>
            </ul>
          </div>

        </div>

      </div>

    </div>
  );
};

export default Dashboard;
