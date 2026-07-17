const jwt = require('jsonwebtoken');
const { User } = require('../models');

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'supersecretchurchtokenkey123!');

      req.user = await User.findByPk(decoded.id);
      if (!req.user) {
        return res.status(401).json({ message: 'Usuario no encontrado' });
      }

      // Validar rol de Secretario Local
      if (req.user.role !== 'Secretario Local') {
        return res.status(403).json({ message: 'Acceso denegado: Se requiere rol de Secretario Local' });
      }

      return next();
    } catch (error) {
      console.error('Error en autenticación:', error);
      return res.status(401).json({ message: 'Token no válido' });
    }
  }

  if (!token) {
    return res.status(401).json({ message: 'No autorizado, sin token' });
  }
};

module.exports = { protect };
