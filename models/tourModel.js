const mongoose = require("mongoose");
const slugify = require("slugify");
//? const validator = require("validator");

const tourSchema = new mongoose.Schema(
  {
    //? Schema Definitions
    name: {
      type: String,
      required: [true, "A tour must have a name"],
      unique: true,
      trim: true, //? removes all the white spaces in the beginning and end of the string
      maxlength: [40, "A tour name must have less or equal than 40 characters"],
      minlength: [10, "A tour name must have more or equal than 10 characters"]
      //? validate: [validator.isAlpha, "Tour name must only contain characters"] This will cause problem with spaces
    },
    slug: String,
    duration: {
      type: Number,
      required: [true, "A tour must have a duration"]
    },
    maxGroupSize: {
      type: Number,
      required: [true, "A tour must have a group size"]
    },
    difficulty: {
      type: String,
      required: [true, "A tour must have a difficulty"],
      enum: {
        //? to restrict input
        values: ["easy", "medium", "difficult"],
        message: "Difficulty is either: easy, medium or difficult"
      }
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, "Rating must be above 1.0"],
      max: [5, "Rating must be below 5.0"]
    },
    ratingsQuantity: {
      type: Number,
      default: 0
    },
    price: {
      type: Number,
      required: [true, "A tour must have a price"]
    },
    priceDiscount: {
      type: Number,
      //? custom validator
      validate: {
        validator: function(val) {
          //! This only points to the current doc on Create | So it won't work on Update
          return val < this.price; //? discount value must be less than the price it self
        },
        message: "Discount price ({VALUE}) must be below regular price"
      }
    },
    summary: {
      //? this is a description of the tour on the overview page
      type: String,
      trim: true,
      required: [true, "A tour must have a summary"]
    },
    description: {
      //? this is a description of the tour on the detail page
      type: String,
      trim: true
    },
    imageCover: {
      //? here we will store the name of the image in the file system (not the image itself)
      type: String,
      required: [true, "A tour must have a cover image"]
    },
    images: [String], //? array of strings
    createdAt: {
      type: Date,
      default: Date.now()
      //? u can add select: false if u don't wanna expose "createdAt"
    },
    startDates: [Date],
    secretTour: {
      type: Boolean,
      default: false
    }
  },
  {
    //? Schema Options
    toJSON: { virtuals: true }, //? each time the data is outputed as a JSON print the virtuals
    toObject: { virtuals: true } //? each time the data is outputed as an Object print the virtuals
  }
);

//? Virtual properties : fields are not persistent in the db (can be derived from another field - so no need to save it too)
tourSchema.virtual("durationWeeks").get(function() {
  //? here we used a regular function instead of an arrow one, cuz in arrow we don't have the "this" keyword
  return this.duration / 7; //? "this" here refers to the current doc
});

//? Types of Middlewares in Mongoose :
//? 1) Document: runs before/after (a certain doc is created) these hooks: .save() and .create()
//* pre: modify the doc before it's creation in the db | post: modify the doc after it's creation in the db
tourSchema.pre("save", function(next) {
  //console.log(this);
  this.slug = slugify(this.name, { lower: true });
  next();
});

// tourSchema.pre("save", function(next) {
//   console.log("Will save doc ...");
//   next();
// });

// tourSchema.post("save", function(doc, next) {
//   console.log(doc);
//   next();
// });

//? 2) Query: runs before/after (a certain query is executed) this hook: .find()
//* pre: modify the doc before it's creation in the db | post: modify the doc after it's creation in the db
tourSchema.pre(/^find/, function(next) {
  //* here we used regular expression /^find/ to apply it for all cmd's that start with find (findOne, findOneAndUpdate...)
  //tourSchema.pre("find", function(req, next) {
  this.find({ secretTour: { $ne: true } }); //? to get only regular tours

  this.start = Date.now();
  next();
});

tourSchema.post(/^find/, function(docs, next) {
  console.log(`Query took ${Date.now() - this.start} milliseconds!`);
  next();
});

//? 3) Aggregate
//* A middleware for aggregations (stats)
tourSchema.pre("aggregate", function(next) {
  this.pipeline().unshift({ $match: { $ne: true } }); //? to add a match stage at the beginning of the aggregation array

  console.log(this.pipeline());
  next();
});

//? 4) Model
///////////////////////////////////

//? define model variable from schema
const Tour = mongoose.model("Tour", tourSchema);

module.exports = Tour;
