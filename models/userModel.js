const crypto = require("crypto");
const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please tell us your name"]
  },
  email: {
    type: String,
    required: [true, "Please provide your email"],
    unique: true,
    lowercase: true, //? to convert the email to lowercase
    validate: [validator.isEmail, "Please provide a valid email"]
  },
  photo: {
    //? here we will store the name of the image in the file system (not the image itself)
    type: String,
    default: "default.jpg"
  },
  role: {
    type: String,
    enum: ["user", "guide", "lead-guide", "admin"],
    default: "user"
  },
  password: {
    type: String,
    required: [true, "Please provide a password"],
    minlength: 8,
    select: false
  },
  passwordConfirm: {
    type: String,
    required: [true, "Please confirm your password"],
    validate: {
      //! This only works on Create and SAVE!!!
      validator: function(val) {
        return val === this.password; //? passwordConfirm must be equal to password
        //! Here if we used it with "findByIdAndUpdate" it won't work because it didn't save yet "this.password", so it can't use it to compare
      },
      message: "Passwords are not the same"
    }
  },
  passwordChangedAt: Date,
  passwordResetString: String,
  passwordResetExpires: Date,
  active: {
    type: Boolean,
    default: true,
    select: false
  }
});

//? document middleware
userSchema.pre("save", async function(next) {
  //* if the password isn't modified then skip
  if (!this.isModified("password")) return next();

  //* else if the password is newly saved or it's modified hash it with cost of 12
  this.password = await bcrypt.hash(this.password, 12);

  //* delete the passwordConfirm field
  this.passwordConfirm = undefined;
  next();
});

userSchema.pre("save", function(next) {
  if (!this.isModified("password") || this.isNew) return next();

  this.passwordChangedAt = Date.now() - 1000; //? to ensure that passwordChangedAt < token time
  next();
});

//? query middleware
//? using regular expressions to apply for all query that starts with "find": "find", "findAndUpdate"...
userSchema.pre(/^find/, function(next) {
  //* this points to the current query
  this.find({ active: { $ne: false } });
  next();
});

//? instance methods: a method that is available on all docs of a collection
userSchema.methods.correctPassword = async function(
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.changePasswordAfter = function(JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    return changedTimestamp > JWTTimestamp; // True: means that user changed his passwd after token creation
  }

  return false; // False: means that passwd NOT changed
};

userSchema.methods.createPasswordResetString = function() {
  const resetString = crypto.randomBytes(32).toString("hex");

  this.passwordResetString = crypto
    .createHash("sha256")
    .update(resetString)
    .digest("hex");

  console.log({ resetString }, this.passwordResetString);

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 min converted to ms

  return resetString;
};

//! Here we didn't use catchAsync with these async functions because they don't have the (req, res, next) params

//? define model variable from schema
const User = mongoose.model("User", userSchema);

module.exports = User;

//! For the adding Admins you have 2 choices
//* 1) adding a field manually in the mongodb compass
//* 2) define a special route for creating admins
