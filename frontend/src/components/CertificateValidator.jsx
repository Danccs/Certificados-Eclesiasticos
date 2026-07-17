import React, { useState, useEffect } from 'react';
import { API_BASE } from '../utils';
import LoadingSpinner from './LoadingSpinner';
import { ShieldCheck, ShieldAlert, Search, RefreshCw, CheckCircle2 } from 'lucide-react';

const CertificateValidator = ({ initialFolio }) => {
  const [folio, setFolio] = useState(initialFolio || '');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [searched, setSearched] = useState(false);

  const handleValidate = async (folioToValidate) => {
    if (!folioToValidate || !folioToValidate.trim()) return;

    setLoading(true);
    setErrorMsg('');
    setResult(null);
    setSearched(true);

    try {
      const response = await fetch(`${API_BASE}/certificates/validate/${folioToValidate.trim()}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error al validar el folio');
      }

      setResult(data);
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || 'El folio ingresado no coincide con ningún registro oficial.');
    } finally {
      setLoading(false);
    }
  };

  // Cargar automáticamente si viene un folio en los parámetros iniciales
  useEffect(() => {
    if (initialFolio) {
      setFolio(initialFolio);
      handleValidate(initialFolio);
    }
  }, [initialFolio]);

  const handleSubmit = (e) => {
    e.preventDefault();
    handleValidate(folio);
  };

  const formatDateString = (dateStr) => {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-');
    const months = [
      'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
      'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
    ];
    return `${parseInt(day, 10)} de ${months[parseInt(month, 10) - 1]} de ${year}`;
  };

  const getTypeName = (type) => {
    switch (type) {
      case 'bautizo': return 'Sagrado Bautismo';
      case 'matrimonio': return 'Santo Matrimonio';
      case 'presentacion': return 'Presentación de Niño';
      default: return type;
    }
  };

  return (
    <div className="validator-card card fade-in" style={{ margin: '0 auto' }}>
      <h2 className="card-title" style={{ justifyContent: 'center' }}>
        <CheckCircle2 size={24} style={{ color: 'var(--color-gold)' }} />
        <span>Validador de Certificados Digitales</span>
      </h2>
      <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: '2rem' }}>
        Ingrese el código de folio único impreso en el certificado para comprobar su autenticidad.
      </p>

      {/* Formulario de consulta */}
      <form onSubmit={handleSubmit} style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <input 
              type="text" 
              value={folio}
              onChange={(e) => setFolio(e.target.value)}
              placeholder="Código de Folio (Ej: BAU-2026-0001)" 
              className="input-field"
              style={{ paddingLeft: '2.5rem', textTransform: 'uppercase' }}
              required
            />
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '13px', color: 'var(--color-text-muted)' }} />
          </div>
          <button type="submit" className="btn btn-gold" disabled={loading} style={{ minWidth: '120px' }}>
            {loading ? <span className="spinner" style={{ width: '16px', height: '16px', borderWidth: '2px' }}></span> : 'Validar'}
          </button>
        </div>
      </form>

      {/* Cargando */}
      {loading && <LoadingSpinner />}

      {/* Sello de Validez - CERTIFICADO VÁLIDO */}
      {!loading && searched && result && result.valid && (
        <div className="fade-in">
          <div className="validation-badge validation-badge-success">
            <div className="validation-icon-container validation-icon-container-success pulse-gold">
              <ShieldCheck size={36} />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '700' }}>✓ CERTIFICADO DIGITAL VÁLIDO</h3>
            <p style={{ fontSize: '0.85rem', opacity: 0.9 }}>
              Confirmado en la base de datos oficial centralizada de la Iglesia
            </p>
          </div>

          {/* Detalles del Registro */}
          <div className="validator-details-grid">
            <div className="validator-detail-item">
              <span className="validator-detail-label">Folio Oficial</span>
              <span className="validator-detail-value highlight">{result.folio}</span>
            </div>
            
            <div className="validator-detail-item">
              <span className="validator-detail-label">Tipo de Acto</span>
              <span className="validator-detail-value">{getTypeName(result.type)}</span>
            </div>

            <div className="validator-detail-item" style={{ gridColumn: '1 / -1' }}>
              <span className="validator-detail-label">
                {result.type === 'matrimonio' ? 'Contrayentes' : 'Nombre del Fiel'}
              </span>
              <span className="validator-detail-value" style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>
                {result.type === 'matrimonio' ? (
                  `${result.name_fiel_1} y ${result.name_fiel_2}`
                ) : (
                  result.name_fiel_1
                )}
              </span>
            </div>

            <div className="validator-detail-item">
              <span className="validator-detail-label">Fecha de Celebración</span>
              <span className="validator-detail-value">{formatDateString(result.event_date)}</span>
            </div>

            <div className="validator-detail-item">
              <span className="validator-detail-label">Pastor Oficiante</span>
              <span className="validator-detail-value">{result.pastor}</span>
            </div>

            <div className="validator-detail-item" style={{ gridColumn: '1 / -1' }}>
              <span className="validator-detail-label">Lugar y Congregación</span>
              <span className="validator-detail-value">
                {result.church} — {result.municipality}, {result.state}
              </span>
            </div>
          </div>

          <div style={{ marginTop: '2rem', padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
              La firma autógrafa digitalizada del Pastor Principal y el sello eclesiástico han sido incorporados electrónicamente en el documento oficial PDF original.
            </p>
          </div>
        </div>
      )}

      {/* Sello de Invalidez - CERTIFICADO NO ENCONTRADO */}
      {!loading && searched && errorMsg && (
        <div className="fade-in">
          <div className="validation-badge validation-badge-error">
            <div className="validation-icon-container validation-icon-container-error">
              <ShieldAlert size={36} />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '700' }}>✗ REGISTRO NO VÁLIDO</h3>
            <p style={{ fontSize: '0.85rem', opacity: 0.9 }}>
              Documento no encontrado o folio inexistente
            </p>
          </div>

          <p style={{ color: '#fca5a5', fontSize: '0.95rem', lineHeight: '1.5', margin: '1.5rem 0' }}>
            El folio <strong>{folio.toUpperCase()}</strong> no corresponde a ningún certificado emitido legalmente por nuestra secretaría digital. 
            Por favor, verifique el código e intente de nuevo. Si considera que es un error, contacte a la secretaría local.
          </p>

          <button 
            type="button" 
            className="btn btn-secondary" 
            onClick={() => { setSearched(false); setResult(null); setErrorMsg(''); }}
          >
            <RefreshCw size={16} /> Volver a intentar
          </button>
        </div>
      )}

    </div>
  );
};

export default CertificateValidator;
