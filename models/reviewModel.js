const mongoose = require("mongoose");
const Tour = require("./tourModel");

const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, "Review cannot be empty!"]
    },
    rating: {
      type: Number,
      default: 4.5,
      min: [1, "Rating must be above 1.0"],
      max: [5, "Rating must be below 5.0"]
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    //? Parent Referencing
    user: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: [true, "Review must belong to a user."]
    },
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: "Tour",
      required: [true, "Review must belong to a tour."]
    }
  },
  {
    //? Schema Options - show virtual properties (a field not stored in the db)
    toJSON: { virtuals: true }, //? each time the data is outputed as a JSON print the virtuals
    toObject: { virtuals: true } //? each time the data is outputed as an Object print the virtuals
  }
);

//? Unique Compound Index to prevent duplicate reviews
reviewSchema.index({ tour: 1, user: 1 }, { unique: true });

//? Populate the ref fields (user-tour)
reviewSchema.pre(/^find/, function(next) {
  //? Populate: replace the field we referenced with the actual related data
  //? (The result will look like the embedded one - although it is in a completely different collection)
  // this.populate({
  //   path: "user",
  //   select: "name photo"
  // }).populate({
  //   path: "tour",
  //   select: "name"
  // });

  //! The thing we wanna add also is that the tour should also have the reviews
  //! (because in our case - parent ref the parent(tour) doesn't know about his reviews)
  //! The Sol without doing the embedding is to create a reviews field in the tour model
  //! And virtually populate it (it won't save up in our db),
  //! Also we will do it only in getTour and not for the getAllTours (we don't need details here)

  this.populate({
    path: "user",
    select: "name photo"
  });

  next();
});

//? static method to calculate the average rating of a tour
reviewSchema.statics.calcAverageRatings = async function(tourId) {
  //? this points to the model
  const stats = await this.aggregate([
    {
      $match: { tour: tourId }
    },
    {
      $group: {
        _id: "$tour",
        nRating: { $sum: 1 },
        avgRating: { $avg: "$rating" }
      }
    }
  ]);

  //? update the tour with the new values
  if (stats.length > 0) {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: stats[0].nRating,
      ratingsAverage: stats[0].avgRating
    });
  } else {
    //? if there are no reviews
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: 0,
      ratingsAverage: 4.5
    });
  }
};

//? Middleware to calculate the average rating after saving a review
reviewSchema.post("save", function() {
  //? this points to the current review
  //? this.constructor points to the model == this.Review
  this.constructor.calcAverageRatings(this.tour);
});

//? Middlewares to calculate the average rating after updating or deleting a review
reviewSchema.pre(/^findOneAnd/, async function(next) {
  //? this.findOne() will return the current document
  //? store it the current query variable this.r (to use it in the post middleware)
  this.r = await this.findOne();
  next();
});

reviewSchema.post(/^findOneAnd/, async function() {
  //? await this.findOne(); does NOT work here, cuz query is already executed
  //? And we can't do this in the pre middleware because we need the document to be saved
  await this.r.constructor.calcAverageRatings(this.tour);
});

//? define model variable from schema
const Review = mongoose.model("Review", reviewSchema);

module.exports = Review;
