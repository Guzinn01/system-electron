"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Adiciona todas as colunas que faltam na tabela 'clientes'
    await queryInterface.addColumn("clientes", "data_nascimento", {
      type: Sequelize.DATEONLY,
      allowNull: true,
    });
    await queryInterface.addColumn("clientes", "profissao", {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn("clientes", "estado_civil", {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn("clientes", "cep", {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn("clientes", "rua", {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn("clientes", "numero", {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn("clientes", "bairro", {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn("clientes", "conjuge_nome_completo", {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn("clientes", "conjuge_cpf", {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn("clientes", "conjuge_data_nascimento", {
      type: Sequelize.DATEONLY,
      allowNull: true,
    });
    await queryInterface.addColumn("clientes", "conjuge_email", {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn("clientes", "conjuge_telefone", {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn("clientes", "statusCliente", {
      type: Sequelize.STRING,
      defaultValue: "Ativo",
      allowNull: false,
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Desfaz as alterações caso seja necessário reverter a migration
    await queryInterface.removeColumn("clientes", "data_nascimento");
    await queryInterface.removeColumn("clientes", "profissao");
    await queryInterface.removeColumn("clientes", "estado_civil");
    await queryInterface.removeColumn("clientes", "cep");
    await queryInterface.removeColumn("clientes", "rua");
    await queryInterface.removeColumn("clientes", "numero");
    await queryInterface.removeColumn("clientes", "bairro");
    await queryInterface.removeColumn("clientes", "conjuge_nome_completo");
    await queryInterface.removeColumn("clientes", "conjuge_cpf");
    await queryInterface.removeColumn("clientes", "conjuge_data_nascimento");
    await queryInterface.removeColumn("clientes", "conjuge_email");
    await queryInterface.removeColumn("clientes", "conjuge_telefone");
    await queryInterface.removeColumn("clientes", "statusCliente");
  },
};
