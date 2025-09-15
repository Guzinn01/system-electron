"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    // O que fazer quando a migration rodar: Adicionar a coluna 'observacao'
    await queryInterface.addColumn("jornadas_de_trabalho", "observacao", {
      type: Sequelize.TEXT,
      allowNull: true,
      after: "saida", // Opcional: coloca a coluna depois da coluna 'saida'
    });
  },

  async down(queryInterface, Sequelize) {
    // O que fazer se precisarmos desfazer a migration: Remover a coluna
    await queryInterface.removeColumn("jornadas_de_trabalho", "observacao");
  },
};
