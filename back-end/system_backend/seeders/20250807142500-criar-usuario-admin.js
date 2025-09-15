"use strict";
const bcrypt = require("bcryptjs");

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const hashedPassword = await bcrypt.hash("123456", 10);

    await queryInterface.bulkInsert(
      "usuarios",
      [
        {
          username: "admin",
          email: "admin@example.com",
          // O bulkInsert usa o nome da coluna do banco: 'senha_hash'
          senha_hash: hashedPassword,
          role: "ADM",
          status: "ativo",
          permissions: JSON.stringify([
            "system_admin",
            "gestao_clientes",
            "clientes_cadastrar",
            "clientes_editar",
            "clientes_excluir",
            "clientes_gerenciar_consorcios",
            "clientes_transferir_consorcios",
            "view_clients",
            "ponto",
            "simulador_parcelas",
            "sorteio",
            "gestao_usuarios",
            "gestao_lances",
            "lances_upload",
          ]),
        },
      ],
      {}
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("usuarios", { username: "admin" }, {});
  },
};