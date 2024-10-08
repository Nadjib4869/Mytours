const express = require("express");
const tourController = require("../controllers/tourController");
const authController = require("../controllers/authController");
const reviewRouter = require("../routes/reviewRoutes");

const router = express.Router();

// router.param('id', tourController.checkID);

//? Nested Routes
// POST /tours/324b2/reviews
// GET /tours/324b2/reviews
// GET /tours/324b2/reviews/435gh

// router
//   .route("/:tourId/reviews")
//   .post(
//     authController.protect,
//     authController.restrictTo("user"),
//     reviewController.createReview
//   );

router.use("/:tourId/reviews", reviewRouter);

router
  .route("/top-5-cheap")
  .get(tourController.aliasTopTours, tourController.getAllTours);

router.route("/tour-stats").get(tourController.getTourStats);

router
  .route("/monthly-plan/:year")
  .get(
    authController.protect,
    authController.restrictTo("admin", "lead-guide", "guide"),
    tourController.getMonthlyPlan
  );

//? Using query string : /tours-within?distance=233&center=35.37000514889885,-119.01085177568844&unit=mi
//? Using query params (our case) : /tours-within/233/center/35.37000514889885,-119.01085177568844/unit/mi
router
  .route("/tours-within/:distance/center/:latlng/unit/:unit")
  .get(tourController.getToursWithin);

//? calculate distance between user location and start location
//? /distances/35.37000514889885,-119.01085177568844/unit/mi
router.route("/distances/:latlng/unit/:unit").get(tourController.getDistances);

router
  .route("/")
  .get(tourController.getAllTours)
  .post(
    authController.protect,
    authController.restrictTo("admin", "lead-guide"),
    tourController.createTour
  );

router
  .route("/:id")
  .get(tourController.getTour)
  .patch(
    authController.protect,
    authController.restrictTo("admin", "lead-guide"),
    tourController.uploadTourImages,
    tourController.resizeTourImages,
    tourController.updateTour
  ) //! *REMEMBER* PATCH : to update only some fields of the doc, PUT : to update the whole doc
  .delete(
    authController.protect,
    authController.restrictTo("admin", "lead-guide"),
    tourController.deleteTour
  );

module.exports = router;
