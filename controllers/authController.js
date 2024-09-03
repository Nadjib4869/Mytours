const crypto = require("crypto");
const { promisify } = require("util");
const jwt = require("jsonwebtoken");
const User = require("../models/userModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const Email = require("../utils/email");

const signToken = id => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  });
};

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);

  //! Cookie: is a small text that a server can send to clients (browser), then when they receive it, it will automatically store it, and send it back (along with all future requests) to the server
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    secure: true,
    httpOnly: true
  };
  if (process.env.NODE_ENV === "development") cookieOptions.secure = false;

  res.cookie("jwt", token, cookieOptions);

  //? Remove password from output (without save)
  user.password = undefined;

  res.status(statusCode).json({
    status: "success",
    token,
    data: {
      user //? to send the newly created obj as a respond (Classic thing we doing a post)
    }
  });
};

exports.signUp = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm
  });

  //const url = "http://localhost:8000/me";
  const url = `${req.protocol}://${req.get("host")}/me`;
  await new Email(newUser, url).sendWelcome();

  createSendToken(newUser, 201, res);
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
  createSendToken(user, 200, res);
});

//? Logout Logic: Since we can't delete the cookie(since it's httpOnly) we will overwrite it with a fake one("loggedout")
exports.logOut = (req, res) => {
  res.cookie("jwt", "loggedout", {
    expires: new Date(Date.now() + 10 * 1000), // 10s
    httpOnly: true
  });
  res.status(200).json({ status: "success" });
};

exports.protect = catchAsync(async (req, res, next) => {
  //* 1) get token & check if it's received
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
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
  res.locals.user = currentUser; // to create a var for our pug templates
  next();
});

//? Only for rendered pages, no errors!
exports.isLoggedIn = async (req, res, next) => {
  if (req.cookies.jwt) {
    try {
      //* 1) Verify token
      const decoded = await promisify(jwt.verify)(
        req.cookies.jwt,
        process.env.JWT_SECRET
      ); //? jwt payload(user._id ...)

      //* 2) Check if user still exists
      const currentUser = await User.findById(decoded.id);
      if (!currentUser) return next();

      //* 3) Check if user changed password after the token was issued
      if (currentUser.changePasswordAfter(decoded.iat)) {
        // iat: token issued at
        return next();
      }

      //* THERE IS A LOGGED IN USER
      res.locals.user = currentUser; // to create a var for our pug templates
    } catch (err) {
      return next();
    }
  }
  next();
};

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
  await user.save({ validateBeforeSave: false }); //? to save data + to deactivate all validators we specified in our schema (required fields) - because we didn't input(email) all required fields(email, password)

  //* 3) Send it to user's email
  try {
    const resetURL = `${req.protocol}://${req.get(
      "host"
    )}/api/v1/users/resetPassword/${resetString}`;

    new Email(user, resetURL).sendPasswordReset();

    res.status(200).json({
      status: "success",
      message: "String sent to email!"
    });
  } catch (err) {
    user.passwordResetString = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false }); //? to save data + to deactivate all validators we specified in our schema (required fields) - because we didn't input(email) all required fields(email, password)

    //console.log(err);
    return next(
      new AppError(
        "There was an error sending the email. try again later!",
        500
      )
    );
  }
});

//? to create token and new passwd
exports.resetPassword = catchAsync(async (req, res, next) => {
  //* 1) Get user based on the string
  const hashedString = crypto
    .createHash("sha256")
    .update(req.params.string)
    .digest("hex");

  const user = await User.findOne({
    passwordResetString: hashedString,
    passwordResetExpires: { $gt: Date.now() }
  });

  if (!user) {
    return next(new AppError("String is invalid or has expired", 400));
  }

  //* 2) If string has not expired, and there is user, set the new password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetString = undefined;
  user.passwordResetExpires = undefined;
  await user.save(); //? to save data

  //* 3) Update changePasswordAt property for the user
  //* 4) Log the user in, send JWT
  createSendToken(user, 200, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  //* 1) Get user from collection
  const user = await User.findById(req.user.id).select("+password");

  //* 2) Check if given password is correct
  if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
    return next(new AppError("Your current password is wrong.", 401));
  }

  //* 3) If so update password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save(); //? to save data
  //! A moment to recap :
  //! why here we didn't use "user.findByIdAndUpdate"
  //! because if we used it then the validators in our schema won't work (like the validator when we compared password and passwordConfirm)
  //! SO NOTE : don't use "user.findByIdAndUpdate" with anything related to passwords

  //* 4) Log user in, send JWT
  createSendToken(user, 200, res);
});
