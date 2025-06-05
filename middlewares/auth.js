const isLoggedIn = (req, res, next) => {
  if (!req.session.userId) {
    return res.redirect("/login?error=Please login first");
  }
  next();
};

const isInstructor = (req, res, next) => {
  if (req.session.role !== "instructor") {
    return res.redirect("/dashboard?error=Access denied. Instructors only.");
  }
  next();
};

const isStudent = (req, res, next) => {
  if (req.session.role !== "student") {
    return res.redirect("/dashboard?error=Access denied. Students only.");
  }
  next();
};

module.exports = {
  isLoggedIn,
  isInstructor,
  isStudent,
};
