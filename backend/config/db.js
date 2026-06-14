const { Sequelize } = require("sequelize");

// Get environment
const NODE_ENV = process.env.NODE_ENV || "development";

const DB_URL =
  NODE_ENV === "production"
    ? process.env.EXTERNAL_DATABASE_URL
    : process.env.DATABASE_URL;

if (!DB_URL) {
  console.error(
    `Error: No database URL provided for ${NODE_ENV} environment. ${
      NODE_ENV === "production"
        ? "Please set EXTERNAL_DATABASE_URL."
        : "Please set DATABASE_URL."
    }`,
  );
  process.exit(1);
}

console.log(`Connecting to PostgreSQL database (${NODE_ENV} environment)`);

const sequelize = new Sequelize(DB_URL, {
  dialect: "postgres",
  protocol: "postgres",
  logging: NODE_ENV === "development" ? console.log : false,
  dialectOptions: {
    ssl:
      NODE_ENV === "production"
        ? {
            require: true,
            rejectUnauthorized: false,
          }
        : false,
  },
});

module.exports = sequelize;
