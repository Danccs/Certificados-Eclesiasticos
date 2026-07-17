const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Certificate = sequelize.define('Certificate', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  folio: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  type: {
    type: DataTypes.ENUM('bautizo', 'matrimonio', 'presentacion'),
    allowNull: false
  },
  event_date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  name_fiel_1: {
    type: DataTypes.STRING,
    allowNull: false // Bautizado, Novio, Niño presentado
  },
  name_fiel_2: {
    type: DataTypes.STRING,
    allowNull: true // Novia (solo matrimonios)
  },
  date_of_birth: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  father_name: {
    type: DataTypes.STRING,
    allowNull: true
  },
  mother_name: {
    type: DataTypes.STRING,
    allowNull: true
  },
  godparents_witnesses: {
    type: DataTypes.STRING,
    allowNull: true // Padrinos para bautizos/presentaciones, Testigos para matrimonios
  },
  pastor: {
    type: DataTypes.STRING,
    allowNull: false
  },
  church: {
    type: DataTypes.STRING,
    allowNull: false
  },
  municipality: {
    type: DataTypes.STRING,
    allowNull: false
  },
  state: {
    type: DataTypes.STRING,
    allowNull: false
  },
  observations: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  created_by: {
    type: DataTypes.INTEGER,
    allowNull: false
  }
}, {
  timestamps: true,
  tableName: 'certificates'
});

module.exports = Certificate;
