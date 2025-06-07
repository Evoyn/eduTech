const { User, UserProfile } = require("../models");

class AuthController {
  static async loginForm(req, res) {
    try {
      const { error, success } = req.query;
      res.render("login", { error, success });
    } catch (error) {
      res.send(error);
    }
  }

  static async loginPost(req, res) {
    try {
      const { email, password } = req.body;

      const user = await User.findOne({
        where: { email },
        include: ["UserProfile"],
      });

      if (!user) {
        return res.redirect("/login?error=Invalid email or password");
      }

      const isValidPassword = await user.checkPassword(password);

      if (!isValidPassword) {
        return res.redirect("/login?error=Invalid email or password");
      }

      req.session.userId = user.id;
      req.session.username = user.username;
      req.session.role = user.role;
      req.session.fullName = user.UserProfile.fullName;

      if (user.role === "instructor") {
        res.redirect("/dashboard?success=Welcome back, Instructor!");
      } else {
        res.redirect("/dashboard?success=Welcome back!");
      }
    } catch (error) {
      res.send(error);
    }
  }

  static async registerForm(req, res) {
    try {
      const { error } = req.query;
      res.render("register", { error });
    } catch (error) {
      res.send(error);
    }
  }

  static async registerPost(req, res) {
    try {
      const {
        username,
        email,
        password,
        role,
        fullName,
        phoneNumber,
        dateOfBirth,
        address,
      } = req.body;

      const existingUser = await User.findOne({
        where: { email },
      });

      if (existingUser) {
        return res.redirect("/register?error=Email already registered");
      }

      const user = await User.create({
        username,
        email,
        password,
        role,
      });

      await UserProfile.create({
        UserId: user.id,
        fullName,
        phoneNumber,
        dateOfBirth: dateOfBirth || null,
        address,
      });

      res.redirect("/login?success=Registration successful! Please login.");
    } catch (error) {
      if (error.name === "SequelizeValidationError") {
        const errorMessages = error.errors.map((e) => e.message).join(", ");
        return res.redirect(`/register?error=${errorMessages}`);
      }

      if (error.name === "SequelizeUniqueConstraintError") {
        let errorMessage = "";

        if (error.fields.username) {
          errorMessage = "Username already taken";
        } else if (error.fields.email) {
          errorMessage = "Email already registered";
        }

        return res.redirect(`/register?error=${errorMessage}`);
      }
      
      res.send(error);
    }
  }

  static async logout(req, res) {
    req.session.destroy((err) => {
      if (err) {
        return res.redirect("/dashboard");
      }
      res.redirect("/?success=You have been logged out successfully");
    });
  }

  static async profile(req, res) {
    try {
      const user = await User.findByPk(req.session.userId, {
        include: ["UserProfile"],
      });

      if (!user) {
        return res.redirect("/login?error=Please login first");
      }

      const { formatDate } = require("../helpers/formatter");
      res.render("profile", { user, formatDate });
    } catch (error) {
      res.send(error);
    }
  }

  static async updateProfile(req, res) {
    try {
      const { fullName, phoneNumber, address, dateOfBirth } = req.body;

      const userProfile = await UserProfile.findOne({
        where: { UserId: req.session.userId },
      });

      if (!userProfile) {
        return res.redirect("/profile?error=Profile not found");
      }

      await userProfile.update({
        fullName,
        phoneNumber,
        address,
        dateOfBirth: dateOfBirth || null,
      });

      req.session.fullName = fullName;

      res.redirect("/");
    } catch (error) {
      if (error.name === "SequelizeValidationError") {
        const errorMessages = error.errors.map((e) => e.message).join(", ");
        return res.redirect(`/profile?error=${errorMessages}`);
      }
      res.send(error);
    }
  }
}

module.exports = AuthController;
