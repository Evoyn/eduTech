const express = require("express");
const router = express.Router();
const Controller = require("../controllers/controller");
const authRoutes = require("./authRoutes");
const courseRoutes = require("./courseRoutes");
const { isLoggedIn, isStudent } = require("../middlewares/auth");

router.get("/", Controller.home);

router.use("/", authRoutes);

router.use("/courses", courseRoutes);

router.get("/dashboard", isLoggedIn, Controller.dashboard);
router.get(
  "/certificate/:userId/:courseId",
  isLoggedIn,
  isStudent,
  Controller.generateCertificate
);

module.exports = router;
