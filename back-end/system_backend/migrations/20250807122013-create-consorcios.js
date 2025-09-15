'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('consorcios', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      cliente_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'clientes', // Referencia a tabela 'clientes'
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      grupo: {
        type: Sequelize.STRING,
        allowNull: false
      },
      cota: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      valor_credito: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      situacao: {
        type: Sequelize.ENUM('ativo', 'cancelado', 'contemplado', 'transferido'),
        defaultValue: 'ativo',
        allowNull: false
      },
      data_adesao: {
        type: Sequelize.DATEONLY,
        allowNull: false
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('consorcios');
  }
};