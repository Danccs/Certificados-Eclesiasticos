const PDFDocument = require('pdfkit');
const qrcode = require('qrcode');
const path = require('path');
const fs = require('fs');

/**
 * Genera un buffer PDF para un certificado eclesiástico
 * @param {Object} cert - Objeto con los datos del certificado
 * @param {string} validateUrl - URL de verificación para el código QR
 * @returns {Promise<Buffer>} - Buffer del PDF generado
 */
const generateCertificatePDF = (cert, validateUrl) => {
  return new Promise(async (resolve, reject) => {
    try {
      // Crear documento en tamaño Carta y orientación Horizontal (Landscape)
      // Dimensiones de Letter Landscape: 792 x 612 puntos
      const doc = new PDFDocument({
        size: 'LETTER',
        layout: 'landscape',
        margin: 40
      });

      const buffers = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfData = Buffer.concat(buffers);
        resolve(pdfData);
      });

      // ---- 1. DIBUJAR BORDES DECORATIVOS PREMIUM ----
      // Borde exterior - Azul Marino (#1e3a8a)
      doc.rect(20, 20, 752, 572)
         .lineWidth(5)
         .stroke('#1e3a8a');

      // Borde interior - Oro (#d4af37)
      doc.rect(28, 28, 736, 556)
         .lineWidth(2)
         .stroke('#d4af37');

      // Adornos en las esquinas (Cruces/Esquinas decorativas en Oro)
      const drawCornerDecorations = (x, y) => {
        doc.rect(x - 5, y - 5, 10, 10).fill('#d4af37');
      };
      drawCornerDecorations(28, 28);
      drawCornerDecorations(764, 28);
      drawCornerDecorations(28, 584);
      drawCornerDecorations(764, 584);

      // ---- 2. ENCABEZADO Y TÍTULOS ----
      // Emblema/Logo - Creado con figuras geométricas vectoriales de PDFKit (Cruz estilizada en Oro)
      doc.save();
      doc.translate(396, 75); // Centro de la página en X, altura 75 en Y
      // Dibujar cruz
      doc.rect(-4, -25, 8, 50).fill('#d4af37');
      doc.rect(-20, -10, 40, 8).fill('#d4af37');
      doc.restore();

      // Nombre de la institución
      doc.font('Times-Bold')
         .fontSize(16)
         .fillColor('#1e3a8a')
         .text('MINISTERIO DE LA IGLESIA EVANGÉLICA NACIONAL', 40, 115, {
           align: 'center',
           width: 712
         });

      // Subtítulo
      doc.font('Times-Roman')
         .fontSize(11)
         .fillColor('#64748b')
         .text('«Consagrados para la Gloria y Servicio del Señor»', 40, 135, {
           align: 'center',
           width: 712
         });

      // Línea divisoria decorativa
      doc.moveTo(250, 155)
         .lineTo(542, 155)
         .lineWidth(1)
         .stroke('#d4af37');

      // Título del Certificado según el tipo
      let certTitle = '';
      if (cert.type === 'bautizo') certTitle = 'CERTIFICADO DE SAGRADO BAUTISMO';
      else if (cert.type === 'matrimonio') certTitle = 'CERTIFICADO DE SANTO MATRIMONIO';
      else if (cert.type === 'presentacion') certTitle = 'CERTIFICADO DE PRESENTACIÓN DE NIÑO';

      doc.font('Times-Bold')
         .fontSize(22)
         .fillColor('#1e3a8a')
         .text(certTitle, 40, 175, {
           align: 'center',
           width: 712
         });

      // ---- 3. CUERPO DEL CERTIFICADO (TEXTOS VARIABLES) ----
      doc.font('Times-Roman')
         .fontSize(13)
         .fillColor('#334155');

      let bodyTextY = 220;

      // Formatear fechas
      const formatDate = (dateStr) => {
        if (!dateStr) return '';
        const [year, month, day] = dateStr.split('-');
        const months = [
          'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
          'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
        ];
        return `${parseInt(day, 10)} de ${months[parseInt(month, 10) - 1]} del año ${year}`;
      };

      if (cert.type === 'bautizo') {
        doc.text('Hacemos constar de manera oficial que ante la presencia de Dios y los testigos correspondientes,', 40, bodyTextY, { align: 'center', width: 712 });
        
        doc.font('Times-Bold').fontSize(18).fillColor('#1e3a8a')
           .text(cert.name_fiel_1.toUpperCase(), 40, bodyTextY + 30, { align: 'center', width: 712 });
        
        doc.font('Times-Roman').fontSize(13).fillColor('#334155');
        
        const descText = `Hijo(a) de ${cert.father_name || 'N/A'} y ${cert.mother_name || 'N/A'}, nacido(a) el ${formatDate(cert.date_of_birth)}, fue bautizado(a) en agua dando público testimonio de su fe cristiana en el nombre del Padre, del Hijo y del Espíritu Santo el día ${formatDate(cert.event_date)}.`;
        doc.text(descText, 80, bodyTextY + 65, { align: 'center', width: 632, lineGap: 6 });

        const localText = `Celebrado en la iglesia "${cert.church}" de ${cert.municipality}, ${cert.state}, oficiado por el Pastor ${cert.pastor}.`;
        doc.text(localText, 80, bodyTextY + 130, { align: 'center', width: 632 });

        if (cert.godparents_witnesses) {
          doc.font('Times-Italic').fontSize(11).fillColor('#475569')
             .text(`Padrinos: ${cert.godparents_witnesses}`, 40, bodyTextY + 165, { align: 'center', width: 712 });
        }

      } else if (cert.type === 'matrimonio') {
        doc.text('Damos testimonio y certificación eclesiástica de que en santa unión e indisoluble vínculo conyugal,', 40, bodyTextY, { align: 'center', width: 712 });
        
        // Nombres de los contrayentes
        const groomAndBride = `${cert.name_fiel_1.toUpperCase()}   y   ${cert.name_fiel_2.toUpperCase()}`;
        doc.font('Times-Bold').fontSize(17).fillColor('#1e3a8a')
           .text(groomAndBride, 40, bodyTextY + 30, { align: 'center', width: 712 });
        
        doc.font('Times-Roman').fontSize(13).fillColor('#334155');
        
        const descText = `Habiendo expresado sus votos mutuos y recibido la bendición sacerdotal, fueron unidos en matrimonio bajo las leyes de Dios y la doctrina eclesiástica el día ${formatDate(cert.event_date)}, en la congregación "${cert.church}" de ${cert.municipality}, ${cert.state}.`;
        doc.text(descText, 80, bodyTextY + 65, { align: 'center', width: 632, lineGap: 6 });

        const detailsText = `Acto pastoral oficiado y consagrado por el Pastor ${cert.pastor}.`;
        doc.text(detailsText, 80, bodyTextY + 130, { align: 'center', width: 632 });

        if (cert.godparents_witnesses) {
          doc.font('Times-Italic').fontSize(11).fillColor('#475569')
             .text(`Testigos oficiales de fe: ${cert.godparents_witnesses}`, 40, bodyTextY + 165, { align: 'center', width: 712 });
        }

      } else if (cert.type === 'presentacion') {
        doc.text('Certificamos solemnemente ante esta congregación que el infante:', 40, bodyTextY, { align: 'center', width: 712 });
        
        doc.font('Times-Bold').fontSize(18).fillColor('#1e3a8a')
           .text(cert.name_fiel_1.toUpperCase(), 40, bodyTextY + 30, { align: 'center', width: 712 });
        
        doc.font('Times-Roman').fontSize(13).fillColor('#334155');
        
        const descText = `Nacido(a) el día ${formatDate(cert.date_of_birth)}, hijo(a) de los esposos ${cert.father_name || 'N/A'} y ${cert.mother_name || 'N/A'}, fue presentado(a) al Señor Jesucristo en acto público de consagración, dedicación y bendición el día ${formatDate(cert.event_date)}.`;
        doc.text(descText, 80, bodyTextY + 65, { align: 'center', width: 632, lineGap: 6 });

        const localText = `Acto consagrado en la iglesia "${cert.church}" de ${cert.municipality}, ${cert.state}, oficiado por el Pastor ${cert.pastor}.`;
        doc.text(localText, 80, bodyTextY + 130, { align: 'center', width: 632 });

        if (cert.godparents_witnesses) {
          doc.font('Times-Italic').fontSize(11).fillColor('#475569')
             .text(`Padrinos de dedicación: ${cert.godparents_witnesses}`, 40, bodyTextY + 165, { align: 'center', width: 712 });
        }
      }

      // ---- 4. SECCIÓN DE FIRMAS Y FOLIO ----
      const footerY = 440;

      // Línea de firma: Secretario Local (Izquierda)
      doc.moveTo(100, footerY + 50)
         .lineTo(300, footerY + 50)
         .lineWidth(1)
         .stroke('#94a3b8');
      
      doc.font('Times-Bold').fontSize(11).fillColor('#1e3a8a')
         .text('SECRETARIO(A) LOCAL', 100, footerY + 55, { width: 200, align: 'center' })
         .font('Times-Roman').fontSize(9).fillColor('#64748b')
         .text('Iglesia Local y Fe Registral', 100, footerY + 68, { width: 200, align: 'center' });

      // Línea de firma: Pastor Principal (Derecha)
      doc.moveTo(492, footerY + 50)
         .lineTo(692, footerY + 50)
         .lineWidth(1)
         .stroke('#94a3b8');

      doc.font('Times-Bold').fontSize(11).fillColor('#1e3a8a')
         .text('PASTOR PRINCIPAL', 492, footerY + 55, { width: 200, align: 'center' })
         .font('Times-Roman').fontSize(9).fillColor('#64748b')
         .text('Oficial de la Iglesia General', 492, footerY + 68, { width: 200, align: 'center' });

      // Insertar imagen de la firma hológrafa del Pastor Principal (sobre la línea derecha)
      const signaturePath = path.resolve(__dirname, '../assets/firma_pastor.png');
      if (fs.existsSync(signaturePath)) {
        // La colocamos encima de la línea derecha de firma: x=542, y=footerY-20
        doc.image(signaturePath, 520, footerY - 30, { width: 140, height: 75 });
      }

      // ---- 5. CÓDIGO QR DE VALIDACIÓN (CENTRO ABAJO) ----
      const qrSize = 55;
      const qrX = 368; // (792 / 2) - (55 / 2)
      const qrY = 445;

      const qrBuffer = await qrcode.toBuffer(validateUrl, {
        margin: 1,
        color: {
          dark: '#1e3a8a', // QR en azul marino
          light: '#ffffff'
        }
      });
      doc.image(qrBuffer, qrX, qrY, { width: qrSize, height: qrSize });

      // Leyenda QR
      doc.font('Times-Roman').fontSize(7).fillColor('#64748b')
         .text('Escanear para validar autenticidad', 346, qrY + qrSize + 4, { width: 100, align: 'center' });

      // ---- 6. FOLIO EN CAJA ESTILIZADA (IZQUIERDA ARRIBA) ----
      doc.save();
      doc.roundedRect(40, 40, 150, 24, 3)
         .lineWidth(1)
         .stroke('#d4af37')
         .fill('#f8fafc');
      doc.font('Times-Bold').fontSize(9).fillColor('#1e3a8a')
         .text(`FOLIO: ${cert.folio}`, 45, 48, { width: 140, align: 'left' });
      doc.restore();

      // Sello de seguridad decorativo (Marca de agua de validez en el fondo de QR o esquina)
      doc.save();
      doc.font('Times-Bold').fontSize(7).fillColor('#10b981')
         .text('✓ CERTIFICADO DIGITAL OFICIAL', 40, 560, { width: 200 });
      doc.restore();

      doc.end();
    } catch (error) {
      console.error('Error al generar PDF del certificado:', error);
      reject(error);
    }
  });
};

module.exports = { generateCertificatePDF };
