"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class UserProfile extends Model {
    static associate(models) {
      UserProfile.belongsTo(models.User, { foreignKey: "UserId" });
    }

    get age() {
      if (!this.dateOfBirth) return null;
      const today = new Date();
      const birthDate = new Date(this.dateOfBirth);
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (
        monthDiff < 0 ||
        (monthDiff === 0 && today.getDate() < birthDate.getDate())
      ) {
        age--;
      }
      return age;
    }
  }
  UserProfile.init(
    {
      fullName: {
        type: DataTypes.STRING,
        validate: {
          notEmpty: {
            msg: "Full name cannot be empty",
          },
        },
      },
      phoneNumber: DataTypes.STRING,
      address: DataTypes.TEXT,
      dateOfBirth: DataTypes.DATE,
      UserId: DataTypes.INTEGER,
    },
    {
      sequelize,
      modelName: "UserProfile",
    }
  );
  return UserProfile;
};
