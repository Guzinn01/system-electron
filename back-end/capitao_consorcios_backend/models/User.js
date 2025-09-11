// models/User.js

const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const User = sequelize.define(
  "User",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    username: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
      field: "senha_hash",
    },
    role: {
      type: DataTypes.ENUM("ADM", "VENDEDOR", "ADMINISTRATIVO", "SDR"),
      allowNull: false,
    },
    status: {
      type: DataTypes.STRING,
      defaultValue: "ativo",
    },

    onlineStatus: {
      type: DataTypes.ENUM("Online", "Offline"),
      defaultValue: "Offline",
      field: "online_status",
    },
    lastSeen: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "last_seen",
    },
    permissions: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    refreshToken: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: "usuarios",
    timestamps: false,
    indexes: [],
  }
);

module.exports = User;
