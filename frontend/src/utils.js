export const API_BASE = 'http://localhost:5000/api';

/**
 * Wrapper de fetch para llamadas a la API con token de autenticación
 * @param {string} endpoint - Ruta relativa de la API (ej: '/auth/me')
 * @param {Object} options - Opciones de fetch (method, body, etc.)
 * @returns {Promise<any>} - Respuesta parseada en formato JSON
 */
export const fetchAPI = async (endpoint, options = {}) => {
  const token = localStorage.getItem('church_token');
  
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMessage = errorData.message || `Error ${response.status} en la petición`;
    const err = new Error(errorMessage);
    err.status = response.status;
    throw err;
  }

  // Si no hay contenido (ej: 204), no intentar parsear JSON
  if (response.status === 204) return null;

  return response.json();
};

/**
 * Descarga el certificado PDF de forma segura realizando una petición autenticada
 * @param {number|string} certId - ID del certificado a descargar
 * @param {string} folio - Folio del certificado (para renombrar el archivo)
 */
export const downloadCertificatePDF = async (certId, folio) => {
  const token = localStorage.getItem('church_token');
  
  const response = await fetch(`${API_BASE}/certificates/${certId}/pdf`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Error descargando PDF:', errorText);
    throw new Error('No se pudo descargar el certificado PDF. Verifique sus permisos.');
  }

  // Convertir respuesta a blob y descargar
  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `Certificado-${folio}.pdf`);
  document.body.appendChild(link);
  link.click();
  
  // Limpieza
  link.parentNode.removeChild(link);
  window.URL.revokeObjectURL(url);
};
