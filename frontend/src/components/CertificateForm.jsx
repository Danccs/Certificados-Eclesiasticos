import React, { useState, useEffect } from 'react';
import { fetchAPI, downloadCertificatePDF } from '../utils';
import LoadingSpinner from './LoadingSpinner';
import { 
  Droplet, 
  Heart, 
  UserCheck, 
  Save, 
  FileText, 
  AlertTriangle, 
  Check, 
  FolderPlus,
  Info,
  Calendar,
  Sparkles
} from 'lucide-react';

const CertificateForm = ({ onCreationSuccess }) => {
  const [type, setType] = useState('bautizo');
  const [nextFolio, setNextFolio] = useState('Calculando...');
  
  const [formData, setFormData] = useState({
    event_date: '',
    name_fiel_1: '',
    name_fiel_2: '',
    date_of_birth: '',
    father_name: '',
    mother_name: '',
    godparents_witnesses: '',
    padrino_temp: '', // Campos desagregados para Bautizo (Stitch)
    madrina_temp: '',
    pastor: 'Pbro. Manuel Salvador Domínguez', // Valor por defecto de Stitch
    church: '',
    municipality: 'San Salvador', // Valores por defecto lógicos
    state: 'San Salvador',
    observations: ''
  });

  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Cargar el folio automático cada vez que cambia el tipo
  const loadNextFolio = async (eventType) => {
    try {
      setNextFolio('Calculando...');
      const response = await fetchAPI(`/certificates/next-folio/${eventType}`);
      setNextFolio(response.folio);
    } catch (err) {
      console.error('Error al cargar siguiente folio:', err);
      setNextFolio('Error al asignar');
    }
  };

  useEffect(() => {
    loadNextFolio(type);
  }, [type]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleTypeChange = (newType) => {
    setType(newType);
    setFormData(prev => ({
      ...prev,
      name_fiel_1: '',
      name_fiel_2: '',
      date_of_birth: '',
      father_name: '',
      mother_name: '',
      godparents_witnesses: '',
      padrino_temp: '',
      madrina_temp: '',
      observations: ''
    }));
    setErrorMsg('');
    setSuccessMsg('');
  };

  // Enviar el formulario y guardar el registro en la DB
  const saveRecord = async (triggerDownload = false) => {
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    // Unificar Padrinos si es Bautizo
    let finalGodparents = formData.godparents_witnesses;
    if (type === 'bautizo') {
      const parts = [];
      if (formData.padrino_temp) parts.push(`Padrino: ${formData.padrino_temp}`);
      if (formData.madrina_temp) parts.push(`Madrina: ${formData.madrina_temp}`);
      finalGodparents = parts.join(' / ');
    }

    const payload = {
      ...formData,
      type,
      godparents_witnesses: finalGodparents
    };

    // Validar requeridos
    if (!payload.event_date || !payload.name_fiel_1 || !payload.pastor || !payload.church) {
      setErrorMsg('Por favor complete todos los campos obligatorios (Nombre, Fecha, Templo y Pastor).');
      setLoading(false);
      return null;
    }

    try {
      const response = await fetchAPI('/certificates', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      setSuccessMsg(`✓ Registro archivado con éxito. Folio: ${response.folio}`);
      
      // Si se solicitó la firma y descarga inmediata del PDF
      if (triggerDownload) {
        await downloadCertificatePDF(response.id, response.folio);
      }

      // Limpiar formulario
      setFormData(prev => ({
        ...prev,
        event_date: '',
        name_fiel_1: '',
        name_fiel_2: '',
        date_of_birth: '',
        father_name: '',
        mother_name: '',
        godparents_witnesses: '',
        padrino_temp: '',
        madrina_temp: '',
        observations: ''
      }));

      // Recargar el siguiente folio
      loadNextFolio(type);

      // Notificar al padre después de un delay
      if (onCreationSuccess) {
        setTimeout(() => {
          onCreationSuccess();
        }, 2500);
      }

      return response;
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || 'Error al guardar el registro en el sistema central.');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const formatDateLong = (dateStr) => {
    if (!dateStr) return '____________________';
    const [year, month, day] = dateStr.split('-');
    const months = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    return `${parseInt(day, 10)} de ${months[parseInt(month, 10) - 1]} de ${year}`;
  };

  const getTypeName = () => {
    if (type === 'bautizo') return 'BAUTISMO';
    if (type === 'matrimonio') return 'MATRIMONIO';
    if (type === 'presentacion') return 'PRESENTACIÓN';
    return type;
  };

  return (
    <div className="fade-in">
      
      {/* Encabezado Superior (Stitch Layout) */}
      <div className="grid-12" style={{ alignItems: 'center', marginBottom: '2rem' }}>
        <div className="col-span-8">
          <h2 style={{ fontSize: '1.8rem', fontWeight: '700', color: 'var(--color-primary)', fontFamily: 'var(--font-serif)', margin: 0 }}>
            Nuevo Registro de Acta
          </h2>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.95rem', margin: 0 }}>
            Complete la información requerida para la emisión del certificado oficial.
          </p>
        </div>
        
        {/* Indicador de Foliación Automática de la derecha */}
        <div className="col-span-4" style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <div style={{
            background: 'var(--color-bg-card)',
            border: '1px solid var(--color-divider)',
            padding: '0.75rem 1.25rem',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            boxShadow: 'var(--shadow-premium)'
          }}>
            <UserCheck size={20} style={{ color: 'var(--color-gold)' }} />
            <div>
              <p style={{ fontSize: '0.65rem', fontWeight: '700', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>
                Foliación Automática
              </p>
              <p style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--color-text-light)', margin: 0 }}>
                Folio: {nextFolio}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Interfaz de Pestañas (Tabbed Interface de Stitch) */}
      <div className="tab-container">
        <button 
          type="button"
          onClick={() => handleTypeChange('bautizo')}
          className={`tab-button ${type === 'bautizo' ? 'active' : ''}`}
        >
          <Droplet size={18} />
          <span>Bautismo</span>
        </button>
        <button 
          type="button"
          onClick={() => handleTypeChange('matrimonio')}
          className={`tab-button ${type === 'matrimonio' ? 'active' : ''}`}
        >
          <Heart size={18} />
          <span>Matrimonio</span>
        </button>
        <button 
          type="button"
          onClick={() => handleTypeChange('presentacion')}
          className={`tab-button ${type === 'presentacion' ? 'active' : ''}`}
        >
          <UserCheck size={18} />
          <span>Presentación</span>
        </button>
      </div>

      {/* Alertas */}
      {successMsg && <div className="alert-toast alert-toast-success" style={{ marginBottom: '1.5rem' }}><Check size={18} /> {successMsg}</div>}
      {errorMsg && <div className="alert-toast alert-toast-error" style={{ marginBottom: '1.5rem' }}><AlertTriangle size={18} /> {errorMsg}</div>}

      {/* Grid del Formulario + Preview Card */}
      <div className="grid-12">
        
        {/* Formulario de Captura (col-span-7) */}
        <section className="col-span-7 card" style={{ background: 'var(--color-bg-card)', marginBottom: 0 }}>
          <form className="form-grid" style={{ gap: '1.25rem' }}>
            
            {/* Campo 1: Nombre Completo */}
            <div className="form-group full-width">
              <label className="form-label">
                {type === 'bautizo' && 'Nombre Completo del Bautizado *'}
                {type === 'matrimonio' && 'Nombre Completo del Novio *'}
                {type === 'presentacion' && 'Nombre Completo del Niño(a) Presentado(a) *'}
              </label>
              <input 
                type="text"
                name="name_fiel_1"
                value={formData.name_fiel_1}
                onChange={handleChange}
                placeholder={type === 'matrimonio' ? 'Ej: Juan Andrés Pérez García' : 'Ej: Juan Andrés Pérez García'}
                className="input-field"
                required
              />
            </div>

            {/* Campo 2: Nombre de la Novia (Solo Matrimonio) */}
            {type === 'matrimonio' && (
              <div className="form-group full-width">
                <label className="form-label">Nombre Completo de la Novia *</label>
                <input 
                  type="text"
                  name="name_fiel_2"
                  value={formData.name_fiel_2}
                  onChange={handleChange}
                  placeholder="Ej: María Elena López Silva"
                  className="input-field"
                  required={type === 'matrimonio'}
                />
              </div>
            )}

            {/* Campo 3: Nombre del Padre */}
            <div className="form-group">
              <label className="form-label">
                {type === 'matrimonio' ? 'Padres del Novio' : 'Nombre del Padre'}
              </label>
              <input 
                type="text"
                name="father_name"
                value={formData.father_name}
                onChange={handleChange}
                placeholder={type === 'matrimonio' ? 'Nombres de los padres del novio' : 'Ej: Pedro Pérez'}
                className="input-field"
              />
            </div>

            {/* Campo 4: Nombre de la Madre */}
            <div className="form-group">
              <label className="form-label">
                {type === 'matrimonio' ? 'Padres de la Novia' : 'Nombre de la Madre'}
              </label>
              <input 
                type="text"
                name="mother_name"
                value={formData.mother_name}
                onChange={handleChange}
                placeholder={type === 'matrimonio' ? 'Nombres de los padres de la novia' : 'Ej: María García'}
                className="input-field"
              />
            </div>

            {/* Campos 5 y 6: Padrinos (Desagregados para Bautismo) */}
            {type === 'bautizo' ? (
              <>
                <div className="form-group">
                  <label className="form-label">Padrino</label>
                  <input 
                    type="text"
                    name="padrino_temp"
                    value={formData.padrino_temp}
                    onChange={handleChange}
                    placeholder="Ej: Roberto Méndez"
                    className="input-field"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Madrina</label>
                  <input 
                    type="text"
                    name="madrina_temp"
                    value={formData.madrina_temp}
                    onChange={handleChange}
                    placeholder="Ej: Sofía Luna"
                    className="input-field"
                  />
                </div>
              </>
            ) : (
              /* Testigos o Padrinos de Presentación (Campo único) */
              <div className="form-group full-width">
                <label className="form-label">
                  {type === 'matrimonio' ? 'Testigos Oficiales de Fe' : 'Padrinos de Dedicación'}
                </label>
                <input 
                  type="text"
                  name="godparents_witnesses"
                  value={formData.godparents_witnesses}
                  onChange={handleChange}
                  placeholder={type === 'matrimonio' ? 'Ej: Roberto Méndez, Sofía Luna' : 'Ej: Roberto Méndez y Sofía Luna'}
                  className="input-field"
                />
              </div>
            )}

            {/* Campo 7: Fecha de Nacimiento (Bautizo y Presentacion) */}
            {type !== 'matrimonio' && (
              <div className="form-group">
                <label className="form-label">Fecha de Nacimiento</label>
                <input 
                  type="date"
                  name="date_of_birth"
                  value={formData.date_of_birth}
                  onChange={handleChange}
                  className="input-field"
                />
              </div>
            )}

            {/* Campo 8: Fecha de Ceremonia */}
            <div className="form-group" style={{ gridColumn: type === 'matrimonio' ? 'span 2' : 'auto' }}>
              <label className="form-label">Fecha de la Ceremonia *</label>
              <input 
                type="date"
                name="event_date"
                value={formData.event_date}
                onChange={handleChange}
                className="input-field"
                required
              />
            </div>

            {/* Campo 9: Ubicación */}
            <div className="form-group full-width">
              <label className="form-label">Ubicación (Templo / Parroquia / Capilla) *</label>
              <input 
                type="text"
                name="church"
                value={formData.church}
                onChange={handleChange}
                placeholder="Ej: Parroquia de San Juan Bautista"
                className="input-field"
                required
              />
            </div>

            {/* Campos de Localidad */}
            <div className="form-group">
              <label className="form-label">Municipio *</label>
              <input 
                type="text"
                name="municipality"
                value={formData.municipality}
                onChange={handleChange}
                className="input-field"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Estado / Departamento *</label>
              <input 
                type="text"
                name="state"
                value={formData.state}
                onChange={handleChange}
                className="input-field"
                required
              />
            </div>

            {/* Campo 10: Pastor Oficiante (Select de Stitch) */}
            <div className="form-group full-width">
              <label className="form-label">Pastor / Ministro Oficiante *</label>
              <select 
                name="pastor"
                value={formData.pastor}
                onChange={handleChange}
                className="input-field"
                required
              >
                <option value="Pbro. Manuel Salvador Domínguez">Pbro. Manuel Salvador Domínguez</option>
                <option value="Mons. Ricardo Antonio Jiménez">Mons. Ricardo Antonio Jiménez</option>
                <option value="Pbro. Luis Alberto Torres">Pbro. Luis Alberto Torres</option>
                <option value="Pastor Principal">Pastor Principal (General)</option>
              </select>
            </div>

          </form>

          {/* Botones de acción del formulario */}
          <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem', borderTop: '1px solid var(--color-divider)', paddingTop: '1.5rem' }}>
            <button 
              type="button"
              onClick={() => saveRecord(false)}
              className="btn btn-secondary"
              disabled={loading}
              style={{ flex: 1, padding: '1rem' }}
            >
              <Save size={18} />
              <span>Guardar Registro</span>
            </button>
            <button 
              type="button"
              onClick={() => saveRecord(true)}
              className="btn btn-primary pulse-gold"
              disabled={loading}
              style={{ flex: 1, padding: '1rem' }}
            >
              <FileText size={18} />
              <span>Generar PDF y Firmar</span>
            </button>
          </div>
        </section>

        {/* Vista Previa del Certificado (col-span-5) */}
        <section className="col-span-5">
          <div className="certificate-preview-container">
            <h3 style={{ fontSize: '1.1rem', fontWeight: '600', color: 'var(--color-text-light)', fontFamily: 'var(--font-serif)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Sparkles size={18} style={{ color: 'var(--color-gold)' }} />
              <span>Vista Previa del Certificado</span>
            </h3>

            {/* Ficha Física del Certificado en Blanco */}
            <div className="certificate-preview-card">
              {/* Marcos de esquina decorativos */}
              <div className="border-decoration-1"></div>
              <div className="border-decoration-2"></div>
              
              {/* Sello de agua */}
              <div className="certificate-preview-watermark">†</div>

              <div className="certificate-preview-header">
                <div style={{ fontSize: '1.5rem', color: 'var(--color-primary)', marginBottom: '0.4rem' }}>†</div>
                <h4 className="certificate-preview-title">
                  CERTIFICADO DE {getTypeName()}
                </h4>
                <p className="certificate-preview-subtitle">
                  Iglesia Evangélica Nacional
                </p>
              </div>

              <div className="certificate-preview-body">
                <p className="certificate-preview-phrase">
                  {type === 'bautizo' && '"Yo te bautizo en el nombre del Padre, y del Hijo, y del Espíritu Santo."'}
                  {type === 'matrimonio' && '"Lo que Dios unió, no lo separe el hombre."'}
                  {type === 'presentacion' && '"Dejad a los niños venir a mí, y no se lo impidáis."'}
                </p>

                <div className="text-center" style={{ marginBottom: '1.5rem' }}>
                  <p className="certificate-preview-subject-label" style={{ marginBottom: '0.25rem' }}>
                    Certificamos que
                  </p>
                  <p className="certificate-preview-subject-name">
                    {type === 'matrimonio' ? (
                      `${formData.name_fiel_1 || 'Nombre del Novio'} y ${formData.name_fiel_2 || 'Nombre de la Novia'}`
                    ) : (
                      formData.name_fiel_1 || 'Nombre del Fiel Bautizado'
                    )}
                  </p>
                </div>

                {/* Grid de padres para Bautizo / Presentacion */}
                {type !== 'matrimonio' ? (
                  <div className="certificate-preview-meta-grid">
                    <div className="certificate-preview-meta-item">
                      <span>Padre</span>
                      <p>{formData.father_name || 'Nombre del padre'}</p>
                    </div>
                    <div className="certificate-preview-meta-item">
                      <span>Madre</span>
                      <p>{formData.mother_name || 'Nombre de la madre'}</p>
                    </div>
                  </div>
                ) : (
                  /* Grid de padres de contrayentes para Matrimonio */
                  <div className="certificate-preview-meta-grid">
                    <div className="certificate-preview-meta-item">
                      <span>Padres del Novio</span>
                      <p>{formData.father_name || 'Padres del novio'}</p>
                    </div>
                    <div className="certificate-preview-meta-item">
                      <span>Padres de la Novia</span>
                      <p>{formData.mother_name || 'Padres de la novia'}</p>
                    </div>
                  </div>
                )}

                <div className="certificate-preview-details">
                  {type === 'bautizo' && (
                    <>
                      <p>Nacido(a) el día <strong>{formatDateLong(formData.date_of_birth)}</strong>.</p>
                      <p>Recibió el Sagrado Sacramento del Bautismo el día <strong>{formatDateLong(formData.event_date)}</strong>.</p>
                      <p>Lugar de celebración: <strong>{formData.church || 'Nombre del Templo'}</strong>, en {formData.municipality}, {formData.state}.</p>
                      <p>Padrinos: <strong>{formData.padrino_temp || 'Padrino'} & {formData.madrina_temp || 'Madrina'}</strong>.</p>
                    </>
                  )}
                  {type === 'matrimonio' && (
                    <>
                      <p>Unidos en Santo Vínculo Matrimonial el día <strong>{formatDateLong(formData.event_date)}</strong>.</p>
                      <p>Lugar de celebración: <strong>{formData.church || 'Nombre del Templo'}</strong>, en {formData.municipality}, {formData.state}.</p>
                      <p>Testigos oficiales de fe: <strong>{formData.godparents_witnesses || 'Nombres de los testigos'}</strong>.</p>
                    </>
                  )}
                  {type === 'presentacion' && (
                    <>
                      <p>Nacido(a) el día <strong>{formatDateLong(formData.date_of_birth)}</strong>.</p>
                      <p>Presentado al Señor en acto público de bendición el día <strong>{formatDateLong(formData.event_date)}</strong>.</p>
                      <p>Lugar de celebración: <strong>{formData.church || 'Nombre del Templo'}</strong>, en {formData.municipality}, {formData.state}.</p>
                      <p>Padrinos de dedicación: <strong>{formData.godparents_witnesses || 'Nombres de los padrinos'}</strong>.</p>
                    </>
                  )}
                </div>

                <div className="certificate-preview-signature-block">
                  {/* Firma transparente del Pastor Principal overlay */}
                  <img 
                    src="http://localhost:5000/assets/firma_pastor.png" 
                    alt="Firma del Pastor" 
                    className="certificate-preview-signature-img"
                    onError={(e) => {
                      e.target.style.display = 'none'; // ocultar si falla conexión de assets
                    }}
                  />
                  <div className="certificate-preview-signature-line" style={{ marginTop: '2.5rem' }}></div>
                  <span className="certificate-preview-signature-title">Pastor Principal</span>
                </div>
                
                <p style={{ fontSize: '8px', color: 'var(--color-text-muted)', textTransform: 'uppercase', marginTop: '1rem', fontWeight: 'bold' }}>
                  Folio Oficial: {nextFolio}
                </p>
              </div>

              {/* Caja informativa de Stitch */}
              <div className="card text-on-tertiary-fixed-variant" style={{ background: 'var(--color-divider)', padding: '1rem', display: 'flex', gap: '0.75rem', marginTop: '1rem', border: 'none', borderRadius: '8px', width: '100%', boxSizing: 'border-box' }}>
                <Info size={18} style={{ flexShrink: 0, color: 'var(--color-primary)' }} />
                <p style={{ fontSize: '0.8rem', lineHeight: '1.4', margin: 0, color: 'var(--color-text-muted)' }}>
                  Los cambios realizados en el formulario se reflejan automáticamente en la vista previa. Asegúrese de que todos los nombres estén escritos correctamente antes de firmar.
                </p>
              </div>
            </div>
          </div>
        </section>

      </div>

    </div>
  );
};

export default CertificateForm;
