"use strict";
const bcrypt = require("bcryptjs");
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    static associate(models) {
      User.hasOne(models.UserProfile, { foreignKey: "UserId" });
      User.hasMany(models.Course, { foreignKey: "UserId" });
      User.belongsToMany(models.Course, {
        through: models.Enrollment,
        foreignKey: "UserId",
      });
    }

    static async findByRole(role) {
      return await this.findAll({
        where: { role },
        include: ["UserProfile"],
      });
    }

    checkPassword(password) {
      return bcrypt.compareSync(password, this.password);
    }

    get displayName() {
      return this.username || this.email.split("@")[0];
    }
  }
  User.init(
    {
      username: {
        type: DataTypes.STRING,
        unique: {
          msg: "Username already taken",
        },
        validate: {
          notEmpty: {
            msg: "Username cannot be empty",
          },
        },
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: {
          msg: "Email already registered",
        },
        validate: {
          notNull: {
            msg: "Email is required",
          },
          notEmpty: {
            msg: "Email cannot be empty",
          },
          isEmail: {
            msg: "Invalid email format",
          },
        },
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notNull: {
            msg: "Password is required",
          },
          notEmpty: {
            msg: "Password cannot be empty",
          },
          len: {
            args: [8],
            msg: "Password must be at least 8 characters",
          },
        },
      },
      role: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notNull: {
            msg: "Role is required",
          },
          notEmpty: {
            msg: "Role cannot be empty",
          },
          isIn: {
            args: [["student", "instructor"]],
            msg: "Role must be either student or instructor",
          },
        },
      },
    },
    {
      sequelize,
      modelName: "User",
      hooks: {
        beforeCreate: (user) => {
          user.password = bcrypt.hashSync(user.password, 10);
        },
      },
    }
  );
  return User;
};
