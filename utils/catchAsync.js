module.exports = fn => {
  return (req, res, next) => {
    fn(req, res, next).catch(next); //! this .catch(next) will send (propagate) the error to the errorController (globalErrorHandler)
  };
};

//! function (catchAsync) that called & returns the execution (promise) of an async function (fn-the async block) that we passed to it
