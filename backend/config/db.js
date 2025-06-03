const { Sequelize } = require('sequelize');
const path = require('path');

// Initialize Sequelize
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(__dirname, '../naijamed.db'), //
  logging: false, // Disable SQL logging (optional)
});

module.exports = sequelize;
