const express = require("express");
const morgan = require("morgan");

const AppError = require("./utils/appError");
const globalErrorHandler = require("./controllers/errorController");
const tourRouter = require("./routes/tourRoutes");
const userRouter = require("./routes/userRoutes");

const app = express();

//* 1) MIDDLEWARES
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

app.use(express.json());
app.use(express.static(`${__dirname}/public`));

app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});

//* 3) ROUTES
app.use("/api/v1/tours", tourRouter);
app.use("/api/v1/users", userRouter);

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
