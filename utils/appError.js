class AppError extends Error {
  constructor(message, statusCode) {
    super(message);

    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith("4") ? "fail" : "error";
    this.isOperational = true; //? to ensure that a certain err isn't a dev bug but operational

    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
