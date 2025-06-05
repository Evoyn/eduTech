"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Enrollment extends Model {
    static associate(models) {
      models.Enrollment.belongsTo(models.Course, {
        foreignKey: "CourseId",
      });
      models.Enrollment.belongsTo(models.User, {
        foreignKey: "UserId",
      });
    }

    get formattedDate() {
      return new Date(this.enrollmentDate).toLocaleDateString("id-ID");
    }
  }
  Enrollment.init(
    {
      UserId: DataTypes.INTEGER,
      CourseId: DataTypes.INTEGER,
      enrollmentDate: {
        type: DataTypes.DATE,
        allowNull: false,
        validate: {
          notNull: {
            msg: "Enrollment date is required",
          },
        },
      },
      status: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "active",
        validate: {
          notNull: {
            msg: "Status is required",
          },
          isIn: {
            args: [["active", "completed", "dropped"]],
            msg: "Invalid status",
          },
        },
      },
    },
    {
      sequelize,
      modelName: "Enrollment",
    }
  );
  return Enrollment;
};
