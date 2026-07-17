require('dotenv').config();
const path = require('path');
const fs = require('fs');

// Cargar Sequelize y modelos
const sequelize = require('./config/database');
const { User, Certificate } = require('./models');
const { generateCertificatePDF } = require('./utils/pdfGenerator');

const runTests = async () => {
  try {
    console.log('--- Iniciando Pruebas de Integración Backend ---');

    // 1. Probar Conexión e Inicialización de DB
    await sequelize.sync({ force: true }); // Limpiar tablas para pruebas
    console.log('✓ Base de datos reiniciada de manera limpia.');

    // 2. Probar Creación de Usuario
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash('testpass123', 10);
    const user = await User.create({
      username: 'test_sec',
      password: hashedPassword,
      role: 'Secretario Local'
    });
    console.log(`✓ Usuario creado con éxito: ID=${user.id}, Username=${user.username}`);

    // 3. Probar Creación de Certificados y Foliación
    const eventDate = '2026-07-16';
    const mockCerts = [
      {
        type: 'bautizo',
        event_date: eventDate,
        name_fiel_1: 'Juan Perez',
        date_of_birth: '2020-05-10',
        father_name: 'Carlos Perez',
        mother_name: 'Maria Gomez',
        godparents_witnesses: 'Jose Perez y Ana Gomez',
        pastor: 'Pastor Alejandro',
        church: 'Iglesia Cristiana Central',
        municipality: 'San Salvador',
        state: 'San Salvador',
        created_by: user.id
      },
      {
        type: 'bautizo',
        event_date: eventDate,
        name_fiel_1: 'Laura Sofia Robles',
        date_of_birth: '2019-12-25',
        father_name: 'Daniel Robles',
        mother_name: 'Clara Ortiz',
        godparents_witnesses: 'Pedro Robles y Julia Ortiz',
        pastor: 'Pastor Alejandro',
        church: 'Iglesia Cristiana Central',
        municipality: 'San Salvador',
        state: 'San Salvador',
        created_by: user.id
      },
      {
        type: 'matrimonio',
        event_date: eventDate,
        name_fiel_1: 'Andres Martinez',
        name_fiel_2: 'Gabriela Silva',
        godparents_witnesses: 'Roberto Martinez y Elena Silva',
        pastor: 'Pastor Alejandro',
        church: 'Iglesia Cristiana Central',
        municipality: 'San Salvador',
        state: 'San Salvador',
        created_by: user.id
      }
    ];

    const generateNextFolio = async (type) => {
      const currentYear = new Date().getFullYear();
      const prefix = `${type === 'bautizo' ? 'BAU' : type === 'matrimonio' ? 'MAT' : 'PRE'}-${currentYear}-`;
      const { Op } = require('sequelize');
      const latestCert = await Certificate.findOne({
        where: { folio: { [Op.like]: `${prefix}%` } },
        order: [['folio', 'DESC']]
      });
      let nextNum = 1;
      if (latestCert) {
        const parts = latestCert.folio.split('-');
        const lastNum = parseInt(parts[parts.length - 1], 10);
        if (!isNaN(lastNum)) nextNum = lastNum + 1;
      }
      return `${prefix}${String(nextNum).padStart(4, '0')}`;
    };

    for (const certData of mockCerts) {
      const folio = await generateNextFolio(certData.type);
      const cert = await Certificate.create({ ...certData, folio });
      console.log(`✓ Certificado registrado: Folio=${cert.folio}, Tipo=${cert.type}, Fiel=${cert.name_fiel_1}`);
    }

    // 4. Probar Generación de PDF
    const createdBautizo = await Certificate.findOne({ where: { type: 'bautizo' } });
    if (createdBautizo) {
      console.log('Generando PDF de Bautizo de prueba...');
      const validateUrl = `http://localhost:5173/?validate=${createdBautizo.folio}`;
      const pdfBuffer = await generateCertificatePDF(createdBautizo, validateUrl);
      
      const outputPath = path.resolve('./test_certificado.pdf');
      fs.writeFileSync(outputPath, pdfBuffer);
      console.log(`✓ PDF generado exitosamente en: ${outputPath}`);
    }

    console.log('--- Pruebas de Integración Completadas con Éxito ---');
    process.exit(0);
  } catch (error) {
    console.error('✗ Fallo en las pruebas de integración:', error);
    process.exit(1);
  }
};

runTests();
