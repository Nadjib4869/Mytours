const { promisify } = require("util");
const jwt = require("jsonwebtoken");
const User = require("../models/userModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");

const signToken = id => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  });
};

exports.signUp = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    passwordChangedAt: req.body.passwordChangedAt
  });

  const token = signToken(newUser._id);

  res.status(201).json({
    status: "success",
    token,
    data: {
      user: newUser //? to send the newly created obj as a respond (Classic thing we doing a post)
    }
  });
});

exports.logIn = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  //* 1) check if email & password received
  if (!email || !password) {
    return next(new AppError("Please provide email and password!", 400));
  }
  //* 2) check if user exists & password is correct
  const user = await User.findOne({ email }).select("+password");
  //? await user.correctPassword(password, user.password); ycompari (using l instance meth) l given password m3a li rah fel db(user.password)

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError("Incorrect email or password", 401));
  }

  //* 3) if everything is ok, send token to client
  const token = signToken(user._id);

  res.status(200).json({
    status: "success",
    token
  });
});

exports.protect = catchAsync(async (req, res, next) => {
  //* 1) get token & check if it's received
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return next(
      new AppError("You're not logged in! Please log in to get access.", 401)
    );
  }
  //* 2) Verify token
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET); //? jwt payload(user._id ...)

  //* 3) Check if user still exists (didn't delete his account)
  const currentUser = await User.findById(decoded.id);
  if (!currentUser)
    return next(
      new AppError(
        "The user belonging to this token does no longer exists.",
        401
      )
    );

  //* 4) Check if user changed password after the token was issued
  if (currentUser.changePasswordAfter(decoded.iat)) {
    // iat: token issued at
    return next(
      new AppError("User recently changed password! Please log in again.", 401)
    );
  }

  //* GRANT ACCESS TO PROTECTED ROUTE
  req.user = currentUser; // so we can use it again in another middleware
  next();
});

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    //* roles is an ["admin", "lead-guide"]
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError("You do not have permission to perform this action", 403)
      );
    }

    next();
  };
};

//? receive an email addr and send random string
exports.forgotPassword = catchAsync(async (req, res, next) => {
  //* 1) Get user based on given email
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError("There is no user with this email address.", 404));
  }

  //* 2) Generate a random reset string
  const resetString = user.createPasswordResetString();
  await user.save({ validateBeforeSave: false }); //? to deactivate all validators we specified in our schema (required fields) - because we didn't input(email) all required fields(email, password)

  //* 3) Send it to user's email
});

//? to create token and new passwd
exports.resetPassword = (req, res, next) => {};
