'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('usuarios', 'online_status', {
      type: Sequelize.ENUM('Online', 'Offline'),
      defaultValue: 'Offline',
      allowNull: false
    });
    await queryInterface.addColumn('usuarios', 'last_seen', {
      type: Sequelize.DATE,
      allowNull: true
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('usuarios', 'online_status');
    await queryInterface.removeColumn('usuarios', 'last_seen');
  }
};