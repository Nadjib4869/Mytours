const path = require("path");
const express = require("express");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const mongoSanitize = require("express-mongo-sanitize");
const xss = require("xss-clean");
const hpp = require("hpp");
const cookieParser = require("cookie-parser");
const compression = require("compression");
const cors = require("cors");

const AppError = require("./utils/appError");
const globalErrorHandler = require("./controllers/errorController");
const tourRouter = require("./routes/tourRoutes");
const userRouter = require("./routes/userRoutes");
const reviewRouter = require("./routes/reviewRoutes");
const bookingRouter = require("./routes/bookingRoutes");
const bookingController = require("./controllers/bookingController");
const viewRouter = require("./routes/viewRoutes");

//? Start Express App
const app = express();

//? Trusting proxies (for render)
app.set("trust proxy", 1);

app.set("view engine", "pug");
app.set("views", path.join(__dirname, "views"));

//* 1) Global MIDDLEWARES
//? Implement CORS
app.use(cors()); //* Allow all origins by setting Access-Control-Allow-Origin: *
//* In case we want to allow only some origins (for ex: only our website : mytours.com to our api : api.mytours.com)
//* we can pass a string to app.use(cors({origin: "https://www.natours.com"}))

app.options("*", cors()); //* Preflight phase (before the actual req) to check if the actual req is allowed
//* app.options("/api/v1/tours/:id", cors()) Allow only req this route

//? Serving static files
app.use(express.static(path.join(__dirname, "public")));

//? Set security HTTP headers
// This : app.use(helmet()); | Didn't work when i used mapbox
//* (because recent version of helmet enable the Cross-Origin-Resource-Policy: by default to same-origin)
//* which doesn't allow to ...
//* so we used used "cross-origin" to allow embedding external resources
app.use(helmet.crossOriginResourcePolicy({ policy: "cross-origin" }));

//? Development logging
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

//? Limit requests from same API
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: "Too many requests from this IP, please try again in an hour!"
});
app.use("/api", limiter);

//? Limit login requests from same API
const loginLimiter = rateLimit({
  max: 3,
  windowMs: 60 * 60 * 1000,
  message: "Too many login requests from this IP, please try again in an hour!"
});
app.use("/api/v1/users/login", loginLimiter);

//? Stripe webhook, BEFORE body-parser, because stripe needs the body as stream (raw) not as json
app.post(
  "/webhook-checkout",
  express.raw({ type: "application/json" }),
  bookingController.webhookCheckout
);

//? Body parser, reading data from body into req.body + limit the size of the body to 10kb (won't accept a bigger body)
app.use(express.json({ limit: "10kb" }));
//? Cookie Parser, reading data from cookies
app.use(cookieParser());

//? Data sanitization against NoSQL query injection ({"email": {"$gt": ""}})
app.use(mongoSanitize()); //* remove $...

//? Data sanitization against XSS (HTML &/or JS malicious code)
app.use(xss()); //* clean/convert htmlSymbols...

//? Prevent HTTP parameter pollution (repeating the sort for ex)
//* clean the query string, But it will take only the last one & there are case where we want to apply them all (filter)
//* so create a whitelist (arr of properties) for which we allow duplicates in the query string
app.use(
  hpp({
    whitelist: [
      "duration",
      "ratingsAverage",
      "ratingsQuantity",
      "maxGroupSize",
      "difficulty",
      "price"
    ]
  })
);

//? Compressing text responses (gzip)
app.use(compression());

//? Test middleware
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  //console.log(req.cookies);
  next();
});

//* 2) ROUTES
app.use("/", viewRouter);
app.use("/api/v1/tours", tourRouter);
app.use("/api/v1/users", userRouter);
app.use("/api/v1/reviews", reviewRouter);
app.use("/api/v1/bookings", bookingRouter);

//? A middleware to handle undefined routes for all http methods
//! It has to be here at the end because they run by order (and if it reaches here it means that the req/res cycle didn't end yet)
app.all("*", (req, res, next) => {
  //? This will be replaced by a class
  // const err = new Error(`Can't find ${req.originalUrl} on this server`);
  // err.status = "fail";
  // err.statusCode = 404;

  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404)); //! So it will escape all middlewares in the stack and send this error in the arg to our global error handler middleware
});

//? Error handling middleware - this will be replaced by an errorController
// app.use((err, req, res, next) => {
//   err.statusCode = err.statusCode || 500;
//   err.status = err.status || "error";

//   res.status(err.statusCode).json({
//     status: err.status,
//     message: err.message
//   });
// });
app.use(globalErrorHandler);

module.exports = app;

//! There is 5 variable we have access to in all modules(files)
//! In fact our entire code is wrapped into this func that gives us access to these vars:
//? 1) __dirname
//? 2) __filename
//? 3) require func (require())
//? 4) module
//? 5) exports
