// config/database.js

const { Sequelize } = require("sequelize");
require("dotenv").config();

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    dialect: "mysql",
    logging: false,
    dialectOptions: {
      charset: "utf8mb4",
      collate: "utf8mb4_unicode_ci",
    },
  }
);
module.exports = sequelize;
