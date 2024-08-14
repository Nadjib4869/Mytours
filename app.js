const express = require("express");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const mongoSanitize = require("express-mongo-sanitize");
const xss = require("xss-clean");
const hpp = require("hpp");

const AppError = require("./utils/appError");
const globalErrorHandler = require("./controllers/errorController");
const tourRouter = require("./routes/tourRoutes");
const userRouter = require("./routes/userRoutes");
const reviewRouter = require("./routes/reviewRoutes");

const app = express();

//* 1) MIDDLEWARES
//? Set security HTTP headers
app.use(helmet());

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

//? Body parser, reading data from body into req.body + limit the size of the body to 10kb (won't accept a bigger body)
app.use(express.json({ limit: "10kb" }));

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

//? Serving static files
app.use(express.static(`${__dirname}/public`));

//? Test middleware
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});

//* 3) ROUTES
app.use("/api/v1/tours", tourRouter);
app.use("/api/v1/users", userRouter);
app.use("/api/v1/reviews", reviewRouter);

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
