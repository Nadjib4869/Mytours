const AppError = require("../utils/appError");

const handleCastErrorDB = err => {
  const message = `Invalid ${err.path}: ${err.value}.`;
  return new AppError(message, 400);
};

const handleDuplicateFieldsDB = err => {
  //? const value = err.message.match(/"(.*?)"/); //regular expression to match text between quotes("")
  /* const message = `Duplicate field value: ${value}. Please use another value!`;*/
  const message = `Duplicate field value: "${
    err.keyValue.name
  }". Please use another value!`;
  return new AppError(message, 400);
};

const handleValidationErrorDB = err => {
  const errors = Object.values(err.errors).map(e => e.message); //* to get the errors obj as an array of it values then map trough to get the messages
  const message = `Invalid input data. "${errors.join(". ")}"`;
  return new AppError(message, 400);
};

const handleJWTError = () =>
  new AppError("Invalid token. Please log in again!", 401);

const handleJWTExpiredError = () =>
  new AppError("Your token has expired! Please log in again", 401);

const sendErrorDev = (err, req, res) => {
  // A) API
  if (req.originalUrl.startsWith("/api")) {
    return res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack
    });
  }

  // B) RENDERED WEBSITE
  console.error("Error 🤬", err);
  return res.status(err.statusCode).render("error", {
    title: "Something went wrong!",
    msg: err.message
  });
};

const sendErrorProd = (err, req, res) => {
  // A) API
  if (req.originalUrl.startsWith("/api")) {
    //* A) Operational, trusted error: send message to client like: invalid id(get), create duplicate(post), edit goes wrong(patch)
    if (err.isOperational) {
      return res.status(err.statusCode).json({
        status: err.status,
        message: err.message
      });
    }
    //* B) Programming or other unknown error: don't leak error details
    //* 1) Log error
    console.error("Error 🤬", err);
    //* 2) Send generic message
    return res.status(500).json({
      status: "error",
      message: "Something went very wrong!"
    });
  }
  // B) RENDERED WEBSITE
  //* A) Operational, trusted error: send message to client like: invalid id(get), create duplicate(post), edit goes wrong(patch)
  if (err.isOperational) {
    return res.status(err.statusCode).render("error", {
      title: "Something went wrong!",
      msg: err.message
    });
  }
  //* B) Programming or other unknown error: don't leak error details
  //* 1) Log error
  console.error("Error 🤬", err);
  //* 2) Send generic message
  return res.status(err.statusCode).render("error", {
    title: "Something went wrong!",
    msg: "Please try again later."
  });
};

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";

  if (process.env.Node_ENV === "development") {
    sendErrorDev(err, req, res);
  } else if (process.env.Node_ENV === "production") {
    let error = { ...err };
    //* here error =/= err (because err isn't really in an obj format)
    // console.error("err Obj😃", err);
    // console.error("error Obj😂", error);
    error.message = err.message;

    //* 1) Invalid DB ID's
    if (err.name === "CastError") error = handleCastErrorDB(error);
    //* 2) Duplicate DB Fields
    if (err.code === 11000) error = handleDuplicateFieldsDB(error);
    //* 3) Mongoose validation errors (update-patch went wrong)
    if (err.name === "ValidationError") error = handleValidationErrorDB(error);
    //* Invalid token
    if (err.name === "JsonWebTokenError") error = handleJWTError();
    //* Expired token
    if (err.name === "TokenExpiredError") error = handleJWTExpiredError();

    sendErrorProd(error, req, res);
  }
};
