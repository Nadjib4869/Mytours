const express = require("express");
const viewsController = require("../controllers/viewsController");
const authController = require("../controllers/authController");

const router = express.Router();

router.use(viewsController.alerts);

router.get(
  "/",
  //bookingController.createBookingCheckout, //? after this middleware is done it will redirect to root without the query string, so it goes next directly (cuz the query string isn't defined this time)
  authController.isLoggedIn,
  viewsController.getOverview
);
router.get("/tour/:slug", authController.isLoggedIn, viewsController.getTour);
router.get("/login", authController.isLoggedIn, viewsController.getLoginForm);
router.get("/signup", authController.isLoggedIn, viewsController.getSignupForm);
router.get("/me", authController.protect, viewsController.getAccount);
router.get(
  "/my-bookings",
  authController.protect,
  viewsController.getMyBookings
);

module.exports = router;
