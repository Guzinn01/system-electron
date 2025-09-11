// models/JornadaDeTrabalho.js

const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const JornadaDeTrabalho = sequelize.define(
  "JornadaDeTrabalho",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    data: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    entrada: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    almoco_saida: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    almoco_volta: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    saida: {
      type: DataTypes.DATE,
      allowNull: true,
    },

    observacao: {
      type: DataTypes.TEXT, 
      allowNull: true, 
    },
  },
  {
    tableName: "jornadas_de_trabalho",
    timestamps: true,
  }
);

module.exports = JornadaDeTrabalho;
