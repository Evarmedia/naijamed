const { Sequelize } = require('sequelize');
const path = require('path');

// Get environment
const NODE_ENV = process.env.NODE_ENV || 'development';
const EXTERNAL_DATABASE_URL = process.env.EXTERNAL_DATABASE_URL;
const DATABASE_URL = process.env.DATABASE_URL;
const DB_URL = EXTERNAL_DATABASE_URL || DATABASE_URL;

if (!DB_URL) {
  console.error("Error: No database URL provided. Please set DATABASE_URL or EXTERNAL_DATABASE_URL.");
  process.exit(1);
}

console.log(`Connecting to PostgreSQL database (${NODE_ENV} environment)`);

const sequelize = new Sequelize(DB_URL, {
  dialect: "postgres",
  protocol: "postgres",
  logging: NODE_ENV === "development" ? console.log : false,
  dialectOptions: {
    ssl: DB_URL.includes('render.com') ? {
      require: true,
      rejectUnauthorized: false,
    } : false,
  },
});

module.exports = sequelize;
