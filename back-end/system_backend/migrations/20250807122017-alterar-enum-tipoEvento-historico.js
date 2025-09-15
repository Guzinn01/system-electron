"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.changeColumn('historico_consorcios', 'tipo_evento', {
      type: Sequelize.ENUM(
        "CRIACAO",
        "EDICAO",
        "TRANSFERENCIA",
        "EXCLUSAO_CONTRATO"
      ),
      allowNull: false,
    });
  },

  async down(queryInterface, Sequelize) {
    // Reverte para a lista antiga se precisarmos desfazer
    await queryInterface.changeColumn('historico_consorcios', 'tipo_evento', {
      type: Sequelize.ENUM("CRIACAO", "EDICAO", "TRANSFERENCIA"),
      allowNull: false,
    });
  },
};
