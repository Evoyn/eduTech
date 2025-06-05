"use strict";
const fs = require("fs").promises;

module.exports = {
  async up(queryInterface, Sequelize) {
    let data = JSON.parse(
      await fs.readFile("./data/categories.json", "utf-8")
    ).map((el) => {
      el.createdAt = new Date();
      el.updatedAt = new Date();
      return el;
    });
    await queryInterface.bulkInsert("Categories", data, {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("Categories", null, {});
  },
};
