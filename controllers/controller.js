const {
  User,
  Course,
  Category,
  Enrollment,
  UserProfile,
} = require("../models");
const { Op } = require("sequelize");
const {
  formatRupiah,
  formatDate,
  getDurationInHours,
} = require("../helpers/formatter");

class Controller {
  static async home(req, res) {
    try {
      const { success } = req.query;
      res.render("home", { success });
    } catch (error) {
      res.send(error);
    }
  }

  static async courses(req, res) {
    try {
      const { search, category, sort } = req.query;

      let courses;

      if (search && !category) {
        courses = await Course.searchByName(search);

        if (sort === "name") {
          courses.sort((a, b) => a.name.localeCompare(b.name));
        } else if (sort === "price-asc") {
          courses.sort((a, b) => a.price - b.price);
        } else if (sort === "price-desc") {
          courses.sort((a, b) => b.price - a.price);
        }
      } else {
        let whereClause = {};

        if (search) {
          whereClause = {
            [Op.or]: [
              { name: { [Op.iLike]: `%${search}%` } },
              { description: { [Op.iLike]: `%${search}%` } },
            ],
          };
        }

        if (category) {
          whereClause.CategoryId = category;
        }

        let orderClause = [["createdAt", "DESC"]];
        if (sort === "name") orderClause = [["name", "ASC"]];
        else if (sort === "price-asc") orderClause = [["price", "ASC"]];
        else if (sort === "price-desc") orderClause = [["price", "DESC"]];

        courses = await Course.findAll({
          where: whereClause,
          include: [
            { model: Category, attributes: ["name"] },
            {
              model: User,
              as: "Instructor",
              attributes: ["username", "email"],
            },
          ],
          order: orderClause,
        });
      }

      const categories = await Category.findAll({ order: [["name", "ASC"]] });

      res.render("courses", {
        courses,
        categories,
        formatRupiah,
        getDurationInHours,
        search,
        selectedCategory: category,
        sort,
      });
    } catch (error) {
      res.send(error);
    }
  }

  static async courseDetail(req, res) {
    try {
      const { id } = req.params;
      const { error, success } = req.query;

      if (isNaN(id)) {
        return res.redirect("/courses?error=Invalid course ID");
      }

      const course = await Course.findByPk(id, {
        include: [
          {
            model: Category,
            attributes: ["name"],
          },
          {
            model: User,
            as: "Instructor",
            attributes: ["username", "email"],
            include: [
              {
                model: UserProfile,
                attributes: ["fullName"],
              },
            ],
          },
          {
            model: User,
            as: "Students",
            attributes: ["username", "email"],
            through: {
              attributes: [],
            },
            include: [
              {
                model: UserProfile,
                attributes: ["fullName"],
              },
            ],
          },
        ],
      });

      if (!course) {
        return res.redirect("/courses?error=Course not found");
      }

      let isEnrolled = false;
      let enrollment = null;

      if (req.session.userId) {
        enrollment = await Enrollment.findOne({
          where: {
            UserId: req.session.userId,
            CourseId: id,
          },
        });
        isEnrolled = !!enrollment;
      }

      res.render("courseDetail", {
        course,
        formatRupiah,
        getDurationInHours,
        isEnrolled,
        enrollment,
        error,
        success,
      });
    } catch (error) {
      res.send(error);
    }
  }

  static async dashboard(req, res) {
    try {
      const { error, success } = req.query;
      const userId = req.session.userId;
      const role = req.session.role;

      const user = await User.findByPk(userId, {
        include: ["UserProfile"],
      });

      let data = {};

      if (role === "instructor") {
        data.courses = await Course.findAll({
          where: { UserId: userId },
          include: [
            {
              model: Category,
              attributes: ["name"],
            },
          ],
          order: [["createdAt", "DESC"]],
        });
      } else {
        const enrollments = await Enrollment.findAll({
          where: { UserId: userId },
          include: [
            {
              model: Course,
              include: [
                {
                  model: Category,
                  attributes: ["name"],
                },
                {
                  model: User,
                  as: "Instructor",
                  attributes: ["username", "email"],
                },
              ],
            },
          ],
          order: [["enrollmentDate", "DESC"]],
        });

        data.enrollments = enrollments.map((enrollment) => {
          const enrollmentObj = enrollment.toJSON();
          return {
            id: enrollmentObj.id,
            UserId: enrollmentObj.UserId,
            CourseId: enrollmentObj.CourseId,
            enrollmentDate: enrollmentObj.enrollmentDate,
            status: enrollmentObj.status,
            createdAt: enrollmentObj.createdAt,
            updatedAt: enrollmentObj.updatedAt,
            Course: enrollmentObj.Course,
            formattedDate: formatDate(enrollment.enrollmentDate),
          };
        });
      }

      res.render("dashboard", {
        user,
        data,
        formatRupiah,
        getDurationInHours,
        error,
        success,
      });
    } catch (error) {
      console.log(error);
      res.send(error);
    }
  }

  static async addCourseForm(req, res) {
    try {
      const categories = await Category.findAll({
        order: [["name", "ASC"]],
      });

      res.render("courseAdd", { categories });
    } catch (error) {
      res.send(error);
    }
  }

  static async addCoursePost(req, res) {
    try {
      const { name, description, CategoryId, duration, price, imageUrl } =
        req.body;

      await Course.create({
        name,
        description,
        CategoryId,
        duration: parseInt(duration),
        price: parseInt(price),
        imageUrl:
          imageUrl ||
          "https://upload.wikimedia.org/wikipedia/commons/1/14/No_Image_Available.jpg",
        UserId: req.session.userId,
      });

      res.redirect("/dashboard?success=Course created successfully!");
    } catch (error) {
      if (error.name === "SequelizeValidationError") {
        const errorMessages = error.errors.map((e) => e.message).join(", ");
        return res.redirect(`/courses/add?error=${errorMessages}`);
      }
      console.log(error);
      res.send(error);
    }
  }

  static async editCourseForm(req, res) {
    try {
      const { id } = req.params;

      const course = await Course.findOne({
        where: {
          id,
          UserId: req.session.userId,
        },
      });

      if (!course) {
        return res.redirect(
          "/dashboard?error=Course not found or unauthorized"
        );
      }

      const categories = await Category.findAll({
        order: [["name", "ASC"]],
      });

      res.render("courseEdit", { course, categories });
    } catch (error) {
      res.send(error);
    }
  }

  static async editCoursePost(req, res) {
    try {
      const { id } = req.params;
      const { name, description, CategoryId, duration, price, imageUrl } =
        req.body;

      const course = await Course.findOne({
        where: {
          id,
          UserId: req.session.userId,
        },
      });

      if (!course) {
        return res.redirect(
          "/dashboard?error=Course not found or unauthorized"
        );
      }

      await course.update({
        name,
        description,
        CategoryId,
        duration: parseInt(duration),
        price: parseInt(price),
        imageUrl:
          imageUrl ||
          "https://upload.wikimedia.org/wikipedia/commons/1/14/No_Image_Available.jpg",
      });

      res.redirect("/dashboard?success=Course updated successfully!");
    } catch (error) {
      if (error.name === "SequelizeValidationError") {
        const errorMessages = error.errors.map((e) => e.message).join(", ");
        return res.redirect(`/courses/${id}/edit?error=${errorMessages}`);
      }
      res.send(error);
    }
  }

  static async deleteCourse(req, res) {
    try {
      const { id } = req.params;

      const course = await Course.findOne({
        where: {
          id,
          UserId: req.session.userId,
        },
      });

      if (!course) {
        return res.redirect(
          "/dashboard?error=Course not found or unauthorized"
        );
      }

      const courseName = course.name;

      await Course.destroy({ where: { id } });
      await Enrollment.destroy({ where: { CourseId: id } });

      res.redirect(
        `/dashboard?success=Course "${courseName}" has been deleted successfully!`
      );
    } catch (error) {
      console.error(error);
      res.redirect("/dashboard?error=Failed to delete course");
    }
  }

  static async enrollCourse(req, res) {
    try {
      const { id } = req.params;

      const existingEnrollment = await Enrollment.findOne({
        where: {
          UserId: req.session.userId,
          CourseId: id,
        },
      });

      if (existingEnrollment) {
        return res.redirect(
          `/courses/${id}?error=You are already enrolled in this course`
        );
      }

      const course = await Course.findByPk(id);
      if (!course) {
        return res.redirect("/courses?error=Course not found");
      }

      await Enrollment.create({
        UserId: req.session.userId,
        CourseId: id,
        enrollmentDate: new Date(),
        status: "active",
      });

      res.redirect(
        `/courses/${id}?success=Successfully enrolled in the course!`
      );
    } catch (error) {
      res.send(error);
    }
  }

  static async generateCertificate(req, res) {
    try {
      const { userId, courseId } = req.params;
      const QRCode = require("qrcode");

      if (parseInt(userId) !== req.session.userId) {
        return res.redirect("/dashboard?error=Unauthorized access");
      }

      const enrollment = await Enrollment.findOne({
        where: {
          UserId: userId,
          CourseId: courseId,
          status: "completed",
        },
        include: [
          {
            model: User,
            include: ["UserProfile"],
          },
          Course,
        ],
      });

      if (!enrollment) {
        return res.redirect(
          "/dashboard?error=Certificate not available. Please complete the course first."
        );
      }

      const certificateData = {
        studentName: enrollment.User.UserProfile.fullName,
        courseName: enrollment.Course.name,
        completionDate: enrollment.updatedAt,
        certificateId: `CERT-${userId}-${courseId}-${Date.now()}`,
      };

      const qrCodeDataUrl = await QRCode.toDataURL(
        JSON.stringify(certificateData)
      );

      res.render("certificate", {
        enrollment,
        qrCodeDataUrl,
        certificateData,
        formatDate,
      });
    } catch (error) {
      console.error("Certificate generation error:", error);
      res.redirect("/dashboard?error=Failed to generate certificate");
    }
  }

  static async completeCourse(req, res) {
    try {
      const { id } = req.params;

      const enrollment = await Enrollment.findOne({
        where: {
          UserId: req.session.userId,
          CourseId: id,
        },
      });

      if (!enrollment) {
        return res.redirect(
          `/courses/${id}?error=You are not enrolled in this course`
        );
      }

      if (enrollment.status === "completed") {
        return res.redirect(`/courses/${id}?error=Course already completed`);
      }

      await enrollment.update({
        status: "completed",
      });

      res.redirect(
        `/courses/${id}?success=Congratulations! You have completed the course. You can now generate your certificate.`
      );
    } catch (error) {
      res.send(error);
    }
  }
}

module.exports = Controller;
