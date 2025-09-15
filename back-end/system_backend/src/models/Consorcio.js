// models/Consorcio.js
const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Consorcio = sequelize.define(
  "Consorcio",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    administradora: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    grupo: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    cota: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    creditoContratado: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    duracaoMeses: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    dataInicio: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    numeroContrato: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    caminhoContratoPDF: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    tableName: "consorcios",
    timestamps: true,
  }
);

module.exports = Consorcio;
