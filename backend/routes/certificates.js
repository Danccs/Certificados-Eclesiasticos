const express = require('express');
const router = express.Router();
const {
  createCertificate,
  getCertificates,
  getStats,
  downloadPDF,
  validateCertificatePublic,
  getNextFolioPublic
} = require('../controllers/certificateController');
const { protect } = require('../middleware/authMiddleware');

// Rutas protegidas para el Secretario Local
router.post('/', protect, createCertificate);
router.get('/', protect, getCertificates);
router.get('/stats', protect, getStats);
router.get('/next-folio/:type', protect, getNextFolioPublic);
router.get('/:id/pdf', protect, downloadPDF);

// Ruta pública de validación para consulta externa
router.get('/validate/:folio', validateCertificatePublic);

module.exports = router;
