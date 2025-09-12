// models/Cliente.js

const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const sequelize = require("../../config/database");

const Cliente = sequelize.define(
  "Cliente",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    tipo_pessoa: {
      type: DataTypes.ENUM("Fisica", "Juridica"),
      allowNull: false,
    },
    nome_completo: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    cpf_cnpj: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        isEmail: true,
      },
    },
    telefone: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    // --- CAMPOS ADICIONADOS ---
    data_nascimento: {
      type: DataTypes.DATEONLY, // Usar DATEONLY para não guardar a hora
      allowNull: true,
    },
    profissao: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    estado_civil: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    cep: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    rua: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    numero: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    bairro: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    // --- CAMPOS DO CÔNJUGE ADICIONADOS ---
    conjuge_nome_completo: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    conjuge_cpf: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    conjuge_data_nascimento: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    conjuge_email: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    conjuge_telefone: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    // --- CAMPO DE SÓCIOS ---
    socios: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    // --- CAMPO DE STATUS DO CLIENTE ---
    statusCliente: {
      type: DataTypes.STRING,
      defaultValue: "Ativo",
      allowNull: false,
    },
  },
  {
    tableName: "clientes",
    timestamps: true,
  }
);

module.exports = Cliente;
