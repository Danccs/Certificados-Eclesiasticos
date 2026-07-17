require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const { sequelize, User } = require('./models');

const authRoutes = require('./routes/auth');
const certificateRoutes = require('./routes/certificates');

const app = express();

// Configuración de Middlewares
app.use(cors({
  origin: '*', // Permitir cualquier origen para desarrollo, o configurar el del frontend (ej: http://localhost:5173)
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Definición de Rutas
app.use('/api/auth', authRoutes);
app.use('/api/certificates', certificateRoutes);

// Ruta de prueba base
app.get('/', (req, res) => {
  res.json({ message: 'API del Sistema de Certificados Eclesiásticos Digitales' });
});

// Función de inicialización
const startServer = async () => {
  try {
    // Sincronizar base de datos
    await sequelize.sync({ force: false }); // force: false asegura que no borre datos existentes
    console.log('✓ Base de datos sincronizada correctamente.');

    // Semilla: Crear un Secretario Local por defecto si la tabla está vacía
    const userCount = await User.count();
    if (userCount === 0) {
      const hashedPassword = await bcrypt.hash('iglesia123', 10);
      await User.create({
        username: 'secretario',
        password: hashedPassword,
        role: 'Secretario Local'
      });
      console.log('⚠ Semilla: Usuario por defecto creado (Usuario: "secretario", Contraseña: "iglesia123")');
    }

    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`✓ Servidor escuchando en http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('✗ Fallo al iniciar el servidor:', error);
    process.exit(1);
  }
};

startServer();
