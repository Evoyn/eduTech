const express = require("express");
const router = express.Router();
const Controller = require("../controllers/controller");
const { isLoggedIn, isInstructor, isStudent } = require("../middlewares/auth");

router.get("/", Controller.courses);

router.get("/add", isLoggedIn, isInstructor, Controller.addCourseForm);
router.post("/add", isLoggedIn, isInstructor, Controller.addCoursePost);

router.get("/:id", Controller.courseDetail);
router.get("/:id/edit", isLoggedIn, isInstructor, Controller.editCourseForm);
router.post("/:id/edit", isLoggedIn, isInstructor, Controller.editCoursePost);
router.get("/:id/delete", isLoggedIn, isInstructor, Controller.deleteCourse);

router.post("/:id/enroll", isLoggedIn, isStudent, Controller.enrollCourse);
router.post("/:id/complete", isLoggedIn, isStudent, Controller.completeCourse);

module.exports = router;
