// models/HistoricoConsorcio.js
const { DataTypes } = require("sequelize");
const sequelize = require("../../config/database");

const HistoricoConsorcio = sequelize.define(
  "HistoricoConsorcio",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    tipoEvento: {
      type: DataTypes.ENUM(
        "CRIACAO",
        "EDICAO",
        "TRANSFERENCIA",
        "EXCLUSAO_CONTRATO"
      ),
      allowNull: false,
    },
    detalhes: {
      type: DataTypes.JSON,
      allowNull: false,
    },
  },
  {
    tableName: "historico_consorcios",
    timestamps: true,
    updatedAt: false,
  }
);

module.exports = HistoricoConsorcio;
