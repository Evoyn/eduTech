"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("Courses", "imageUrl", {
      type: Sequelize.STRING,
      defaultValue:
        "https://upload.wikimedia.org/wikipedia/commons/1/14/No_Image_Available.jpg",
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("Courses", "imageUrl");
  },
};
