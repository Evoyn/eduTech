const express = require("express");
const router = express.Router();
const AuthController = require("../controllers/authController");
const { isLoggedIn } = require("../middlewares/auth");

router.get("/login", AuthController.loginForm);
router.post("/login", AuthController.loginPost);
router.get("/register", AuthController.registerForm);
router.post("/register", AuthController.registerPost);

router.get("/profile", isLoggedIn, AuthController.profile);
router.post("/profile", isLoggedIn, AuthController.updateProfile);
router.get("/logout", isLoggedIn, AuthController.logout);

module.exports = router;
