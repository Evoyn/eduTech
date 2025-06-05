"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Course extends Model {
    static associate(models) {
      Course.belongsTo(models.Category, { foreignKey: "CategoryId" });
      Course.belongsTo(models.User, { foreignKey: "UserId", as: "Instructor" });
      Course.belongsToMany(models.User, {
        through: models.Enrollment,
        foreignKey: "CourseId",
        as: "Students",
      });
    }

    static async searchByName(keyword) {
      const { Op } = require("sequelize");
      return await this.findAll({
        where: {
          name: {
            [Op.iLike]: `%${keyword}%`,
          },
        },
        include: ["Category", "Instructor"],
      });
    }

    getDurationInHours() {
      return `${Math.floor(this.duration / 60)} hours ${
        this.duration % 60
      } minutes`;
    }

    get formattedPrice() {
      return `Rp ${this.price.toLocaleString("id-ID")}`;
    }
  }
  Course.init(
    {
      name: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notNull: {
            msg: "Course name is required",
          },
          notEmpty: {
            msg: "Course name cannot be empty",
          },
        },
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: false,
        validate: {
          notNull: {
            msg: "Description is required",
          },
          notEmpty: {
            msg: "Description cannot be empty",
          },
        },
      },
      duration: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          notNull: {
            msg: "Duration is required",
          },
          notEmpty: {
            msg: "Duration cannot be empty",
          },
          min: {
            args: [30],
            msg: "Duration must be at least 30 minutes",
          },
        },
      },
      price: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          notNull: {
            msg: "Price is required",
          },
          notEmpty: {
            msg: "Price cannot be empty",
          },
          min: {
            args: [0],
            msg: "Price cannot be negative",
          },
        },
      },
      imageUrl: {
        type: DataTypes.STRING,
        defaultValue:
          "https://upload.wikimedia.org/wikipedia/commons/1/14/No_Image_Available.jpg",
      },
      CategoryId: DataTypes.INTEGER,
      UserId: DataTypes.INTEGER,
    },
    {
      sequelize,
      modelName: "Course",
      hooks: {
        beforeCreate: (course) => {
          if (!course.imageUrl) {
            course.imageUrl =
              "https://upload.wikimedia.org/wikipedia/commons/1/14/No_Image_Available.jpg";
          }
        },
      },
    }
  );
  return Course;
};
