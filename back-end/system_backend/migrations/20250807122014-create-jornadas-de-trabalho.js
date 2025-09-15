'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('jornadas_de_trabalho', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'usuarios', // Garanta que sua tabela de usuários se chama 'usuarios'
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      data: {
        type: Sequelize.DATEONLY,
        allowNull: false
      },
      entrada: {
        type: Sequelize.DATE,
        allowNull: true
      },
      almoco_saida: {
        type: Sequelize.DATE,
        allowNull: true
      },
      almoco_volta: {
        type: Sequelize.DATE,
        allowNull: true
      },
      saida: {
        type: Sequelize.DATE,
        allowNull: true
      },
      // O campo 'observacao' será adicionado pela outra migration
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
    await queryInterface.dropTable('jornadas_de_trabalho');
  }
};