require('dotenv').config();
const { Sequelize } = require('sequelize');
const path = require('path');

let sequelize;

if (process.env.DB_DIALECT === 'sqlite' || !process.env.DB_DIALECT) {
  const storagePath = process.env.DB_STORAGE 
    ? path.resolve(process.env.DB_STORAGE) 
    : path.resolve(__dirname, '../database.sqlite');
  
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: storagePath,
    logging: false // Deshabilitar logs de consola para un output limpio
  });
} else {
  sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASS,
    {
      host: process.env.DB_HOST || 'localhost',
      dialect: process.env.DB_DIALECT,
      port: process.env.DB_PORT || (process.env.DB_DIALECT === 'postgres' ? 5432 : 3306),
      logging: false,
      pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
      }
    }
  );
}

module.exports = sequelize;
