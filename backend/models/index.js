const sequelize = require('../config/database');
const User = require('./user');
const Certificate = require('./certificate');

// Definir relaciones
Certificate.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });
User.hasMany(Certificate, { foreignKey: 'created_by' });

module.exports = {
  sequelize,
  User,
  Certificate
};
