const { Certificate, User } = require('../models');
const { Op } = require('sequelize');
const sequelize = require('../config/database');
const { generateCertificatePDF } = require('../utils/pdfGenerator');

// Obtener el prefijo de folio según el tipo de certificado
const getFolioPrefix = (type) => {
  switch (type) {
    case 'bautizo': return 'BAU';
    case 'matrimonio': return 'MAT';
    case 'presentacion': return 'PRE';
    default: return 'CERT';
  }
};

// Generador de folio secuencial y robusto
const generateNextFolio = async (type, transaction) => {
  const currentYear = new Date().getFullYear();
  const prefix = `${getFolioPrefix(type)}-${currentYear}-`;

  // Buscar el certificado con el folio más alto para ese tipo y año
  const latestCert = await Certificate.findOne({
    where: {
      folio: {
        [Op.like]: `${prefix}%`
      }
    },
    order: [['folio', 'DESC']],
    transaction
  });

  let nextNum = 1;
  if (latestCert) {
    // Extraer la parte numérica (últimos 4 dígitos)
    const parts = latestCert.folio.split('-');
    const lastNumStr = parts[parts.length - 1];
    const lastNum = parseInt(lastNumStr, 10);
    if (!isNaN(lastNum)) {
      nextNum = lastNum + 1;
    }
  }

  // Rellenar con ceros a la izquierda (ej. 0001, 0012)
  const paddedNum = String(nextNum).padStart(4, '0');
  return `${prefix}${paddedNum}`;
};

// 1. Crear un nuevo certificado (Secretario Local)
const createCertificate = async (req, res) => {
  const {
    type,
    event_date,
    name_fiel_1,
    name_fiel_2,
    date_of_birth,
    father_name,
    mother_name,
    godparents_witnesses,
    pastor,
    church,
    municipality,
    state,
    observations
  } = req.body;

  const t = await sequelize.transaction();

  try {
    if (!type || !event_date || !name_fiel_1 || !pastor || !church || !municipality || !state) {
      await t.rollback();
      return res.status(400).json({ message: 'Por favor, complete todos los campos obligatorios' });
    }

    // Generar el folio de forma segura dentro de la transacción
    const folio = await generateNextFolio(type, t);

    const newCertificate = await Certificate.create({
      folio,
      type,
      event_date,
      name_fiel_1,
      name_fiel_2: type === 'matrimonio' ? name_fiel_2 : null,
      date_of_birth: type !== 'matrimonio' ? date_of_birth : null,
      father_name,
      mother_name,
      godparents_witnesses,
      pastor,
      church,
      municipality,
      state,
      observations,
      created_by: req.user.id
    }, { transaction: t });

    await t.commit();
    res.status(201).json(newCertificate);
  } catch (error) {
    await t.rollback();
    console.error('Error al crear certificado:', error);
    res.status(500).json({ message: 'Error en el servidor al crear el certificado' });
  }
};

// 2. Módulo de Consulta y Localización (Secretario Local)
const getCertificates = async (req, res) => {
  const { search, type, dateStart, dateEnd, municipality, pastor } = req.query;

  try {
    const whereClause = {};

    // Filtro por tipo de certificado
    if (type) {
      whereClause.type = type;
    }

    // Filtro por rango de fechas del evento
    if (dateStart || dateEnd) {
      whereClause.event_date = {};
      if (dateStart) whereClause.event_date[Op.gte] = dateStart;
      if (dateEnd) whereClause.event_date[Op.lte] = dateEnd;
    }

    // Filtro por municipio
    if (municipality) {
      whereClause.municipality = { [Op.like]: `%${municipality}%` };
    }

    // Filtro por pastor oficiante
    if (pastor) {
      whereClause.pastor = { [Op.like]: `%${pastor}%` };
    }

    // Filtro de búsqueda general (nombre del fiel 1 o fiel 2)
    if (search) {
      whereClause[Op.or] = [
        { name_fiel_1: { [Op.like]: `%${search}%` } },
        { name_fiel_2: { [Op.like]: `%${search}%` } },
        { folio: { [Op.like]: `%${search}%` } }
      ];
    }

    const certificates = await Certificate.findAll({
      where: whereClause,
      include: [
        { model: User, as: 'creator', attributes: ['username'] }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json(certificates);
  } catch (error) {
    console.error('Error al consultar certificados:', error);
    res.status(500).json({ message: 'Error al realizar la consulta' });
  }
};

// 3. Módulo de Estadísticas / Dashboard (Secretario Local)
const getStats = async (req, res) => {
  try {
    const allCerts = await Certificate.findAll({
      attributes: ['type', 'event_date', 'state']
    });

    // 1. Totales consolidados por tipo
    const counts = { bautizos: 0, matrimonios: 0, presentaciones: 0 };
    allCerts.forEach(c => {
      if (c.type === 'bautizo') counts.bautizos++;
      else if (c.type === 'matrimonio') counts.matrimonios++;
      else if (c.type === 'presentacion') counts.presentaciones++;
    });

    // 2. Bautizos por mes (últimos 12 meses)
    const baptismsByMonth = {};
    // Inicializar los últimos 6 meses para que el gráfico no esté vacío
    const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    for (let i = 5; i >= 0; i--) {
      let m = currentMonth - i;
      let y = currentYear;
      if (m < 0) {
        m += 12;
        y -= 1;
      }
      const key = `${monthNames[m]} ${y}`;
      baptismsByMonth[key] = 0;
    }

    // Llenar datos de bautizos por mes
    allCerts.forEach(c => {
      if (c.type === 'bautizo' && c.event_date) {
        const date = new Date(c.event_date + 'T00:00:00'); // Evitar problemas de zona horaria
        const m = date.getMonth();
        const y = date.getFullYear();
        const key = `${monthNames[m]} ${y}`;
        if (baptismsByMonth[key] !== undefined) {
          baptismsByMonth[key]++;
        } else {
          // Si no está en el rango de los últimos 6 meses inicializados, pero es del año actual
          if (y === currentYear) {
            baptismsByMonth[key] = 1;
          }
        }
      }
    });

    const baptismsChartData = Object.keys(baptismsByMonth).map(key => ({
      name: key,
      value: baptismsByMonth[key]
    }));

    // 3. Matrimonios por estado
    const marriagesByState = {};
    allCerts.forEach(c => {
      if (c.type === 'matrimonio' && c.state) {
        const stateKey = c.state.trim().toUpperCase();
        marriagesByState[stateKey] = (marriagesByState[stateKey] || 0) + 1;
      }
    });

    const marriagesChartData = Object.keys(marriagesByState).map(state => ({
      name: state,
      value: marriagesByState[state]
    })).sort((a, b) => b.value - a.value).slice(0, 5); // Top 5 estados

    // 4. Crecimiento de presentaciones (últimos 6 meses)
    const presentationsByMonth = {};
    for (let i = 5; i >= 0; i--) {
      let m = currentMonth - i;
      let y = currentYear;
      if (m < 0) {
        m += 12;
        y -= 1;
      }
      const key = `${monthNames[m]} ${y}`;
      presentationsByMonth[key] = 0;
    }

    allCerts.forEach(c => {
      if (c.type === 'presentacion' && c.event_date) {
        const date = new Date(c.event_date + 'T00:00:00');
        const m = date.getMonth();
        const y = date.getFullYear();
        const key = `${monthNames[m]} ${y}`;
        if (presentationsByMonth[key] !== undefined) {
          presentationsByMonth[key]++;
        } else if (y === currentYear) {
          presentationsByMonth[key] = 1;
        }
      }
    });

    // Calcular crecimiento acumulativo para presentaciones
    let runningTotal = 0;
    const presentationsChartData = Object.keys(presentationsByMonth).map(key => {
      runningTotal += presentationsByMonth[key];
      return {
        name: key,
        value: runningTotal
      };
    });

    res.json({
      totals: counts,
      charts: {
        bautizos: baptismsChartData,
        matrimonios: marriagesChartData,
        presentaciones: presentationsChartData
      }
    });
  } catch (error) {
    console.error('Error al generar estadísticas:', error);
    res.status(500).json({ message: 'Error al obtener datos estadísticos' });
  }
};

// 4. Descargar PDF oficial (Secretario Local - Protegido)
const downloadPDF = async (req, res) => {
  const { id } = req.params;

  try {
    const cert = await Certificate.findByPk(id);
    if (!cert) {
      return res.status(404).json({ message: 'Certificado no encontrado' });
    }

    // URL de validación pública
    // El host se lee de los headers o config de entorno
    const protocol = req.protocol;
    const host = req.get('host');
    // Para desarrollo apuntamos al frontend puerto 5173 que procesa el query ?validate=FOLIO
    const frontendUrl = process.env.NODE_ENV === 'production'
      ? `${protocol}://${host}/?validate=${cert.folio}`
      : `http://localhost:5173/?validate=${cert.folio}`;

    // Generar el buffer del PDF
    const pdfBuffer = await generateCertificatePDF(cert, frontendUrl);

    // Configurar cabeceras de descarga
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Certificado-${cert.folio}.pdf`);
    res.setHeader('Content-Length', pdfBuffer.length);
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Error al descargar PDF:', error);
    res.status(500).json({ message: 'Error al generar el documento PDF' });
  }
};

// 5. Validación Pública (Público general - Sin proteger)
const validateCertificatePublic = async (req, res) => {
  const { folio } = req.params;

  try {
    const cert = await Certificate.findOne({
      where: {
        folio: {
          [Op.like]: folio.trim()
        }
      }
    });

    if (!cert) {
      return res.status(404).json({
        valid: false,
        message: 'Certificado no encontrado en los registros oficiales. Verifique el folio.'
      });
    }

    // Retorna sólo datos no sensibles y necesarios para validar
    res.json({
      valid: true,
      folio: cert.folio,
      type: cert.type,
      event_date: cert.event_date,
      name_fiel_1: cert.name_fiel_1,
      name_fiel_2: cert.type === 'matrimonio' ? cert.name_fiel_2 : null,
      church: cert.church,
      municipality: cert.municipality,
      state: cert.state,
      pastor: cert.pastor,
      verification_date: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error al validar certificado:', error);
    res.status(500).json({ message: 'Error interno en la validación' });
  }
};

// 6. Obtener Siguiente Folio Eclesiástico (Secretario Local - Protegido)
const getNextFolioPublic = async (req, res) => {
  const { type } = req.params;
  try {
    const folio = await generateNextFolio(type);
    res.json({ folio });
  } catch (error) {
    console.error('Error al obtener siguiente folio:', error);
    res.status(500).json({ message: 'Error al calcular el siguiente folio' });
  }
};

module.exports = {
  createCertificate,
  getCertificates,
  getStats,
  downloadPDF,
  validateCertificatePublic,
  getNextFolioPublic
};
